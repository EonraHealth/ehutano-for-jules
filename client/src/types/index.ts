// User related types
export enum UserRole {
  PATIENT = "PATIENT",
  PHARMACY_STAFF = "PHARMACY_STAFF",
  DOCTOR = "DOCTOR",
  WHOLESALER_STAFF = "WHOLESALER_STAFF",
  ADMIN = "ADMIN"
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  phoneNumber?: string;
  profilePictureUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// Patient related types
export interface PatientProfile {
  id: number;
  userId: number;
  medicalAidProvider?: string;
  medicalAidMemberId?: string;
  medicalAidVerified: boolean;
  bloodPressure?: string;
  lastCheckupDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Order related types
export enum OrderStatus {
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PROCESSING = "PROCESSING",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY",
  DELIVERED = "DELIVERED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum MedicalAidStatus {
  NOT_APPLICABLE = "NOT_APPLICABLE",
  PENDING_PATIENT_AUTH = "PENDING_PATIENT_AUTH",
  CLAIM_SUBMITTED = "CLAIM_SUBMITTED",
  RECEIVED = "RECEIVED",
  PAID = "PAID",
  REJECTED = "REJECTED"
}

export interface OrderItem {
  id: number;
  orderId: number;
  inventoryItemId?: number;
  medicineName: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  patientId: number;
  patientName?: string;  // Sometimes included when fetching orders
  pharmacyId: number;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  paymentMethod?: string;
  medicalAidProvider?: string;
  medicalAidMemberId?: string;
  medicalAidStatus: MedicalAidStatus;
  amountCoveredByAid?: number;
  deliveryAddress?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

// Prescription related types
export enum PrescriptionStatus {
  PENDING_REVIEW = "PENDING_REVIEW",
  QUOTE_READY = "QUOTE_READY",
  ACTIVE = "ACTIVE",
  FILLED = "FILLED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED"
}

export interface PrescriptionItem {
  id: number;
  prescriptionId: number;
  medicineNameManual?: string;
  medicineId?: number;
  dosage: string;
  quantity: number;
  instructions?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: number;
  patientId: number;
  patientName?: string;  // Sometimes included when fetching prescriptions
  doctorId?: number;
  doctorNameManual?: string;
  dateIssued: string;
  status: PrescriptionStatus;
  refillsLeft: number;
  uploadUrl?: string;
  notesPatient?: string;
  isQuoteReady: boolean;
  quoteDetailsJson?: any;
  createdAt: string;
  updatedAt: string;
  items?: PrescriptionItem[];
}

// Medicine and inventory related types
export enum InventoryStatus {
  IN_STOCK = "IN_STOCK",
  LOW_STOCK = "LOW_STOCK",
  OUT_OF_STOCK = "OUT_OF_STOCK"
}

export interface Medicine {
  id: number;
  name: string;
  genericName?: string;
  category?: string;
  description?: string;
  manufacturer?: string;
  requiresPrescription: boolean;
  isAntibiotic: boolean;
  defaultImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  pharmacies?: PharmacyInventory[];
}

export interface PharmacyInventory {
  pharmacyId: number;
  pharmacyName: string;
  price: number;
  stockStatus: InventoryStatus;
  stockQuantity?: number;
}

export interface InventoryItem {
  id: number;
  pharmacyId: number;
  medicineId: number;
  medicineName?: string;
  batchNumber?: string;
  expiryDate?: string;
  stockQuantity: number;
  price: number;
  costPrice?: number;
  supplier?: string;
  wholesaleSource?: string;
  status: InventoryStatus;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
}

// Medicine verification related types
export enum VerificationStatus {
  VERIFIED = "VERIFIED",
  INVALID = "INVALID",
  EXPIRED = "EXPIRED",
  NOT_FOUND = "NOT_FOUND"
}

export interface VerificationResult {
  status: VerificationStatus;
  medicineName?: string;
  batchNumber?: string;
  expiryDate?: string;
  pharmacySource?: string;
  wholesaleSourceMatch?: string;
  manufacturerMatch?: string;
  isAntibiotic?: boolean;
  message: string;
}

// Wellness activities related types
export interface WellnessActivity {
  id: number;
  name: string;
  dayOfWeek: string;
  time: string;
  location: string;
  totalSlots: number;
  availableSlots: number;
  bookedByCurrentUser?: boolean;
  iconEmoji?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WellnessBooking {
  id: number;
  activityId: number;
  userId: number;
  bookingTimestamp: string;
  createdAt: string;
  updatedAt: string;
}

// Blog related types
export interface BlogPost {
  id: number;
  title: string;
  authorName: string;
  publishDate: string;
  snippet: string;
  fullContent: string;
  imageUrl?: string;
  category: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// Reminder related types
export interface Reminder {
  id: number;
  patientId: number;
  type: string;
  relatedMedicineId?: number;
  details: string;
  dueDate: string;
  isDismissed: boolean;
  createdAt: string;
  updatedAt: string;
}

// Cart related types
export interface CartItem {
  id: number;
  userId: number;
  inventoryItemId: number;
  medicineName: string;
  quantity: number;
  pricePerUnit: number;
  createdAt: string;
  updatedAt: string;
}
