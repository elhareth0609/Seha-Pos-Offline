

"use client";

import * as React from 'react';
import type { User, UserPermissions, TimeLog, AppSettings, Medication, Sale, Patient, Advertisement, SaleItem, PaginatedResponse, Expense, MedicalRepresentative, Notification, PharmacyGroup, BranchInventory } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from './use-toast';
import { PinDialog } from '@/components/auth/PinDialog';
import { differenceInDays, parseISO, startOfToday, isSameDay, endOfMonth } from 'date-fns';
import { db } from '@/lib/db';
import { useSync } from './use-sync';


const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AuthResponse = {
    token: string;
    user: User;
    pharmacy_data: {
        settings: AppSettings;
        inventory: Medication[];
        sales: Sale[];
        patients: Patient[];
        timeLogs: TimeLog[];
        expenses: Expense[];
    };
    all_users_in_pharmacy: User[];
    advertisements: Advertisement[];
};

export type ActiveInvoice = {
    cart: SaleItem[];
    discountValue: string;
    discountType: 'fixed' | 'percentage';
    patientId: string | null;
    paymentMethod: 'cash' | 'card' | 'credit';
    saleIdToUpdate?: string | null;
    reviewIndex?: number | null;
};

interface AuthContextType {
    currentUser: User | null;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    isAuthenticated: boolean;
    loading: boolean;
    createPharmacyAdmin: (name: string, email: string, pin: string, province: string, dofied_id: string) => Promise<boolean>;
    login: (email: string, pin: string) => Promise<User | null>;
    logout: () => void;
    updateUserHourlyRate: (userId: string, rate: number) => Promise<boolean>;
    getAllPharmacySettings: () => Promise<Record<string, AppSettings>>;
    getPharmacyData: (pharmacyId: string) => Promise<{ users: User[], sales: Sale[], inventory: Medication[]}>;

    advertisements: Advertisement[];

    clearPharmacyData: () => Promise<void>;
    closeMonth: (pin: string, dateFrom: string, dateTo: string) => Promise<boolean>;

    scopedData: ScopedDataContextType;

    // Inventory Management
    markAsDamaged: (medId: string) => Promise<boolean>;
    bulkAddOrUpdateInventory: (items: Partial<Medication>[]) => Promise<{ new_count: number; updated_count?: number; } | null>;
    bulkUploadInventory: (file: File) => Promise<{ new_count: number; updated_count?: number; processed_medications?: number; } | null>;
    getPaginatedInventory: (page: number, perPage: number, search: string, filters: Record<string, any>) => Promise<PaginatedResponse<Medication>>;
    searchAllInventory: (search: string) => Promise<Medication[]>;
    toggleFavoriteMedication: (medId: string) => Promise<void>;
    searchInOtherBranches: (medicationName: string) => Promise<BranchInventory[]>;

    // Central Drug Management (SuperAdmin)
    getCentralDrugs: (page: number, perPage: number, search: string) => Promise<PaginatedResponse<Medication>>;
    uploadCentralDrugList: (items: Partial<Medication>[]) => Promise<boolean>;
    bulkUploadCentralDrugs: (file: File) => Promise<{ new_count: number; updated_count?: number; processed_medications?: number; } | null>;

    // Sales
    addSale: (saleData: any) => Promise<Sale | null>;
    updateSale: (saleData: any) => Promise<Sale | null>;
    deleteSale: (saleId: string) => Promise<boolean>;
    getPaginatedSales: (page: number, perPage: number, search: string, dateFrom: string, dateTo: string, employeeId: string, paymentMethod: string) => Promise<PaginatedResponse<Sale>>;
    searchAllSales: (search?: string) => Promise<Sale[]>;

    // Patients
    getPaginatedPatients: (page: number, perPage: number, search: string) => Promise<PaginatedResponse<Patient>>;
    searchAllPatients: (search: string) => Promise<Patient[]>;

    // Multi-invoice state
    activeInvoices: ActiveInvoice[];
    currentInvoiceIndex: number;
    updateActiveInvoice: (updater: (invoice: ActiveInvoice) => ActiveInvoice) => void;
    switchToInvoice: (index: number) => void;
    createNewInvoice: () => void;
    closeInvoice: (index: number, isAfterSale?: boolean) => void;

    verifyPin: (pin: string, isDeletePin?: boolean) => Promise<boolean>;
    updateUserPinRequirement: (userId: string, requirePin: boolean) => Promise<void>;

    // Pharmacy Groups
    pharmacyGroups: PharmacyGroup[];
    getPharmacyGroups: () => Promise<PharmacyGroup[]>;
    createPharmacyGroup: (name: string, pharmacy_ids: string[]) => Promise<PharmacyGroup | null>;
    updatePharmacyGroup: (groupId: string, data: { name?: string; pharmacy_ids?: string[] }) => Promise<PharmacyGroup | null>;
    deletePharmacyGroup: (groupId: string) => Promise<boolean>;
}
export interface ScopedDataContextType {
    inventory: [Medication[], React.Dispatch<React.SetStateAction<Medication[]>>];
    sales: [Sale[], React.Dispatch<React.SetStateAction<Sale[]>>];
    patients: [Patient[], React.Dispatch<React.SetStateAction<Patient[]>>];
    timeLogs: [TimeLog[], React.Dispatch<React.SetStateAction<TimeLog[]>>];
    settings: [AppSettings, (value: AppSettings | ((val: AppSettings) => AppSettings)) => void];
    expenses: [Expense[], React.Dispatch<React.SetStateAction<Expense[]>>];
}

const AuthContext = React.createContext<AuthContextType | null>(null);

const fallbackAppSettings: AppSettings = {
    pharmacyName: "صيدلية جديدة",
    pharmacyAddress: "",
    pharmacyPhone: "",
    pharmacyEmail: "",
    expirationThresholdDays: 90,
    invoiceFooterMessage: "شكرًا لزيارتكم!",
    favorite_med_ids: [],
}

const initialActiveInvoice: ActiveInvoice = {
    cart: [],
    discountValue: '0',
    discountType: 'fixed',
    patientId: null,
    paymentMethod: 'cash',
    saleIdToUpdate: null,
    reviewIndex: null,
};




async function apiRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: object) {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    };

    if (!navigator.onLine && method !== 'GET') {
        await db.offlineRequests.add({
            url: `${API_URL}${endpoint}`,
            method,
            body,
            timestamp: Date.now()
        });
        toast({ title: 'أنت غير متصل', description: 'تم حفظ طلبك وسيتم إرساله عند عودة الاتصال بالإنترنت.' });
        return null;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);

        if (response.status === 204) return null;

        const responseData = await response.json();

        if (!response.ok) {
            const errorMessage = responseData.message || 'An API error occurred';

            // If the error message is "Unauthenticated", redirect to login page
            if (errorMessage === "Unauthenticated") {
                localStorage.removeItem('authToken');
                window.location.href = '/';
                throw new Error('Session expired. Please login again.');
            }

            throw new Error(errorMessage);
        }

        return responseData.data ?? responseData;
    } catch (error: any) {
        // Don't show toast for unauthenticated errors since we're redirecting
        if (error.message !== 'Session expired. Please login again.') {
            toast({ variant: 'destructive', title: 'خطأ في الشبكة', description: error.message });
        }
        throw error;
    }
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    // Initialize auth state on component mount
    const initializeAuth = React.useCallback(async () => {
        const token = localStorage.getItem('authToken');

        if (token) {
            try {
                const data: AuthResponse = await apiRequest('/user');
                setAllData(data);

                // Save to local DB
                if (data.pharmacy_data) {
                    await db.transaction('rw', [db.sales, db.inventory, db.patients, db.settings], async () => {
                        await db.sales.clear();
                        await db.sales.bulkPut(data.pharmacy_data.sales);
                        await db.inventory.clear();
                        await db.inventory.bulkPut(data.pharmacy_data.inventory);
                        await db.patients.clear();
                        await db.patients.bulkPut(data.pharmacy_data.patients);
                        if (data.pharmacy_data.settings) {
                            await db.settings.put({ ...data.pharmacy_data.settings, id: 1 }); // Use fixed ID for settings
                        }
                    });
                }
            } catch (error) {
                // Try loading from local DB
                try {
                    const sales = await db.sales.toArray();
                    const inventory = await db.inventory.toArray();
                    const patients = await db.patients.toArray();
                    const settings = await db.settings.get(1);

                    if (inventory.length > 0 || sales.length > 0) {
                        setInventory(inventory);
                        setSales(sales);
                        setPatients(patients);
                        if (settings) setSettings(settings);
                        // We might need to mock a user object or store it in DB too
                        // For now, let's assume if we have data we are "logged in" enough to view it
                        // But we need currentUser to be set.
                        // Ideally we should store currentUser in DB too.
                    } else {
                        localStorage.removeItem('authToken');
                    }
                } catch (e) {
                    localStorage.removeItem('authToken');
                }
            }
        }
        setLoading(false);
    }, []);

    const { syncRequests } = useSync(initializeAuth);

    React.useEffect(() => {
        initializeAuth();
    }, [initializeAuth]);


    const [inventory, setInventory] = React.useState<Medication[]>([]);
    const [sales, setSales] = React.useState<Sale[]>([]);
    const [patients, setPatients] = React.useState<Patient[]>([]);
    const [timeLogs, setTimeLogs] = React.useState<TimeLog[]>([]);
    const [settings, setSettings] = React.useState<AppSettings>(fallbackAppSettings);
    const [expenses, setExpenses] = React.useState<Expense[]>([]);

    const [activeTimeLogId, setActiveTimeLogId] = React.useState<string | null>(null);
    const [advertisements, setAdvertisements] = React.useState<Advertisement[]>([]);
    const [pharmacyGroups, setPharmacyGroups] = React.useState<PharmacyGroup[]>([]);

    // Multi-invoice state
    const [activeInvoices, setActiveInvoices] = React.useState<ActiveInvoice[]>([initialActiveInvoice]);
    const [currentInvoiceIndex, setCurrentInvoiceIndex] = React.useState(0);

    const updateActiveInvoice = React.useCallback((updater: (invoice: ActiveInvoice) => ActiveInvoice) => {
        setActiveInvoices(prevInvoices =>
            prevInvoices.map((invoice, index) =>
                index === currentInvoiceIndex ? updater(invoice) : invoice
            )
        );
    }, [currentInvoiceIndex]);

    const switchToInvoice = (index: number) => {
        if (index >= 0 && index < activeInvoices.length) {
            setCurrentInvoiceIndex(index);
        }
    };

    const createNewInvoice = () => {
        setActiveInvoices(prev => [...prev, initialActiveInvoice]);
        setCurrentInvoiceIndex(activeInvoices.length);
    };

    const closeInvoice = (index: number, isAfterSale = false) => {
        if (activeInvoices.length > 1) {
            setActiveInvoices(prev => prev.filter((_, i) => i !== index));
            if (currentInvoiceIndex >= index && currentInvoiceIndex > 0) {
                setCurrentInvoiceIndex(prev => prev - 1);
            }
        } else if (isAfterSale) {
            setActiveInvoices([initialActiveInvoice]);
            setCurrentInvoiceIndex(0);
        } else {
            setActiveInvoices(prev => prev.map((inv, i) => i === index ? initialActiveInvoice : inv));
        }
    };


    const setAllData = (data: AuthResponse) => {
        setCurrentUser(data.user);
        setUsers(data.all_users_in_pharmacy || []);
        setAdvertisements(data.advertisements || []);

        const pd = data.pharmacy_data;
        if (pd) {
            const activeLog = pd.timeLogs?.find(log => log.user_id === data.user.id && !log.clock_out);
            if (activeLog) setActiveTimeLogId(activeLog.id);
            setInventory(pd.inventory || []);
            setSales(pd.sales || []);
            setPatients(pd.patients || []);
            setTimeLogs(pd.timeLogs || []);
            setExpenses(pd.expenses || []);
            setSettings(pd.settings || fallbackAppSettings);
        }
        localStorage.setItem('authToken', data.token);
    };

    const login = async (email: string, pin: string) => {
        setLoading(true);
        try {
            const data: AuthResponse = await apiRequest('/login', 'POST', { email, pin });
            setAllData(data);
            if (data.user.role !== 'SuperAdmin' && data.user.role !== 'Admin') {
                const newTimeLog = await apiRequest('/time-logs', 'POST', { user_id: data.user.id, clock_in: new Date().toISOString() });
                setActiveTimeLogId(newTimeLog.id);
            }
            return data.user;
        } catch (error: any) {
            return null;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        try {
            if (currentUser?.role === 'Employee') {
                await apiRequest(`/time-logs/${activeTimeLogId}`, 'PUT');
                setActiveTimeLogId(null);
            }
            await apiRequest('/logout', 'POST');
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            localStorage.removeItem('authToken');
            setCurrentUser(null);
            setUsers([]);
            router.push('/');
        }
    };

    const createPharmacyAdmin = async (name: string, email: string, pin: string, province: string, dofied_id: string) => {
        try {
            const newUser = await apiRequest('/superadmin/pharmacies', 'POST', { name, email, pin, province, dofied_id });
            setUsers(prev => [...prev, newUser]);
            return true;
        } catch (error: any) { return false; }
    };

    const updateUserHourlyRate = async (userId: string, rate: number) => {
        try {
            await apiRequest(`/users/${userId}/hourly-rate`, 'PUT', { hourly_rate: rate });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, hourly_rate: rate } : u));
            toast({ title: "تم تحديث سعر الساعة" });
            return true;
        } catch (error: any) { return false; }
    };

    const getAllPharmacySettings = async (): Promise<Record<string, AppSettings>> => {
        try {
            return await apiRequest('/superadmin/pharmacies/settings');
        } catch (e: any) { return {}; }
    };

    const getPharmacyData = async (pharmacyId: string) => {
        try {
            const data = await apiRequest(`/superadmin/pharmacies/${pharmacyId}`);
            return {
                sales: data.sales || [],
                inventory: data.inventory || [],
                users: data.users || [],
            };
        } catch (e: any) {
            return { sales: [], inventory: [], users: []};
        }
    };

    const clearPharmacyData = async () => {
        try {
            await apiRequest('/settings/clear-data', 'DELETE');
            toast({ title: "تم مسح البيانات بنجاح" });
            logout();
        } catch (e: any) { }
    };

    const closeMonth = async (pin: string, dateFrom: string, dateTo: string) => {
        try {
            await apiRequest('/settings/close-month', 'POST', { pin, date_from: dateFrom, date_to: dateTo });
            toast({ title: "تم إقفال الفترة بنجاح!", description: "تمت أرشفة البيانات وتصفير الحسابات." });
            // Manually refetch user data to get the cleared state
            const data: AuthResponse = await apiRequest('/user');
            setAllData(data);
            return true;
        } catch (error: any) {
            toast({ variant: 'destructive', title: "فشل إقفال الفترة", description: error.message });
            return false;
        }
    };

    const getPaginatedInventory = React.useCallback(async (page: number, perPage: number, search: string, filters: Record<string, any> = {}) => {
        if (!navigator.onLine) {
            let allItems = await db.inventory.toArray();
            if (search) {
                const lowerSearch = search.toLowerCase();
                allItems = allItems.filter(i =>
                    i.name.toLowerCase().includes(lowerSearch) ||
                    i.barcodes?.some(b => b.toLowerCase().includes(lowerSearch)) ||
                    i.scientific_names?.some(s => s.toLowerCase().includes(lowerSearch))
                );
            }
            // Apply other filters if needed

            const total = allItems.length;
            const start = (page - 1) * perPage;
            const data = allItems.slice(start, start + perPage);

            return {
                data,
                current_page: page,
                last_page: Math.ceil(total / perPage),
                total,
                per_page: perPage,
                first_page_url: '', from: start + 1, last_page_url: '', links: [], next_page_url: null, path: '', prev_page_url: null, to: start + data.length
            } as PaginatedResponse<Medication>;
        }

        try {
            const params = new URLSearchParams({
                paginate: "true",
                page: String(page),
                per_page: String(perPage),
                search: search,
                ...filters
            });
            const data = await apiRequest(`/medications?${params.toString()}`);
            return data;
        } catch (e) {
            return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<Medication>;
        }
    }, []);

    const searchAllInventory = React.useCallback(async (search: string) => {
        if (!navigator.onLine) {
            let allItems = await db.inventory.toArray();
            if (search) {
                const lowerSearch = search.toLowerCase();
                allItems = allItems.filter(i =>
                    i.name.toLowerCase().includes(lowerSearch) ||
                    i.barcodes?.some(b => b.toLowerCase().includes(lowerSearch)) ||
                    i.scientific_names?.some(s => s.toLowerCase().includes(lowerSearch))
                );
            }
            return allItems.slice(0, 50); // Limit results
        }

        try {
            const params = new URLSearchParams({ search });
            return await apiRequest(`/medications?${params.toString()}`);
        } catch (e) {
            return [];
        }
    }, []);

    const searchInOtherBranches = React.useCallback(async (medicationName: string): Promise<BranchInventory[]> => {
        if (!navigator.onLine) {
            return [];
        }
        try {
            return await apiRequest(`/inventory/branches/${medicationName}`);
        } catch (e) {
            return [];
        }
    }, []);

    const getPaginatedPatients = React.useCallback(async (page: number, perPage: number, search: string) => {
        if (!navigator.onLine) {
            let allItems = await db.patients.toArray();
            if (search) {
                const lowerSearch = search.toLowerCase();
                allItems = allItems.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.phone?.includes(search));
            }

            const total = allItems.length;
            const start = (page - 1) * perPage;
            const data = allItems.slice(start, start + perPage);

            return {
                data,
                current_page: page,
                last_page: Math.ceil(total / perPage),
                total,
                per_page: perPage,
                first_page_url: '', from: start + 1, last_page_url: '', links: [], next_page_url: null, path: '', prev_page_url: null, to: start + data.length
            } as PaginatedResponse<Patient>;
        }

        try {
            const params = new URLSearchParams({
                paginate: "true",
                page: String(page),
                per_page: String(perPage),
                search: search,
            });
            const data = await apiRequest(`/patients?${params.toString()}`);
            return data;
        } catch (e) {
            return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<Patient>;
        }
    }, []);

    const searchAllPatients = React.useCallback(async (search: string) => {
        if (!navigator.onLine) {
            let allItems = await db.patients.toArray();
            if (search) {
                const lowerSearch = search.toLowerCase();
                allItems = allItems.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.phone?.includes(search));
            }
            return allItems.slice(0, 50);
        }

        try {
            const params = new URLSearchParams({ search });
            return await apiRequest(`/patients?${params.toString()}`);
        } catch (e) {
            return [];
        }
    }, []);

    const getPaginatedUsers = React.useCallback(async (role: 'Admin' | 'Employee', page: number, perPage: number, search: string, filters: { status?: string, province?: string } = {}) => {
        try {
            const params = new URLSearchParams({
                role,
                paginate: "true",
                page: String(page),
                per_page: String(perPage),
                search,
                ...filters
            });
            const data = await apiRequest(`/users?${params.toString()}`);
            return data;
        } catch (e) {
            return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<User>;
        }
    }, []);

    const getPaginatedSales = React.useCallback(async (page: number, perPage: number, search: string, dateFrom: string, dateTo: string, employeeId: string, paymentMethod: string) => {
        if (!navigator.onLine) {
            let allSales = await db.sales.toArray();

            // Filter
            if (search) {
                const lowerSearch = search.toLowerCase();
                allSales = allSales.filter(s => s.id.toLowerCase().includes(lowerSearch) || s.patientName?.toLowerCase().includes(lowerSearch));
            }
            if (dateFrom) {
                allSales = allSales.filter(s => new Date(s.date) >= new Date(dateFrom));
            }
            if (dateTo) {
                allSales = allSales.filter(s => new Date(s.date) <= new Date(dateTo));
            }
            if (employeeId && employeeId !== 'all') {
                allSales = allSales.filter(s => s.employee_id === employeeId);
            }
            if (paymentMethod && paymentMethod !== 'all') {
                allSales = allSales.filter(s => s.payment_method === paymentMethod);
            }

            // Sort by date desc
            allSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const total = allSales.length;
            const start = (page - 1) * perPage;
            const data = allSales.slice(start, start + perPage);

            return {
                data,
                current_page: page,
                last_page: Math.ceil(total / perPage),
                total,
                per_page: perPage,
                first_page_url: '', from: start + 1, last_page_url: '', links: [], next_page_url: null, path: '', prev_page_url: null, to: start + data.length
            } as PaginatedResponse<Sale>;
        }

        try {
            const params = new URLSearchParams({
                paginate: "true",
                page: String(page),
                per_page: String(perPage),
                search: search,
                date_from: dateFrom,
                date_to: dateTo,
                employee_id: employeeId,
                payment_method: paymentMethod,
            });
            const data = await apiRequest(`/sales?${params.toString()}`);
            return data;
        } catch (e) {
            return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<Sale>;
        }
    }, []);

    const searchAllSales = React.useCallback(async (search: string = "") => {
        if (!navigator.onLine) {
            let allSales = await db.sales.toArray();
            if (search) {
                const lowerSearch = search.toLowerCase();
                allSales = allSales.filter(s => s.id.toLowerCase().includes(lowerSearch) || s.patientName?.toLowerCase().includes(lowerSearch));
            }
            // Sort by date desc
            allSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return allSales.slice(0, 50);
        }

        try {
            const params = new URLSearchParams({ search });
            return await apiRequest(`/sales?${params.toString()}`);
        } catch (e) {
            return [];
        }
    }, []);

    const markAsDamaged = async (medId: string) => {
        try {
            await apiRequest(`/medications/${medId}/damage`, 'POST');
            toast({ title: "تم نقل الدواء إلى قائمة التالف" });
            return true;
        } catch (e) { return false; }
    };

    const bulkAddOrUpdateInventory = async (items: Partial<Medication>[]) => {
        try {
            const { new_count, updated_count } = await apiRequest('/medications/bulk', 'POST', { items });
            if (new_count !== undefined) {
                toast({ title: "اكتمل الاستيراد", description: `تمت إضافة ${new_count} أصناف جديدة${updated_count !== undefined ? ` وتحديث ${updated_count} أصناف` : ''}.` });
                return { new_count, updated_count };
            } else {
                return null;
            }
        } catch (e) {
            return null;
        }
    };

    const bulkUploadInventory = async (file: File) => {
        const token = localStorage.getItem('authToken');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/medications/bulk-upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to upload file');
            }

            const result = await response.json();
            const { new_count, updated_count, processed_medications } = result;

            if (new_count !== undefined) {
                toast({ title: "اكتمل الاستيراد", description: `تمت إضافة ${new_count} أصناف جديدة${updated_count !== undefined ? ` وتحديث ${updated_count} أصناف` : ''}.` });
                return { new_count, updated_count, processed_medications };
            } else {
                return null;
            }
        } catch (e) {
            toast({ title: "خطأ في الاستيراد", description: "حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى." });
            return null;
        }
    };

    const uploadCentralDrugList = async (items: Partial<Medication>[]) => {
        try {
            await apiRequest('/superadmin/drugs/bulk-upload', 'POST', { items });
            return true;
        } catch (e) { return false; }
    }

    const bulkUploadCentralDrugs = async (file: File) => {
        const token = localStorage.getItem('authToken');

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${API_URL}/superadmin/drugs/bulk-upload`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to upload file');
            }

            const result = await response.json();
            const { new_count, updated_count, processed_medications } = result;

            if (new_count !== undefined) {
                toast({ title: "اكتمل الاستيراد", description: `تمت إضافة ${new_count} أصناف جديدة${updated_count !== undefined ? ` وتحديث ${updated_count} أصناف` : ''}.` });
                return { new_count, updated_count, processed_medications };
            } else {
                return null;
            }
        } catch (e) {
            toast({ title: "خطأ في الاستيراد", description: "حدث خطأ أثناء رفع الملف. يرجى المحاولة مرة أخرى." });
            return null;
        }
    };

    const addSale = async (saleData: any) => {
        if (!navigator.onLine) {
            const newSale = {
                ...saleData,
                id: `local-${Date.now()}`,
                date: new Date().toISOString(),
                items: saleData.items.map((item: any) => ({ ...item, name: item.name || 'Unknown' })) // Ensure name exists
            };

            await db.sales.add(newSale);
            await db.offlineRequests.add({
                url: '/sales',
                method: 'POST',
                body: saleData,
                timestamp: Date.now()
            });

            setSales(prev => [newSale, ...prev]);
            // Optimistically update inventory
            setInventory(prev => {
                const newInventory = [...prev];
                newSale.items.forEach((item: any) => {
                    const medIndex = newInventory.findIndex(m => m.id === item.medication_id);
                    if (medIndex !== -1) {
                        newInventory[medIndex] = {
                            ...newInventory[medIndex],
                            stock: newInventory[medIndex].stock - item.quantity
                        };
                    }
                });
                return newInventory;
            });
            return newSale;
        }

        try {
            const { sale: newSale, updated_inventory } = await apiRequest('/sales', 'POST', saleData);
            setSales(prev => [newSale, ...prev]);
            if (updated_inventory && Array.isArray(updated_inventory)) {
                setInventory(prev => {
                    const updatedInventoryMap = new Map(updated_inventory.map((item: Medication) => [item.id, item]));
                    return prev.map(item => updatedInventoryMap.get(item.id) || item);
                });
            }
            return newSale;
        } catch (e) { return null; }
    }

    const updateSale = async (saleData: any) => {
        if (!navigator.onLine) {
            await db.sales.put(saleData);
            await db.offlineRequests.add({
                url: `/sales/${saleData.id}`,
                method: 'PUT',
                body: saleData,
                timestamp: Date.now()
            });
            setSales(prev => prev.map(s => s.id === saleData.id ? saleData : s));
            // Note: Inventory update logic for updateSale is complex to do offline without previous state diff. 
            // Skipping inventory update for offline edit for now or we could implement it if we have the old sale.
            return saleData;
        }

        try {
            const { sale: updatedSale, updated_inventory } = await apiRequest(`/sales/${saleData.id}`, 'PUT', saleData);
            setSales(prev => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
            if (updated_inventory && Array.isArray(updated_inventory)) {
                setInventory(prev => {
                    const updatedInventoryMap = new Map(updated_inventory.map((item: Medication) => [item.id, item]));
                    return prev.map(item => updatedInventoryMap.get(item.id) || item);
                });
            }
            return updatedSale;
        } catch (e) { return null; }
    }

    const deleteSale = async (saleId: string) => {
        if (!navigator.onLine) {
            await db.sales.delete(saleId);
            await db.offlineRequests.add({
                url: `/sales/${saleId}`,
                method: 'DELETE',
                timestamp: Date.now()
            });

            // Optimistically revert inventory
            const sale = sales.find(s => s.id === saleId);
            if (sale) {
                setInventory(prev => {
                    const newInventory = [...prev];
                    sale.items.forEach(item => {
                        const medIndex = newInventory.findIndex(m => m.id === item.medication_id);
                        if (medIndex !== -1) {
                            newInventory[medIndex] = {
                                ...newInventory[medIndex],
                                stock: newInventory[medIndex].stock + item.quantity
                            };
                        }
                    });
                    return newInventory;
                });
            }

            setSales(prev => prev.filter(s => s.id !== saleId));
            return true;
        }

        try {
            const { updated_inventory } = await apiRequest(`/sales/${saleId}`, 'DELETE');
            if (updated_inventory && Array.isArray(updated_inventory)) {
                setInventory(prev => {
                    const updatedInventoryMap = new Map(updated_inventory.map((item: Medication) => [item.id, item]));
                    return prev.map(item => updatedInventoryMap.get(item.id) || item);
                });
            }
            // Also remove from local state
            setSales(prev => prev.filter(s => s.id !== saleId));
            return true;
        } catch (e) { return false; }
    }

    const verifyPin = async (pin: string, isDeletePin: boolean = false) => {
        try {
            const response = await apiRequest('/verify-pin', 'POST', { pin, is_delete_pin: isDeletePin });
            return response.valid;
        } catch (e) {
            return false;
        }
    };

    const updateUserPinRequirement = async (userId: string, requirePin: boolean) => {
        try {
            await apiRequest(`/users/${userId}/require-pin`, 'PUT', { require_pin_for_delete: requirePin });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, require_pin_for_delete: requirePin } : u));
            toast({ title: "تم تحديث إعدادات الأمان" });
        } catch (e) { }
    }

    const toggleFavoriteMedication = async (medId: string) => {
        const currentFavs = settings.favorite_med_ids || [];
        const isFavorite = currentFavs.includes(medId);
        const newFavs = isFavorite ? currentFavs.filter(id => id !== medId) : [...currentFavs, medId];
        setScopedSettings({ ...settings, favorite_med_ids: newFavs });
    }

    const setScopedSettings = async (value: AppSettings | ((val: AppSettings) => AppSettings)) => {
        const newSettings = typeof value === 'function' ? value(settings) : value;
        try {
            const updatedSettings = await apiRequest('/settings', 'POST', newSettings);
            setSettings(updatedSettings); // Update local state with the response from the server
            toast({ title: "تم حفظ الإعدادات" });
        } catch (error: any) {
            // The apiRequest function already shows a toast on error
        }
    };

    // Central Drug Management
    const getCentralDrugs = React.useCallback(async (page: number, perPage: number, search: string) => {
        try {
            const params = new URLSearchParams({ page: String(page), per_page: String(perPage), search });
            return await apiRequest(`/superadmin/drugs?${params.toString()}`);
        } catch (e) { return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<Medication>; }
    }, []);

    // Pharmacy Groups Management
    const getPharmacyGroups = async (): Promise<PharmacyGroup[]> => {
        try {
            const groups = await apiRequest('/superadmin/pharmacy-groups');
            setPharmacyGroups(groups);
            return groups;
        } catch (e) {
            return [];
        }
    };

    const createPharmacyGroup = async (name: string, pharmacy_ids: string[]): Promise<PharmacyGroup | null> => {
        try {
            const newGroup = await apiRequest('/superadmin/pharmacy-groups', 'POST', { name, pharmacy_ids });
            setPharmacyGroups(prev => [...prev, newGroup]);
            return newGroup;
        } catch (e) {
            return null;
        }
    };

    const updatePharmacyGroup = async (groupId: string, data: { name?: string; pharmacy_ids?: string[] }): Promise<PharmacyGroup | null> => {
        try {
            const updatedGroup = await apiRequest(`/superadmin/pharmacy-groups/${groupId}`, 'PUT', data);
            setPharmacyGroups(prev => prev.map(g => g.id === groupId ? updatedGroup : g));
            return updatedGroup;
        } catch (e) {
            return null;
        }
    };

    const deletePharmacyGroup = async (groupId: string): Promise<boolean> => {
        try {
            await apiRequest(`/superadmin/pharmacy-groups/${groupId}`, 'DELETE');
            setPharmacyGroups(prev => prev.filter(g => g.id !== groupId));
            return true;
        } catch (e) {
            return false;
        }
    };

    const scopedData: ScopedDataContextType = {
        inventory: [inventory, setInventory],
        sales: [sales, setSales],
        patients: [patients, setPatients],
        timeLogs: [timeLogs, setTimeLogs],
        settings: [settings, setScopedSettings],
        expenses: [expenses, setExpenses],
    };

    const isAuthenticated = !!currentUser;

    return (
        <AuthContext.Provider value={{
            currentUser, users, setUsers, isAuthenticated, loading,
            login, logout,
            updateUserHourlyRate, createPharmacyAdmin, scopedData,
            getAllPharmacySettings, getPharmacyData, clearPharmacyData, closeMonth,
            advertisements,
            bulkAddOrUpdateInventory, bulkUploadInventory, getPaginatedInventory, searchAllInventory, markAsDamaged, toggleFavoriteMedication,
            addSale, updateSale, deleteSale, getPaginatedSales, searchAllSales,
            getPaginatedPatients, searchAllPatients,
            activeInvoices, currentInvoiceIndex, updateActiveInvoice, switchToInvoice, createNewInvoice, closeInvoice,
            verifyPin, updateUserPinRequirement,
            getCentralDrugs, uploadCentralDrugList, bulkUploadCentralDrugs,
            searchInOtherBranches,
            pharmacyGroups, getPharmacyGroups, createPharmacyGroup, updatePharmacyGroup, deletePharmacyGroup,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = React.useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
