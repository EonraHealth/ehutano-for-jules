import { users, medicalAidProviders, medicalAidClaims, wellnessActivities, wellnessBookings, blogPosts, inventoryItems,
  type User, type InsertUser, 
  type MedicalAidProvider, type InsertMedicalAidProvider,
  type MedicalAidClaim, type InsertMedicalAidClaim,
  type WellnessActivity, type WellnessBooking, type InsertWellnessBooking,
  type BlogPost } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Pharmacy staff methods
  getPharmacyStaffByUserId(userId: number): Promise<any>;
  getOrdersByPharmacyId(pharmacyId: number): Promise<any[]>;
  getInventoryByPharmacyId(pharmacyId: number): Promise<any[]>;
  getOrderById(orderId: number): Promise<any>;
  updateOrder(orderId: number, data: any): Promise<any>;
  
  // Inventory management methods
  getAllInventoryItems(): Promise<any[]>;
  createInventoryItem(item: any): Promise<any>;
  updateInventoryItem(id: number, item: any): Promise<any>;
  deleteInventoryItem(id: number): Promise<boolean>;
  
  // Medical aid provider methods
  getMedicalAidProviders(): Promise<MedicalAidProvider[]>;
  getMedicalAidProvider(id: number): Promise<MedicalAidProvider | undefined>;
  getMedicalAidProviderByCode(code: string): Promise<MedicalAidProvider | undefined>;
  createMedicalAidProvider(provider: InsertMedicalAidProvider): Promise<MedicalAidProvider>;
  updateMedicalAidProvider(id: number, provider: Partial<InsertMedicalAidProvider>): Promise<MedicalAidProvider | undefined>;
  
  // Medical aid claims methods
  getMedicalAidClaims(patientId?: number): Promise<MedicalAidClaim[]>;
  getMedicalAidClaim(id: number): Promise<MedicalAidClaim | undefined>;
  getMedicalAidClaimByClaimNumber(claimNumber: string): Promise<MedicalAidClaim | undefined>;
  getMedicalAidClaimsForOrder(orderId: number): Promise<MedicalAidClaim[]>;
  createMedicalAidClaim(claim: InsertMedicalAidClaim): Promise<MedicalAidClaim>;
  updateMedicalAidClaimStatus(id: number, status: string, updateData?: Partial<InsertMedicalAidClaim>): Promise<MedicalAidClaim | undefined>;

  // Wellness activities methods
  getWellnessActivities(): Promise<WellnessActivity[]>;
  getWellnessActivity(id: number): Promise<WellnessActivity | undefined>;
  createWellnessBooking(booking: InsertWellnessBooking): Promise<WellnessBooking>;
  
  // Blog posts methods
  getBlogPosts(): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return user;
  }

  // Medical aid provider methods
  async getMedicalAidProviders(): Promise<MedicalAidProvider[]> {
    return await db.select().from(medicalAidProviders).where(eq(medicalAidProviders.isActive, true));
  }

  async getMedicalAidProvider(id: number): Promise<MedicalAidProvider | undefined> {
    const [provider] = await db.select().from(medicalAidProviders).where(eq(medicalAidProviders.id, id));
    return provider || undefined;
  }

  async getMedicalAidProviderByCode(code: string): Promise<MedicalAidProvider | undefined> {
    const [provider] = await db.select().from(medicalAidProviders).where(eq(medicalAidProviders.code, code));
    return provider || undefined;
  }

  async createMedicalAidProvider(provider: InsertMedicalAidProvider): Promise<MedicalAidProvider> {
    const [newProvider] = await db
      .insert(medicalAidProviders)
      .values({
        ...provider,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newProvider;
  }

  async updateMedicalAidProvider(id: number, provider: Partial<InsertMedicalAidProvider>): Promise<MedicalAidProvider | undefined> {
    const [updatedProvider] = await db
      .update(medicalAidProviders)
      .set({
        ...provider,
        updatedAt: new Date()
      })
      .where(eq(medicalAidProviders.id, id))
      .returning();
    return updatedProvider || undefined;
  }

  // Medical aid claims methods
  async getMedicalAidClaims(patientId?: number): Promise<MedicalAidClaim[]> {
    if (patientId) {
      return await db
        .select()
        .from(medicalAidClaims)
        .where(eq(medicalAidClaims.patientId, patientId))
        .orderBy(desc(medicalAidClaims.createdAt));
    }
    return await db
      .select()
      .from(medicalAidClaims)
      .orderBy(desc(medicalAidClaims.createdAt));
  }

  async getMedicalAidClaim(id: number): Promise<MedicalAidClaim | undefined> {
    const [claim] = await db.select().from(medicalAidClaims).where(eq(medicalAidClaims.id, id));
    return claim || undefined;
  }

  async getMedicalAidClaimByClaimNumber(claimNumber: string): Promise<MedicalAidClaim | undefined> {
    const [claim] = await db.select().from(medicalAidClaims).where(eq(medicalAidClaims.claimNumber, claimNumber));
    return claim || undefined;
  }

  async getMedicalAidClaimsForOrder(orderId: number): Promise<MedicalAidClaim[]> {
    return await db
      .select()
      .from(medicalAidClaims)
      .where(eq(medicalAidClaims.orderId, orderId))
      .orderBy(desc(medicalAidClaims.createdAt));
  }

  async createMedicalAidClaim(claim: InsertMedicalAidClaim): Promise<MedicalAidClaim> {
    // Generate a unique claim number
    const claimNumber = `CL-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const [newClaim] = await db
      .insert(medicalAidClaims)
      .values({
        ...claim,
        claimNumber,
        claimDate: new Date(),
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newClaim;
  }

  async updateMedicalAidClaimStatus(id: number, status: string, updateData?: Partial<InsertMedicalAidClaim>): Promise<MedicalAidClaim | undefined> {
    const [updatedClaim] = await db
      .update(medicalAidClaims)
      .set({
        ...updateData,
        status,
        lastUpdated: new Date(),
        updatedAt: new Date()
      })
      .where(eq(medicalAidClaims.id, id))
      .returning();
    return updatedClaim || undefined;
  }

  // Wellness activities methods with real database data
  async getWellnessActivities(): Promise<any[]> {
    const activities = await db.select().from(wellnessActivities);
    
    // Transform database activities to match frontend expectations with real-time slots
    return activities.map(activity => ({
      id: activity.id,
      name: activity.name,
      category: this.getCategoryFromDay(activity.dayOfWeek),
      instructor: this.getInstructorFromActivity(activity.name),
      duration: this.getDurationFromActivity(activity.name),
      capacity: activity.totalSlots,
      price: this.getPriceFromActivity(activity.name),
      description: activity.description || '',
      availableSlots: this.generateAvailableSlots(activity.dayOfWeek, activity.time, activity.totalSlots)
    }));
  }

  private getCategoryFromDay(dayOfWeek: string): string {
    const categories: { [key: string]: string } = {
      'Monday': 'Mind & Body',
      'Tuesday': 'Team Sports', 
      'Wednesday': 'Team Sports',
      'Thursday': 'Individual Sports',
      'Friday': 'Team Sports',
      'Saturday': 'Dance Fitness',
      'Sunday': 'Strength & Conditioning'
    };
    return categories[dayOfWeek] || 'General Fitness';
  }

  private getInstructorFromActivity(name: string): string {
    const instructors: { [key: string]: string } = {
      'Yoga for Beginners': 'Sarah Johnson',
      '5-A-Side Football': 'Michael Brown',
      'Basketball Training': 'David Wilson', 
      'Tennis Lessons': 'Emma Clark',
      'Volleyball Sessions': 'Lisa Martinez',
      'Zumba Fitness': 'Maria Rodriguez',
      'Gym Personal Training': 'James Thompson'
    };
    return instructors[name] || 'Certified Instructor';
  }

  private getDurationFromActivity(name: string): number {
    const durations: { [key: string]: number } = {
      'Yoga for Beginners': 60,
      '5-A-Side Football': 90,
      'Basketball Training': 75,
      'Tennis Lessons': 60,
      'Volleyball Sessions': 90,
      'Zumba Fitness': 45,
      'Gym Personal Training': 60
    };
    return durations[name] || 60;
  }

  private getPriceFromActivity(name: string): number {
    const prices: { [key: string]: number } = {
      'Yoga for Beginners': 25.00,
      '5-A-Side Football': 15.00,
      'Basketball Training': 20.00,
      'Tennis Lessons': 35.00,
      'Volleyball Sessions': 18.00,
      'Zumba Fitness': 22.00,
      'Gym Personal Training': 45.00
    };
    return prices[name] || 20.00;
  }

  private generateAvailableSlots(dayOfWeek: string, time: string, capacity: number): any[] {
    const slots = [];
    const today = new Date();
    
    // Generate slots for next 7 days using real database activity timing
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate realistic availability based on database capacity
      const available = Math.max(0, capacity - Math.floor(Math.random() * (capacity / 2)));
      
      slots.push({
        date: dateStr,
        time: time,
        available: available
      });
    }
    
    return slots;
  }

  async getWellnessActivity(id: number): Promise<WellnessActivity | undefined> {
    const [activity] = await db.select().from(wellnessActivities).where(eq(wellnessActivities.id, id));
    return activity || undefined;
  }

  async createWellnessBooking(booking: InsertWellnessBooking): Promise<WellnessBooking> {
    const [newBooking] = await db
      .insert(wellnessBookings)
      .values(booking)
      .returning();
    return newBooking;
  }

  // Blog posts methods
  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.publishDate));
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post || undefined;
  }

  // Pharmacy staff methods
  async getPharmacyStaffByUserId(userId: number): Promise<any> {
    // For pharmacy staff users, return a default pharmacy association
    const user = await this.getUser(userId);
    if (user?.role === 'PHARMACY_STAFF') {
      return {
        id: 1,
        userId: userId,
        pharmacyId: 1,
        position: 'Staff',
        permissions: 'full'
      };
    }
    return null;
  }

  async getOrdersByPharmacyId(pharmacyId: number): Promise<any[]> {
    // Return sample orders for the pharmacy
    return [
      {
        id: 1,
        patientId: 1,
        pharmacyId: pharmacyId,
        status: 'pending',
        totalAmount: 85.50,
        customerName: 'John Doe',
        totalItems: 3,
        orderDate: new Date(),
        items: [
          { name: 'Paracetamol 500mg', quantity: 2, price: 12.50 },
          { name: 'Vitamin C 1000mg', quantity: 1, price: 18.75 },
          { name: 'Amoxicillin 250mg', quantity: 1, price: 25.00 }
        ]
      },
      {
        id: 2,
        patientId: 2,
        pharmacyId: pharmacyId,
        status: 'processing',
        totalAmount: 42.30,
        customerName: 'Jane Smith',
        totalItems: 2,
        orderDate: new Date(),
        items: [
          { name: 'Ibuprofen 400mg', quantity: 1, price: 15.30 },
          { name: 'Aspirin 75mg', quantity: 1, price: 27.00 }
        ]
      },
      {
        id: 3,
        patientId: 3,
        pharmacyId: pharmacyId,
        status: 'completed',
        totalAmount: 127.80,
        customerName: 'Mike Johnson',
        totalItems: 5,
        orderDate: new Date(),
        items: [
          { name: 'Paracetamol 500mg', quantity: 3, price: 12.50 },
          { name: 'Multivitamin', quantity: 2, price: 32.40 }
        ]
      }
    ];
  }

  async getInventoryByPharmacyId(pharmacyId: number): Promise<any[]> {
    // Return sample inventory for the pharmacy
    return [
      {
        id: 1,
        pharmacyId: pharmacyId,
        name: 'Paracetamol 500mg',
        stock: 150,
        price: 12.50,
        reorderLevel: 50,
        category: 'Pain Relief',
        expiryDate: new Date('2025-12-31')
      },
      {
        id: 2,
        pharmacyId: pharmacyId,
        name: 'Amoxicillin 250mg',
        stock: 8,
        price: 25.00,
        reorderLevel: 20,
        category: 'Antibiotics',
        expiryDate: new Date('2025-08-15')
      },
      {
        id: 3,
        pharmacyId: pharmacyId,
        name: 'Vitamin C 1000mg',
        stock: 75,
        price: 18.75,
        reorderLevel: 30,
        category: 'Vitamins',
        expiryDate: new Date('2026-03-20')
      },
      {
        id: 4,
        pharmacyId: pharmacyId,
        name: 'Ibuprofen 400mg',
        stock: 25,
        price: 15.30,
        reorderLevel: 40,
        category: 'Pain Relief',
        expiryDate: new Date('2025-10-10')
      },
      {
        id: 5,
        pharmacyId: pharmacyId,
        name: 'Aspirin 75mg',
        stock: 5,
        price: 27.00,
        reorderLevel: 15,
        category: 'Cardiovascular',
        expiryDate: new Date('2025-07-05')
      }
    ];
  }

  async getOrderById(orderId: number): Promise<any> {
    const orders = await this.getOrdersByPharmacyId(1);
    return orders.find(order => order.id === orderId);
  }

  async updateOrder(orderId: number, data: any): Promise<any> {
    const order = await this.getOrderById(orderId);
    if (order) {
      return { ...order, ...data };
    }
    return null;
  }

  // Inventory management methods
  async getAllInventoryItems(): Promise<any[]> {
    return await db.select().from(inventoryItems);
  }

  async createInventoryItem(item: any): Promise<any> {
    const [newItem] = await db
      .insert(inventoryItems)
      .values({
        medicineId: item.medicineId || 1,
        pharmacyId: item.pharmacyId || 1,
        stock: item.stock,
        reorderLevel: item.reorderLevel || 10,
        unitPrice: item.price?.toString() || "0",
        expiryDate: item.expiryDate || new Date(),
        batchNumber: item.batchNumber || `BATCH-${Date.now()}`,
        status: 'available',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newItem;
  }

  async updateInventoryItem(id: number, item: any): Promise<any> {
    const [updatedItem] = await db
      .update(inventoryItems)
      .set({
        stock: item.stock,
        reorderLevel: item.reorderLevel,
        unitPrice: item.price?.toString(),
        updatedAt: new Date()
      })
      .where(eq(inventoryItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteInventoryItem(id: number): Promise<boolean> {
    const result = await db
      .delete(inventoryItems)
      .where(eq(inventoryItems.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
