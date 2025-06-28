export type Medication = {
  id: string;
  name: string;
  stock: number;
  reorderPoint: number;
  category: string;
  supplier: string;
  price: number; // Selling price
  purchasePrice: number;
  expirationDate: string;
};

export type SaleItem = {
  medicationId: string;
  name: string;
  quantity: number;
  price: number;
};

export type Sale = {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
};

export type PurchaseOrderItem = {
  medicationId: string;
  name: string;
  quantity: number;
};

export type PurchaseOrder = {
  id: string;
  supplier: string;
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
};
