import type { Medication, Sale, PurchaseOrder, Return, Patient, Supplier, User, TimeLog, AppSettings } from "./types";

export const suppliers: Supplier[] = [
    { id: "SUP001", name: "Pharma Inc.", contactPerson: "John Doe", phone: "123-456-7890", email: "contact@pharma-inc.com"},
    { id: "SUP002", name: "HealthCare Supplies", contactPerson: "Jane Smith", phone: "987-654-3210", email: "sales@healthcaresupplies.com"},
    { id: "SUP003", name: "Allergy Relief Co.", contactPerson: "Peter Jones", phone: "555-555-5555", email: "info@allergyrelief.com"},
    { id: "SUP004", name: "Wellness Distributors", contactPerson: "Maria Garcia", phone: "555-123-4567", email: "orders@wellnessdist.com"},
];

export const inventory: Medication[] = [
  { id: "MED001", name: "Paracetamol 500mg Tabs", stock: 150, reorderPoint: 50, category: "Painkiller", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 5.99, purchasePrice: 3.50, expirationDate: "2025-12-31" },
  { id: "MED002", name: "Amoxicillin 250mg Caps", stock: 80, reorderPoint: 30, category: "Antibiotic", supplierId: "SUP002", supplierName: "HealthCare Supplies", price: 12.50, purchasePrice: 8.00, expirationDate: "2025-08-31" },
  { id: "MED003", name: "Ibuprofen 200mg Tabs", stock: 20, reorderPoint: 75, category: "Painkiller", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 7.25, purchasePrice: 4.50, expirationDate: "2026-01-31" },
  { id: "MED004", name: "Loratadine 10mg Tabs", stock: 45, reorderPoint: 20, category: "Antihistamine", supplierId: "SUP003", supplierName: "Allergy Relief Co.", price: 15.00, purchasePrice: 9.75, expirationDate: "2024-10-31" },
  { id: "MED005", name: "Omeprazole 20mg Caps", stock: 60, reorderPoint: 25, category: "Acid Reflux", supplierId: "SUP002", supplierName: "HealthCare Supplies", price: 22.75, purchasePrice: 15.00, expirationDate: "2025-05-31" },
  { id: "MED006", name: "Simvastatin 40mg Tabs", stock: 90, reorderPoint: 40, category: "Cholesterol", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 30.00, purchasePrice: 20.25, expirationDate: "2024-09-30" },
  { id: "MED007", name: "Metformin 500mg Tabs", stock: 120, reorderPoint: 50, category: "Diabetes", supplierId: "SUP002", supplierName: "HealthCare Supplies", price: 18.90, purchasePrice: 12.00, expirationDate: "2025-11-30" },
  { id: "MED008", name: "Amlodipine 5mg Tabs", stock: 12, reorderPoint: 15, category: "Blood Pressure", supplierId: "SUP003", supplierName: "Allergy Relief Co.", price: 14.50, purchasePrice: 9.00, expirationDate: "2024-08-15" },
  { id: "MED009", name: "Cetirizine 10mg Tabs", stock: 70, reorderPoint: 30, category: "Antihistamine", supplierId: "SUP003", supplierName: "Allergy Relief Co.", price: 11.20, purchasePrice: 7.00, expirationDate: "2026-03-31" },
  { id: "MED010", name: "Aspirin 81mg Tabs", stock: 300, reorderPoint: 100, category: "Painkiller", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 4.50, purchasePrice: 2.50, expirationDate: "2025-07-31" },
  { id: "MED011", name: "Vitamin C 1000mg", stock: 5, reorderPoint: 20, category: "Vitamins", supplierId: "SUP004", supplierName: "Wellness Distributors", price: 9.99, purchasePrice: 6.00, expirationDate: "2024-08-20" },
  { id: "MED012", name: "Vitamin D3 2000IU", stock: 150, reorderPoint: 30, category: "Vitamins", supplierId: "SUP004", supplierName: "Wellness Distributors", price: 13.50, purchasePrice: 8.50, expirationDate: "2026-06-30" },
];

export const users: User[] = [
    { id: "USR001", name: "علي المدير", role: "Admin", hourlyRate: 25.00, pin: "1234"},
    { id: "USR002", name: "سارة الموظفة", role: "Employee", hourlyRate: 15.00, pin: "5678"},
];

export const sales: Sale[] = [
  { id: "SALE001", date: "2024-07-20T10:30:00Z", items: [{ medicationId: "MED001", name: "Paracetamol 500mg Tabs", quantity: 2, price: 5.99 }], total: 11.98, userId: "USR002" },
  { id: "SALE002", date: "2024-07-20T11:05:00Z", items: [{ medicationId: "MED003", name: "Ibuprofen 200mg Tabs", quantity: 1, price: 7.25 }, { medicationId: "MED004", name: "Loratadine 10mg Tabs", quantity: 1, price: 15.00 }], total: 22.25, userId: "USR001", patientId: "PAT002", patientName: "فاطمة علي" },
  { id: "SALE003", date: "2024-07-21T14:00:00Z", items: [{ medicationId: "MED002", name: "Amoxicillin 250mg Caps", quantity: 1, price: 12.50 }], total: 12.50, userId: "USR002" },
  { id: "SALE004", date: "2024-07-22T09:15:00Z", items: [{ medicationId: "MED010", name: "Aspirin 81mg Tabs", quantity: 3, price: 4.50 }], total: 13.50, userId: "USR002" },
  { id: "SALE005", date: "2024-07-23T16:45:00Z", items: [{ medicationId: "MED005", name: "Omeprazole 20mg Caps", quantity: 1, price: 22.75 }], total: 22.75, userId: "USR001" },
  { id: "SALE006", date: "2024-07-24T12:00:00Z", items: [{ medicationId: "MED008", name: "Amlodipine 5mg Tabs", quantity: 1, price: 14.50 }], total: 14.50, userId: "USR002", patientId: "PAT001", patientName: "أحمد محمود" },
  { id: "SALE007", date: "2024-07-25T11:20:00Z", items: [{ medicationId: "MED001", name: "Paracetamol 500mg Tabs", quantity: 1, price: 5.99 }, { medicationId: "MED010", name: "Aspirin 81mg Tabs", quantity: 1, price: 4.50 }], total: 10.49, userId: "USR001" },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: "PO001", supplierId: "SUP001", supplierName: "Pharma Inc.", date: "2024-07-15", items: [{ medicationId: "MED001", name: "Paracetamol 500mg Tabs", quantity: 100 }, { medicationId: "MED003", name: "Ibuprofen 200mg Tabs", quantity: 50 }], status: "Received" },
  { id: "PO002", supplierId: "SUP002", supplierName: "HealthCare Supplies", date: "2024-07-18", items: [{ medicationId: "MED002", name: "Amoxicillin 250mg Caps", quantity: 50 }], status: "Received" },
  { id: "PO003", supplierId: "SUP003", supplierName: "Allergy Relief Co.", date: "2024-07-22", items: [{ medicationId: "MED004", name: "Loratadine 10mg Tabs", quantity: 30 }], status: "Pending" },
];

export const supplierReturns: Return[] = [
    { id: "S-RET001", date: "2024-07-21", medicationId: "MED001", medicationName: "Paracetamol 500mg Tabs", quantity: 5, reason: "Damaged packaging", supplierId: "SUP001", purchaseId: "PO001" },
];

export const patients: Patient[] = [
    { 
        id: "PAT001", 
        name: "أحمد محمود", 
        medications: [
            { medicationId: "MED007", name: "Metformin 500mg Tabs" },
            { medicationId: "MED008", name: "Amlodipine 5mg Tabs" }
        ],
        notes: "يعاني من السكري وارتفاع ضغط الدم."
    },
    { 
        id: "PAT002", 
        name: "فاطمة علي", 
        medications: [
            { medicationId: "MED004", name: "Loratadine 10mg Tabs" }
        ],
        notes: "حساسية موسمية."
    },
    { 
        id: "PAT003", 
        name: "خالد وليد", 
        medications: [],
        notes: "لا توجد أدوية مزمنة."
    },
];

export const timeLogs: TimeLog[] = [
    { id: "TL001", userId: "USR002", clockIn: "2024-07-25T09:00:00Z", clockOut: "2024-07-25T17:00:00Z" },
    { id: "TL002", userId: "USR001", clockIn: "2024-07-25T08:30:00Z", clockOut: "2024-07-25T18:00:00Z" },
    { id: "TL003", userId: "USR002", clockIn: "2024-07-26T09:05:00Z", clockOut: "2024-07-26T17:15:00Z" },
];

export const appSettings: AppSettings = {
    pharmacyName: "صيدلية مدستوك",
    pharmacyAddress: "123 شارع الصحة، المدينة الطبية",
    pharmacyPhone: "964-7701234567",
    pharmacyEmail: "contact@medstock.com",
    expirationThresholdDays: 90,
}
