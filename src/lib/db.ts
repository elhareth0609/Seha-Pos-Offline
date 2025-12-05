import Dexie, { type EntityTable } from 'dexie';
import type { Sale, Medication, Patient, AppSettings, Supplier, PurchaseOrder, ReturnOrder, Expense, Task, Doctor, DoctorSuggestion, TrashItem, SupplierPayment, PatientPayment, SupplierDebt, PatientDebt, TimeLog, OrderRequestItem, Advertisement, Offer, SupportRequest, PharmacyGroup, BranchInventory, TransactionHistoryItem } from './types';

interface OfflineRequest {
    id?: number;
    url: string;
    method: string;
    body?: any;
    timestamp: number;
}

const db = new Dexie('SehaPosOfflineDB') as Dexie & {
    sales: EntityTable<Sale, 'id'>;
    inventory: EntityTable<Medication, 'id'>;
    patients: EntityTable<Patient, 'id'>;
    suppliers: EntityTable<Supplier, 'id'>;
    settings: EntityTable<AppSettings & { id: number }, 'id'>; // We might use a fixed ID for settings
    offlineRequests: EntityTable<OfflineRequest, 'id'>;

    // Other tables to mirror AuthResponse structure for full offline capability
    trash: EntityTable<TrashItem, 'id'>;
    supplierPayments: EntityTable<SupplierPayment, 'id'>;
    patientPayments: EntityTable<PatientPayment, 'id'>;
    supplierDebts: EntityTable<SupplierDebt, 'id'>;
    patientDebts: EntityTable<PatientDebt, 'id'>;
    purchaseOrders: EntityTable<PurchaseOrder, 'id'>;
    supplierReturns: EntityTable<ReturnOrder, 'id'>;
    timeLogs: EntityTable<TimeLog, 'id'>;
    expenses: EntityTable<Expense, 'id'>;
    tasks: EntityTable<Task, 'id'>;
    orderRequests: EntityTable<OrderRequestItem, 'id'>;
    doctors: EntityTable<Doctor, 'id'>;
    doctorSuggestions: EntityTable<DoctorSuggestion, 'id'>;
    advertisements: EntityTable<Advertisement, 'id'>;
    offers: EntityTable<Offer, 'id'>;
    supportRequests: EntityTable<SupportRequest, 'id'>;
    pharmacyGroups: EntityTable<PharmacyGroup, 'id'>;
};

// Schema definition
db.version(1).stores({
    sales: 'id, date, patient_id, employee_id, payment_method',
    inventory: 'id, name, *barcodes, *scientific_names',
    patients: 'id, name, phone',
    suppliers: 'id, name',
    settings: '++id',

    offlineRequests: '++id, timestamp',

    trash: 'id, item_type, deleted_at',

    supplierPayments: 'id, supplier_id, date',
    patientPayments: 'id, patient_id, date',

    supplierDebts: 'id, supplier_id, date',
    patientDebts: 'id, patient_id, date',

    purchaseOrders: 'id, supplier_id, date',
    supplierReturns: 'id, supplier_id, date',
    timeLogs: 'id, user_id, pharmacy_id, clock_in',
    expenses: 'id, created_at, user_id',
    tasks: 'id, user_id, completed',
    orderRequests: 'id, medication_id, pharmacy_id',
    doctors: 'id, name',
    doctorSuggestions: 'id, doctor_id',
    advertisements: 'id, created_at',
    offers: 'id, expiration_date',
    supportRequests: 'id, pharmacy_id, status',
    pharmacyGroups: 'id'
});

export { db };
export type { OfflineRequest };
