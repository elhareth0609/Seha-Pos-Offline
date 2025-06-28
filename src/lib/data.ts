import { Medication, Sale, PurchaseOrder, Return } from "./types";

export const inventory: Medication[] = [
  { id: "MED001", name: "Paracetamol 500mg", stock: 150, reorderPoint: 50, category: "Painkiller", supplier: "Pharma Inc.", price: 5.99 },
  { id: "MED002", name: "Amoxicillin 250mg", stock: 80, reorderPoint: 30, category: "Antibiotic", supplier: "HealthCare Supplies", price: 12.50 },
  { id: "MED003", name: "Ibuprofen 200mg", stock: 200, reorderPoint: 75, category: "Painkiller", supplier: "Pharma Inc.", price: 7.25 },
  { id: "MED004", name: "Loratadine 10mg", stock: 45, reorderPoint: 20, category: "Antihistamine", supplier: "Allergy Relief Co.", price: 15.00 },
  { id: "MED005", name: "Omeprazole 20mg", stock: 60, reorderPoint: 25, category: "Acid Reflux", supplier: "HealthCare Supplies", price: 22.75 },
  { id: "MED006", name: "Simvastatin 40mg", stock: 90, reorderPoint: 40, category: "Cholesterol", supplier: "Pharma Inc.", price: 30.00 },
  { id: "MED007", name: "Metformin 500mg", stock: 120, reorderPoint: 50, category: "Diabetes", supplier: "HealthCare Supplies", price: 18.90 },
  { id: "MED008", name: "Amlodipine 5mg", stock: 25, reorderPoint: 15, category: "Blood Pressure", supplier: "Allergy Relief Co.", price: 14.50 },
  { id: "MED009", name: "Cetirizine 10mg", stock: 70, reorderPoint: 30, category: "Antihistamine", supplier: "Allergy Relief Co.", price: 11.20 },
  { id: "MED010", name: "Aspirin 81mg", stock: 300, reorderPoint: 100, category: "Painkiller", supplier: "Pharma Inc.", price: 4.50 },
];

export const sales: Sale[] = [
  { id: "SALE001", date: "2024-07-20T10:30:00Z", items: [{ medicationId: "MED001", name: "Paracetamol 500mg", quantity: 2, price: 5.99 }], total: 11.98 },
  { id: "SALE002", date: "2024-07-20T11:05:00Z", items: [{ medicationId: "MED003", name: "Ibuprofen 200mg", quantity: 1, price: 7.25 }, { medicationId: "MED004", name: "Loratadine 10mg", quantity: 1, price: 15.00 }], total: 22.25 },
  { id: "SALE003", date: "2024-07-21T14:00:00Z", items: [{ medicationId: "MED002", name: "Amoxicillin 250mg", quantity: 1, price: 12.50 }], total: 12.50 },
  { id: "SALE004", date: "2024-07-22T09:15:00Z", items: [{ medicationId: "MED010", name: "Aspirin 81mg", quantity: 3, price: 4.50 }], total: 13.50 },
  { id: "SALE005", date: "2024-07-23T16:45:00Z", items: [{ medicationId: "MED005", name: "Omeprazole 20mg", quantity: 1, price: 22.75 }], total: 22.75 },
  { id: "SALE006", date: "2024-07-24T12:00:00Z", items: [{ medicationId: "MED008", name: "Amlodipine 5mg", quantity: 1, price: 14.50 }], total: 14.50 },
  { id: "SALE007", date: "2024-07-25T11:20:00Z", items: [{ medicationId: "MED001", name: "Paracetamol 500mg", quantity: 1, price: 5.99 }, { medicationId: "MED010", name: "Aspirin 81mg", quantity: 1, price: 4.50 }], total: 10.49 },
];

export const purchaseOrders: PurchaseOrder[] = [
  { id: "PO001", supplier: "Pharma Inc.", date: "2024-07-15", items: [{ medicationId: "MED001", name: "Paracetamol 500mg", quantity: 100 }, { medicationId: "MED003", name: "Ibuprofen 200mg", quantity: 50 }], status: "Received" },
  { id: "PO002", supplier: "HealthCare Supplies", date: "2024-07-18", items: [{ medicationId: "MED002", name: "Amoxicillin 250mg", quantity: 50 }], status: "Received" },
  { id: "PO003", supplier: "Allergy Relief Co.", date: "2024-07-22", items: [{ medicationId: "MED004", name: "Loratadine 10mg", quantity: 30 }], status: "Pending" },
  { id: "PO004", supplier: "Pharma Inc.", date: "2024-07-25", items: [{ medicationId: "MED006", name: "Simvastatin 40mg", quantity: 60 }], status: "Pending" },
  { id: "PO005", supplier: "HealthCare Supplies", date: "2024-07-28", items: [{ medicationId: "MED007", name: "Metformin 500mg", quantity: 80 }], status: "Pending" },
];

export const returns: Return[] = [
    { id: "RET001", date: "2024-07-21", medicationId: "MED001", medicationName: "Paracetamol 500mg", quantity: 1, reason: "Incorrect purchase" },
    { id: "RET002", date: "2024-07-23", medicationId: "MED004", medicationName: "Loratadine 10mg", quantity: 1, reason: "Allergic reaction" },
];
