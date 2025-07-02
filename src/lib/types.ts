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
  isReturn?: boolean;
};

export type Sale = {
  id:string;
  date: string;
  items: SaleItem[];
  total: number;
  discount?: number;
  employeeId: string;
  employeeName: string;
  patientId?: string;
  patientName?: string;
};

export type PurchaseOrderItem = {
  medicationId: string;
  name: string;
  quantity: number;
  purchasePrice: number;
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: PurchaseOrderItem[];
  status: "Pending" | "Received" | "Cancelled";
  totalAmount: number;
};

export type Return = {
  id: string;
  date: string;
  medicationId: string;
  medicationName: string;
  quantity: number;
  reason: string;
  supplierId: string;
  totalAmount: number;
  purchaseId?: string;
};

export type Patient = {
  id: string;
  name: string;
  medications: {
    medicationId: string;
    name: string;
  }[];
  notes?: string;
};

export type Supplier = {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
};

export type User = {
  id: string;
  name: string;
  role: "Admin" | "Employee";
};

export type TimeLog = {
  id: string;
  userId: string;
  clockIn: string; // ISO string
  clockOut?: string; // ISO string
};

export type AppSettings = {
    pharmacyName: string;
    pharmacyAddress: string;
    pharmacyPhone: string;
    pharmacyEmail: string;
    expirationThresholdDays: number;
}
