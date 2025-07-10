
export type UserPermissions = {
    sales: boolean;
    inventory: boolean;
    purchases: boolean;
    suppliers: boolean;
    reports: boolean;
    itemMovement: boolean;
    patients: boolean;
    expiringSoon: boolean;
    guide: boolean;
    settings: boolean;
    trash: boolean;
};

export type Medication = {
  id: string; // Barcode
  tradeName: string; // الاسم التجاري
  scientificName?: string; // الاسم العلمي
  company?: string; // الشركة
  details?: string; // تفاصيل
  dosage?: string; // الجرعة
  dosageForm?: string; // الشكل الدوائي
  imageUrl?: string; // صورة الدواء
  
  // Stock is always in the smallest unit (saleUnit)
  stock: number;
  reorderPoint: number;
  
  price: number; // Selling price for ONE saleUnit
  purchasePrice: number; // Purchase price for ONE saleUnit
  
  expirationDate: string;

  // Unit management
  purchaseUnit: string; // e.g., 'باكيت'
  saleUnit: string; // e.g., 'شريط'
  itemsPerPurchaseUnit: number; // e.g., 5 (شرائط in a باكيت)
};

export type SaleItem = {
  medicationId: string;
  name: string; // This will be tradeName for display
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
  name: string; // tradeName
  quantityInPurchaseUnits: number; // How many purchaseUnits (e.g., packets)
  totalItems: number; // Total smallest units (e.g., strips)
  purchasePricePerSaleUnit: number; // Price per smallest unit
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
  quantity: number; // in sale units
  purchasePrice: number; // per sale unit
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
  email?: string;
  pin?: string;
  permissions?: UserPermissions;
  image1DataUri?: string;
  image2DataUri?: string;
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

export type TrashItem = {
  id: string; // Unique ID for the trash entry
  deletedAt: string; // ISO date string
  itemType: 'medication' | 'patient' | 'supplier' | 'user';
  data: Medication | Patient | Supplier | User;
};
