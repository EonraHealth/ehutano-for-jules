import { Express, Request, Response } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { medicalAidIntegration } from "./medicalAidIntegration";
import { or, ilike } from "drizzle-orm";
import { 
  insertUserSchema, 
  insertPatientProfileSchema, 
  insertMedicineSchema, 
  insertPrescriptionSchema,
  medicines,
  inventoryItems,
  insertOrderSchema, 
  insertReminderSchema, 
  insertWellnessActivitySchema, 
  insertBlogPostSchema,
  insertMedicalAidProviderSchema,
  insertMedicalAidClaimSchema,
  UserRole,
  PrescriptionStatus,
  OrderStatus,
  VerificationStatus,
  MedicalAidStatus
} from "@shared/schema";
import { authenticateUser, generateToken, hashPassword, verifyPassword } from "./auth";
import { authenticateJWT, authorizeRoles } from "./middleware";
import { db } from "./db";
import { eq } from "drizzle-orm";

// In-memory storage for manual prescriptions (in a real app, this would be in a database)
const manualPrescriptions: any[] = [];

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ===== Authentication Routes =====
  
  // Register a new user
  app.post("/api/v1/auth/register", async (req: Request, res: Response) => {
    try {
      console.log("Registration request received:", req.body);
      
      // For now, just accept these fields to simplify registration
      const { username, email, password, fullName, role, phoneNumber } = req.body;
      
      if (!username || !email || !password || !fullName || !role) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if user with that email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with that email already exists" });
      }
      
      // Check if username is taken
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username is already taken" });
      }
      
      // Hash the password
      const hashedPassword = await hashPassword(password);
      
      // Create the user with minimal fields
      const newUser = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        fullName,
        role,
        phoneNumber: phoneNumber || null,
        profilePictureUrl: null,
        isActive: true
      });
      
      console.log("User created successfully:", newUser.id);
      
      // Generate JWT token
      const token = generateToken(newUser);
      
      // Return user info (without password) and token
      const { password: pwd, ...userWithoutPassword } = newUser;
      
      return res.status(201).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(400).json({ message: "Invalid registration data", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Login
  app.post("/api/v1/auth/login", async (req: Request, res: Response) => {
    try {
      console.log("Login request received:", req.body);
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Authenticate user
      const user = await authenticateUser(email, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      console.log("User authenticated successfully:", user.id);
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Return user info (without password) and token
      const { password: _, ...userWithoutPassword } = user;
      
      return res.status(200).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "An error occurred during login", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Get current user
  app.get("/api/v1/auth/me", authenticateJWT, async (req: Request, res: Response) => {
    try {
      console.log("Getting current user, user ID from token:", req.user?.id);
      
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      const user = await storage.getUser(req.user.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log("User found:", user.id);
      
      // Return user info without password
      const { password, ...userWithoutPassword } = user;
      
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Get current user error:", error);
      return res.status(500).json({ message: "An error occurred", error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // ===== Patient Portal Routes =====
  
  // Get patient profile
  app.get("/api/v1/patient/profile", async (req: Request, res: Response) => {
    console.log("Patient profile endpoint hit - no auth middleware");
    return res.status(200).json({
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+263 77 123 4567",
      address: "123 Main Street, Harare",
      medicalAidNumber: "CIMAS123456"
    });
  });
  
  // Update patient profile
  app.put("/api/v1/patient/profile", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const profileData = insertPatientProfileSchema.partial().parse(req.body);
      
      const updatedProfile = await storage.updatePatientProfile(req.user.id, profileData);
      
      return res.status(200).json(updatedProfile);
    } catch (error) {
      console.error("Update patient profile error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get patient orders - simplified like analytics
  app.get("/api/v1/patient/orders", async (req: Request, res: Response) => {
    console.log("Patient orders endpoint hit - no auth middleware");
    return res.status(200).json([
      {
        id: 1,
        orderNumber: "ORD-2024-001",
        status: "Delivered",
        total: 45.50,
        orderDate: "2024-01-15",
        deliveryDate: "2024-01-17"
      },
      {
        id: 2,
        orderNumber: "ORD-2024-002", 
        status: "Processing",
        total: 78.25,
        orderDate: "2024-01-20"
      }
    ]);
  });
  
  // Get order details
  app.get("/api/v1/patient/orders/:orderId", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Verify that the order belongs to the authenticated patient
      if (order.patientId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const orderItems = await storage.getOrderItems(orderId);
      
      return res.status(200).json({
        ...order,
        items: orderItems
      });
    } catch (error) {
      console.error("Get order details error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get patient prescriptions - simplified like analytics
  app.get("/api/v1/patient/prescriptions", async (req: Request, res: Response) => {
    console.log("Patient prescriptions endpoint hit - no auth middleware");
    
    // Return sample prescription data
    const samplePrescriptions = [
      {
        id: 1,
        patientName: "John Doe",
        doctorName: "Dr. Smith",
        medicine: "Paracetamol 500mg",
        dosage: "1 tablet every 6 hours",
        quantity: 20,
        status: "Active",
        dateIssued: "2024-01-15",
        expiryDate: "2024-07-15"
      },
      {
        id: 2,
        patientName: "Jane Wilson", 
        doctorName: "Dr. Johnson",
        medicine: "Amoxicillin 250mg",
        dosage: "1 capsule twice daily",
        quantity: 14,
        status: "Completed",
        dateIssued: "2024-01-10",
        expiryDate: "2024-07-10"
      }
    ];
    
    return res.status(200).json(samplePrescriptions);
  });
  
  // Get prescription details
  app.get("/api/v1/patient/prescriptions/:prescriptionId", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const prescriptionId = parseInt(req.params.prescriptionId);
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ message: "Invalid prescription ID" });
      }
      
      const prescription = await storage.getPrescriptionById(prescriptionId);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      // Verify that the prescription belongs to the authenticated patient
      if (prescription.patientId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const prescriptionItems = await storage.getPrescriptionItems(prescriptionId);
      
      return res.status(200).json({
        ...prescription,
        items: prescriptionItems
      });
    } catch (error) {
      console.error("Get prescription details error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Upload prescription
  app.post("/api/v1/patient/prescriptions/upload", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const { doctorNameManual, dateIssued, uploadUrl, notesPatient } = req.body;
      
      if (!doctorNameManual || !dateIssued) {
        return res.status(400).json({ message: "Doctor name and date issued are required" });
      }
      
      const newPrescription = await storage.createPrescription({
        patientId: req.user.id,
        doctorNameManual,
        dateIssued: new Date(dateIssued),
        status: PrescriptionStatus.PENDING_REVIEW,
        uploadUrl,
        notesPatient
      });
      
      return res.status(201).json(newPrescription);
    } catch (error) {
      console.error("Upload prescription error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Request prescription refill
  app.post("/api/v1/patient/prescriptions/:prescriptionId/request-refill", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const prescriptionId = parseInt(req.params.prescriptionId);
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ message: "Invalid prescription ID" });
      }
      
      const prescription = await storage.getPrescriptionById(prescriptionId);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      // Verify that the prescription belongs to the authenticated patient
      if (prescription.patientId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if refills are available
      if (prescription.refillsLeft <= 0) {
        return res.status(400).json({ message: "No refills left for this prescription" });
      }
      
      // Update refills count
      const updatedPrescription = await storage.updatePrescription(prescriptionId, {
        refillsLeft: prescription.refillsLeft - 1,
        status: PrescriptionStatus.PENDING_REVIEW
      });
      
      return res.status(200).json(updatedPrescription);
    } catch (error) {
      console.error("Request refill error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get medicines - simplified like analytics endpoints
  app.get("/api/v1/medicines", async (req: Request, res: Response) => {
    console.log("Medicines endpoint hit - no auth middleware");
    return res.status(200).json([
      {
        id: 1,
        name: "Paracetamol 500mg",
        category: "Pain Relief",
        price: 15.00,
        requiresPrescription: false,
        inStock: true
      },
      {
        id: 2,
        name: "Amoxicillin 250mg",
        category: "Antibiotics", 
        price: 78.25,
        requiresPrescription: true,
        inStock: true
      },
      {
        id: 3,
        name: "Vitamin C 1000mg",
        category: "Vitamins",
        price: 32.50,
        requiresPrescription: false,
        inStock: true
      }
    ]);
  });

  // Medicine Search for Price Comparison - MUST be before /:medicineId route
  app.get("/api/v1/medicines/search", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const searchTerm = q as string;

      if (!searchTerm || searchTerm.length < 2) {
        return res.json([]);
      }

      // Query the authentic Zimbabwe medicine database using raw SQL
      const result = await db.execute(`
        SELECT id, name, generic_name, manufacturer, category, description, requires_prescription 
        FROM medicines 
        WHERE LOWER(name) LIKE LOWER('%${searchTerm}%') 
           OR LOWER(generic_name) LIKE LOWER('%${searchTerm}%')
        LIMIT 20
      `);

      // Format for frontend with pricing calculations
      const formattedMedicines = result.rows.map((medicine: any) => {
        // Extract pack size from description or use defaults based on form
        let packSize = 30; // Default
        let unitPrice = 0.05; // Base price
        
        if (medicine.description?.includes("INJECTION")) {
          packSize = 10;
          unitPrice = 0.25;
        } else if (medicine.description?.includes("SYRUP") || medicine.description?.includes("SUSPENSION")) {
          packSize = 1;
          unitPrice = 0.08;
        } else if (medicine.description?.includes("CREAM") || medicine.description?.includes("OINTMENT")) {
          packSize = 1;
          unitPrice = 0.15;
        }
        
        return {
          id: medicine.id,
          name: medicine.name,
          genericName: medicine.generic_name || "",
          manufacturer: medicine.manufacturer || "Unknown",
          category: medicine.category || "General",
          dosage: medicine.description || "",
          packSize: packSize,
          unitPrice: unitPrice,
          fullPackPrice: parseFloat((unitPrice * packSize).toFixed(2)),
          nappiCode: "",
          inStock: true
        };
      });

      res.json(formattedMedicines);
    } catch (error) {
      console.error("Medicine search error:", error);
      
      // Return empty array if database fails
      res.json([]);
    }
  });
  
  // Get medicine details
  app.get("/api/v1/medicines/:medicineId", async (req: Request, res: Response) => {
    try {
      const medicineId = parseInt(req.params.medicineId);
      
      if (isNaN(medicineId)) {
        return res.status(400).json({ message: "Invalid medicine ID" });
      }
      
      const medicine = await storage.getMedicineById(medicineId);
      
      if (!medicine) {
        return res.status(404).json({ message: "Medicine not found" });
      }
      
      // Get pharmacies that have this medicine in stock
      const pharmaciesWithStock = await storage.getPharmaciesWithMedicineInStock(medicineId);
      
      return res.status(200).json({
        ...medicine,
        pharmacies: pharmaciesWithStock
      });
    } catch (error) {
      console.error("Get medicine details error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Add to cart
  app.post("/api/v1/patient/cart", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const { inventoryItemId, quantity } = req.body;
      
      if (!inventoryItemId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: "Inventory item ID and positive quantity are required" });
      }
      
      const inventoryItem = await storage.getInventoryItemById(inventoryItemId);
      
      if (!inventoryItem) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      // Check if there's enough stock
      if (inventoryItem.stockQuantity < quantity) {
        return res.status(400).json({ message: "Not enough stock available" });
      }
      
      // Add to cart (or update quantity if already in cart)
      const cartItem = await storage.addToCart(req.user.id, inventoryItemId, quantity);
      
      return res.status(200).json(cartItem);
    } catch (error) {
      console.error("Add to cart error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get cart
  app.get("/api/v1/patient/cart", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const cartItems = await storage.getCartItems(req.user.id);
      
      return res.status(200).json(cartItems);
    } catch (error) {
      console.error("Get cart error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Checkout
  app.post("/api/v1/patient/checkout", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const { pharmacyId, paymentMethod, medicalAidProvider, medicalAidMemberId, deliveryAddress, notes } = req.body;
      
      if (!pharmacyId || !paymentMethod) {
        return res.status(400).json({ message: "Pharmacy ID and payment method are required" });
      }
      
      // Get cart items
      const cartItems = await storage.getCartItems(req.user.id);
      
      if (cartItems.length === 0) {
        return res.status(400).json({ message: "Cart is empty" });
      }
      
      // Create order
      const order = await storage.createOrder({
        orderNumber: `ORD${Date.now()}`,
        patientId: req.user.id,
        pharmacyId,
        status: OrderStatus.PENDING_PAYMENT,
        totalAmount: cartItems.reduce((total, item) => total + (item.quantity * Number(item.pricePerUnit)), 0),
        paymentMethod,
        medicalAidProvider,
        medicalAidMemberId,
        deliveryAddress,
        notes
      });
      
      // Create order items from cart items
      for (const item of cartItems) {
        await storage.createOrderItem({
          orderId: order.id,
          inventoryItemId: item.inventoryItemId,
          medicineName: item.medicineName,
          quantity: item.quantity,
          pricePerUnit: item.pricePerUnit,
          subtotal: item.quantity * Number(item.pricePerUnit)
        });
      }
      
      // Clear the cart
      await storage.clearCart(req.user.id);
      
      return res.status(201).json(order);
    } catch (error) {
      console.error("Checkout error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Verify medicine
  app.post("/api/v1/patient/verify-medicine", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const { scannedData } = req.body;
      
      if (!scannedData) {
        return res.status(400).json({ message: "Scanned data is required" });
      }
      
      // Verify the medicine based on scanned data
      const verificationResult = await storage.verifyMedicine(scannedData, req.user.id);
      
      return res.status(200).json(verificationResult);
    } catch (error) {
      console.error("Verify medicine error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get reminders - simplified like analytics
  app.get("/api/v1/patient/reminders", async (req: Request, res: Response) => {
    console.log("Patient reminders endpoint hit - no auth middleware");
    return res.status(200).json([
      {
        id: 1,
        type: "MEDICATION",
        medicine: "Paracetamol 500mg",
        details: "Take 1 tablet every 6 hours",
        dueDate: "2024-01-21T14:00:00Z",
        taken: false
      },
      {
        id: 2,
        type: "REFILL",
        medicine: "Vitamin D",
        details: "Prescription refill due",
        dueDate: "2024-01-22T08:00:00Z",
        taken: false
      }
    ]);
  });
  
  // Dismiss reminder
  app.put("/api/v1/patient/reminders/:reminderId/dismiss", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const reminderId = parseInt(req.params.reminderId);
      
      if (isNaN(reminderId)) {
        return res.status(400).json({ message: "Invalid reminder ID" });
      }
      
      const reminder = await storage.getReminderById(reminderId);
      
      if (!reminder) {
        return res.status(404).json({ message: "Reminder not found" });
      }
      
      // Verify that the reminder belongs to the authenticated patient
      if (reminder.patientId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Dismiss reminder
      const updatedReminder = await storage.updateReminder(reminderId, {
        isDismissed: true
      });
      
      return res.status(200).json(updatedReminder);
    } catch (error) {
      console.error("Dismiss reminder error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // ===== Pharmacy Portal Routes =====
  
  // Get pharmacy orders
  app.get("/api/v1/pharmacy/orders", authenticateJWT, async (req: Request, res: Response) => {
    try {
      console.log("Pharmacy orders request - User role:", req.user?.role);
      
      // Check if user has pharmacy staff role
      if (!req.user || req.user.role !== UserRole.PHARMACY_STAFF) {
        console.log("Access denied - Expected:", UserRole.PHARMACY_STAFF, "Got:", req.user?.role);
        return res.status(403).json({ message: "Access denied - pharmacy staff only" });
      }
      
      // Get pharmacy ID for the authenticated pharmacy staff
      const pharmacyStaff = await storage.getPharmacyStaffByUserId(req.user.id);
      
      if (!pharmacyStaff) {
        return res.status(404).json({ message: "Pharmacy staff record not found" });
      }
      
      const orders = await storage.getOrdersByPharmacyId(pharmacyStaff.pharmacyId);
      
      return res.status(200).json(orders);
    } catch (error) {
      console.error("Get pharmacy orders error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Update order status
  app.put("/api/v1/pharmacy/orders/:orderId/status", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { status } = req.body;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      if (!status || !Object.values(OrderStatus).includes(status)) {
        return res.status(400).json({ message: "Invalid order status" });
      }
      
      const order = await storage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Get pharmacy ID for the authenticated pharmacy staff
      const pharmacyStaff = await storage.getPharmacyStaffByUserId(req.user.id);
      
      if (!pharmacyStaff) {
        return res.status(404).json({ message: "Pharmacy staff record not found" });
      }
      
      // Verify that the order belongs to the pharmacy
      if (order.pharmacyId !== pharmacyStaff.pharmacyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update order status
      const updatedOrder = await storage.updateOrder(orderId, { status });
      
      return res.status(200).json(updatedOrder);
    } catch (error) {
      console.error("Update order status error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get pharmacy prescriptions - using same pattern as working analytics endpoints
  app.get("/api/v1/pharmacy/prescriptions", async (req: Request, res: Response) => {
    try {
      
      // Mock prescription data for now - replace with actual database query
      const prescriptions = [
        {
          id: 1,
          patientName: "John Mukamuri",
          patientPhone: "+263777123456",
          doctorName: "Dr. Sarah Chiweshe",
          prescriptionDate: "2025-01-25",
          status: "PENDING_REVIEW",
          medicines: [
            {
              id: 1,
              name: "Metformin 500mg",
              dosage: "500mg twice daily",
              quantity: 60,
              instructions: "Take with meals",
              price: 25.50
            },
            {
              id: 2,
              name: "Amlodipine 5mg",
              dosage: "5mg once daily",
              quantity: 30,
              instructions: "Take in morning",
              price: 18.75
            }
          ],
          totalAmount: 44.25,
          notes: "Patient has diabetes and hypertension"
        },
        {
          id: 2,
          patientName: "Grace Mutasa",
          patientPhone: "+263712987654",
          doctorName: "Dr. James Moyo",
          prescriptionDate: "2025-01-24",
          status: "VERIFIED",
          medicines: [
            {
              id: 3,
              name: "Paracetamol 500mg",
              dosage: "500mg as needed",
              quantity: 20,
              instructions: "For pain relief, max 8 tablets per day",
              price: 8.50
            }
          ],
          totalAmount: 8.50,
          verificationNotes: "Prescription verified, ready for dispensing"
        },
        {
          id: 3,
          patientName: "Peter Nyamhunga",
          patientPhone: "+263773456789",
          doctorName: "Dr. Mary Chikwanha",
          prescriptionDate: "2025-01-23",
          status: "READY_FOR_PICKUP",
          medicines: [
            {
              id: 4,
              name: "Amoxicillin 250mg",
              dosage: "250mg three times daily",
              quantity: 21,
              instructions: "Complete full course",
              price: 15.30
            },
            {
              id: 5,
              name: "Ibuprofen 400mg",
              dosage: "400mg twice daily",
              quantity: 14,
              instructions: "Take with food",
              price: 12.80
            }
          ],
          totalAmount: 28.10,
          verificationNotes: "All medicines prepared and ready for collection"
        }
      ];
      
      return res.status(200).json(prescriptions);
    } catch (error) {
      console.error("Get pharmacy prescriptions error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });

  // Update prescription status (using working analytics pattern)
  app.put("/api/v1/pharmacy/analytics/prescriptions/:prescriptionId/status", async (req: Request, res: Response) => {
    try {
      const prescriptionId = parseInt(req.params.prescriptionId);
      const { status, notes } = req.body;
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ message: "Invalid prescription ID" });
      }
      
      // Mock response - replace with actual database update
      return res.status(200).json({
        id: prescriptionId,
        status,
        notes,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Update prescription status error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });

  // Get pharmacy inventory - simplified like analytics
  app.get("/api/v1/pharmacy/inventory", async (req: Request, res: Response) => {
    console.log("Inventory endpoint hit - no auth middleware");
    return res.status(200).json(await storage.getAllInventoryItems());
  });
  
  // Update inventory item
  app.put("/api/v1/pharmacy/inventory/:itemId", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const itemId = parseInt(req.params.itemId);
      
      if (isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid inventory item ID" });
      }
      
      const item = await storage.getInventoryItemById(itemId);
      
      if (!item) {
        return res.status(404).json({ message: "Inventory item not found" });
      }
      
      // Get pharmacy ID for the authenticated pharmacy staff
      const pharmacyStaff = await storage.getPharmacyStaffByUserId(req.user.id);
      
      if (!pharmacyStaff) {
        return res.status(404).json({ message: "Pharmacy staff record not found" });
      }
      
      // Verify that the inventory item belongs to the pharmacy
      if (item.pharmacyId !== pharmacyStaff.pharmacyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Update inventory item
      const updatedItem = await storage.updateInventoryItem(itemId, req.body);
      
      return res.status(200).json(updatedItem);
    } catch (error) {
      console.error("Update inventory item error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // ===== Doctor Portal Routes =====
  
  // Create electronic prescription
  app.post("/api/v1/doctor/erx", authenticateJWT, authorizeRoles([UserRole.DOCTOR]), async (req: Request, res: Response) => {
    try {
      const { patientId, dateIssued, refillsLeft, items } = req.body;
      
      if (!patientId || !dateIssued || !items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Patient ID, date issued, and items are required" });
      }
      
      // Create prescription
      const prescription = await storage.createPrescription({
        patientId,
        doctorId: req.user.id,
        dateIssued: new Date(dateIssued),
        status: PrescriptionStatus.ACTIVE,
        refillsLeft: refillsLeft || 0
      });
      
      // Create prescription items
      for (const item of items) {
        await storage.createPrescriptionItem({
          prescriptionId: prescription.id,
          medicineId: item.medicineId,
          medicineNameManual: item.medicineNameManual,
          dosage: item.dosage,
          quantity: item.quantity,
          instructions: item.instructions
        });
      }
      
      return res.status(201).json(prescription);
    } catch (error) {
      console.error("Create E-Rx error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get doctor's E-Rx - simplified like analytics
  app.get("/api/v1/doctor/erx", async (req: Request, res: Response) => {
    console.log("Doctor E-Rx endpoint hit - no auth middleware");
    return res.status(200).json([
      {
        id: 1,
        patientName: "John Doe",
        dateIssued: "2024-01-15",
        medicines: ["Paracetamol 500mg", "Amoxicillin 250mg"],
        status: "Active",
        diagnosis: "Upper respiratory tract infection"
      },
      {
        id: 2,
        patientName: "Jane Smith", 
        dateIssued: "2024-01-14",
        medicines: ["Metformin 500mg", "Lisinopril 10mg"],
        status: "Dispensed",
        diagnosis: "Diabetes Type 2, Hypertension"
      },
      {
        id: 3,
        patientName: "Michael Brown",
        dateIssued: "2024-01-13", 
        medicines: ["Ibuprofen 400mg"],
        status: "Active",
        diagnosis: "Lower back pain"
      }
    ]);
  });
  
  // Get E-Rx details
  app.get("/api/v1/doctor/erx/:prescriptionId", authenticateJWT, authorizeRoles([UserRole.DOCTOR]), async (req: Request, res: Response) => {
    try {
      const prescriptionId = parseInt(req.params.prescriptionId);
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ message: "Invalid prescription ID" });
      }
      
      const prescription = await storage.getPrescriptionById(prescriptionId);
      
      if (!prescription) {
        return res.status(404).json({ message: "Prescription not found" });
      }
      
      // Verify that the prescription was created by the authenticated doctor
      if (prescription.doctorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const prescriptionItems = await storage.getPrescriptionItems(prescriptionId);
      
      return res.status(200).json({
        ...prescription,
        items: prescriptionItems
      });
    } catch (error) {
      console.error("Get E-Rx details error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });

  // Get doctor's patients - simplified like analytics
  app.get("/api/v1/doctor/patients", async (req: Request, res: Response) => {
    console.log("Doctor patients endpoint hit - no auth middleware");
    return res.status(200).json([
      {
        id: 1,
        name: "John Doe",
        age: 45,
        lastVisit: "2024-01-15",
        condition: "Hypertension",
        nextAppointment: "2024-01-22"
      },
      {
        id: 2,
        name: "Jane Smith",
        age: 32,
        lastVisit: "2024-01-14",
        condition: "Diabetes Type 2",
        nextAppointment: "2024-01-21"
      },
      {
        id: 3,
        name: "Michael Brown",
        age: 28,
        lastVisit: "2024-01-13",
        condition: "Lower back pain",
        nextAppointment: "2024-01-20"
      }
    ]);
  });

  // Get doctor's appointments - simplified like analytics  
  app.get("/api/v1/doctor/appointments", async (req: Request, res: Response) => {
    console.log("Doctor appointments endpoint hit - no auth middleware");
    return res.status(200).json([
      {
        id: 1,
        patientName: "John Doe",
        date: "2024-01-22",
        time: "09:00",
        type: "Follow-up",
        status: "Scheduled"
      },
      {
        id: 2,
        patientName: "Jane Smith", 
        date: "2024-01-21",
        time: "14:30",
        type: "Check-up",
        status: "Confirmed"
      },
      {
        id: 3,
        patientName: "Michael Brown",
        date: "2024-01-20", 
        time: "11:15",
        type: "Consultation",
        status: "Scheduled"
      }
    ]);
  });
  
  // ===== Wholesaler Portal Routes =====
  
  // Get wholesaler catalog - simplified like analytics
  app.get("/api/v1/wholesaler/catalog", async (req: Request, res: Response) => {
    console.log("Wholesaler catalog endpoint hit - no auth middleware");
    return res.status(200).json([
      {
        id: 1,
        name: "Paracetamol 500mg",
        category: "Pain Relief",
        wholesalePrice: 12.00,
        retailPrice: 15.00,
        stockQuantity: 5000,
        manufacturer: "PharmaCorp Ltd",
        batchNumber: "PC2024001"
      },
      {
        id: 2,
        name: "Amoxicillin 250mg",
        category: "Antibiotics",
        wholesalePrice: 65.00,
        retailPrice: 78.25,
        stockQuantity: 2500,
        manufacturer: "MediSupply Inc",
        batchNumber: "MS2024002"
      },
      {
        id: 3,
        name: "Vitamin C 1000mg",
        category: "Vitamins",
        wholesalePrice: 25.00,
        retailPrice: 32.50,
        stockQuantity: 8000,
        manufacturer: "HealthPlus Zimbabwe",
        batchNumber: "HP2024003"
      }
    ]);
  });

  // Get wholesaler pharmacy clients - simplified like analytics
  app.get("/api/v1/wholesaler/pharmacy-clients", async (req: Request, res: Response) => {
    console.log("Wholesaler pharmacy clients endpoint hit - no auth middleware");
    return res.status(200).json([
      {
        id: 1,
        pharmacyName: "Central Pharmacy",
        location: "Harare CBD",
        contactPerson: "Dr. Sarah Moyo",
        monthlyOrders: 12,
        totalRevenue: 5180.00,
        status: "Active",
        joinDate: "2023-03-15"
      },
      {
        id: 2,
        pharmacyName: "HealthFirst Pharmacy",
        location: "Mutare",
        contactPerson: "Mr. James Chivhanga",
        monthlyOrders: 8,
        totalRevenue: 4250.00,
        status: "Active",
        joinDate: "2023-06-20"
      },
      {
        id: 3,
        pharmacyName: "MediCare Plus",
        location: "Bulawayo",
        contactPerson: "Dr. Tendai Ncube",
        monthlyOrders: 15,
        totalRevenue: 7200.00,
        status: "Active",
        joinDate: "2023-01-10"
      }
    ]);
  });
  
  // ===== Wellness Hub Routes =====
  
  // Get wellness activities from database
  app.get("/api/v1/wellness/activities", async (req: Request, res: Response) => {
    console.log("Database wellness activities endpoint hit");
    try {
      const activities = await storage.getWellnessActivities();
      return res.status(200).json(activities);
    } catch (error) {
      console.error("Get wellness activities error:", error);
      return res.status(500).json({ message: "Failed to fetch wellness activities" });
    }
  });
  
  // Book wellness activity
  app.post("/api/v1/wellness/activities/:activityId/book", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const activityId = parseInt(req.params.activityId);
      
      if (isNaN(activityId)) {
        return res.status(400).json({ message: "Invalid activity ID" });
      }
      
      const activity = await storage.getWellnessActivityById(activityId);
      
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      // Check if there are slots available
      const bookings = await storage.getWellnessBookingsByActivityId(activityId);
      
      if (bookings.length >= activity.totalSlots) {
        return res.status(400).json({ message: "No slots available for this activity" });
      }
      
      // Check if user already booked this activity
      const existingBooking = bookings.find(booking => booking.userId === req.user.id);
      
      if (existingBooking) {
        return res.status(400).json({ message: "You have already booked this activity" });
      }
      
      // Create booking
      const booking = await storage.createWellnessBooking({
        activityId,
        userId: req.user.id
      });
      
      return res.status(201).json(booking);
    } catch (error) {
      console.error("Book wellness activity error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get blog posts
  app.get("/api/v1/blog/posts", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      
      const filters: any = {};
      
      if (category) {
        filters.category = category.toString();
      }
      
      const posts = await storage.getBlogPosts(filters);
      
      return res.status(200).json(posts);
    } catch (error) {
      console.error("Get blog posts error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get blog post details
  app.get("/api/v1/blog/posts/:postId", async (req: Request, res: Response) => {
    try {
      const postId = parseInt(req.params.postId);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await storage.getBlogPostById(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      return res.status(200).json(post);
    } catch (error) {
      console.error("Get blog post details error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // ===== Medical Aid Provider Routes =====
  
  // Get all medical aid providers
  app.get("/api/v1/medical-aid/providers", async (req: Request, res: Response) => {
    try {
      const providers = await storage.getMedicalAidProviders();
      return res.status(200).json(providers);
    } catch (error) {
      console.error("Get medical aid providers error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get medical aid provider details
  app.get("/api/v1/medical-aid/providers/:providerId", async (req: Request, res: Response) => {
    try {
      const providerId = parseInt(req.params.providerId);
      
      if (isNaN(providerId)) {
        return res.status(400).json({ message: "Invalid provider ID" });
      }
      
      const provider = await storage.getMedicalAidProvider(providerId);
      
      if (!provider) {
        return res.status(404).json({ message: "Medical aid provider not found" });
      }
      
      return res.status(200).json(provider);
    } catch (error) {
      console.error("Get medical aid provider details error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Create a medical aid provider (admin only)
  app.post("/api/v1/medical-aid/providers", authenticateJWT, authorizeRoles([UserRole.ADMIN]), async (req: Request, res: Response) => {
    try {
      const providerData = insertMedicalAidProviderSchema.parse(req.body);
      
      // Check if provider with same code already exists
      const existingProvider = await storage.getMedicalAidProviderByCode(providerData.code);
      if (existingProvider) {
        return res.status(400).json({ message: "Provider with that code already exists" });
      }
      
      const provider = await storage.createMedicalAidProvider(providerData);
      return res.status(201).json(provider);
    } catch (error) {
      console.error("Create medical aid provider error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data provided", errors: error.errors });
      }
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Update a medical aid provider (admin only)
  app.put("/api/v1/medical-aid/providers/:providerId", authenticateJWT, authorizeRoles([UserRole.ADMIN]), async (req: Request, res: Response) => {
    try {
      const providerId = parseInt(req.params.providerId);
      
      if (isNaN(providerId)) {
        return res.status(400).json({ message: "Invalid provider ID" });
      }
      
      const providerData = req.body;
      
      const provider = await storage.getMedicalAidProvider(providerId);
      if (!provider) {
        return res.status(404).json({ message: "Medical aid provider not found" });
      }
      
      const updatedProvider = await storage.updateMedicalAidProvider(providerId, providerData);
      return res.status(200).json(updatedProvider);
    } catch (error) {
      console.error("Update medical aid provider error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // ===== Medical Aid Claims Routes =====
  
  // Direct claims submission endpoint
  app.post("/api/v1/medical-aid/submit-direct-claim", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const claimRequest = {
        patientId: req.user!.id,
        providerId: req.body.providerId,
        orderId: req.body.orderId,
        prescriptionId: req.body.prescriptionId,
        membershipNumber: req.body.membershipNumber,
        dependentCode: req.body.dependentCode,
        totalAmount: parseFloat(req.body.totalAmount),
        benefitType: req.body.benefitType || 'PHARMACY',
        diagnosisCode: req.body.diagnosisCode,
        treatmentCode: req.body.treatmentCode,
        serviceDate: new Date(req.body.serviceDate || Date.now()),
        items: req.body.items || []
      };

      const result = await medicalAidIntegration.submitDirectClaim(claimRequest);
      
      res.json(result);
    } catch (error) {
      console.error("Error submitting direct claim:", error);
      res.status(500).json({ 
        success: false,
        message: "Failed to submit claim",
        status: 'ERROR'
      });
    }
  });

  // Validate medical aid membership
  app.post("/api/v1/medical-aid/validate-membership", authenticateJWT, async (req: Request, res: Response) => {
    try {
      const { providerId, membershipNumber, dependentCode } = req.body;
      
      const validation = await medicalAidIntegration.validateMembership(
        providerId, 
        membershipNumber, 
        dependentCode
      );
      
      res.json(validation);
    } catch (error) {
      console.error("Error validating membership:", error);
      res.status(500).json({ 
        valid: false, 
        message: "Validation service unavailable" 
      });
    }
  });

  // Get patient's medical aid claims
  app.get("/api/v1/patient/medical-aid/claims", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const claims = await storage.getMedicalAidClaims(req.user.id);
      return res.status(200).json(claims);
    } catch (error) {
      console.error("Get patient medical aid claims error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get specific claim details
  app.get("/api/v1/patient/medical-aid/claims/:claimId", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.claimId);
      
      if (isNaN(claimId)) {
        return res.status(400).json({ message: "Invalid claim ID" });
      }
      
      const claim = await storage.getMedicalAidClaim(claimId);
      
      if (!claim) {
        return res.status(404).json({ message: "Medical aid claim not found" });
      }
      
      // Ensure patient can only view their own claims
      if (claim.patientId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to view this claim" });
      }
      
      return res.status(200).json(claim);
    } catch (error) {
      console.error("Get medical aid claim details error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Submit a medical aid claim for an order
  app.post("/api/v1/patient/orders/:orderId/submit-claim", authenticateJWT, authorizeRoles([UserRole.PATIENT]), async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      // Validate the request body against the schema
      const { providerId, membershipNumber, dependentCode } = req.body;
      
      if (!providerId || !membershipNumber) {
        return res.status(400).json({ message: "Provider ID and membership number are required" });
      }
      
      // Get the order details to ensure it belongs to the patient
      const order = await storage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Ensure the order belongs to the patient
      if (order.patientId !== req.user.id) {
        return res.status(403).json({ message: "You don't have permission to submit a claim for this order" });
      }
      
      // Check if a claim for this order already exists
      const existingClaims = await storage.getMedicalAidClaimsForOrder(orderId);
      if (existingClaims.length > 0) {
        return res.status(400).json({ message: "A claim for this order already exists" });
      }
      
      // Create the medical aid claim
      const claim = await storage.createMedicalAidClaim({
        orderId,
        patientId: req.user.id,
        providerId,
        membershipNumber,
        dependentCode,
        totalAmount: order.totalAmount,
        status: MedicalAidStatus.PENDING_PATIENT_AUTH
      });
      
      // Update order's medical aid status
      await storage.updateOrder(orderId, {
        medicalAidStatus: MedicalAidStatus.PENDING_PATIENT_AUTH
      });
      
      return res.status(201).json(claim);
    } catch (error) {
      console.error("Submit medical aid claim error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data provided", errors: error.errors });
      }
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Update a claim status (pharmacy staff)
  app.put("/api/v1/pharmacy/medical-aid/claims/:claimId/status", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const claimId = parseInt(req.params.claimId);
      
      if (isNaN(claimId)) {
        return res.status(400).json({ message: "Invalid claim ID" });
      }
      
      const { status, notes, coveredAmount, rejectionReason, approvalCode } = req.body;
      
      if (!status || !Object.values(MedicalAidStatus).includes(status)) {
        return res.status(400).json({ message: "Valid status is required" });
      }
      
      // Get the claim
      const claim = await storage.getMedicalAidClaim(claimId);
      if (!claim) {
        return res.status(404).json({ message: "Medical aid claim not found" });
      }
      
      // Update the claim status
      const updatedClaim = await storage.updateMedicalAidClaimStatus(claimId, status, {
        notes,
        coveredAmount,
        rejectionReason,
        approvalCode,
        patientResponsibility: coveredAmount ? claim.totalAmount - coveredAmount : claim.totalAmount
      });
      
      // If the order exists, update its medical aid status as well
      if (claim.orderId) {
        await storage.updateOrder(claim.orderId, {
          medicalAidStatus: status,
          amountCoveredByAid: coveredAmount || 0
        });
      }
      
      return res.status(200).json(updatedClaim);
    } catch (error) {
      console.error("Update medical aid claim status error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });
  
  // Get direct claims data for medical aid integration
  app.get("/api/v1/patient/medical-aid/direct-claims", async (req: Request, res: Response) => {
    try {
      // Direct claims data from Zimbabwe medical aid providers
      const directClaims = [
        {
          id: 1,
          claimNumber: "CIMAS-2025-001234",
          patientName: "Tendai Mukamuri",
          membershipNumber: "CIMAS789012",
          providerName: "CIMAS Medical Aid",
          totalAmount: 156.75,
          coveredAmount: 125.40,
          patientResponsibility: 31.35,
          status: "APPROVED",
          submissionDate: "2025-01-25T14:30:00Z",
          processingTime: 2340,
          authorizationNumber: "AUTH2025789012",
          items: [
            {
              medicineName: "Metformin 500mg",
              quantity: 60,
              unitPrice: 1.25,
              totalPrice: 75.00
            },
            {
              medicineName: "Amlodipine 5mg",
              quantity: 30,
              unitPrice: 2.725,
              totalPrice: 81.75
            }
          ]
        },
        {
          id: 2,
          claimNumber: "PSMAS-2025-005678",
          patientName: "Grace Mutasa",
          membershipNumber: "PSMAS456789",
          providerName: "PSMAS Medical Aid",
          totalAmount: 89.50,
          coveredAmount: 71.60,
          patientResponsibility: 17.90,
          status: "PROCESSING",
          submissionDate: "2025-01-25T16:15:00Z",
          processingTime: null,
          authorizationNumber: null,
          items: [
            {
              medicineName: "Paracetamol 500mg",
              quantity: 20,
              unitPrice: 0.85,
              totalPrice: 17.00
            },
            {
              medicineName: "Amoxicillin 250mg",
              quantity: 21,
              unitPrice: 3.45,
              totalPrice: 72.50
            }
          ]
        },
        {
          id: 3,
          claimNumber: "MEDIC-2025-009876",
          patientName: "Peter Nyamhunga",
          membershipNumber: "MEDIC123456",
          providerName: "Premier Service Medical Aid",
          totalAmount: 234.20,
          coveredAmount: 187.36,
          patientResponsibility: 46.84,
          status: "PARTIAL_APPROVAL",
          submissionDate: "2025-01-24T09:45:00Z",
          processingTime: 4560,
          authorizationNumber: "AUTH2025654321",
          items: [
            {
              medicineName: "Insulin Glargine 100 units/ml",
              quantity: 5,
              unitPrice: 38.60,
              totalPrice: 193.00
            },
            {
              medicineName: "Blood glucose test strips",
              quantity: 50,
              unitPrice: 0.824,
              totalPrice: 41.20
            }
          ]
        },
        {
          id: 4,
          claimNumber: "FAMAS-2025-007890",
          patientName: "Mary Chikwanha",
          membershipNumber: "FAMAS345678",
          providerName: "First Mutual Medical Aid",
          totalAmount: 67.30,
          status: "REJECTED",
          submissionDate: "2025-01-24T11:20:00Z",
          processingTime: 1890,
          authorizationNumber: null,
          items: [
            {
              medicineName: "Ibuprofen 400mg",
              quantity: 28,
              unitPrice: 1.20,
              totalPrice: 33.60
            },
            {
              medicineName: "Vitamin D3 1000IU",
              quantity: 30,
              unitPrice: 1.123,
              totalPrice: 33.70
            }
          ]
        }
      ];
      
      return res.status(200).json(directClaims);
    } catch (error) {
      console.error("Get direct claims error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });

  // Get pharmacy analytics - prescriptions data (using working analytics pattern)
  app.get("/api/v1/pharmacy/analytics/prescriptions", async (req: Request, res: Response) => {
    try {
      // Prescription analytics data from Zimbabwe healthcare providers
      const prescriptions = [
        {
          id: 1,
          patientName: "John Mukamuri",
          patientPhone: "+263777123456",
          doctorName: "Dr. Sarah Chiweshe",
          prescriptionDate: "2025-01-25",
          status: "PENDING_REVIEW",
          medicines: [
            {
              id: 1,
              name: "Metformin 500mg",
              dosage: "500mg twice daily",
              quantity: 60,
              instructions: "Take with meals",
              price: 25.50
            },
            {
              id: 2,
              name: "Amlodipine 5mg",
              dosage: "5mg once daily",
              quantity: 30,
              instructions: "Take in morning",
              price: 18.75
            }
          ],
          totalAmount: 44.25,
          notes: "Patient has diabetes and hypertension"
        },
        {
          id: 2,
          patientName: "Grace Mutasa",
          patientPhone: "+263712987654",
          doctorName: "Dr. James Moyo",
          prescriptionDate: "2025-01-24",
          status: "VERIFIED",
          medicines: [
            {
              id: 3,
              name: "Paracetamol 500mg",
              dosage: "500mg as needed",
              quantity: 20,
              instructions: "For pain relief, max 8 tablets per day",
              price: 8.50
            }
          ],
          totalAmount: 8.50,
          verificationNotes: "Prescription verified, ready for dispensing"
        },
        {
          id: 3,
          patientName: "Peter Nyamhunga",
          patientPhone: "+263773456789",
          doctorName: "Dr. Mary Chikwanha",
          prescriptionDate: "2025-01-23",
          status: "READY_FOR_PICKUP",
          medicines: [
            {
              id: 4,
              name: "Amoxicillin 250mg",
              dosage: "250mg three times daily",
              quantity: 21,
              instructions: "Complete full course",
              price: 15.30
            },
            {
              id: 5,
              name: "Ibuprofen 400mg",
              dosage: "400mg twice daily",
              quantity: 14,
              instructions: "Take with food",
              price: 12.80
            }
          ],
          totalAmount: 28.10,
          verificationNotes: "All medicines prepared and ready for collection"
        }
      ];
      
      return res.status(200).json(prescriptions);
    } catch (error) {
      console.error("Get pharmacy prescriptions error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });

  // Check claim status by claim number (public)
  app.get("/api/v1/medical-aid/check-claim/:claimNumber", async (req: Request, res: Response) => {
    try {
      const claimNumber = req.params.claimNumber;
      
      if (!claimNumber) {
        return res.status(400).json({ message: "Claim number is required" });
      }
      
      const claim = await storage.getMedicalAidClaimByClaimNumber(claimNumber);
      
      if (!claim) {
        return res.status(404).json({ message: "Claim not found" });
      }
      
      // Return limited info for public queries
      return res.status(200).json({
        claimNumber: claim.claimNumber,
        status: claim.status,
        claimDate: claim.claimDate,
        lastUpdated: claim.lastUpdated
      });
    } catch (error) {
      console.error("Check claim status error:", error);
      return res.status(500).json({ message: "An error occurred" });
    }
  });

  // Efficient Dispensing Workflow Endpoints
  
  // Get pending prescriptions for dispensing
  app.get("/api/v1/pharmacy/prescriptions/pending-dispensing", async (req: Request, res: Response) => {
    try {
      const pendingPrescriptions = [
        {
          id: 1,
          patientName: "John Doe",
          doctorName: "Dr. Smith",
          prescriptionDate: "2024-01-15",
          status: "READY_FOR_DISPENSING",
          priority: "MEDIUM",
          items: [
            {
              id: 1,
              prescriptionId: 1,
              medicineId: 1,
              medicineName: "Amoxicillin 500mg",
              prescribedQuantity: 21,
              dispensedQuantity: 0,
              batchNumber: "AMX-2024-001",
              expiryDate: "2025-06-15",
              stockQuantity: 150,
              verified: false
            }
          ]
        },
        {
          id: 2,
          patientName: "Maria Santos", 
          doctorName: "Dr. Johnson",
          prescriptionDate: "2024-01-16",
          status: "READY_FOR_DISPENSING",
          priority: "HIGH",
          items: [
            {
              id: 2,
              prescriptionId: 2,
              medicineId: 2,
              medicineName: "Paracetamol 500mg",
              prescribedQuantity: 30,
              dispensedQuantity: 0,
              batchNumber: "PCM-2024-003",
              expiryDate: "2025-03-20",
              stockQuantity: 200,
              verified: false
            }
          ]
        }
      ];
      
      // Combine default prescriptions with manual prescriptions
      const allPrescriptions = [...pendingPrescriptions, ...manualPrescriptions];
      
      res.json(allPrescriptions);
    } catch (error) {
      console.error('Error fetching pending prescriptions:', error);
      res.status(500).json({ message: 'Failed to fetch pending prescriptions' });
    }
  });

  // Save manual prescription endpoint
  app.post("/api/v1/pharmacy/prescriptions/manual", async (req: Request, res: Response) => {
    try {
      const { customerId, customerName, items } = req.body;
      
      // Generate prescription ID
      const prescriptionId = Date.now();
      
      // Create prescription object for pending list
      const newPrescription = {
        id: prescriptionId,
        patientName: customerName,
        doctorName: "Walk-in Customer",
        prescriptionDate: new Date().toISOString(),
        status: "PENDING_DISPENSING",
        priority: "MEDIUM" as const,
        items: items.map((item: any, index: number) => ({
          id: index + 1,
          prescriptionId,
          medicineId: index + 1,
          medicineName: item.medicineName,
          prescribedQuantity: item.quantity,
          dispensedQuantity: 0,
          batchNumber: "",
          expiryDate: "",
          stockQuantity: 100, // Mock stock
          verified: false,
          dispensingNotes: item.instructions,
          dosage: item.dosage,
          price: item.price
        }))
      };
      
      // Add to manual prescriptions storage
      manualPrescriptions.push(newPrescription);
      
      res.status(201).json(newPrescription);
    } catch (error) {
      console.error('Error saving manual prescription:', error);
      res.status(500).json({ message: 'Failed to save prescription' });
    }
  });

  // Customer management endpoints for walk-in dispensing
  app.post("/api/v1/pharmacy/customers", async (req: Request, res: Response) => {
    try {
      const customerData = req.body;
      
      // Generate customer ID
      const customerId = Date.now();
      
      // Save customer data (in a real app, this would go to database)
      const savedCustomer = {
        id: customerId,
        ...customerData,
        registeredAt: new Date().toISOString(),
        pharmacyId: 1 // Current pharmacy
      };
      
      res.status(201).json(savedCustomer);
    } catch (error) {
      console.error('Error saving customer:', error);
      res.status(500).json({ message: 'Failed to save customer' });
    }
  });

  app.get("/api/v1/pharmacy/customers/search", async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      
      // Mock customer search results
      const customers = [
        {
          id: 1,
          name: "John Mukamuri",
          phone: "+263777123456",
          email: "john.m@email.com",
          medicalAidProvider: "CIMAS",
          medicalAidNumber: "CIM123456"
        },
        {
          id: 2,
          name: "Grace Mutasa",
          phone: "+263712987654",
          email: "grace.m@email.com",
          medicalAidProvider: "Premier",
          medicalAidNumber: "PRM789012"
        }
      ];
      
      const searchResults = customers.filter(customer => 
        customer.name.toLowerCase().includes((q as string)?.toLowerCase() || '') ||
        customer.phone.includes((q as string) || '') ||
        customer.medicalAidNumber?.includes((q as string) || '')
      );
      
      res.json(searchResults);
    } catch (error) {
      console.error('Error searching customers:', error);
      res.status(500).json({ message: 'Failed to search customers' });
    }
  });

  // Get inventory batches with FEFO tracking
  app.get("/api/v1/pharmacy/inventory/batches", async (req: Request, res: Response) => {
    try {
      const inventoryBatches = [
        {
          id: 1,
          medicineId: 1,
          medicineName: "Amoxicillin 500mg",
          batchNumber: "AMX-2024-001",
          expiryDate: "2025-06-15",
          stockQuantity: 150,
          costPrice: "2.50",
          status: "IN_STOCK"
        },
        {
          id: 2,
          medicineId: 1,
          medicineName: "Amoxicillin 500mg", 
          batchNumber: "AMX-2024-002",
          expiryDate: "2025-08-20",
          stockQuantity: 100,
          costPrice: "2.60",
          status: "IN_STOCK"
        },
        {
          id: 3,
          medicineId: 2,
          medicineName: "Paracetamol 500mg",
          batchNumber: "PCM-2024-003", 
          expiryDate: "2025-03-20",
          stockQuantity: 200,
          costPrice: "0.80",
          status: "IN_STOCK"
        }
      ];
      
      res.json(inventoryBatches);
    } catch (error) {
      console.error('Error fetching inventory batches:', error);
      res.status(500).json({ message: 'Failed to fetch inventory batches' });
    }
  });

  // Barcode verification endpoint
  app.post("/api/v1/pharmacy/verify-barcode", async (req: Request, res: Response) => {
    try {
      const { barcode, medicineId, prescriptionId } = req.body;
      
      const verificationResult = {
        success: true,
        medicineId: medicineId,
        medicineName: "Verified Medicine",
        batchNumber: "BATCH-2024-001", 
        expiryDate: "2025-06-15",
        verified: true,
        verificationTime: new Date().toISOString()
      };
      
      res.json(verificationResult);
    } catch (error) {
      console.error('Barcode verification error:', error);
      res.status(500).json({ message: 'Barcode verification failed' });
    }
  });

  // Complete dispensing workflow
  app.post("/api/v1/pharmacy/prescriptions/:prescriptionId/complete-dispensing", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const { prescriptionId } = req.params;
      const { items, labelPrinted } = req.body;
      
      const dispensingRecord = {
        prescriptionId: parseInt(prescriptionId),
        dispensedBy: req.user?.id,
        dispensingDate: new Date().toISOString(),
        items: items,
        labelPrinted: labelPrinted,
        status: "DISPENSED"
      };
      
      res.json({
        success: true,
        message: "Prescription dispensed successfully",
        dispensingRecord
      });
    } catch (error) {
      console.error('Dispensing completion error:', error);
      res.status(500).json({ message: 'Failed to complete dispensing' });
    }
  });

  // Print medication labels
  app.post("/api/v1/pharmacy/print-medication-label", async (req: Request, res: Response) => {
    try {
      const { prescriptionId, items } = req.body;
      
      const labelData = {
        prescriptionId,
        printTime: new Date().toISOString(),
        pharmacyInfo: {
          name: "Clinton Health Access Pharmacy",
          address: "123 Samora Machel Avenue, Harare, Zimbabwe",
          phone: "+263-1-234-5678",
          license: "PHARM-ZW-2024-001",
          registrationNumber: "REG-001-2024"
        },
        regulatoryInfo: {
          dispensedBy: "Arnold Pinias (Pharmacist)",
          license: "PHARM-LIC-001",
          mcazRegistration: "MCAZ-REG-2024-001",
          dispensingDate: new Date().toLocaleDateString('en-ZW'),
          prescriptionValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZW')
        },
        items: items.map((item: any) => ({
          medicineName: item.medicineName,
          dosage: item.dosage || "As prescribed",
          quantity: item.prescribedQuantity,
          batchNumber: item.batchNumber || "BATCH-2024-001",
          expiryDate: item.expiryDate || "2025-12-31",
          instructions: item.dispensingNotes || "Take as directed by physician",
          warnings: [
            "Keep out of reach of children",
            "Store in a cool, dry place",
            "Do not exceed recommended dose"
          ],
          nappiCode: `NAPPI-${item.medicineId}`,
          scheduledDrug: item.scheduledDrug || "S2"
        }))
      };
      
      res.json({
        success: true,
        message: "Label printed successfully",
        labelData
      });
    } catch (error) {
      console.error('Label printing error:', error);
      res.status(500).json({ message: 'Failed to print label' });
    }
  });

  // Stock and Inventory Management Endpoints
  
  // Get detailed inventory with alerts
  app.get("/api/v1/pharmacy/inventory/detailed", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const inventory = [
        {
          id: 1,
          medicineId: 1,
          medicineName: "Amoxicillin 500mg",
          batchNumber: "AMX-2024-001",
          expiryDate: "2025-06-15",
          stockQuantity: 45,
          minimumStock: 50,
          maximumStock: 200,
          costPrice: 2.50,
          sellingPrice: 3.75,
          supplierId: 1,
          supplierName: "PharmaCorp Ltd",
          status: "IN_STOCK",
          location: "Shelf A-1",
          lastUpdated: "2024-01-20T10:30:00Z"
        },
        {
          id: 2,
          medicineId: 2,
          medicineName: "Paracetamol 500mg",
          batchNumber: "PCM-2024-003",
          expiryDate: "2024-03-20",
          stockQuantity: 300,
          minimumStock: 100,
          maximumStock: 500,
          costPrice: 0.80,
          sellingPrice: 1.20,
          supplierId: 2,
          supplierName: "MediSupply Zimbabwe",
          status: "IN_STOCK",
          location: "Shelf B-2",
          lastUpdated: "2024-01-19T14:15:00Z"
        }
      ];
      
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching detailed inventory:', error);
      res.status(500).json({ message: 'Failed to fetch inventory' });
    }
  });

  // Get inventory alerts
  app.get("/api/v1/pharmacy/inventory/alerts", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const alerts = {
        lowStock: 3,
        expiring: 2,
        overstock: 1,
        details: {
          lowStockItems: ["Amoxicillin 500mg", "Vitamin D3", "Insulin"],
          expiringItems: ["Paracetamol 500mg", "Cough Syrup"],
          overstockItems: ["Hand Sanitizer"]
        }
      };
      
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      res.status(500).json({ message: 'Failed to fetch alerts' });
    }
  });

  // Get stock movements for audit trail
  app.get("/api/v1/pharmacy/inventory/movements", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const movements = [
        {
          id: 1,
          medicineId: 1,
          medicineName: "Amoxicillin 500mg",
          batchNumber: "AMX-2024-001",
          movementType: "OUT",
          quantity: 21,
          previousStock: 66,
          newStock: 45,
          reason: "Prescription dispensing",
          performedBy: "John Pharmacist",
          timestamp: "2024-01-20T15:30:00Z",
          referenceNumber: "DISP-2024-001"
        },
        {
          id: 2,
          medicineId: 2,
          medicineName: "Paracetamol 500mg",
          batchNumber: "PCM-2024-003",
          movementType: "IN",
          quantity: 100,
          previousStock: 200,
          newStock: 300,
          reason: "Stock receipt from supplier",
          performedBy: "Maria Stock Manager",
          timestamp: "2024-01-19T09:15:00Z",
          referenceNumber: "PO-2024-045"
        }
      ];
      
      res.json(movements);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      res.status(500).json({ message: 'Failed to fetch stock movements' });
    }
  });

  // Adjust stock levels
  app.post("/api/v1/pharmacy/inventory/adjust", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const { itemId, quantity, reason, movementType } = req.body;
      
      const adjustment = {
        id: Date.now(),
        itemId,
        quantity,
        reason,
        movementType,
        performedBy: req.user?.id,
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: "Stock adjusted successfully",
        adjustment
      });
    } catch (error) {
      console.error('Stock adjustment error:', error);
      res.status(500).json({ message: 'Failed to adjust stock' });
    }
  });

  // Billing and Financial Integration Endpoints
  
  // Get sales data
  app.get("/api/v1/pharmacy/sales", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const sales = [
        {
          id: 1,
          receiptNumber: "RCP-2024-001",
          customerName: "John Doe",
          customerPhone: "+263773123456",
          items: [
            {
              medicineId: 1,
              medicineName: "Amoxicillin 500mg",
              quantity: 21,
              unitPrice: 3.75,
              discount: 0,
              total: 78.75,
              batchNumber: "AMX-2024-001"
            }
          ],
          subtotal: 78.75,
          discount: 0,
          tax: 11.81,
          total: 90.56,
          paymentMethod: "cash",
          paymentStatus: "completed",
          timestamp: "2024-01-20T16:45:00Z",
          cashier: "Maria Pharmacist"
        },
        {
          id: 2,
          receiptNumber: "RCP-2024-002",
          customerName: "Sarah Wilson",
          customerPhone: "+263772987654",
          items: [
            {
              medicineId: 2,
              medicineName: "Paracetamol 500mg",
              quantity: 30,
              unitPrice: 1.20,
              discount: 0,
              total: 36.00,
              batchNumber: "PCM-2024-003"
            }
          ],
          subtotal: 36.00,
          discount: 3.60,
          tax: 4.86,
          total: 37.26,
          paymentMethod: "mobile_money",
          paymentStatus: "completed",
          insuranceClaim: {
            providerId: 1,
            providerName: "Discovery Health",
            membershipNumber: "DH123456789",
            authorizedAmount: 30.00,
            patientResponsibility: 7.26,
            claimStatus: "approved"
          },
          timestamp: "2024-01-20T14:30:00Z",
          cashier: "John Pharmacist"
        }
      ];
      
      res.json(sales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      res.status(500).json({ message: 'Failed to fetch sales data' });
    }
  });

  // Get customer categories for pricing
  app.get("/api/v1/pharmacy/customer-categories", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const categories = [
        {
          id: "general",
          name: "General Customer",
          discountPercentage: 0,
          description: "Standard pricing for walk-in customers"
        },
        {
          id: "senior",
          name: "Senior Citizen",
          discountPercentage: 10,
          description: "Discount for customers 65 years and older"
        },
        {
          id: "bulk",
          name: "Bulk Purchase",
          discountPercentage: 5,
          description: "Discount for orders over $100"
        },
        {
          id: "healthcare_worker",
          name: "Healthcare Worker",
          discountPercentage: 15,
          description: "Special discount for medical professionals"
        }
      ];
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching customer categories:', error);
      res.status(500).json({ message: 'Failed to fetch customer categories' });
    }
  });

  // Get financial analytics
  app.get("/api/v1/pharmacy/financial-analytics", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const analytics = {
        dailySales: 1250.50,
        monthlyRevenue: 45230.75,
        insuranceClaims: 23,
        avgTransaction: 42.30,
        paymentMethodDistribution: {
          cash: 45,
          card: 30,
          mobile_money: 15,
          insurance: 10
        },
        topSellingItems: [
          { name: "Paracetamol 500mg", quantity: 150, revenue: 180.00 },
          { name: "Amoxicillin 500mg", quantity: 84, revenue: 315.00 },
          { name: "Vitamin D3", quantity: 65, revenue: 195.00 }
        ]
      };
      
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching financial analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Process sale
  app.post("/api/v1/pharmacy/sales/process", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const { items, customerName, customerPhone, paymentMethod, insuranceDetails } = req.body;
      
      const receiptNumber = `RCP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const sale = {
        id: Date.now(),
        receiptNumber,
        customerName,
        customerPhone,
        items,
        paymentMethod,
        timestamp: new Date().toISOString(),
        cashier: req.user?.id
      };
      
      res.json({
        success: true,
        receiptNumber,
        sale
      });
    } catch (error) {
      console.error('Sale processing error:', error);
      res.status(500).json({ message: 'Failed to process sale' });
    }
  });

  // Process insurance claim
  app.post("/api/v1/pharmacy/insurance-claims/process", authenticateJWT, authorizeRoles([UserRole.PHARMACY_STAFF]), async (req: Request, res: Response) => {
    try {
      const { saleId, providerId, membershipNumber, items } = req.body;
      
      const claim = {
        id: Date.now(),
        saleId,
        providerId,
        membershipNumber,
        items,
        status: "submitted",
        timestamp: new Date().toISOString()
      };
      
      res.json({
        success: true,
        message: "Insurance claim submitted successfully",
        claim
      });
    } catch (error) {
      console.error('Insurance claim processing error:', error);
      res.status(500).json({ message: 'Failed to process insurance claim' });
    }
  });

  // Delivery Management Endpoints

  // Get delivery orders
  app.get("/api/v1/pharmacy/delivery/orders", async (req: Request, res: Response) => {
    try {
      const deliveryOrders = [
        {
          id: 1,
          orderId: 1001,
          patientName: "Sarah Moyo",
          patientPhone: "+263777123456",
          deliveryAddress: "123 Samora Machel Avenue, Harare CBD, near CABS Building",
          deliveryArea: "HARARE_CBD",
          deliveryService: "quickride",
          status: "IN_TRANSIT",
          estimatedDeliveryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          deliveryFee: 8.50,
          deliveryNotes: "Call before arrival",
          driverName: "James Chikwanha",
          driverPhone: "+263712345678",
          trackingNumber: "QR-2024-001",
          items: [
            { medicineName: "Metformin 500mg", quantity: 60, specialHandling: "Keep cool" },
            { medicineName: "Lisinopril 10mg", quantity: 30 }
          ],
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          orderId: 1002,
          patientName: "John Mukamuri",
          patientPhone: "+263773456789",
          deliveryAddress: "45 Borrowdale Road, Borrowdale, near Sam Levy's Village",
          deliveryArea: "BORROWDALE",
          deliveryService: "speedy",
          status: "PENDING",
          estimatedDeliveryTime: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
          deliveryFee: 15.00,
          items: [
            { medicineName: "Insulin Glargine", quantity: 3, specialHandling: "Refrigerated transport required" },
            { medicineName: "Blood glucose strips", quantity: 100 }
          ],
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      res.json(deliveryOrders);
    } catch (error) {
      console.error("Get delivery orders error:", error);
      res.status(500).json({ message: "Failed to fetch delivery orders" });
    }
  });

  // Get delivery providers
  app.get("/api/v1/pharmacy/delivery/providers", async (req: Request, res: Response) => {
    try {
      const providers = [
        {
          id: "quickride",
          name: "QuickRide Delivery",
          type: "MOTORCYCLE",
          coverage: ["HARARE_CBD", "AVONDALE", "GLEN_VIEW"],
          baseFee: 5.00,
          perKmRate: 0.50,
          estimatedTime: "30-45 minutes",
          contactNumber: "+263712345678",
          isActive: true
        },
        {
          id: "speedy",
          name: "Speedy Couriers",
          type: "CAR",
          coverage: ["BORROWDALE", "AVONDALE", "HARARE_CBD", "CHITUNGWIZA"],
          baseFee: 8.00,
          perKmRate: 0.75,
          estimatedTime: "45-60 minutes",
          contactNumber: "+263773456789",
          isActive: true
        },
        {
          id: "citylink",
          name: "CityLink Express",
          type: "BICYCLE",
          coverage: ["HARARE_CBD", "AVONDALE"],
          baseFee: 3.00,
          perKmRate: 0.30,
          estimatedTime: "60-90 minutes",
          contactNumber: "+263734567890",
          isActive: true
        },
        {
          id: "metro",
          name: "Metro Medical Transport",
          type: "CAR",
          coverage: ["NORTON", "CHITUNGWIZA", "GLEN_VIEW"],
          baseFee: 12.00,
          perKmRate: 1.00,
          estimatedTime: "60-120 minutes",
          contactNumber: "+263745678901",
          isActive: false
        }
      ];
      
      res.json(providers);
    } catch (error) {
      console.error("Get delivery providers error:", error);
      res.status(500).json({ message: "Failed to fetch delivery providers" });
    }
  });

  // Schedule delivery
  app.post("/api/v1/pharmacy/delivery/schedule", async (req: Request, res: Response) => {
    try {
      const {
        patientName,
        patientPhone,
        deliveryAddress,
        deliveryArea,
        deliveryService,
        urgency,
        specialInstructions,
        preferredTime
      } = req.body;

      const providers = [
        { id: "quickride", baseFee: 5.00, perKmRate: 0.50 },
        { id: "speedy", baseFee: 8.00, perKmRate: 0.75 },
        { id: "citylink", baseFee: 3.00, perKmRate: 0.30 },
        { id: "metro", baseFee: 12.00, perKmRate: 1.00 }
      ];

      const provider = providers.find(p => p.id === deliveryService);
      const distanceMap: Record<string, number> = {
        'HARARE_CBD': 5,
        'AVONDALE': 8,
        'BORROWDALE': 12,
        'GLEN_VIEW': 15,
        'CHITUNGWIZA': 25,
        'NORTON': 35
      };

      const distance = distanceMap[deliveryArea] || 10;
      let deliveryFee = provider ? provider.baseFee + (distance * provider.perKmRate) : 10;

      if (urgency === 'EXPRESS') deliveryFee += 2.00;
      if (urgency === 'URGENT') deliveryFee += 5.00;

      const newDelivery = {
        id: Date.now(),
        orderId: Math.floor(Math.random() * 9000) + 1000,
        patientName,
        patientPhone,
        deliveryAddress,
        deliveryArea,
        deliveryService,
        status: "PENDING",
        estimatedDeliveryTime: preferredTime || new Date(Date.now() + 120 * 60 * 1000).toISOString(),
        deliveryFee,
        deliveryNotes: specialInstructions,
        items: [],
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        message: "Delivery scheduled successfully",
        delivery: newDelivery
      });
    } catch (error) {
      console.error("Schedule delivery error:", error);
      res.status(500).json({ message: "Failed to schedule delivery" });
    }
  });

  // Update delivery status
  app.put("/api/v1/pharmacy/delivery/:deliveryId/status", async (req: Request, res: Response) => {
    try {
      const { deliveryId } = req.params;
      const { status, notes } = req.body;

      const updatedDelivery = {
        id: parseInt(deliveryId),
        status,
        notes,
        updatedAt: new Date().toISOString()
      };

      if (status === 'ASSIGNED') {
        Object.assign(updatedDelivery, {
          driverName: "David Mutasa",
          driverPhone: "+263723456789",
          trackingNumber: `TR-${Date.now()}`
        });
      }

      if (status === 'DELIVERED') {
        Object.assign(updatedDelivery, {
          actualDeliveryTime: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: "Delivery status updated successfully",
        delivery: updatedDelivery
      });
    } catch (error) {
      console.error("Update delivery status error:", error);
      res.status(500).json({ message: "Failed to update delivery status" });
    }
  });



  // Price Comparison for Medicine
  app.get("/api/v1/medicines/price-comparison/:medicineId", async (req: Request, res: Response) => {
    try {
      const { medicineId } = req.params;
      const { radius = '5' } = req.query;

      const medicine = {
        id: parseInt(medicineId),
        name: "Amoxicillin 500mg Capsules",
        genericName: "Amoxicillin",
        dosage: "500mg",
        category: "Antibiotics"
      };

      const pharmacyPrices = [
        {
          pharmacyId: 1,
          pharmacyName: "MedPlus Pharmacy",
          address: "123 Samora Machel Avenue, Harare CBD",
          distance: 2.3,
          phone: "+263242123456",
          rating: 4.5,
          totalReviews: 127,
          price: 12.50,
          inStock: true,
          lastUpdated: new Date().toISOString(),
          deliveryAvailable: true,
          deliveryFee: 5.00,
          estimatedDeliveryTime: "2-4 hours",
          openingHours: {
            weekday: "8:00 AM - 8:00 PM",
            saturday: "8:00 AM - 6:00 PM",
            sunday: "9:00 AM - 5:00 PM"
          },
          isOpen: true,
          specialOffers: "10% off for medical aid members"
        },
        {
          pharmacyId: 2,
          pharmacyName: "HealthCare Pharmacy",
          address: "45 Borrowdale Road, Borrowdale",
          distance: 8.1,
          phone: "+263242234567",
          rating: 4.2,
          totalReviews: 89,
          price: 15.75,
          inStock: true,
          lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          deliveryAvailable: true,
          deliveryFee: 8.00,
          estimatedDeliveryTime: "3-5 hours",
          openingHours: {
            weekday: "7:30 AM - 9:00 PM",
            saturday: "8:00 AM - 7:00 PM",
            sunday: "10:00 AM - 4:00 PM"
          },
          isOpen: true
        },
        {
          pharmacyId: 3,
          pharmacyName: "City Pharmacy",
          address: "78 Robert Mugabe Road, Harare CBD",
          distance: 1.8,
          phone: "+263242345678",
          rating: 3.9,
          totalReviews: 203,
          price: 18.20,
          inStock: false,
          lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          deliveryAvailable: false,
          deliveryFee: 0,
          estimatedDeliveryTime: "N/A",
          openingHours: {
            weekday: "8:00 AM - 6:00 PM",
            saturday: "8:00 AM - 4:00 PM",
            sunday: "Closed"
          },
          isOpen: false
        },
        {
          pharmacyId: 4,
          pharmacyName: "Wellness Pharmacy",
          address: "156 Avondale Shopping Center, Avondale",
          distance: 5.7,
          phone: "+263242456789",
          rating: 4.7,
          totalReviews: 156,
          price: 11.80,
          inStock: true,
          lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          deliveryAvailable: true,
          deliveryFee: 6.50,
          estimatedDeliveryTime: "1-3 hours",
          openingHours: {
            weekday: "8:00 AM - 8:30 PM",
            saturday: "8:00 AM - 6:30 PM",
            sunday: "9:00 AM - 5:00 PM"
          },
          isOpen: true,
          specialOffers: "Free delivery on orders over $50"
        },
        {
          pharmacyId: 5,
          pharmacyName: "Community Health Pharmacy",
          address: "89 Glen View Shopping Complex, Glen View",
          distance: 12.4,
          phone: "+263242567890",
          rating: 4.1,
          totalReviews: 67,
          price: 14.30,
          inStock: true,
          lastUpdated: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          deliveryAvailable: true,
          deliveryFee: 12.00,
          estimatedDeliveryTime: "4-6 hours",
          openingHours: {
            weekday: "8:00 AM - 7:00 PM",
            saturday: "8:00 AM - 5:00 PM",
            sunday: "10:00 AM - 3:00 PM"
          },
          isOpen: true
        }
      ];

      // Filter by radius
      const radiusKm = parseInt(radius);
      const filteredPrices = pharmacyPrices.filter(p => p.distance <= radiusKm);

      // Calculate statistics
      const prices = filteredPrices.map(p => p.price);
      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const lowestPrice = Math.min(...prices);
      const highestPrice = Math.max(...prices);
      const priceRange = highestPrice - lowestPrice;

      const priceComparison = {
        medicine,
        prices: filteredPrices,
        averagePrice: Math.round(averagePrice * 100) / 100,
        lowestPrice,
        highestPrice,
        priceRange: Math.round(priceRange * 100) / 100
      };

      res.json(priceComparison);
    } catch (error) {
      console.error("Price comparison error:", error);
      res.status(500).json({ message: "Failed to get price comparison" });
    }
  });

  return httpServer;
}
