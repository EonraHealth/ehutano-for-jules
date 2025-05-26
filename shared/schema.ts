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

// Delivery status enum
export const DeliveryStatus = {
  PENDING: "PENDING",
  ASSIGNED: "ASSIGNED",
  PICKED_UP: "PICKED_UP",
  IN_TRANSIT: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED"
} as const;

// Delivery types enum
export const DeliveryType = {
  STANDARD: "STANDARD",
  EXPRESS: "EXPRESS",
  SAME_DAY: "SAME_DAY",
  SCHEDULED: "SCHEDULED"
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
  PENDING_APPROVAL: "PENDING_APPROVAL",
  AWAITING_INFORMATION: "AWAITING_INFORMATION",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  RECEIVED: "RECEIVED",
  PAID: "PAID",
  REJECTED: "REJECTED",
  APPEALED: "APPEALED"
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

// Delivery partners table
export const deliveryPartners = pgTable("delivery_partners", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  website: text("website"),
  logoUrl: text("logo_url"),
  apiEndpoint: text("api_endpoint"),
  apiKey: text("api_key"),
  trackingUrlPattern: text("tracking_url_pattern"),
  isActive: boolean("is_active").default(true).notNull(),
  supportedAreas: text("supported_areas").array(),
  averageDeliveryTime: integer("average_delivery_time"), // in minutes
  costPerKm: numeric("cost_per_km", { precision: 10, scale: 2 }),
  minimumFee: numeric("minimum_fee", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Deliveries table
export const deliveries = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  partnerId: integer("partner_id").references(() => deliveryPartners.id),
  trackingNumber: text("tracking_number"),
  deliveryType: text("delivery_type").notNull().default(DeliveryType.STANDARD),
  status: text("status").notNull().default(DeliveryStatus.PENDING),
  scheduledDate: timestamp("scheduled_date"),
  scheduledTimeSlot: text("scheduled_time_slot"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  driverNotes: text("driver_notes"),
  estimatedDeliveryTime: timestamp("estimated_delivery_time"),
  actualPickupTime: timestamp("actual_pickup_time"),
  actualDeliveryTime: timestamp("actual_delivery_time"),
  deliveryAddress: text("delivery_address").notNull(),
  recipientName: text("recipient_name").notNull(),
  recipientPhone: text("recipient_phone").notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  distance: numeric("distance", { precision: 10, scale: 2 }), // in km
  specialInstructions: text("special_instructions"),
  signature: text("signature"), // URL to signature image
  photoProof: text("photo_proof"), // URL to delivery photo proof
  lastLocationLat: numeric("last_location_lat", { precision: 10, scale: 6 }),
  lastLocationLng: numeric("last_location_lng", { precision: 10, scale: 6 }),
  lastLocationUpdate: timestamp("last_location_update"),
  statusHistory: jsonb("status_history"),
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

// Medical aid providers table
export const medicalAidProviders = pgTable("medical_aid_providers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  address: text("address").notNull(),
  apiEndpoint: text("api_endpoint"),
  apiKey: text("api_key"),
  isActive: boolean("is_active").default(true).notNull(),
  supportedClaimTypes: text("supported_claim_types").array(),
  processingTimeHours: integer("processing_time_hours"),
  // Direct integration enhancements
  supportsDirectClaims: boolean("supports_direct_claims").default(false).notNull(),
  authenticationMethod: text("authentication_method"), // 'API_KEY', 'OAUTH2', 'BASIC_AUTH'
  webhookUrl: text("webhook_url"),
  testMode: boolean("test_mode").default(true).notNull(),
  realTimeValidation: boolean("real_time_validation").default(false).notNull(),
  autoApprovalLimit: numeric("auto_approval_limit", { precision: 10, scale: 2 }),
  integrationConfig: jsonb("integration_config"),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Medical aid claims table
export const medicalAidClaims = pgTable("medical_aid_claims", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  prescriptionId: integer("prescription_id").references(() => prescriptions.id),
  patientId: integer("patient_id").notNull().references(() => users.id),
  providerId: integer("provider_id").notNull().references(() => medicalAidProviders.id),
  membershipNumber: text("membership_number").notNull(),
  dependentCode: text("dependent_code"),
  claimNumber: text("claim_number").unique(),
  claimDate: timestamp("claim_date").defaultNow().notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  coveredAmount: numeric("covered_amount", { precision: 10, scale: 2 }),
  patientResponsibility: numeric("patient_responsibility", { precision: 10, scale: 2 }),
  status: text("status").notNull().default(MedicalAidStatus.PENDING_PATIENT_AUTH),
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  approvalCode: text("approval_code"),
  submissionData: jsonb("submission_data"),
  responseData: jsonb("response_data"),
  attachments: text("attachments").array(),
  // Direct integration enhancements
  isDirectSubmission: boolean("is_direct_submission").default(false).notNull(),
  submissionReference: text("submission_reference"),
  authorizationNumber: text("authorization_number"),
  providerClaimId: text("provider_claim_id"),
  realTimeValidated: boolean("real_time_validated").default(false).notNull(),
  autoProcessed: boolean("auto_processed").default(false).notNull(),
  integrationStatus: text("integration_status").default("MANUAL"),
  webhookReceived: timestamp("webhook_received"),
  processingDurationMs: integer("processing_duration_ms"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
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

export const insertWellnessBookingSchema = createInsertSchema(wellnessBookings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMedicalAidProviderSchema = createInsertSchema(medicalAidProviders).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMedicalAidClaimSchema = createInsertSchema(medicalAidClaims).omit({
  id: true,
  claimNumber: true,
  claimDate: true,
  lastUpdated: true,
  createdAt: true,
  updatedAt: true
});

export const insertDeliveryPartnerSchema = createInsertSchema(deliveryPartners).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertDeliverySchema = createInsertSchema(deliveries).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// No relations needed for now

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

export type WellnessBooking = typeof wellnessBookings.$inferSelect;
export type InsertWellnessBooking = z.infer<typeof insertWellnessBookingSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type MedicalAidProvider = typeof medicalAidProviders.$inferSelect;
export type InsertMedicalAidProvider = z.infer<typeof insertMedicalAidProviderSchema>;

export type MedicalAidClaim = typeof medicalAidClaims.$inferSelect;
export type InsertMedicalAidClaim = z.infer<typeof insertMedicalAidClaimSchema>;

export type DeliveryPartner = typeof deliveryPartners.$inferSelect;
export type InsertDeliveryPartner = z.infer<typeof insertDeliveryPartnerSchema>;

export type Delivery = typeof deliveries.$inferSelect;
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
