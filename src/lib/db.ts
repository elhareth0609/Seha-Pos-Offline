import Dexie, { type EntityTable } from 'dexie';
import type { Sale, Medication, Patient, AppSettings, Expense, Task, TimeLog, Advertisement, PharmacyGroup, PatientMedication, Doctor } from './types';

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
    patientMedications: EntityTable<PatientMedication, 'id'>;
    patients: EntityTable<Patient, 'id'>;
    settings: EntityTable<AppSettings & { id: number }, 'id'>; // We might use a fixed ID for settings
    offlineRequests: EntityTable<OfflineRequest, 'id'>;

    // Other tables to mirror AuthResponse structure for full offline capability
    timeLogs: EntityTable<TimeLog, 'id'>;
    expenses: EntityTable<Expense, 'id'>;
    tasks: EntityTable<Task, 'id'>;
    advertisements: EntityTable<Advertisement, 'id'>;
    pharmacyGroups: EntityTable<PharmacyGroup, 'id'>;
    doctors: EntityTable<Doctor, 'id'>;
};

// Schema definition
db.version(2).stores({
    sales: 'id, date, patient_id, employee_id, payment_method',
    inventory: 'id, name, *barcodes, *scientific_names',
    patientMedications: 'id, patient_id, medication_id',
    patients: 'id, name, phone',
    settings: '++id',

    offlineRequests: '++id, timestamp',

    timeLogs: 'id, user_id, pharmacy_id, clock_in',
    expenses: 'id, created_at, user_id',
    tasks: 'id, user_id, completed',
    advertisements: 'id, created_at',
    pharmacyGroups: 'id',
    doctors: 'id, name'
});

export { db };
export type { OfflineRequest };
