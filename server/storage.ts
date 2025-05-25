import { users, medicalAidProviders, medicalAidClaims, 
  type User, type InsertUser, 
  type MedicalAidProvider, type InsertMedicalAidProvider,
  type MedicalAidClaim, type InsertMedicalAidClaim } from "@shared/schema";
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
}

export class DatabaseStorage implements IStorage {
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
}

export const storage = new DatabaseStorage();
