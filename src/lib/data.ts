
import type { Medication, Sale, PurchaseOrder, Return, Supplier, User, TimeLog, AppSettings, SupplierPayment, Patient } from "./types";

export const suppliers: Supplier[] = [
    { id: "SUP001", name: "Pharma Inc.", contactPerson: "John Doe", phone: "123-456-7890", email: "contact@pharma-inc.com"},
    { id: "SUP002", name: "HealthCare Supplies", contactPerson: "Jane Smith", phone: "987-654-3210", email: "sales@healthcaresupplies.com"},
    { id: "SUP003", name: "Allergy Relief Co.", contactPerson: "Peter Jones", phone: "555-555-5555", email: "info@allergyrelief.com"},
    { id: "SUP004", name: "Wellness Distributors", contactPerson: "Maria Garcia", phone: "555-123-4567", email: "orders@wellnessdist.com"},
];

export const inventory: Medication[] = [
  { id: "8901138507542", name: "Paracetamol 500mg Tabs", stock: 150, reorderPoint: 50, category: "Painkiller", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 9000, purchasePrice: 5250, expirationDate: "2025-12-31" },
  { id: "8901043002229", name: "Amoxicillin 250mg Caps", stock: 80, reorderPoint: 30, category: "Antibiotic", supplierId: "SUP002", supplierName: "HealthCare Supplies", price: 18750, purchasePrice: 12000, expirationDate: "2025-08-31" },
  { id: "8904091101497", name: "Ibuprofen 200mg Tabs", stock: 20, reorderPoint: 75, category: "Painkiller", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 11000, purchasePrice: 6750, expirationDate: "2026-01-31" },
  { id: "5010087201048", name: "Loratadine 10mg Tabs", stock: 45, reorderPoint: 20, category: "Antihistamine", supplierId: "SUP003", supplierName: "Allergy Relief Co.", price: 22500, purchasePrice: 14750, expirationDate: "2024-10-31" },
  { id: "300450305609", name: "Omeprazole 20mg Caps", stock: 60, reorderPoint: 25, category: "Acid Reflux", supplierId: "SUP002", supplierName: "HealthCare Supplies", price: 34250, purchasePrice: 22500, expirationDate: "2025-05-31" },
  { id: "03784993510", name: "Simvastatin 40mg Tabs", stock: 90, reorderPoint: 40, category: "Cholesterol", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 45000, purchasePrice: 30500, expirationDate: "2024-09-30" },
  { id: "301504944810", name: "Metformin 500mg Tabs", stock: 120, reorderPoint: 50, category: "Diabetes", supplierId: "SUP002", supplierName: "HealthCare Supplies", price: 28500, purchasePrice: 18000, expirationDate: "2025-11-30" },
  { id: "305801384013", name: "Amlodipine 5mg Tabs", stock: 12, reorderPoint: 15, category: "Blood Pressure", supplierId: "SUP003", supplierName: "Allergy Relief Co.", price: 21750, purchasePrice: 13500, expirationDate: "2024-08-15" },
  { id: "300450552109", name: "Cetirizine 10mg Tabs", stock: 70, reorderPoint: 30, category: "Antihistamine", supplierId: "SUP003", supplierName: "Allergy Relief Co.", price: 17000, purchasePrice: 10500, expirationDate: "2026-03-31" },
  { id: "041100062327", name: "Aspirin 81mg Tabs", stock: 300, reorderPoint: 100, category: "Painkiller", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 6750, purchasePrice: 3750, expirationDate: "2025-07-31" },
  { id: "031604012891", name: "Vitamin C 1000mg", stock: 5, reorderPoint: 20, category: "Vitamins", supplierId: "SUP004", supplierName: "Wellness Distributors", price: 15000, purchasePrice: 9000, expirationDate: "2024-08-20" },
  { id: "037000412852", name: "Vitamin D3 2000IU", stock: 150, reorderPoint: 30, category: "Vitamins", supplierId: "SUP004", supplierName: "Wellness Distributors", price: 20250, purchasePrice: 12750, expirationDate: "2026-06-30" },
];

export const users: User[] = [];

export const patients: Patient[] = [
  { id: "PAT001", name: "أحمد محمود", medications: [{medicationId: "301504944810", name: "Metformin 500mg Tabs"}], notes: "يراجع كل شهر" },
  { id: "PAT002", name: "فاطمة علي", medications: [{medicationId: "305801384013", name: "Amlodipine 5mg Tabs"}, {medicationId: "03784993510", name: "Simvastatin 40mg Tabs"}], notes: "قياس الضغط عند كل زيارة" },
];

export const sales: Sale[] = [
  { id: "SALE001", date: "2024-07-20T10:30:00Z", items: [{ medicationId: "8901138507542", name: "Paracetamol 500mg Tabs", quantity: 2, price: 9000, purchasePrice: 5250 }], total: 18000, profit: 7500, employeeId: "USR002", employeeName: "سارة الموظفة" },
  { id: "SALE002", date: "2024-07-20T11:05:00Z", items: [{ medicationId: "8904091101497", name: "Ibuprofen 200mg Tabs", quantity: 1, price: 11000, purchasePrice: 6750 }, { medicationId: "5010087201048", name: "Loratadine 10mg Tabs", quantity: 1, price: 22500, purchasePrice: 14750 }], total: 33500, profit: 12000, employeeId: "USR001", employeeName: "علي المدير" },
  { id: "SALE003", date: "2024-07-21T14:00:00Z", items: [{ medicationId: "8901043002229", name: "Amoxicillin 250mg Caps", quantity: 1, price: 18750, purchasePrice: 12000 }], total: 18750, profit: 6750, employeeId: "USR002", employeeName: "سارة الموظفة" },
  { id: "SALE004", date: "2024-07-22T09:15:00Z", items: [{ medicationId: "041100062327", name: "Aspirin 81mg Tabs", quantity: 3, price: 6750, purchasePrice: 3750 }], total: 20250, profit: 9000, employeeId: "USR003", employeeName: "أحمد الصيدلي" },
  { id: "SALE005", date: "2024-07-23T16:45:00Z", items: [{ medicationId: "300450305609", name: "Omeprazole 20mg Caps", quantity: 1, price: 34250, purchasePrice: 22500 }], total: 34250, profit: 11750, employeeId: "USR001", employeeName: "علي المدير" },
  { id: "SALE006", date: "2024-07-24T12:00:00Z", items: [{ medicationId: "305801384013", name: "Amlodipine 5mg Tabs", quantity: 1, price: 21750, purchasePrice: 13500 }], total: 21750, profit: 8250, employeeId: "USR002", employeeName: "سارة الموظفة" },
  { id: "SALE007", date: "2024-07-25T11:20:00Z", items: [{ medicationId: "8901138507542", name: "Paracetamol 500mg Tabs", quantity: 1, price: 9000, purchasePrice: 5250 }, { medicationId: "041100062327", name: "Aspirin 81mg Tabs", quantity: 1, price: 6750, purchasePrice: 3750 }], total: 15750, profit: 6750, employeeId: "USR001", employeeName: "علي المدير" },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: "PO001", supplierId: "SUP001", supplierName: "Pharma Inc.", date: "2024-07-15", items: [{ medicationId: "8901138507542", name: "Paracetamol 500mg Tabs", quantity: 100, purchasePrice: 5250 }, { medicationId: "8904091101497", name: "Ibuprofen 200mg Tabs", quantity: 50, purchasePrice: 6750 }], status: "Received", totalAmount: 862500 },
  { id: "PO002", supplierId: "SUP002", supplierName: "HealthCare Supplies", date: "2024-07-18", items: [{ medicationId: "8901043002229", name: "Amoxicillin 250mg Caps", quantity: 50, purchasePrice: 12000 }], status: "Received", totalAmount: 600000 },
  { id: "PO003", supplierId: "SUP003", supplierName: "Allergy Relief Co.", date: "2024-07-22", items: [{ medicationId: "5010087201048", name: "Loratadine 10mg Tabs", quantity: 30, purchasePrice: 14750 }], status: "Pending", totalAmount: 442500 },
];

export const supplierReturns: Return[] = [
    { id: "S-RET001", date: "2024-07-21", medicationId: "8901138507542", medicationName: "Paracetamol 500mg Tabs", quantity: 5, reason: "Damaged packaging", supplierId: "SUP001", purchaseId: "PO001", totalAmount: 26250 },
];

export const supplierPayments: SupplierPayment[] = [];

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
    invoiceFooterMessage: "شكرًا لزيارتكم!",
}
