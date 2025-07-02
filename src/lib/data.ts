
import type { Medication, Sale, PurchaseOrder, Return, Supplier, User, TimeLog, AppSettings, SupplierPayment } from "./types";

export const suppliers: Supplier[] = [
    { id: "SUP001", name: "Pharma Inc.", contactPerson: "John Doe", phone: "123-456-7890", email: "contact@pharma-inc.com"},
    { id: "SUP002", name: "HealthCare Supplies", contactPerson: "Jane Smith", phone: "987-654-3210", email: "sales@healthcaresupplies.com"},
    { id: "SUP003", name: "Allergy Relief Co.", contactPerson: "Peter Jones", phone: "555-555-5555", email: "info@allergyrelief.com"},
    { id: "SUP004", name: "Wellness Distributors", contactPerson: "Maria Garcia", phone: "555-123-4567", email: "orders@wellnessdist.com"},
];

export const inventory: Medication[] = [
  { id: "8901138507542", name: "Paracetamol 500mg Tabs", stock: 150, reorderPoint: 50, category: "Painkiller", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 5.99, purchasePrice: 3.50, expirationDate: "2025-12-31" },
  { id: "8901043002229", name: "Amoxicillin 250mg Caps", stock: 80, reorderPoint: 30, category: "Antibiotic", supplierId: "SUP002", supplierName: "HealthCare Supplies", price: 12.50, purchasePrice: 8.00, expirationDate: "2025-08-31" },
  { id: "8904091101497", name: "Ibuprofen 200mg Tabs", stock: 20, reorderPoint: 75, category: "Painkiller", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 7.25, purchasePrice: 4.50, expirationDate: "2026-01-31" },
  { id: "5010087201048", name: "Loratadine 10mg Tabs", stock: 45, reorderPoint: 20, category: "Antihistamine", supplierId: "SUP003", supplierName: "Allergy Relief Co.", price: 15.00, purchasePrice: 9.75, expirationDate: "2024-10-31" },
  { id: "300450305609", name: "Omeprazole 20mg Caps", stock: 60, reorderPoint: 25, category: "Acid Reflux", supplierId: "SUP002", supplierName: "HealthCare Supplies", price: 22.75, purchasePrice: 15.00, expirationDate: "2025-05-31" },
  { id: "03784993510", name: "Simvastatin 40mg Tabs", stock: 90, reorderPoint: 40, category: "Cholesterol", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 30.00, purchasePrice: 20.25, expirationDate: "2024-09-30" },
  { id: "301504944810", name: "Metformin 500mg Tabs", stock: 120, reorderPoint: 50, category: "Diabetes", supplierId: "SUP002", supplierName: "HealthCare Supplies", price: 18.90, purchasePrice: 12.00, expirationDate: "2025-11-30" },
  { id: "305801384013", name: "Amlodipine 5mg Tabs", stock: 12, reorderPoint: 15, category: "Blood Pressure", supplierId: "SUP003", supplierName: "Allergy Relief Co.", price: 14.50, purchasePrice: 9.00, expirationDate: "2024-08-15" },
  { id: "300450552109", name: "Cetirizine 10mg Tabs", stock: 70, reorderPoint: 30, category: "Antihistamine", supplierId: "SUP003", supplierName: "Allergy Relief Co.", price: 11.20, purchasePrice: 7.00, expirationDate: "2026-03-31" },
  { id: "041100062327", name: "Aspirin 81mg Tabs", stock: 300, reorderPoint: 100, category: "Painkiller", supplierId: "SUP001", supplierName: "Pharma Inc.", price: 4.50, purchasePrice: 2.50, expirationDate: "2025-07-31" },
  { id: "031604012891", name: "Vitamin C 1000mg", stock: 5, reorderPoint: 20, category: "Vitamins", supplierId: "SUP004", supplierName: "Wellness Distributors", price: 9.99, purchasePrice: 6.00, expirationDate: "2024-08-20" },
  { id: "037000412852", name: "Vitamin D3 2000IU", stock: 150, reorderPoint: 30, category: "Vitamins", supplierId: "SUP004", supplierName: "Wellness Distributors", price: 13.50, purchasePrice: 8.50, expirationDate: "2026-06-30" },
];

export const users: User[] = [];

export const sales: Sale[] = [
  { id: "SALE001", date: "2024-07-20T10:30:00Z", items: [{ medicationId: "8901138507542", name: "Paracetamol 500mg Tabs", quantity: 2, price: 5.99 }], total: 11.98, employeeId: "USR002", employeeName: "سارة الموظفة" },
  { id: "SALE002", date: "2024-07-20T11:05:00Z", items: [{ medicationId: "8904091101497", name: "Ibuprofen 200mg Tabs", quantity: 1, price: 7.25 }, { medicationId: "5010087201048", name: "Loratadine 10mg Tabs", quantity: 1, price: 15.00 }], total: 22.25, employeeId: "USR001", employeeName: "علي المدير" },
  { id: "SALE003", date: "2024-07-21T14:00:00Z", items: [{ medicationId: "8901043002229", name: "Amoxicillin 250mg Caps", quantity: 1, price: 12.50 }], total: 12.50, employeeId: "USR002", employeeName: "سارة الموظفة" },
  { id: "SALE004", date: "2024-07-22T09:15:00Z", items: [{ medicationId: "041100062327", name: "Aspirin 81mg Tabs", quantity: 3, price: 4.50 }], total: 13.50, employeeId: "USR003", employeeName: "أحمد الصيدلي" },
  { id: "SALE005", date: "2024-07-23T16:45:00Z", items: [{ medicationId: "300450305609", name: "Omeprazole 20mg Caps", quantity: 1, price: 22.75 }], total: 22.75, employeeId: "USR001", employeeName: "علي المدير" },
  { id: "SALE006", date: "2024-07-24T12:00:00Z", items: [{ medicationId: "305801384013", name: "Amlodipine 5mg Tabs", quantity: 1, price: 14.50 }], total: 14.50, employeeId: "USR002", employeeName: "سارة الموظفة" },
  { id: "SALE007", date: "2024-07-25T11:20:00Z", items: [{ medicationId: "8901138507542", name: "Paracetamol 500mg Tabs", quantity: 1, price: 5.99 }, { medicationId: "041100062327", name: "Aspirin 81mg Tabs", quantity: 1, price: 4.50 }], total: 10.49, employeeId: "USR001", employeeName: "علي المدير" },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: "PO001", supplierId: "SUP001", supplierName: "Pharma Inc.", date: "2024-07-15", items: [{ medicationId: "8901138507542", name: "Paracetamol 500mg Tabs", quantity: 100, purchasePrice: 3.50 }, { medicationId: "8904091101497", name: "Ibuprofen 200mg Tabs", quantity: 50, purchasePrice: 4.50 }], status: "Received", totalAmount: (100 * 3.50) + (50 * 4.50) },
  { id: "PO002", supplierId: "SUP002", supplierName: "HealthCare Supplies", date: "2024-07-18", items: [{ medicationId: "8901043002229", name: "Amoxicillin 250mg Caps", quantity: 50, purchasePrice: 8.00 }], status: "Received", totalAmount: 50 * 8.00 },
  { id: "PO003", supplierId: "SUP003", supplierName: "Allergy Relief Co.", date: "2024-07-22", items: [{ medicationId: "5010087201048", name: "Loratadine 10mg Tabs", quantity: 30, purchasePrice: 9.75 }], status: "Pending", totalAmount: 30 * 9.75 },
];

export const supplierReturns: Return[] = [
    { id: "S-RET001", date: "2024-07-21", medicationId: "8901138507542", medicationName: "Paracetamol 500mg Tabs", quantity: 5, reason: "Damaged packaging", supplierId: "SUP001", purchaseId: "PO001", totalAmount: 5 * 3.50 },
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
}
