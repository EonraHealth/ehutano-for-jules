import { generateOrderNumber } from './utils';

// Mock inventory data
export const mockInventoryItems = [
  {
    id: 1,
    medicineId: 101,
    medicineName: "Paracetamol 500mg",
    batchNumber: "PCM2023-001",
    expiryDate: "2024-12-31",
    quantity: 150,
    reorderLevel: 50,
    unitPrice: 5.99,
    status: "IN_STOCK",
    location: "Main Shelf A1",
    manufacturer: "PharmaCorp Ltd",
    category: "Painkillers"
  },
  {
    id: 2,
    medicineId: 102,
    medicineName: "Amoxicillin 250mg",
    batchNumber: "AMX2023-045",
    expiryDate: "2024-10-15",
    quantity: 80,
    reorderLevel: 30,
    unitPrice: 12.50,
    status: "IN_STOCK",
    location: "Refrigerator R2",
    manufacturer: "MediCare Pharmaceuticals",
    category: "Antibiotics"
  },
  {
    id: 3,
    medicineId: 103,
    medicineName: "Lisinopril 10mg",
    batchNumber: "LSP2023-112",
    expiryDate: "2025-05-20",
    quantity: 200,
    reorderLevel: 60,
    unitPrice: 15.75,
    status: "IN_STOCK",
    location: "Main Shelf B3",
    manufacturer: "HeartCare Pharma",
    category: "Chronic"
  },
  {
    id: 4,
    medicineId: 104,
    medicineName: "Metformin 500mg",
    batchNumber: "MTF2023-078",
    expiryDate: "2025-08-10",
    quantity: 120,
    reorderLevel: 40,
    unitPrice: 9.99,
    status: "IN_STOCK",
    location: "Main Shelf C2",
    manufacturer: "DiabeCare Ltd",
    category: "Chronic"
  },
  {
    id: 5,
    medicineId: 105,
    medicineName: "Ibuprofen 400mg",
    batchNumber: "IBP2023-056",
    expiryDate: "2024-06-15",
    quantity: 25,
    reorderLevel: 30,
    unitPrice: 7.50,
    status: "LOW_STOCK",
    location: "Main Shelf A2",
    manufacturer: "PharmaCorp Ltd",
    category: "Painkillers"
  },
  {
    id: 6,
    medicineId: 106,
    medicineName: "Ciprofloxacin 500mg",
    batchNumber: "CPF2023-023",
    expiryDate: "2023-06-30",
    quantity: 0,
    reorderLevel: 20,
    unitPrice: 18.25,
    status: "OUT_OF_STOCK",
    location: "Main Shelf D1",
    manufacturer: "MediCare Pharmaceuticals",
    category: "Antibiotics"
  },
  {
    id: 7,
    medicineId: 107,
    medicineName: "Vitamin D3 1000IU",
    batchNumber: "VTD2023-098",
    expiryDate: "2025-12-01",
    quantity: 85,
    reorderLevel: 30,
    unitPrice: 14.99,
    status: "IN_STOCK",
    location: "Supplements Section S1",
    manufacturer: "VitalLife Supplements",
    category: "Supplements"
  }
];

// Mock order data
export const mockOrders = [
  {
    id: 1,
    patientId: 101,
    patientName: "John Smith",
    patientEmail: "john.smith@example.com",
    patientPhone: "+263 77 123 4567",
    orderNumber: generateOrderNumber(),
    orderDate: "2023-05-15T10:30:00Z",
    status: "COMPLETED",
    total: 48.97,
    deliveryAddress: "123 Main St, Harare",
    deliveryMethod: "PICKUP",
    paymentMethod: "CASH",
    paymentStatus: "PAID",
    notes: "Customer prefers generic medicines",
    items: [
      {
        id: 1,
        orderId: 1,
        medicineId: 101,
        medicineName: "Paracetamol 500mg",
        quantity: 3,
        unitPrice: 5.99,
        subtotal: 17.97
      },
      {
        id: 2,
        orderId: 1,
        medicineId: 105,
        medicineName: "Ibuprofen 400mg",
        quantity: 2,
        unitPrice: 7.50,
        subtotal: 15.00
      },
      {
        id: 3,
        orderId: 1,
        medicineId: 107,
        medicineName: "Vitamin D3 1000IU",
        quantity: 1,
        unitPrice: 14.99,
        subtotal: 14.99
      }
    ]
  },
  {
    id: 2,
    patientId: 102,
    patientName: "Mary Johnson",
    patientEmail: "mary.j@example.com",
    patientPhone: "+263 77 987 6543",
    orderNumber: generateOrderNumber(),
    orderDate: "2023-05-18T14:45:00Z",
    status: "READY",
    total: 34.75,
    deliveryAddress: "45 Park Avenue, Bulawayo",
    deliveryMethod: "DELIVERY",
    paymentMethod: "MEDICAL_AID",
    paymentStatus: "PAID",
    notes: "",
    items: [
      {
        id: 4,
        orderId: 2,
        medicineId: 102,
        medicineName: "Amoxicillin 250mg",
        quantity: 2,
        unitPrice: 12.50,
        subtotal: 25.00
      },
      {
        id: 5,
        orderId: 2,
        medicineId: 101,
        medicineName: "Paracetamol 500mg",
        quantity: 1,
        unitPrice: 5.99,
        subtotal: 5.99
      }
    ]
  },
  {
    id: 3,
    patientId: 103,
    patientName: "David Williams",
    patientEmail: "david.w@example.com",
    patientPhone: "+263 77 456 7890",
    orderNumber: generateOrderNumber(),
    orderDate: "2023-05-20T09:15:00Z",
    status: "PROCESSING",
    total: 45.73,
    deliveryAddress: "78 River Road, Mutare",
    deliveryMethod: "PICKUP",
    paymentMethod: "MEDICAL_AID",
    paymentStatus: "PENDING",
    notes: "Call before preparing, may change some items",
    items: [
      {
        id: 6,
        orderId: 3,
        medicineId: 103,
        medicineName: "Lisinopril 10mg",
        quantity: 2,
        unitPrice: 15.75,
        subtotal: 31.50
      },
      {
        id: 7,
        orderId: 3,
        medicineId: 101,
        medicineName: "Paracetamol 500mg",
        quantity: 1,
        unitPrice: 5.99,
        subtotal: 5.99
      },
      {
        id: 8,
        orderId: 3,
        medicineId: 105,
        medicineName: "Ibuprofen 400mg",
        quantity: 1,
        unitPrice: 7.50,
        subtotal: 7.50
      }
    ]
  },
  {
    id: 4,
    patientId: 104,
    patientName: "Sarah Brown",
    patientEmail: "sarah.b@example.com",
    patientPhone: "+263 77 567 8901",
    orderNumber: generateOrderNumber(),
    orderDate: "2023-05-21T16:30:00Z",
    status: "PENDING",
    total: 55.74,
    deliveryAddress: "12 Highland Drive, Gweru",
    deliveryMethod: "DELIVERY",
    paymentMethod: "CREDIT_CARD",
    paymentStatus: "PAID",
    notes: "",
    items: [
      {
        id: 9,
        orderId: 4,
        medicineId: 104,
        medicineName: "Metformin 500mg",
        quantity: 3,
        unitPrice: 9.99,
        subtotal: 29.97
      },
      {
        id: 10,
        orderId: 4,
        medicineId: 107,
        medicineName: "Vitamin D3 1000IU",
        quantity: 1,
        unitPrice: 14.99,
        subtotal: 14.99
      },
      {
        id: 11,
        orderId: 4,
        medicineId: 105,
        medicineName: "Ibuprofen 400mg",
        quantity: 1,
        unitPrice: 7.50,
        subtotal: 7.50
      }
    ]
  },
  {
    id: 5,
    patientId: 105,
    patientName: "Michael Davis",
    patientEmail: "michael.d@example.com",
    patientPhone: "+263 77 678 9012",
    orderNumber: generateOrderNumber(),
    orderDate: "2023-05-22T11:20:00Z",
    status: "CANCELLED",
    total: 39.24,
    deliveryAddress: "56 Central Ave, Harare",
    deliveryMethod: "PICKUP",
    paymentMethod: "MOBILE_MONEY",
    paymentStatus: "FAILED",
    notes: "Customer canceled due to payment issues",
    items: [
      {
        id: 12,
        orderId: 5,
        medicineId: 103,
        medicineName: "Lisinopril 10mg",
        quantity: 1,
        unitPrice: 15.75,
        subtotal: 15.75
      },
      {
        id: 13,
        orderId: 5,
        medicineId: 104,
        medicineName: "Metformin 500mg",
        quantity: 2,
        unitPrice: 9.99,
        subtotal: 19.98
      }
    ]
  }
];

// Mock medical aid claims data
// Mock delivery partners data
export const mockDeliveryPartners = [
  {
    id: 1,
    name: "Swift Courier Zimbabwe",
    contactEmail: "dispatch@swiftcourier.co.zw",
    contactPhone: "+263772123456",
    website: "https://swiftcourier.co.zw",
    logoUrl: "/assets/logos/swift-courier.png",
    isActive: true,
    supportedAreas: ["Harare", "Bulawayo", "Mutare"],
    averageDeliveryTime: 120, // 2 hours in minutes
    costPerKm: 0.50,
    minimumFee: 5.00
  },
  {
    id: 2,
    name: "MedExpress Delivery",
    contactEmail: "operations@medexpress.co.zw",
    contactPhone: "+263712987654",
    website: "https://medexpress.co.zw",
    logoUrl: "/assets/logos/medexpress.png",
    isActive: true,
    supportedAreas: ["Harare", "Chitungwiza", "Norton", "Ruwa"],
    averageDeliveryTime: 90, // 1.5 hours in minutes
    costPerKm: 0.65,
    minimumFee: 7.50
  },
  {
    id: 3,
    name: "HealthRider Logistics",
    contactEmail: "support@healthrider.co.zw",
    contactPhone: "+263782456789",
    website: "https://healthrider.co.zw",
    logoUrl: "/assets/logos/healthrider.png",
    isActive: true,
    supportedAreas: ["Harare", "Bulawayo", "Gweru", "Kwekwe", "Kadoma"],
    averageDeliveryTime: 150, // 2.5 hours in minutes
    costPerKm: 0.45,
    minimumFee: 6.00
  },
  {
    id: 4,
    name: "Rural Health Connect",
    contactEmail: "dispatch@ruralhealthconnect.org",
    contactPhone: "+263733789012",
    website: "https://ruralhealthconnect.org",
    logoUrl: "/assets/logos/rural-health.png",
    isActive: true,
    supportedAreas: ["Masvingo", "Marondera", "Mutoko", "Murewa", "Chipinge"],
    averageDeliveryTime: 240, // 4 hours in minutes
    costPerKm: 0.40,
    minimumFee: 8.00
  }
];

// Mock deliveries data
export const mockDeliveries = [
  {
    id: 1,
    orderId: 2,
    orderNumber: mockOrders[1].orderNumber,
    partnerId: 1,
    partnerName: "Swift Courier Zimbabwe",
    trackingNumber: "SCZ-12345",
    deliveryType: "STANDARD",
    status: "DELIVERED",
    scheduledDate: "2023-05-18",
    scheduledTimeSlot: "14:00-16:00",
    driverName: "Tendai Moyo",
    driverPhone: "+263772111222",
    estimatedDeliveryTime: "2023-05-18T15:30:00Z",
    actualPickupTime: "2023-05-18T14:10:00Z",
    actualDeliveryTime: "2023-05-18T15:45:00Z",
    deliveryAddress: "45 Park Avenue, Bulawayo",
    recipientName: "Mary Johnson",
    recipientPhone: "+263 77 987 6543",
    deliveryFee: 8.50,
    distance: 7.2,
    signature: "/assets/signatures/delivery-1.png",
    photoProof: "/assets/photos/delivery-1.jpg",
    createdAt: "2023-05-18T09:30:00Z"
  },
  {
    id: 2,
    orderId: 4,
    orderNumber: mockOrders[3].orderNumber,
    partnerId: 2,
    partnerName: "MedExpress Delivery",
    trackingNumber: "MED-67890",
    deliveryType: "EXPRESS",
    status: "IN_TRANSIT",
    scheduledDate: "2023-05-21",
    scheduledTimeSlot: "16:00-18:00",
    driverName: "Chido Makoni",
    driverPhone: "+263772333444",
    estimatedDeliveryTime: "2023-05-21T17:15:00Z",
    actualPickupTime: "2023-05-21T16:05:00Z",
    actualDeliveryTime: null,
    deliveryAddress: "12 Highland Drive, Gweru",
    recipientName: "Sarah Brown",
    recipientPhone: "+263 77 567 8901",
    deliveryFee: 12.00,
    distance: 5.8,
    lastLocationLat: -19.516667,
    lastLocationLng: 29.833333,
    lastLocationUpdate: "2023-05-21T16:45:00Z",
    createdAt: "2023-05-21T14:15:00Z"
  },
  {
    id: 3,
    orderId: 3,
    orderNumber: mockOrders[2].orderNumber,
    partnerId: 3,
    partnerName: "HealthRider Logistics",
    trackingNumber: "HRL-54321",
    deliveryType: "SCHEDULED",
    status: "PENDING",
    scheduledDate: "2023-05-25",
    scheduledTimeSlot: "10:00-12:00",
    driverName: null,
    driverPhone: null,
    estimatedDeliveryTime: "2023-05-25T11:00:00Z",
    actualPickupTime: null,
    actualDeliveryTime: null,
    deliveryAddress: "78 River Road, Mutare",
    recipientName: "David Williams",
    recipientPhone: "+263 77 456 7890",
    deliveryFee: 10.25,
    distance: 8.5,
    createdAt: "2023-05-20T14:20:00Z"
  },
  {
    id: 4,
    orderId: 6,
    orderNumber: "ORD-20230523-001",
    partnerId: 1,
    partnerName: "Swift Courier Zimbabwe",
    trackingNumber: "SCZ-67890",
    deliveryType: "SAME_DAY",
    status: "ASSIGNED",
    scheduledDate: "2023-05-23",
    scheduledTimeSlot: "12:00-14:00",
    driverName: "Farai Dube",
    driverPhone: "+263772777888",
    estimatedDeliveryTime: "2023-05-23T13:30:00Z",
    actualPickupTime: null,
    actualDeliveryTime: null,
    deliveryAddress: "34 Samora Machel Ave, Harare",
    recipientName: "Elizabeth Taylor",
    recipientPhone: "+263712345678",
    deliveryFee: 9.75,
    distance: 6.8,
    createdAt: "2023-05-23T09:45:00Z"
  },
  {
    id: 5,
    orderId: 7,
    orderNumber: "ORD-20230524-003",
    partnerId: 4,
    partnerName: "Rural Health Connect",
    trackingNumber: "RHC-13579",
    deliveryType: "STANDARD",
    status: "PICKED_UP",
    scheduledDate: "2023-05-24",
    scheduledTimeSlot: "09:00-13:00",
    driverName: "Tatenda Mhuri",
    driverPhone: "+263772999000",
    estimatedDeliveryTime: "2023-05-24T12:00:00Z",
    actualPickupTime: "2023-05-24T09:15:00Z",
    actualDeliveryTime: null,
    deliveryAddress: "15 Main Street, Masvingo",
    recipientName: "Robert Miller",
    recipientPhone: "+263712765432",
    deliveryFee: 15.50,
    distance: 18.2,
    lastLocationLat: -20.072300,
    lastLocationLng: 30.828751,
    lastLocationUpdate: "2023-05-24T10:30:00Z",
    createdAt: "2023-05-24T08:20:00Z"
  }
];

export const mockMedicalAidClaims = [
  {
    id: 1,
    claimNumber: "MA2023-0001",
    orderId: 2,
    orderNumber: mockOrders[1].orderNumber,
    patientId: 102,
    patientName: "Mary Johnson",
    medicalAidProvider: "CIMAS",
    medicalAidMemberId: "CIM12345678",
    claimDate: "2023-05-18T15:00:00Z",
    claimAmount: 30.99,
    approvedAmount: 28.50,
    status: "APPROVED",
    notes: "Approved with partial coverage",
    submittedAt: "2023-05-18T15:05:00Z",
    updatedAt: "2023-05-19T09:15:00Z",
    claimItems: [
      {
        id: 1,
        claimId: 1,
        medicineId: 102,
        medicineName: "Amoxicillin 250mg",
        quantity: 2,
        unitPrice: 12.50,
        subtotal: 25.00,
        approvedAmount: 22.50
      },
      {
        id: 2,
        claimId: 1,
        medicineId: 101,
        medicineName: "Paracetamol 500mg",
        quantity: 1,
        unitPrice: 5.99,
        subtotal: 5.99,
        approvedAmount: 5.99
      }
    ]
  },
  {
    id: 2,
    claimNumber: "MA2023-0002",
    orderId: 3,
    orderNumber: mockOrders[2].orderNumber,
    patientId: 103,
    patientName: "David Williams",
    medicalAidProvider: "First Mutual",
    medicalAidMemberId: "FM98765432",
    claimDate: "2023-05-20T09:30:00Z",
    claimAmount: 44.99,
    approvedAmount: null,
    status: "PENDING",
    notes: null,
    submittedAt: "2023-05-20T09:45:00Z",
    updatedAt: null,
    claimItems: [
      {
        id: 3,
        claimId: 2,
        medicineId: 103,
        medicineName: "Lisinopril 10mg",
        quantity: 2,
        unitPrice: 15.75,
        subtotal: 31.50,
        approvedAmount: null
      },
      {
        id: 4,
        claimId: 2,
        medicineId: 101,
        medicineName: "Paracetamol 500mg",
        quantity: 1,
        unitPrice: 5.99,
        subtotal: 5.99,
        approvedAmount: null
      },
      {
        id: 5,
        claimId: 2,
        medicineId: 105,
        medicineName: "Ibuprofen 400mg",
        quantity: 1,
        unitPrice: 7.50,
        subtotal: 7.50,
        approvedAmount: null
      }
    ]
  },
  {
    id: 3,
    claimNumber: "MA2023-0003",
    orderId: 1,
    orderNumber: mockOrders[0].orderNumber,
    patientId: 101,
    patientName: "John Smith",
    medicalAidProvider: "PSMAS",
    medicalAidMemberId: "PSM45678901",
    claimDate: "2023-05-15T11:00:00Z",
    claimAmount: 32.96,
    approvedAmount: 0,
    status: "REJECTED",
    notes: "Claim rejected due to expired membership",
    submittedAt: "2023-05-15T11:15:00Z",
    updatedAt: "2023-05-16T14:30:00Z",
    claimItems: [
      {
        id: 6,
        claimId: 3,
        medicineId: 101,
        medicineName: "Paracetamol 500mg",
        quantity: 3,
        unitPrice: 5.99,
        subtotal: 17.97,
        approvedAmount: 0
      },
      {
        id: 7,
        claimId: 3,
        medicineId: 105,
        medicineName: "Ibuprofen 400mg",
        quantity: 2,
        unitPrice: 7.50,
        subtotal: 15.00,
        approvedAmount: 0
      }
    ]
  },
  {
    id: 4,
    claimNumber: "MA2023-0004",
    orderId: 6,
    orderNumber: "ORD-20230523-001",
    patientId: 106,
    patientName: "Elizabeth Taylor",
    medicalAidProvider: "CIMAS",
    medicalAidMemberId: "CIM34567890",
    claimDate: "2023-05-23T13:45:00Z",
    claimAmount: 53.48,
    approvedAmount: 53.48,
    status: "PAID",
    notes: "Claim fully paid",
    submittedAt: "2023-05-23T14:00:00Z",
    updatedAt: "2023-05-24T10:30:00Z",
    claimItems: [
      {
        id: 8,
        claimId: 4,
        medicineId: 104,
        medicineName: "Metformin 500mg",
        quantity: 2,
        unitPrice: 9.99,
        subtotal: 19.98,
        approvedAmount: 19.98
      },
      {
        id: 9,
        claimId: 4,
        medicineId: 103,
        medicineName: "Lisinopril 10mg",
        quantity: 1,
        unitPrice: 15.75,
        subtotal: 15.75,
        approvedAmount: 15.75
      },
      {
        id: 10,
        claimId: 4,
        medicineId: 107,
        medicineName: "Vitamin D3 1000IU",
        quantity: 1,
        unitPrice: 14.99,
        subtotal: 14.99,
        approvedAmount: 14.99
      }
    ]
  },
  {
    id: 5,
    claimNumber: "MA2023-0005",
    orderId: 7,
    orderNumber: "ORD-20230524-003",
    patientId: 107,
    patientName: "Robert Miller",
    medicalAidProvider: "First Mutual",
    medicalAidMemberId: "FM23456789",
    claimDate: "2023-05-24T15:20:00Z",
    claimAmount: 40.24,
    approvedAmount: null,
    status: "PENDING",
    notes: null,
    submittedAt: "2023-05-24T15:35:00Z",
    updatedAt: null,
    claimItems: [
      {
        id: 11,
        claimId: 5,
        medicineId: 102,
        medicineName: "Amoxicillin 250mg",
        quantity: 2,
        unitPrice: 12.50,
        subtotal: 25.00,
        approvedAmount: null
      },
      {
        id: 12,
        claimId: 5,
        medicineId: 105,
        medicineName: "Ibuprofen 400mg",
        quantity: 2,
        unitPrice: 7.50,
        subtotal: 15.00,
        approvedAmount: null
      }
    ]
  }
];