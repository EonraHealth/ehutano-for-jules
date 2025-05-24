import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb, uniqueIndex, foreignKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User role enum
export const UserRole = {
  PATIENT: "PATIENT",
  PHARMACY_STAFF: "PHARMACY_STAFF",
  DOCTOR: "DOCTOR",
  WHOLESALER_STAFF: "WHOLESALER_STAFF",
  ADMIN: "ADMIN"
} as const;

// Order status enum
export const OrderStatus = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  PROCESSING: "PROCESSING",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
} as const;

// Prescription status enum
export const PrescriptionStatus = {
  PENDING_REVIEW: "PENDING_REVIEW",
  QUOTE_READY: "QUOTE_READY",
  ACTIVE: "ACTIVE",
  FILLED: "FILLED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED"
} as const;

// Medical aid status enum
export const MedicalAidStatus = {
  NOT_APPLICABLE: "NOT_APPLICABLE",
  PENDING_PATIENT_AUTH: "PENDING_PATIENT_AUTH",
  CLAIM_SUBMITTED: "CLAIM_SUBMITTED",
  RECEIVED: "RECEIVED",
  PAID: "PAID",
  REJECTED: "REJECTED"
} as const;

// Verification status enum
export const VerificationStatus = {
  VERIFIED: "VERIFIED",
  INVALID: "INVALID",
  EXPIRED: "EXPIRED",
  NOT_FOUND: "NOT_FOUND"
} as const;

// Inventory status enum
export const InventoryStatus = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK"
} as const;

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default(UserRole.PATIENT),
  isActive: boolean("is_active").notNull().default(true),
  phoneNumber: text("phone_number"),
  profilePictureUrl: text("profile_picture_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Patient profiles table
export const patientProfiles = pgTable("patient_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  medicalAidProvider: text("medical_aid_provider"),
  medicalAidMemberId: text("medical_aid_member_id"),
  medicalAidVerified: boolean("medical_aid_verified").default(false),
  bloodPressure: text("blood_pressure"),
  lastCheckupDate: timestamp("last_checkup_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Pharmacies table
export const pharmacies = pgTable("pharmacies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  address: text("address").notNull(),
  phoneNumber: text("phone_number").notNull(),
  licenseNumber: text("license_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Pharmacy staff table
export const pharmacyStaff = pgTable("pharmacy_staff", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmacies.id),
  position: text("position"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Medicines table
export const medicines = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  genericName: text("generic_name"),
  category: text("category"),
  description: text("description"),
  manufacturer: text("manufacturer"),
  requiresPrescription: boolean("requires_prescription").default(false),
  isAntibiotic: boolean("is_antibiotic").default(false),
  defaultImageUrl: text("default_image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Inventory items table
export const inventoryItems = pgTable("inventory_items", {
  id: serial("id").primaryKey(),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmacies.id),
  medicineId: integer("medicine_id").notNull().references(() => medicines.id),
  batchNumber: text("batch_number"),
  expiryDate: timestamp("expiry_date"),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  supplier: text("supplier"),
  wholesaleSource: text("wholesale_source"),
  status: text("status").notNull().default(InventoryStatus.IN_STOCK),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Prescriptions table
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").references(() => users.id),
  doctorNameManual: text("doctor_name_manual"),
  dateIssued: timestamp("date_issued").notNull(),
  status: text("status").notNull().default(PrescriptionStatus.PENDING_REVIEW),
  refillsLeft: integer("refills_left").default(0),
  uploadUrl: text("upload_url"),
  notesPatient: text("notes_patient"),
  isQuoteReady: boolean("is_quote_ready").default(false),
  quoteDetailsJson: jsonb("quote_details_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Prescription items table
export const prescriptionItems = pgTable("prescription_items", {
  id: serial("id").primaryKey(),
  prescriptionId: integer("prescription_id").notNull().references(() => prescriptions.id),
  medicineNameManual: text("medicine_name_manual"),
  medicineId: integer("medicine_id").references(() => medicines.id),
  dosage: text("dosage").notNull(),
  quantity: integer("quantity").notNull(),
  instructions: text("instructions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  pharmacyId: integer("pharmacy_id").notNull().references(() => pharmacies.id),
  orderDate: timestamp("order_date").defaultNow().notNull(),
  status: text("status").notNull().default(OrderStatus.PENDING_PAYMENT),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  medicalAidProvider: text("medical_aid_provider"),
  medicalAidMemberId: text("medical_aid_member_id"),
  medicalAidStatus: text("medical_aid_status").default(MedicalAidStatus.NOT_APPLICABLE),
  amountCoveredByAid: numeric("amount_covered_by_aid", { precision: 10, scale: 2 }).default("0"),
  deliveryAddress: text("delivery_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  inventoryItemId: integer("inventory_item_id").references(() => inventoryItems.id),
  medicineName: text("medicine_name").notNull(),
  quantity: integer("quantity").notNull(),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Reminders table
export const reminders = pgTable("reminders", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  relatedMedicineId: integer("related_medicine_id").references(() => medicines.id),
  details: text("details").notNull(),
  dueDate: timestamp("due_date").notNull(),
  isDismissed: boolean("is_dismissed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Medicine verification logs table
export const medicineVerificationLogs = pgTable("medicine_verification_logs", {
  id: serial("id").primaryKey(),
  scannedData: text("scanned_data").notNull(),
  userId: integer("user_id").references(() => users.id),
  scanTimestamp: timestamp("scan_timestamp").defaultNow().notNull(),
  verificationStatus: text("verification_status").notNull(),
  medicineNameMatch: text("medicine_name_match"),
  batchNumberMatch: text("batch_number_match"),
  expiryDateMatch: timestamp("expiry_date_match"),
  pharmacySourceMatch: text("pharmacy_source_match"),
  wholesaleSourceMatch: text("wholesale_source_match"),
  manufacturerMatch: text("manufacturer_match"),
  isAntibioticMatch: boolean("is_antibiotic_match"),
  responseMessage: text("response_message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Wellness activities table
export const wellnessActivities = pgTable("wellness_activities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  dayOfWeek: text("day_of_week").notNull(),
  time: text("time").notNull(),
  location: text("location").notNull(),
  totalSlots: integer("total_slots").notNull(),
  iconEmoji: text("icon_emoji"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Wellness bookings table
export const wellnessBookings = pgTable("wellness_bookings", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").notNull().references(() => wellnessActivities.id),
  userId: integer("user_id").notNull().references(() => users.id),
  bookingTimestamp: timestamp("booking_timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Blog posts table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  authorName: text("author_name").notNull(),
  publishDate: timestamp("publish_date").notNull(),
  snippet: text("snippet").notNull(),
  fullContent: text("full_content").notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  tags: text("tags").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Wholesalers table
export const wholesalers = pgTable("wholesalers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  address: text("address").notNull(),
  phoneNumber: text("phone_number").notNull(),
  licenseNumber: text("license_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Wholesaler staff table
export const wholesalerStaff = pgTable("wholesaler_staff", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  wholesalerId: integer("wholesaler_id").notNull().references(() => wholesalers.id),
  position: text("position"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPatientProfileSchema = createInsertSchema(patientProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPharmacySchema = createInsertSchema(pharmacies).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMedicineSchema = createInsertSchema(medicines).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertReminderSchema = createInsertSchema(reminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertWellnessActivitySchema = createInsertSchema(wellnessActivities).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Type relations
export const userRelations = {
  patientProfile: one(patientProfiles, {
    fields: [users.id],
    references: [patientProfiles.userId],
  }),
};

export type PatientProfile = typeof patientProfiles.$inferSelect;
export type InsertPatientProfile = z.infer<typeof insertPatientProfileSchema>;

export type Pharmacy = typeof pharmacies.$inferSelect;
export type InsertPharmacy = z.infer<typeof insertPharmacySchema>;

export type Medicine = typeof medicines.$inferSelect;
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = z.infer<typeof insertReminderSchema>;

export type WellnessActivity = typeof wellnessActivities.$inferSelect;
export type InsertWellnessActivity = z.infer<typeof insertWellnessActivitySchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
