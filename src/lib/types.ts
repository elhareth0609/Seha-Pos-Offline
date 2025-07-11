
import { z } from 'zod';

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
  patientId?: string;
  patientName?: string;
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
  phone?: string;
};


export type TimeLog = {
  id: string;
  userId: string;
  clockIn: string; // ISO string
  clockOut?: string; // ISO string
};

export type AppSettings = {
    initialized?: boolean;
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

// AI Flow Schemas
const MedicationInfoSchema = z.object({
  tradeName: z.string().describe('The commercial trade name of the medication.'),
  dosage: z.string().describe('The dosage strength of the medication (e.g., "500mg", "100mg/5ml").'),
  dosageForm: z.string().describe('The form of the medication (e.g., "Tablet", "Syrup", "Capsule").'),
});

export const DoseCalculationInputSchema = z.object({
  patientAge: z.number().describe('The age of the patient in years.'),
  medications: z.array(MedicationInfoSchema).describe('A list of medications in the current transaction.'),
});
export type DoseCalculationInput = z.infer<typeof DoseCalculationInputSchema>;

export const MedicationAnalysisSchema = z.object({
    tradeName: z.string().describe('The trade name of the medication being analyzed.'),
    suggestedDose: z.string().describe('The suggested dose, frequency, and duration for the patient. For example: "نصف حبة (250mg) مرتين يوميًا لمدة 5 أيام". Be specific and clear.'),
    usageInstructions: z.string().describe('Important instructions on how to take the medication, such as with or without food.'),
    warning: z.string().optional().describe('Any critical warnings or contraindications for this age group, if applicable. For example: "لا يستخدم للأطفال أقل من سنتين".'),
});
export type MedicationAnalysis = z.infer<typeof MedicationAnalysisSchema>;

export const DoseCalculationOutputSchema = z.object({
    interactions: z.array(z.string()).describe('A list of strings, each describing a potential interaction between the provided drugs. Empty if no interactions are found.'),
    medicationAnalysis: z.array(MedicationAnalysisSchema).describe('An array containing the analysis for each individual medication.'),
});
export type DoseCalculationOutput = z.infer<typeof DoseCalculationOutputSchema>;

// This is a helper type for the frontend, not used in the flow itself
export type DoseCalculation = z.infer<typeof MedicationAnalysisSchema>;
