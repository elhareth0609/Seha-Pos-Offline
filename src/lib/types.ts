
export type Medication = {
  id: string;
  name: string;
  stock: number;
  reorderPoint: number;
  supplierId: string;
  supplierName: string;
  price: number; // Selling price
  purchasePrice: number;
  expirationDate: string;
  saleUnit?: string;
};

export type SaleItem = {
  medicationId: string;
  name: string;
  quantity: number;
  price: number;
  purchasePrice: number;
  expirationDate?: string;
  isReturn?: boolean;
  saleUnit?: string;
};

export type Sale = {
  id:string;
  date: string;
  items: SaleItem[];
  total: number;
  profit: number;
  discount?: number;
  employeeId: string;
  employeeName: string;
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

export type ReturnOrderItem = {
  medicationId: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  reason: string;
};

export type ReturnOrder = {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: ReturnOrderItem[];
  totalAmount: number;
  purchaseId?: string; // Optional: Link to the original purchase order
};

export type SupplierPayment = {
    id: string;
    date: string;
    supplierId: string;
    amount: number;
    notes?: string;
}

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
  email?: string; // Optional: Only for Admin
  pin?: string; // Optional: Only for Admin
};

export type Patient = {
  id: string;
  name: string;
  medications: {
    medicationId: string;
    name: string;
    saleUnit?: string;
  }[];
  notes?: string;
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
    invoiceFooterMessage?: string;
}
