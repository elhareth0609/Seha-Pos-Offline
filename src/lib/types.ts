

import { z } from 'zod';

export type PharmacyGroup = {
    id: string;
    name: string;
    pharmacy_ids: string[];
};

export type UserPermissions = {
    manage_sales: boolean;
    manage_inventory: boolean;
    manage_reports: boolean;
    manage_patients: boolean;
    manage_salesPriceModification: boolean;
    manage_previous_sales: boolean;
};

export type Notification = {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiring_soon' | 'expired' | 'task_assigned' | 'sale_below_cost' | 'large_discount' | 'supplier_debt_limit' | 'month_end_reminder' | 'new_purchase_order' | 'alternative_expiry';
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
};

export type MedicalRepresentative = {
    id: string;
    comm_name: string;
    office_name: string;
    image_url: string | null;
    city: string;
    phone_number: string;
    status: 'active' | 'deleted';
};

export type Medication = {
  id: string;
  barcodes: string[];
  name: string; 
  scientific_names?: string[];
  image_url?: string;
  stock: number;
  reorder_point: number;
  expiration_date: string;
  dosage_form?: string;
  status?: 'active' | 'damaged';
  // Box/Strip unit fields
  box_count: number;             // عدد العلب
  strips_per_box: number;        // التعبئة: number of strips in one box
  box_purchase_price: number;    // سعر شراء العلبة
  strip_purchase_price: number;  // سعر شراء الشريط (calculated)
  box_sell_price: number;        // سعر بيع العلبة
  strip_sell_price: number;      // سعر بيع الشريط
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
  dosage_form?: string;
  unit_type?: 'box' | 'strip';    // Unit being sold (علبة or شريط)
};

export type Sale = {
  id: string;
  date: string;
  items: SaleItem[];
  total: number;
  profit: number;
  discount?: number;
  patient_id: string | null;
  patientName?: string;
  doctor_id: string | null;
  doctor_name?: string;
  employee_id: string;
  employeeName: string;
  payment_method: 'cash' | 'card' | 'credit';
};

export type ActiveInvoice = {
    cart: SaleItem[];
    discountValue: string;
    discountType: 'fixed' | 'percentage';
    patientId: string | null;
  doctorId: string | null;
    paymentMethod: 'cash' | 'card' | 'credit';
    saleIdToUpdate?: string | null;
    reviewIndex?: number | null;
};

export type User = {
  id: string;
  name: string;
  role: "SuperAdmin" | "Admin" | "Employee";
  status: 'active' | 'suspended';
  email?: string;
  pin?: string;
  delete_pin?: string;
  permissions?: UserPermissions;
  hourly_rate?: number;
  salary?: number;
  pharmacy_id: string;
  dofied_id?: string;
  province?: string;
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
    suggestion_preference_score?: Record<string, number>;
    controlled_substances?: string[];
    favorite_med_ids?: string[];
  expense_categories?: { id: string; name: string }[];
}

export type Advertisement = {
    id: string;
    title: string;
    image_url: string;
    created_at: string;
    views: number;
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
    recurring: boolean;
  notes?: string;
};

export type Task = {
    id: string;
    description: string;
    user_id: string;
    user_name: string;
    completed: boolean;
    created_at: string;
    completed_at: string | null;
};



// AI Flow Schemas
const MedicationInfoSchema = z.object({
  tradeName: z.string().describe('The commercial trade name of the medication.'),
  scientific_names: z.array(z.string()).optional().describe('The active scientific names of the medication.'),
  dosage_form: z.string().describe('The form of the medication (e.g., "Tablet", "Syrup", "Capsule").'),
});

export const DoseCalculationInputSchema = z.object({
  patientWeight: z.number().describe("The weight of the patient in kilograms."),
  medications: z.array(MedicationInfoSchema).describe('A list of medications in the current transaction.'),
});

export type DoseCalculationInput = z.infer<typeof DoseCalculationInputSchema>;

export const MedicationAnalysisSchema = z.object({
    tradeName: z.string().describe('The trade name of the medication being analyzed.'),
    suggestedDose: z.string().describe('VERY brief and direct dose, frequency, and simple instructions. Example: "one tablet daily after food".'),
});

export const DoseCalculationOutputSchema = z.object({
    medicationAnalysis: z.array(MedicationAnalysisSchema).describe('An array containing the analysis for each individual medication.'),
});
export type DoseCalculationOutput = z.infer<typeof DoseCalculationOutputSchema>;


// Types for multi-pharmacy data stores
export type InventoryData = { [pharmacyId: string]: Medication[] };
export type SalesData = { [pharmacyId: string]: Sale[] };
export type PatientsData = { [pharmacyId: string]: Patient[] };
export type TimeLogsData = { [pharmacyId: string]: TimeLog[] };

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

export type BranchInventory = {
    pharmacy_id: string;
    pharmacy_name: string;
    medication_name: string;
    stock: number;
};