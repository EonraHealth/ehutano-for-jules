import { db } from "../server/db";
import { 
  users, medicines, inventoryItems, orders, orderItems, prescriptions, prescriptionItems,
  patientProfiles, pharmacies, pharmacyStaff, reminders, wellnessActivities, wellnessTimeSlots,
  wellnessBookings, blogPosts, medicalAidProviders, medicalAidClaims,
  UserRole, OrderStatus, PrescriptionStatus, MedicalAidStatus, InventoryStatus
} from "../shared/schema";
import { hashPassword } from "../server/auth";

async function seedComprehensiveData() {
  console.log("🌱 Starting comprehensive database seeding...");

  try {
    // 1. Create users with different roles
    const hashedPassword = await hashPassword("password123");
    
    const [patient1] = await db.insert(users).values({
      username: "john_doe",
      email: "john.doe@email.com",
      password: hashedPassword,
      fullName: "John Doe",
      role: UserRole.PATIENT,
      phoneNumber: "+263712345678"
    }).returning();

    const [patient2] = await db.insert(users).values({
      username: "sarah_smith",
      email: "sarah.smith@email.com", 
      password: hashedPassword,
      fullName: "Sarah Smith",
      role: UserRole.PATIENT,
      phoneNumber: "+263712345679"
    }).returning();

    const [doctor1] = await db.insert(users).values({
      username: "dr_pinias",
      email: "a.pinias@hotmail.com",
      password: await hashPassword("b7qd7JUbJALuTu7"),
      fullName: "Dr. Pinias Mukamuri",
      role: UserRole.DOCTOR,
      phoneNumber: "+263712345680"
    }).returning();

    const [pharmacyStaffUser] = await db.insert(users).values({
      username: "pharmacy_manager",
      email: "manager@pharmacy.com",
      password: hashedPassword,
      fullName: "Michael Pharmacy Manager",
      role: UserRole.PHARMACY_STAFF,
      phoneNumber: "+263712345681"
    }).returning();

    const [wholesalerUser] = await db.insert(users).values({
      username: "wholesaler_staff",
      email: "staff@wholesaler.com",
      password: hashedPassword,
      fullName: "Lisa Wholesaler Staff",
      role: UserRole.WHOLESALER_STAFF,
      phoneNumber: "+263712345682"
    }).returning();

    console.log("✅ Users created");

    // 2. Create patient profiles
    await db.insert(patientProfiles).values([
      {
        userId: patient1.id,
        medicalAidProvider: "CIMAS",
        medicalAidMemberId: "CIM123456789",
        medicalAidVerified: true,
        bloodPressure: "120/80"
      },
      {
        userId: patient2.id,
        medicalAidProvider: "PSMAS",
        medicalAidMemberId: "PSM987654321",
        medicalAidVerified: true,
        bloodPressure: "110/75"
      }
    ]);

    console.log("✅ Patient profiles created");

    // 3. Create pharmacies
    const [pharmacy1] = await db.insert(pharmacies).values({
      name: "Central Pharmacy",
      address: "123 Main Street, Harare",
      phoneNumber: "+263712000001",
      licenseNumber: "PH001"
    }).returning();

    const [pharmacy2] = await db.insert(pharmacies).values({
      name: "Wellness Pharmacy",
      address: "456 Second Avenue, Bulawayo", 
      phoneNumber: "+263712000002",
      licenseNumber: "PH002"
    }).returning();

    console.log("✅ Pharmacies created");

    // 4. Link pharmacy staff
    await db.insert(pharmacyStaff).values({
      userId: pharmacyStaffUser.id,
      pharmacyId: pharmacy1.id,
      position: "Manager"
    });

    console.log("✅ Pharmacy staff linked");

    // 5. Create medicines
    const medicinesData = [
      {
        name: "Paracetamol 500mg",
        genericName: "Acetaminophen",
        category: "Pain Relief",
        description: "Effective pain and fever relief",
        manufacturer: "Varichem",
        requiresPrescription: false,
        isAntibiotic: false
      },
      {
        name: "Amoxicillin 500mg",
        genericName: "Amoxicillin",
        category: "Antibiotics",
        description: "Broad-spectrum antibiotic",
        manufacturer: "Caps Pharmaceuticals",
        requiresPrescription: true,
        isAntibiotic: true
      },
      {
        name: "Lisinopril 10mg",
        genericName: "Lisinopril",
        category: "Cardiovascular",
        description: "ACE inhibitor for blood pressure",
        manufacturer: "Quest Pharmaceuticals",
        requiresPrescription: true,
        isAntibiotic: false
      },
      {
        name: "Metformin 500mg",
        genericName: "Metformin",
        category: "Diabetes",
        description: "Type 2 diabetes management",
        manufacturer: "Pharmanova",
        requiresPrescription: true,
        isAntibiotic: false
      },
      {
        name: "Ibuprofen 400mg",
        genericName: "Ibuprofen",
        category: "Pain Relief",
        description: "Anti-inflammatory pain relief",
        manufacturer: "Varichem",
        requiresPrescription: false,
        isAntibiotic: false
      }
    ];

    const insertedMedicines = await db.insert(medicines).values(medicinesData).returning();
    console.log("✅ Medicines created");

    // 6. Create inventory items
    const inventoryData = insertedMedicines.flatMap(medicine => [
      {
        pharmacyId: pharmacy1.id,
        medicineId: medicine.id,
        batchNumber: `BATCH001-${medicine.id}`,
        expiryDate: new Date('2025-12-31'),
        stockQuantity: Math.floor(Math.random() * 100) + 50,
        price: parseFloat((Math.random() * 50 + 5).toFixed(2)),
        costPrice: parseFloat((Math.random() * 30 + 3).toFixed(2)),
        supplier: "Medical Suppliers Ltd",
        status: InventoryStatus.IN_STOCK
      },
      {
        pharmacyId: pharmacy2.id,
        medicineId: medicine.id,
        batchNumber: `BATCH002-${medicine.id}`,
        expiryDate: new Date('2025-12-31'),
        stockQuantity: Math.floor(Math.random() * 100) + 30,
        price: parseFloat((Math.random() * 50 + 5).toFixed(2)),
        costPrice: parseFloat((Math.random() * 30 + 3).toFixed(2)),
        supplier: "Pharmanova Distributors",
        status: InventoryStatus.IN_STOCK
      }
    ]);

    await db.insert(inventoryItems).values(inventoryData);
    console.log("✅ Inventory items created");

    // 7. Create wellness activities
    const wellnessActivitiesData = [
      {
        name: "Yoga for Beginners",
        category: "Mind & Body",
        instructor: "Sarah Johnson",
        duration: 60,
        capacity: 15,
        price: "25.00",
        description: "Perfect for beginners, focusing on basic poses and breathing techniques",
        location: "Studio A",
        isActive: true
      },
      {
        name: "5-A-Side Football",
        category: "Team Sports",
        instructor: "Michael Brown",
        duration: 90,
        capacity: 10,
        price: "15.00",
        description: "Competitive 5-a-side football matches on outdoor turf pitch",
        location: "Outdoor Pitch",
        isActive: true
      },
      {
        name: "Basketball Training",
        category: "Team Sports",
        instructor: "David Wilson",
        duration: 75,
        capacity: 12,
        price: "20.00",
        description: "Skills development and scrimmage games for all levels",
        location: "Basketball Court",
        isActive: true
      },
      {
        name: "Tennis Lessons",
        category: "Individual Sports",
        instructor: "Emma Clark",
        duration: 60,
        capacity: 4,
        price: "35.00",
        description: "Private and group tennis coaching for beginners to advanced",
        location: "Tennis Courts",
        isActive: true
      },
      {
        name: "Volleyball Sessions",
        category: "Team Sports",
        instructor: "Lisa Martinez",
        duration: 90,
        capacity: 12,
        price: "18.00",
        description: "Beach and indoor volleyball games and training",
        location: "Volleyball Court",
        isActive: true
      },
      {
        name: "Zumba Fitness",
        category: "Dance Fitness",
        instructor: "Maria Rodriguez",
        duration: 45,
        capacity: 20,
        price: "22.00",
        description: "High-energy dance fitness combining Latin and international music",
        location: "Dance Studio",
        isActive: true
      },
      {
        name: "Gym Personal Training",
        category: "Strength & Conditioning",
        instructor: "James Thompson",
        duration: 60,
        capacity: 1,
        price: "45.00",
        description: "One-on-one personal training sessions tailored to your fitness goals",
        location: "Gym",
        isActive: true
      }
    ];

    const insertedActivities = await db.insert(wellnessActivities).values(wellnessActivitiesData).returning();
    console.log("✅ Wellness activities created");

    // 8. Create time slots for activities (next 7 days)
    const timeSlots = [];
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      const dateStr = date.toISOString().split('T')[0];
      
      for (const activity of insertedActivities) {
        // Create different time slots for different activities
        const activityTimes = getTimeSlotsForActivity(activity.category);
        
        for (const time of activityTimes) {
          timeSlots.push({
            activityId: activity.id,
            date: dateStr,
            time: time,
            availableSpots: Math.floor(Math.random() * activity.capacity),
            totalCapacity: activity.capacity,
            isActive: true
          });
        }
      }
    }

    await db.insert(wellnessTimeSlots).values(timeSlots);
    console.log("✅ Wellness time slots created");

    // 9. Create sample orders
    const orderData = [
      {
        orderNumber: "ORD-2024-001",
        patientId: patient1.id,
        pharmacyId: pharmacy1.id,
        status: OrderStatus.DELIVERED,
        totalAmount: "45.50",
        paymentMethod: "Medical Aid + Cash",
        medicalAidProvider: "CIMAS",
        medicalAidMemberId: "CIM123456789",
        medicalAidStatus: MedicalAidStatus.PAID,
        amountCoveredByAid: "35.50",
        deliveryAddress: "123 Patient Street, Harare"
      },
      {
        orderNumber: "ORD-2024-002", 
        patientId: patient2.id,
        pharmacyId: pharmacy2.id,
        status: OrderStatus.PROCESSING,
        totalAmount: "67.80",
        paymentMethod: "Cash",
        deliveryAddress: "456 Patient Avenue, Bulawayo"
      }
    ];

    const insertedOrders = await db.insert(orders).values(orderData).returning();
    console.log("✅ Orders created");

    // 10. Create blog posts
    const blogData = [
      {
        title: "Understanding Your Medication Labels",
        authorName: "Dr. Sarah Wilson",
        publishDate: new Date('2024-01-15'),
        snippet: "Learn how to read and understand the important information on your medication labels.",
        fullContent: "Reading medication labels correctly is crucial for your health and safety. Here's what you need to know...",
        category: "Medication Safety",
        tags: ["medication", "safety", "health"]
      },
      {
        title: "Managing Diabetes with Exercise",
        authorName: "Dr. Michael Chen",
        publishDate: new Date('2024-01-20'),
        snippet: "Discover effective exercise strategies for managing type 2 diabetes.",
        fullContent: "Regular exercise is one of the most powerful tools for managing diabetes. Here are evidence-based strategies...",
        category: "Diabetes Management",
        tags: ["diabetes", "exercise", "health"]
      },
      {
        title: "Heart Health: Prevention is Key",
        authorName: "Dr. Lisa Thompson",
        publishDate: new Date('2024-01-25'),
        snippet: "Essential tips for maintaining cardiovascular health throughout your life.",
        fullContent: "Cardiovascular disease remains a leading health concern. Prevention through lifestyle changes can make a significant difference...",
        category: "Heart Health",
        tags: ["heart", "prevention", "cardiovascular"]
      }
    ];

    await db.insert(blogPosts).values(blogData);
    console.log("✅ Blog posts created");

    // 11. Create prescriptions
    const prescriptionData = [
      {
        patientId: patient1.id,
        doctorId: doctor1.id,
        dateIssued: new Date('2024-01-20'),
        status: PrescriptionStatus.ACTIVE,
        refillsLeft: 2,
        isQuoteReady: true
      }
    ];

    const insertedPrescriptions = await db.insert(prescriptions).values(prescriptionData).returning();
    console.log("✅ Prescriptions created");

    // 12. Create reminders
    const reminderData = [
      {
        patientId: patient1.id,
        type: "MEDICATION",
        relatedMedicineId: insertedMedicines[0].id,
        details: "Take your morning medication",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        isDismissed: false
      },
      {
        patientId: patient1.id,
        type: "APPOINTMENT",
        details: "Annual checkup with Dr. Smith",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // next week
        isDismissed: false
      }
    ];

    await db.insert(reminders).values(reminderData);
    console.log("✅ Reminders created");

    console.log("🎉 Comprehensive database seeding completed successfully!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

function getTimeSlotsForActivity(category: string): string[] {
  switch (category) {
    case "Mind & Body":
      return ["08:00", "18:00"];
    case "Team Sports":
      return ["16:00", "17:00", "19:00"];
    case "Individual Sports":
      return ["09:00", "15:00"];
    case "Dance Fitness":
      return ["19:00"];
    case "Strength & Conditioning":
      return ["06:00", "07:00", "20:00"];
    default:
      return ["09:00", "17:00"];
  }
}

// Run the seeding
seedComprehensiveData()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });

export { seedComprehensiveData };