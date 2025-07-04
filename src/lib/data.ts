
import type { Medication, Sale, PurchaseOrder, ReturnOrder, Supplier, User, TimeLog, AppSettings, SupplierPayment, Patient } from "./types";

export const suppliers: Supplier[] = [];

export const inventory: Medication[] = [];

export const users: User[] = [];

export const patients: Patient[] = [];

export const sales: Sale[] = [];

export const purchaseOrders: PurchaseOrder[] = [];

export const supplierReturns: ReturnOrder[] = [];

export const supplierPayments: SupplierPayment[] = [];

export const timeLogs: TimeLog[] = [];

export const appSettings: AppSettings = {
    pharmacyName: "صيدلية Midgram",
    pharmacyAddress: "123 شارع الصحة، المدينة الطبية",
    pharmacyPhone: "964-7701234567",
    pharmacyEmail: "contact@midgram.com",
    expirationThresholdDays: 90,
    invoiceFooterMessage: "شكرًا لزيارتكم!",
}

