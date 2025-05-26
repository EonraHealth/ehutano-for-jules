import { users, medicalAidProviders, medicalAidClaims, wellnessActivities, wellnessBookings, blogPosts,
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

  // Wellness activities methods
  async getWellnessActivities(): Promise<WellnessActivity[]> {
    return await db.select().from(wellnessActivities);
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
}

export const storage = new DatabaseStorage();
