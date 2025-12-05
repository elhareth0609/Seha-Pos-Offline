
import type { Medication, Sale, User, TimeLog, AppSettings, Patient } from "./types";

export const inventory: Medication[] = [];

export const users: User[] = [];

export const patients: Patient[] = [];

export const sales: Sale[] = [];


export const timeLogs: TimeLog[] = [];

export const appSettings: AppSettings = {
    pharmacyName: "صيدلية Midgram",
    pharmacyAddress: "123 شارع الصحة، المدينة الطبية",
    pharmacyPhone: "964-7701234567",
    pharmacyEmail: "contact@midgram.com",
    expirationThresholdDays: 90,
    invoiceFooterMessage: "شكرًا لزيارتكم!",
}