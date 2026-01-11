

import { z } from 'zod';

export type Doctor = {
  id: string;
  name: string;
  login_key: string;
  pharmacy_id: string;
  created_at: string;
};

export type DoctorSuggestion = {
  id: string;
  doctor_id: string;
  doctor_name: string;
  suggestion: string;
  created_at: string;
};

export type PharmacyGroup = {
  id: string;
  name: string;
  pharmacy_ids: string[];
};

export type SupportRequest = {
  id: string;
  pharmacy_id: string;
  pharmacy_name: string;
  phone_number: string;
  problem_section: string;
  contact_time: string;
  status: 'new' | 'contacted';
  created_at: string;
};

export type UserPermissions = {
  manage_sales: boolean;
  manage_inventory: boolean;
  // manage_purchases: boolean;
  // manage_suppliers: boolean;
  manage_reports: boolean;
  // manage_itemMovement: boolean;
  // manage_patients: boolean;
  // manage_expiringSoon: boolean;
  // manage_users: boolean;
  // // manage_guide: boolean;
  // manage_settings: boolean;
  // manage_trash: boolean;
  manage_salesPriceModification: boolean;
  manage_previous_sales: boolean;
  // manage_expenses: boolean;
  // manage_tasks: boolean;
  // // manage_close_month: boolean;
  // manage_archives: boolean;
  // manage_order_requests: boolean;
  // manage_offers: boolean;
  // manage_hr: boolean;
  // manage_support: boolean;
  // // manage_representatives: boolean;
  // manage_exchange: boolean;
  // manage_doctors: boolean;
  manage_sales_performance_period: boolean;
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

export type ExchangeItem = {
  id: string;
  pharmacy_id: string;
  pharmacyName: string;
  medicationName: string;
  scientificName?: string;
  quantity: number;
  expirationDate: string;
  price: number;
  contactPhone: string;
  province: string;
};

export type RequestResponse = {
  id: string;
  responderPharmacyId: string;
  responderPharmacyName: string;
  price: number;
  contactPhone: string;
};

export type DrugRequest = {
  id: string;
  pharmacy_id: string;
  pharmacyName: string;
  province: string;
  medicationName: string;
  quantity: number;
  notes?: string;
  status: 'open' | 'closed';
  responses: RequestResponse[];
  ignoredBy: string[]; // Array of pharmacy IDs that ignored this
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

export type OrderRequestItem = {
  id: string; // This is the ID of the order request item itself
  medication_id: string; // This links to the Medication table
  pharmacy_id: string;
  name: string;
  scientific_names?: string[];
  image_url?: string;
  stock: number;
  reorder_point: number;
  expiration_date: string;
  dosage_form?: string;
  quantity: number;
  supplier_id?: string;
  invoice_id?: string;
  date?: string;
  barcodes?: string[];
  // Box/Strip pricing fields
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

export type PurchaseOrderItem = {
  id: string;
  medication_id?: string;
  name: string; // tradeName
  quantity: number;
  expiration_date?: string;
  scientific_names?: string[];
  dosage_form?: string;
  barcodes?: string[];
  image_url?: string;
  reorder_point?: number;
  stock?: number;
  is_new?: boolean;
  medication?: Medication;
  // Box/Strip unit fields
  box_count?: number;             // عدد العلب
  strips_per_box: number;        // التعبئة
  box_purchase_price: number;    // سعر شراء العلبة
  strip_purchase_price: number;  // سعر شراء الشريط (calculated)
  box_sell_price: number;        // سعر بيع العلبة
  strip_sell_price: number;      // سعر بيع الشريط
};

export type PurchaseOrder = {
  id: string;
  number: string;
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
  number: string;
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
  discount?: number;
  notes?: string;
}

export type PatientPayment = {
  id: string;
  date: string;
  patient_id: string;
  amount: number;
  notes?: string;
}

export type SupplierDebt = {
  id: string;
  date: string;
  supplier_id: string;
  amount: number;
  notes?: string;
}

export type PatientDebt = {
  id: string;
  date: string;
  patient_id: string;
  amount: number;
  notes?: string;
}

export type Supplier = {
  id: string;
  name: string;
  contact_person?: string;
  debt_limit?: number;
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

export type PatientMedication = {
  id: string;
  patient_id: string;
  medication_id: string;
  medication_name: string;
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
  force_box_if_single_strip?: boolean;
}

export type TrashItem = {
  id: string; // Unique ID for the trash entry
  deleted_at: string; // ISO date string
  item_type: 'medication' | 'patient' | 'supplier' | 'user' | 'sale' | 'task' | 'expense';
  data: Partial<Medication & Patient & Supplier & User & Sale & Task & Expense>;
};

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

export type Offer = {
  id: string;
  title: string;
  image_url: string;
  contact_number?: string;
  expiration_date: string;
  created_at: string;
  views: number;
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

export type MonthlyArchive = {
  id: string;
  pharmacy_id: string;
  date_to: string;
  date_from: string;
  month_name: string; // e.g., "August 2024"
  created_at: string;
};

export type ArchivedMonthData = {
  id: string;
  month_name: string;
  date_to: string;
  date_from: string;
  summary: {
    total_sales: number;
    total_expenses: number;
    net_profit: number;
  };
  sales: Sale[];
  expenses: Expense[];
  top_selling_medications: {
    medication_id: string;
    name: string;
    total_quantity: number;
  }[];
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
  unitType: string;
  current_stock: number;
};


export type TopSellingMedication = {
  medication_id: string;
  name: string;
  quantity: number;
  profit?: number;
};

export type PharmacyPerformance = {
  pharmacy_id: string;
  pharmacy_name: string;
  province: string;
  total_sales: number;
  total_profit: number;
  employee_count: number;
};

export type TopPurchasingPharmacy = {
  pharmacy_id: string;
  name: string;
  count: number;
};

export type TopPurchasedItem = {
  name: string;
  quantity: number;
};

export type SupportRequestPayload = {
  phone_number: string;
  problem_section: string;
  contact_time: string;
};

export type PatientPaymentPayload = {
  amount: number;
  notes?: string;
};

// Types for Clinical Training Module
export type DrugClassInfo = {
  name: string;
  mechanism?: string;
  scientific_names: string[];
};

export type DiseaseInfo = {
  name: string;
  overview: string;
  drugClasses: DrugClassInfo[];
  counselingPoints: string[];
};

export type ClinicalSystem = {
  system: string;
  icon: React.ComponentType<any>;
  diseases: DiseaseInfo[];
};

export type SupplierAnalyticsData = {
  supplier_id: string;
  supplier_name: string;
  total_purchases: number;
  total_sales: number;
  total_profit: number;
  net_debt: number;
};

export type BranchInventory = {
  pharmacy_id: string;
  pharmacy_name: string;
  medication_name: string;
  stock: number;
};