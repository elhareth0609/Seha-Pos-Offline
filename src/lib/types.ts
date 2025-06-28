export type Medication = {
  id: string;
  name: string;
  stock: number;
  reorderPoint: number;
  category: string;
  supplierId: string;
  supplierName: string;
  price: number; // Selling price
  purchasePrice: number;
  expirationDate: string;
};

export type SaleItem = {
  medicationId: string;
  name: string;
  quantity: number;
  price: number;
  expirationDate?: string;
};

export type Sale = {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  discount?: number;
  userId: string;
};

export type PurchaseOrderItem = {
  medicationId: string;
  name: string;
  quantity: number;
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseOrderItem[];
  status: "Pending" | "Received" | "Cancelled";
};

export type Return = {
  id: string;
  date: string;
  medicationId: string;
  medicationName: string;
  quantity: number;
  reason: string;
  supplierId: string;
};

export type Patient = {
  id: string;
  name: string;
  medications: {
    medicationId: string;
    name: string;
  }[];
};

export type Supplier = {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
};

export type User = {
  id: string;
  name: string;
  role: "Admin" | "Employee";
  hourlyRate: number;
  pin: string; // Simulate login with a PIN
};

export type TimeLog = {
  id: string;
  userId: string;
  clockIn: string; // ISO string
  clockOut?: string; // ISO string
};
