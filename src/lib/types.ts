
import { z } from 'zod';

export type UserPermissions = {
    manage_sales: boolean;
    manage_inventory: boolean;
    manage_purchases: boolean;
    manage_suppliers: boolean;
    manage_reports: boolean;
    manage_itemMovement: boolean;
    manage_patients: boolean;
    manage_expiringSoon: boolean;
    manage_users: boolean;
    manage_guide: boolean;
    manage_settings: boolean;
    manage_trash: boolean;
    manage_salesPriceModification: boolean;
    manage_previous_sales: boolean;
    manage_expenses: boolean; // New permission
};

export type Medication = {
  id: string;
  barcodes: string[];
  name: string; 
  scientific_names?: string[];
  image_url?: string;
  stock: number;
  reorder_point: number;
  price: number; 
  purchase_price: number; 
  expiration_date: string;
  dosage?: string;
  dosage_form?: string;
  status?: 'active' | 'damaged';
};

export type SaleItem = {
  id: string;
  medication_id: string;
  name: string; 
  scientific_names?: string[];
  quantity: number;
  price: number;
  purchase_price: number;
  expiration_date?: string;
  is_return?: boolean;
  dosage?: string;
  dosage_form?: string;
};

export type Sale = {
  id:string;
  date: string;
  items: SaleItem[];
  total: number;
  profit: number;
  discount?: number;
  patient_id: string | null;
  patientName?: string;
  employee_id: string;
  employeeName: string;
  payment_method: 'cash' | 'card';
};

export type PurchaseOrderItem = {
  id: string;
  medication_id?: string;
  name: string; // tradeName
  quantity: number;
  purchase_price: number;
};

export type PurchaseOrder = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  date: string;
  items: PurchaseOrderItem[];
  status: "Pending" | "Received" | "Cancelled";
  total_amount: number;
};

export type ReturnOrderItem = {
  id: string;
  medication_id: string;
  name: string;
  quantity: number; // in sale units
  purchase_price: number; // per sale unit
  reason: string;
};

export type ReturnOrder = {
  id: string;
  supplier_id: string;
  supplier_name: string;
  date: string;
  items: ReturnOrderItem[];
  total_amount: number;
  purchase_id?: string; // Optional: Link to the original purchase order
};

export type SupplierPayment = {
    id: string;
    date: string;
    supplier_id: string;
    amount: number;
    notes?: string;
}

export type Supplier = {
  id: string;
  name: string;
  contact_person?: string;
};

export type User = {
  id: string;
  name: string;
  role: "SuperAdmin" | "Admin" | "Employee";
  status: 'active' | 'suspended';
  email?: string;
  pin?: string;
  permissions?: UserPermissions;
  hourly_rate?: number;
  pharmacy_id: string;
  created_at: string; // ISO date string
  image1DataUri?: string;
  require_pin_for_delete?: boolean;
};

export type Patient = {
  id: string;
  name: string;
  phone?: string;
};


export type TimeLog = {
  id: string;
  user_id: string;
  pharmacy_id: string;
  clock_in: string; // ISO string
  clock_out?: string; // ISO string
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
  deleted_at: string; // ISO date string
  item_type: 'medication' | 'patient' | 'supplier' | 'user' | 'sale';
  data: Partial<Medication & Patient & Supplier & User & Sale>;
};

export type Advertisement = {
    id: string;
    title: string;
    image_url: string;
    created_at: string;
    show_on: {
        dashboard: boolean;
        sales: boolean;
        reports: boolean;
        inventory: boolean;
    }
};

export type Expense = {
    id: string;
    date: string;
    amount: number;
    description: string;
    user_id: string;
    user_name: string;
};


// AI Flow Schemas
const MedicationInfoSchema = z.object({
  tradeName: z.string().describe('The commercial trade name of the medication.'),
  scientific_names: z.array(z.string()).optional().describe('The active scientific names of the medication.'),
  dosage: z.string().describe('The dosage strength of the medication (e.g., "500mg", "100mg/5ml").'),
  dosage_form: z.string().describe('The form of the medication (e.g., "Tablet", "Syrup", "Capsule").'),
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

export const DoseCalculationOutputSchema = z.object({
    interactions: z.array(z.string()).describe('A list of strings, each describing a potential interaction between the provided drugs. Empty if no interactions are found.'),
    medicationAnalysis: z.array(MedicationAnalysisSchema).describe('An array containing the analysis for each individual medication.'),
});
export type DoseCalculationOutput = z.infer<typeof DoseCalculationOutputSchema>;


// Types for multi-pharmacy data stores
export type InventoryData = { [pharmacyId: string]: Medication[] };
export type SalesData = { [pharmacyId: string]: Sale[] };
export type SuppliersData = { [pharmacyId: string]: Supplier[] };
export type PatientsData = { [pharmacyId: string]: Patient[] };
export type TrashData = { [pharmacyId: string]: TrashItem[] };
export type PaymentsData = { [pharmacyId: string]: SupplierPayment[] };
export type TimeLogsData = { [pharmacyId: string]: TimeLog[] };
export type PurchaseOrdersData = { [pharmacyId: string]: PurchaseOrder[] };
export type ReturnsData = { [pharmacyId: string]: ReturnOrder[] };

// Pagination response type from Laravel
export type PaginatedResponse<T> = {
  current_page: number;
  data: T[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: { url: string | null; label: string; active: boolean }[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
};

export type TransactionHistoryItem = {
  id: string; // Changed from number to string to match backend
  date: string;
  type: 'شراء' | 'بيع' | 'مرتجع زبون' | 'مرتجع للمورد';
  quantity: number; // positive for in, negative for out
  price: number;
  balance: number;
  documentId: string;
  actor: string;
};
