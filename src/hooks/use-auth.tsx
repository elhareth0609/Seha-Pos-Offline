

"use client";

import * as React from 'react';
import type { User, UserPermissions, TimeLog, AppSettings, Medication, Sale, Supplier, Patient, TrashItem, SupplierPayment, PurchaseOrder, ReturnOrder, Advertisement, Offer, SaleItem, PaginatedResponse, TransactionHistoryItem, Expense, Task, MonthlyArchive, ArchivedMonthData, OrderRequestItem, PurchaseOrderItem, MedicalRepresentative, Notification, SupportRequestPayload, PatientPaymentPayload, SupportRequest, PatientPayment, DrugRequest, RequestResponse, ExchangeItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from './use-toast';
import { PinDialog } from '@/components/auth/PinDialog';
import { differenceInDays, parseISO, startOfToday, isSameDay, endOfMonth } from 'date-fns';


const API_URL = process.env.NEXT_PUBLIC_API_URL;

type AuthResponse = {
    token: string;
    user: User;
    pharmacy_data: {
        settings: AppSettings;
        inventory: Medication[];
        sales: Sale[];
        suppliers: Supplier[];
        patients: Patient[];
        trash: TrashItem[];
        payments: {
            supplierPayments: SupplierPayment[];
            patientPayments: PatientPayment[];
        };
        purchaseOrders: PurchaseOrder[];
        supplierReturns: ReturnOrder[];
        timeLogs: TimeLog[];
        expenses: Expense[];
        tasks: Task[];
        orderRequests: OrderRequestItem[];
    };
    all_users_in_pharmacy: User[];
    advertisements: Advertisement[];
    offers: Offer[];
    support_requests: SupportRequest[];
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
    createPharmacyAdmin: (name: string, email: string, pin: string, province: string) => Promise<boolean>;
    login: (email: string, pin: string) => Promise<User | null>;
    logout: () => void;
    registerUser: (name: string, email: string, pin: string) => Promise<boolean>;
    deleteUser: (userId: string, permanent?: boolean) => Promise<boolean>;
    updateUser: (userId: string, data: Partial<User>) => Promise<boolean>;
    updateUserPermissions: (userId: string, permissions: UserPermissions) => Promise<boolean>;
    updateUserHourlyRate: (userId: string, rate: number) => Promise<boolean>;
    toggleUserStatus: (user: User) => Promise<boolean>;
    getAllPharmacySettings: () => Promise<Record<string, AppSettings>>;
    getPharmacyData: (pharmacyId: string) => Promise<{ users: User[], sales: Sale[], inventory: Medication[], purchaseOrders: PurchaseOrder[], suppliers: Supplier[], payments: any, supplierReturns: ReturnOrder[] }>;
    
    advertisements: Advertisement[];
    addAdvertisement: (title: string, image_url: string) => Promise<void>;
    updateAdvertisement: (adId: string, data: Partial<Omit<Advertisement, 'id' | 'created_at'>>) => Promise<void>;
    deleteAdvertisement: (adId: string) => Promise<void>;
    incrementAdView: (adId: string) => Promise<void>;
    
    offers: Offer[];
    addOffer: (title: string, image_url: string, expiration_date: string, contact_number?: string) => Promise<void>;
    deleteOffer: (offerId: string) => Promise<void>;
    incrementOfferView: (offerId: string) => Promise<void>;
    
    clearPharmacyData: () => Promise<void>;
    closeMonth: (pin: string, dateFrom: string, dateTo: string) => Promise<boolean>;
    
    scopedData: ScopedDataContextType;

    // Inventory Management
    addMedication: (data: Partial<Medication>) => Promise<Medication | null>;
    updateMedication: (medId: string, data: Partial<Medication>) => Promise<boolean>;
    deleteMedication: (medId: string) => Promise<boolean>;
    markAsDamaged: (medId: string) => Promise<boolean>;
    bulkAddOrUpdateInventory: (items: Partial<Medication>[]) => Promise<boolean>;
    getPaginatedInventory: (page: number, perPage: number, search: string, filters: Record<string, any>) => Promise<PaginatedResponse<Medication>>;
    searchAllInventory: (search: string) => Promise<Medication[]>;
    toggleFavoriteMedication: (medId: string) => Promise<void>;
    
    // Expiring Soon
    getPaginatedExpiringSoon: (page: number, perPage: number, search: string, type: 'expiring' | 'expired' | 'damaged') => Promise<{
        data: Medication[];
        expiredMedicationsLength: number;
        expiringMedicationsLength: number;
        damagedMedicationsLength: number;
        current_page: number;
        last_page: number;
    }>;

    // Sales
    addSale: (saleData: any) => Promise<Sale | null>;
    updateSale: (saleData: any) => Promise<Sale | null>;
    deleteSale: (saleId: string) => Promise<boolean>;
    getPaginatedSales: (page: number, perPage: number, search: string, dateFrom: string, dateTo: string, employeeId: string, paymentMethod: string) => Promise<PaginatedResponse<Sale>>;
    searchAllSales: (search?: string) => Promise<Sale[]>;
    
    // Suppliers
    addSupplier: (data: Partial<Supplier>) => Promise<Supplier | null>;
    updateSupplier: (supplier_id: string, data: Partial<Supplier>) => Promise<boolean>;
    deleteSupplier: (supplier_id: string) => Promise<boolean>;
    getPaginatedSuppliers: (page: number, perPage: number, search: string) => Promise<PaginatedResponse<Supplier>>;

    // Patients
    addPatient: (name: string, phone?: string) => Promise<Patient | null>;
    updatePatient: (patientId: string, data: Partial<Patient>) => Promise<boolean>;
    deletePatient: (patientId: string) => Promise<boolean>;
    getPaginatedPatients: (page: number, perPage: number, search: string) => Promise<PaginatedResponse<Patient>>;
    searchAllPatients: (search: string) => Promise<Patient[]>;

    // Payments
    addPayment: (supplier_id: string, amount: number, notes?: string) => Promise<boolean>;
    addPatientPayment: (patient_id: string, amount: number, notes?: string) => Promise<boolean>;
    
    // Purchases and Returns
    addPurchaseOrder: (data: any) => Promise<boolean>;
    addReturnOrder: (data: any) => Promise<boolean>;
    getPaginatedPurchaseOrders: (page: number, perPage: number, search: string, dateFrom?: string, dateTo?: string) => Promise<PaginatedResponse<PurchaseOrder>>;
    getPaginatedReturnOrders: (page: number, perPage: number, search: string, dateFrom?: string, dateTo?: string) => Promise<PaginatedResponse<ReturnOrder>>;
    
    // Expenses
    getPaginatedExpenses: (page: number, perPage: number, search: string) => Promise<PaginatedResponse<Expense>>;
    addExpense: (amount: number, description: string) => Promise<boolean>;
    updateExpense: (id: string, amount: number, description: string) => Promise<boolean>;
    deleteExpense: (id: string) => Promise<boolean>;
    getRecurringExpenses: () => Promise<any[]>;
    addRecurringExpense: (data: any) => Promise<boolean>;
    deleteRecurringExpense: (id: string) => Promise<boolean>;


    // Tasks
    getPaginatedTasks: (page: number, perPage: number, filters: { user_id?: string, completed?: boolean }) => Promise<PaginatedResponse<Task>>;
    getMineTasks: (user_id: string) => Promise<Task[]>;
    addTask: (description: string, user_id: string) => Promise<boolean>;
    updateTask: (id: string, data: Partial<Task>) => Promise<boolean>;
    updateStatusTask: (id: string, data: Partial<Task>) => Promise<boolean>;
    deleteTask: (id: string) => Promise<boolean>;

    // Trash
    restoreItem: (itemId: string) => Promise<boolean>;
    permDelete: (itemId: string) => Promise<boolean>;
    clearTrash: () => Promise<boolean>;
    getPaginatedTrash: (page: number, perPage: number) => Promise<PaginatedResponse<TrashItem>>;
    
    // Users (for SuperAdmin)
    getPaginatedUsers: (role: 'Admin' | 'Employee', page: number, perPage: number, search: string, filters?: { status?: string, province?: string }) => Promise<PaginatedResponse<User>>;
    
    getPaginatedItemMovements: (page: number, perPage: number, search: string, medication_id: string, scientificName?: string) => Promise<PaginatedResponse<TransactionHistoryItem>>;
    getMedicationMovements: (medId: string) => Promise<TransactionHistoryItem[]>;

    // Multi-invoice state
    activeInvoices: ActiveInvoice[];
    currentInvoiceIndex: number;
    updateActiveInvoice: (updater: (invoice: ActiveInvoice) => ActiveInvoice) => void;
    switchToInvoice: (index: number) => void;
    createNewInvoice: () => void;
    closeInvoice: (index: number, isAfterSale?: boolean) => void;
    
    verifyPin: (pin: string, isDeletePin?: boolean) => Promise<boolean>;
    updateUserPinRequirement: (userId: string, requirePin: boolean) => Promise<void>;
    
    getArchivedMonths: () => Promise<MonthlyArchive[]>;
    getArchivedMonthData: (archiveId: string) => Promise<ArchivedMonthData | null>;

    getOrderRequestCart: () => Promise<OrderRequestItem[]>;
    addToOrderRequestCart: (item: Medication | { medication_id: string; name: string }) => void;
    removeFromOrderRequestCart: (orderItemId: string, skipToast?: boolean) => void;
    updateOrderRequestItem: (orderItemId: string, data: Partial<OrderRequestItem>) => Promise<void>;
    duplicateOrderRequestItem: (orderItemId: string) => Promise<void>;
    updatePreferenceScore: (medicationId: string, preferred: boolean) => void;

    purchaseDraft: {
        invoiceId: string;
        supplierId: string;
        items: PurchaseOrderItem[];
    };
    setPurchaseDraft: React.Dispatch<React.SetStateAction<{
        invoiceId: string;
        supplierId: string;
        items: PurchaseOrderItem[];
    }>>;

    addRepresentative: (rep: Omit<MedicalRepresentative, 'id'>) => Promise<MedicalRepresentative | null>;

    // Notifications
    getNotifications: () => Promise<Notification[]>;
    
    // Support
    supportRequests: SupportRequest[];
    addSupportRequest: (data: SupportRequestPayload) => Promise<boolean>;
    updateSupportRequestStatus: (id: string, status: 'new' | 'contacted') => Promise<void>;
    // Pharma-Swap
    getExchangeItems: () => Promise<ExchangeItem[]>;
    postExchangeItem: (item: Omit<ExchangeItem, 'id' | 'pharmacyName' | 'pharmacy_id'>) => Promise<ExchangeItem | null>;
    deleteExchangeItem: (itemId: string) => Promise<boolean>;
    getDrugRequests: () => Promise<DrugRequest[]>;
    postDrugRequest: (request: Omit<DrugRequest, 'id' | 'pharmacy_id' | 'pharmacyName' | 'province' | 'status' | 'responses' | 'ignoredBy'>) => Promise<DrugRequest | null>;
    deleteDrugRequest: (requestId: string) => Promise<boolean>;
    respondToDrugRequest: (requestId: string, price: number) => Promise<DrugRequest | null>;
    ignoreDrugRequest: (requestId: string) => Promise<boolean>;
}

export interface ScopedDataContextType {
    inventory: [Medication[], React.Dispatch<React.SetStateAction<Medication[]>>];
    sales: [Sale[], React.Dispatch<React.SetStateAction<Sale[]>>];
    suppliers: [Supplier[], React.Dispatch<React.SetStateAction<Supplier[]>>];
    patients: [Patient[], React.Dispatch<React.SetStateAction<Patient[]>>];
    trash: [TrashItem[], React.Dispatch<React.SetStateAction<TrashItem[]>>];
    payments: [{
        supplierPayments: SupplierPayment[],
        patientPayments: PatientPayment[],
    }, React.Dispatch<React.SetStateAction<{
        supplierPayments: SupplierPayment[],
        patientPayments: PatientPayment[],
    }>>],
    purchaseOrders: [PurchaseOrder[], React.Dispatch<React.SetStateAction<PurchaseOrder[]>>];
    supplierReturns: [ReturnOrder[], React.Dispatch<React.SetStateAction<ReturnOrder[]>>];
    timeLogs: [TimeLog[], React.Dispatch<React.SetStateAction<TimeLog[]>>];
    settings: [AppSettings, (value: AppSettings | ((val: AppSettings) => AppSettings)) => void];
    expenses: [Expense[], React.Dispatch<React.SetStateAction<Expense[]>>];
    tasks: [Task[], React.Dispatch<React.SetStateAction<Task[]>>];
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

function openDB() {
    return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('offline-requests-db', 1);
        request.onupgradeneeded = event => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('requests')) {
                db.createObjectStore('requests', { autoIncrement: true, keyPath: 'id' });
            }
        };
        request.onsuccess = event => resolve((event.target as IDBOpenDBRequest).result);
        request.onerror = event => reject((event.target as IDBOpenDBRequest).error);
    });
}

async function queueRequest(url: string, options: RequestInit) {
    const db = await openDB();
    const tx = db.transaction('requests', 'readwrite');
    const store = tx.objectStore('requests');
    await new Promise((resolve, reject) => {
        const req = store.add({ url, options });
        req.onsuccess = resolve;
        req.onerror = reject;
    });

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(sw => {
            (sw as any).sync?.register('sync-requests');
        });
    }
}


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
        await queueRequest(`${API_URL}${endpoint}`, options);
        toast({ title: 'أنت غير متصل', description: 'تم حفظ طلبك وسيتم إرساله عند عودة الاتصال بالإنترنت.' });
        // Return a mocked successful response for offline actions to update UI optimistically
        return { message: 'Request queued for sync' }; 
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
    React.useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const data: AuthResponse = await apiRequest('/user');
                    setAllData(data);
                } catch (error) {
                    localStorage.removeItem('authToken');
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    const [inventory, setInventory] = React.useState<Medication[]>([]);
    const [sales, setSales] = React.useState<Sale[]>([]);
    const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
    const [patients, setPatients] = React.useState<Patient[]>([]);
    const [trash, setTrash] = React.useState<TrashItem[]>([]);
    const [payments, setPayments] = React.useState<{ supplierPayments: SupplierPayment[], patientPayments: PatientPayment[] }>({ supplierPayments: [], patientPayments: [] });
    const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>([]);
    const [supplierReturns, setSupplierReturns] = React.useState<ReturnOrder[]>([]);
    const [timeLogs, setTimeLogs] = React.useState<TimeLog[]>([]);
    const [settings, setSettings] = React.useState<AppSettings>(fallbackAppSettings);
    const [expenses, setExpenses] = React.useState<Expense[]>([]);
    const [tasks, setTasks] = React.useState<Task[]>([]);
    
    const [activeTimeLogId, setActiveTimeLogId] = React.useState<string | null>(null);
    const [advertisements, setAdvertisements] = React.useState<Advertisement[]>([]);
    const [offers, setOffers] = React.useState<Offer[]>([]);
    const [supportRequests, setSupportRequests] = React.useState<SupportRequest[]>([]);
    
    // Multi-invoice state
    const [activeInvoices, setActiveInvoices] = React.useState<ActiveInvoice[]>([initialActiveInvoice]);
    const [currentInvoiceIndex, setCurrentInvoiceIndex] = React.useState(0);

    const [orderRequestCart, setOrderRequestCart] = React.useState<OrderRequestItem[]>([]);
    const [purchaseDraft, setPurchaseDraft] = React.useState<{
        invoiceId: string;
        supplierId: string;
        items: PurchaseOrderItem[];
    }>({ invoiceId: '', supplierId: '', items: [] });
    

    const getOrderRequestCart = async () => {
        try {
            return await apiRequest('/order-requests');
        } catch(e) { return []; }
    }
    
    const [addingToCart, setAddingToCart] = React.useState(false);
    const addToOrderRequestCart = async (item: Medication | { medication_id: string; name: string }) => {
        if (addingToCart) return;
        setAddingToCart(true);
        try {
            // Check if the item has 'id' property (from Medication type) or use 'medication_id' directly
            const medicationId = 'id' in item ? item.id : item.medication_id;
            console.log(medicationId);
            const newItemData = { medication_id: medicationId, quantity: 1, is_new: true };
            const savedItem = await apiRequest('/order-requests', 'POST', newItemData);
            setOrderRequestCart(prev => [...prev, savedItem]);
            toast({ title: 'تمت الإضافة إلى الطلبات', description: `تمت إضافة ${item.name} إلى قائمة الطلبات.` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'فشل الإضافة', description: 'لم يتم إضافة الطلب. الرجاء المحاولة مرة أخرى.' });
        } finally {
            setAddingToCart(false);
        }
    };
    
    const duplicateOrderRequestItem = async (orderItemId: string) => {
        const originalItem = orderRequestCart.find(item => item.id === orderItemId);
        if (!originalItem) return;

        try {
            const newItemData = { medication_id: originalItem.medication_id, quantity: 1, is_new: true };
            const savedItem = await apiRequest('/order-requests', 'POST', newItemData);
            
            const originalIndex = orderRequestCart.findIndex(item => item.id === orderItemId);
            
            setOrderRequestCart(currentCart => {
                const newCart = [...currentCart];
                newCart.splice(originalIndex + 1, 0, savedItem);
                return newCart;
            });
            
            toast({ title: 'تم تكرار الصنف', description: `تمت إضافة نسخة جديدة من ${originalItem.name}.` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'فشل التكرار', description: 'لم يتم تكرار الطلب. الرجاء المحاولة مرة أخرى.' });
        }
    };

    const removeFromOrderRequestCart = async (orderItemId: string, skipToast = false) => {
        try {
            await apiRequest(`/order-requests/${orderItemId}`, 'DELETE');
            setOrderRequestCart(prev => prev.filter(item => item.id != orderItemId));
            if (!skipToast) {
                toast({ title: "تم الحذف من الطلبات" });
            }
        } catch(e) {
            toast({ variant: 'destructive', title: "فشل الحذف", description: "لم يتم حذف الطلب. الرجاء المحاولة مرة أخرى." });
        }
    };

    const updateOrderRequestItem = async (orderItemId: string, data: Partial<OrderRequestItem>) => {
        try {
            const updatedItem = await apiRequest(`/order-requests/${orderItemId}`, 'PUT', data);
            setOrderRequestCart(prev => prev.map(item => item.id === orderItemId ? updatedItem : item));
        } catch (e) {
            toast({ variant: 'destructive', title: "فشل التحديث", description: "لم يتم حفظ التغيير. الرجاء المحاولة مرة أخرى." });
        }
    };

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
        setOffers(data.offers || []);
        setSupportRequests(data.support_requests || []);
        
        const pd = data.pharmacy_data;
        if(pd) {
            const activeLog = pd.timeLogs?.find(log => log.user_id === data.user.id && !log.clock_out);
            if (activeLog) setActiveTimeLogId(activeLog.id);
            setInventory(pd.inventory || []);
            setSales(pd.sales || []);
            setSuppliers(pd.suppliers || []);
            setPatients(pd.patients || []);
            setTrash(pd.trash || []);
            setPayments(pd.payments || { supplierPayments: [], patientPayments: [] });
            setPurchaseOrders(pd.purchaseOrders || []);
            setSupplierReturns(pd.supplierReturns || []);
            setTimeLogs(pd.timeLogs || []);
            setExpenses(pd.expenses || []);
            setTasks(pd.tasks || []);
            setSettings(pd.settings || fallbackAppSettings);
            setOrderRequestCart(pd.orderRequests || []);
        }
        localStorage.setItem('authToken', data.token);
    };

    const login = async (email: string, pin: string) => {
        setLoading(true);
        try {
            const data: AuthResponse = await apiRequest('/login', 'POST', { email, pin });
            setAllData(data);
            if (data.user.role !== 'SuperAdmin' && data.user.role !== 'Admin') {
                const newTimeLog = await apiRequest('/time-logs', 'POST', {user_id: data.user.id, clock_in: new Date().toISOString()});
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
    
    const createPharmacyAdmin = async (name: string, email: string, pin: string, province: string) => {
        try {
            const newUser = await apiRequest('/superadmin/pharmacies', 'POST', { name, email, pin, province });
            setUsers(prev => [...prev, newUser]);
            return true;
        } catch (error: any) { return false; }
    };

    const registerUser = async (name: string, email: string, pin: string) => {
       try {
            const newUser = await apiRequest('/admin/users', 'POST', { name, email, pin });
            setUsers(prev => [...prev, newUser]);
            return true;
        } catch (error: any) { return false; }
    }
    
    const updateUser = async (userId: string, data: Partial<User>) => {
        try {
            const updatedUser = await apiRequest(`/users/${userId}`, 'PUT', data);
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            if (currentUser?.id === userId) setCurrentUser(updatedUser);
            return true;
        } catch (error: any) { return false; }
    };
    
    const deleteUser = async (userId: string, permanent: boolean = false) => {
        try {
            if (permanent) {
                 await apiRequest(`/users/${userId}`, 'DELETE', { permanent: true });
            } else {
                const trashedItem = await apiRequest(`/users/${userId}`, 'DELETE');
                setTrash(prev => [...prev, trashedItem]);
            }
            setUsers(prev => prev.filter(u => u.id !== userId));
            return true;
        } catch (error: any) { return false; }
    };
    
    const toggleUserStatus = async (user: User) => {
        try {
            const { status } = await apiRequest(`/users/${user.id}/status`, 'PUT');
            // In SuperAdmin, we don't have access to all users, so just toast
            toast({title: `تم تغيير حالة حساب ${user.name} إلى ${status === 'active' ? 'فعال' : 'معلق'}`});
            return true;
        } catch (error: any) { return false; }
    };
    
    const updateUserPermissions = async (userId: string, permissions: UserPermissions) => {
        try {
            await apiRequest(`/users/${userId}/permissions`, 'PUT', { permissions });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions } : u));
            toast({ title: "تم تحديث الصلاحيات بنجاح" });
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
        } catch(e: any) { return {}; }
    };

    const getPharmacyData = async (pharmacyId: string) => {
         try {
            const data = await apiRequest(`/superadmin/pharmacies/${pharmacyId}`);
            return {
                sales: data.sales || [],
                inventory: data.inventory || [],
                users: data.users || [],
                purchaseOrders: data.purchaseOrders || [],
                suppliers: data.suppliers || [],
                payments: data.payments || { supplierPayments: [], patientPayments: [] },
                supplierReturns: data.supplierReturns || [],
            };
        } catch(e: any) { 
            return { sales: [], inventory: [], users: [], purchaseOrders: [], suppliers:[], payments:{}, supplierReturns:[] }; 
        }
    };
    
    const clearPharmacyData = async () => {
        try {
            await apiRequest('/settings/clear-data', 'DELETE');
            toast({ title: "تم مسح البيانات بنجاح" });
            logout();
        } catch (e: any) {}
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

    const addAdvertisement = async (title: string, image_url: string) => {
         try {
            const newAd = await apiRequest('/advertisements', 'POST', { title, image_url });
            setAdvertisements(prev => [...prev, newAd]);
        } catch(e: any) {}
    };

    const updateAdvertisement = async (adId: string, data: Partial<Omit<Advertisement, 'id' | 'created_at'>>) => {
        try {
            const updatedAd = await apiRequest(`/advertisements/${adId}`, 'PUT', data);
            setAdvertisements(prev => prev.map(ad => ad.id === adId ? updatedAd : ad));
        } catch(e: any) {}
    };

    const deleteAdvertisement = async (adId: string) => {
        try {
            await apiRequest(`/advertisements/${adId}`, 'DELETE');
            setAdvertisements(prev => prev.filter(ad => ad.id !== adId));
        } catch(e: any) {}
    };

    const incrementAdView = async (adId: string) => {
        try {
            await apiRequest(`/advertisements/${adId}/view`, 'POST');
            setAdvertisements(prev => prev.map(ad => ad.id === adId ? { ...ad, views: (ad.views || 0) + 1 } : ad));
        } catch(e: any) {}
    };
    
    const addOffer = async (title: string, image_url: string, expiration_date: string, contact_number?: string) => {
         try {
            const newOffer = await apiRequest('/offers', 'POST', { title, image_url, expiration_date, contact_number });
            setOffers(prev => [...prev, newOffer]);
        } catch(e: any) {}
    };
    
    const deleteOffer = async (offerId: string) => {
        try {
            await apiRequest(`/offers/${offerId}`, 'DELETE');
            setOffers(prev => prev.filter(offer => offer.id !== offerId));
        } catch(e: any) {}
    };

    const incrementOfferView = async (offerId: string) => {
        try {
            await apiRequest(`/offers/${offerId}/view`, 'POST');
            setOffers(prev => prev.map(offer => offer.id === offerId ? { ...offer, views: (offer.views || 0) + 1 } : offer));
        } catch(e: any) {}
    }

    const getPaginatedInventory = React.useCallback(async (page: number, perPage: number, search: string, filters: Record<string, any> = {}) => {
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
        try {
            const params = new URLSearchParams({ search });
            return await apiRequest(`/medications?${params.toString()}`);
        } catch (e) {
            return [];
        }
    }, []);
    
const getPaginatedExpiringSoon = React.useCallback(async (page: number, perPage: number, search: string, type: 'expiring' | 'expired' | 'damaged') => {
    try {
        const params = new URLSearchParams({
            paginate: "true",
            page: String(page),
            per_page: String(perPage),
            search: search,
            type: type,
        });
        const response = await apiRequest(`/expiring-soon?${params.toString()}`);
        return {
            data: response.data.data,
            expiredMedicationsLength: response.expiredMedicationsLength,
            expiringMedicationsLength: response.expiringMedicationsLength,
            damagedMedicationsLength: response.damagedMedicationsLength,
            current_page: response.data.current_page,
            last_page: response.data.last_page,
        };
    } catch (e) {
        return {
            data: [],
            expiredMedicationsLength: 0,
            expiringMedicationsLength: 0,
            damagedMedicationsLength: 0,
            current_page: 1,
            last_page: 1,
        };
    }
}, []);

    const getMedicationMovements = React.useCallback(async (medicationId: string) => {
        try {
            const data = await apiRequest(`/medications/${medicationId}/movements`);
            return data;
        } catch (e) {
            return { data: [] };
        }
    }, []);

    // Update getPaginatedItemMovements to handle medication_id
    const getPaginatedItemMovements = React.useCallback(async (page: number, perPage: number, search: string, medicationId?: string, scientificName?: string) => {
        try {
            const params = new URLSearchParams({
                paginate: "true",
                page: String(page),
                per_page: String(perPage),
                search: search,
            });
            if (medicationId) params.append('medication_id', medicationId);
            if (scientificName) params.append('scientific_name', scientificName);

            const data = await apiRequest(`/item-movements?${params.toString()}`);
            return data;
        } catch (e) {
            return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<TransactionHistoryItem>;
        }
    }, []);

    const getPaginatedPatients = React.useCallback(async (page: number, perPage: number, search: string) => {
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
        try {
            const params = new URLSearchParams({ search });
            return await apiRequest(`/patients?${params.toString()}`);
        } catch (e) {
            return [];
        }
    }, []);

    const getPaginatedSuppliers = React.useCallback(async (page: number, perPage: number, search: string) => {
        try {
            const params = new URLSearchParams({
                paginate: "true",
                page: String(page),
                per_page: String(perPage),
                search: search,
            });
            const data = await apiRequest(`/suppliers?${params.toString()}`);
            return data;
        } catch (e) {
            return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<Supplier>;
        }
    }, []);
    
    const getPaginatedTrash = React.useCallback(async (page: number, perPage: number) => {
        try {
            const params = new URLSearchParams({
                paginate: "true",
                page: String(page),
                per_page: String(perPage),
            });
            const data = await apiRequest(`/trash?${params.toString()}`);
            return data;
        } catch (e) {
            return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<TrashItem>;
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
        try {
            const params = new URLSearchParams({ search });
            return await apiRequest(`/sales?${params.toString()}`);
        } catch (e) {
            return [];
        }
    }, []);

    const getPaginatedPurchaseOrders = React.useCallback(async (page: number, perPage: number, search: string, dateFrom?: string, dateTo?: string) => {
        try {
            const params = new URLSearchParams({
                paginate: "true",
                page: String(page),
                per_page: String(perPage),
                search: search,
            });
            if(dateFrom) params.append('date_from', dateFrom);
            if(dateTo) params.append('date_to', dateTo);

            const data = await apiRequest(`/purchase-orders?${params.toString()}`);
            return data;
        } catch (e) {
            return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<PurchaseOrder>;
        }
    }, []);
    
    const getPaginatedReturnOrders = React.useCallback(async (page: number, perPage: number, search: string, dateFrom?: string, dateTo?: string) => {
        try {
            const params = new URLSearchParams({
                paginate: "true",
                page: String(page),
                per_page: String(perPage),
                search: search,
            });
             if(dateFrom) params.append('date_from', dateFrom);
            if(dateTo) params.append('date_to', dateTo);
            const data = await apiRequest(`/return-orders?${params.toString()}`);
            return data;
        } catch (e) {
            return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<ReturnOrder>;
        }
    }, []);


    const addMedication = async (data: Partial<Medication>) => {
        try {
            const newMed = await apiRequest('/medications', 'POST', data);
            setInventory(prev => [newMed, ...prev]);
            return newMed;
        } catch (e) { return null; }
    }
    const updateMedication = async (medId: string, data: Partial<Medication>) => {
        try {
            const updatedMed = await apiRequest(`/medications/${medId}`, 'PUT', data);
            toast({ title: "تم تحديث الدواء بنجاح" });
            return true;
        } catch (e) { return false; }
    }
    
    const deleteMedication = async (medId: string) => {
        try {
            const trashedItem = await apiRequest(`/medications/${medId}`, 'DELETE');
            setTrash(prev => [...prev, trashedItem]);
            toast({ title: "تم نقل الدواء إلى سلة المحذوفات" });
            return true;
        } catch (e) { return false; }
    }
    
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
            toast({ title: "اكتمل الاستيراد", description: `تمت إضافة ${new_count} أصناف جديدة وتحديث ${updated_count} أصناف.` });
            return true;
        } catch (e) { return false; }
    }

    const addSale = async (saleData: any) => {
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
        try {
            const { updated_inventory } = await apiRequest(`/sales/${saleId}`, 'DELETE');
            if (updated_inventory && Array.isArray(updated_inventory)) {
                setInventory(prev => {
                    const updatedInventoryMap = new Map(updated_inventory.map((item: Medication) => [item.id, item]));
                    return prev.map(item => updatedInventoryMap.get(item.id) || item);
                });
            }
            return true;
        } catch (e) { return false; }
    }


    const addSupplier = async (data: Partial<Supplier>) => {
        try {
            const newSupplier = await apiRequest('/suppliers', 'POST', data);
            setSuppliers(prev => [newSupplier, ...prev]);
            toast({ title: "تمت إضافة المورد بنجاح" });
            return newSupplier;
        } catch(e) { return null; }
    }

    const updateSupplier = async (supplier_id: string, data: Partial<Supplier>) => {
        try {
            const updatedSupplier = await apiRequest(`/suppliers/${supplier_id}`, 'PUT', data);
            setSuppliers(prev => prev.map(s => s.id === supplier_id ? updatedSupplier : s));
            toast({ title: "تم تحديث المورد بنجاح" });
            return true;
        } catch (e) { return false; }
    }

    const deleteSupplier = async (supplier_id: string) => {
        try {
            const trashedItem = await apiRequest(`/suppliers/${supplier_id}`, 'DELETE');
            setSuppliers(prev => prev.filter(s => s.id !== supplier_id));
            setTrash(prev => [...prev, trashedItem]);
            toast({ title: "تم نقل المورد إلى سلة المحذوفات" });
            return true;
        } catch (e) { return false; }
    }

    const addPatient = async (name: string, phone?: string) => {
        try {
            const newPatient = await apiRequest('/patients', 'POST', { name, phone });
            setPatients(prev => [newPatient, ...prev]);
            toast({ title: "تمت إضافة المريض بنجاح" });
            return newPatient;
        } catch (e) { return null; }
    }

    const updatePatient = async (patientId: string, data: Partial<Patient>) => {
        try {
            const updatedPatient = await apiRequest(`/patients/${patientId}`, 'PUT', data);
            setPatients(prev => prev.map(p => p.id === patientId ? updatedPatient : p));
            toast({ title: "تم تحديث المريض بنجاح" });
            return true;
        } catch (e) { return false; }
    }

    const deletePatient = async (patientId: string) => {
        try {
            const trashedItem = await apiRequest(`/patients/${patientId}`, 'DELETE');
            setPatients(prev => prev.filter(p => p.id !== patientId));
            setTrash(prev => [...prev, trashedItem]);
            toast({ title: "تم نقل المريض إلى سلة المحذوفات" });
            return true;
        } catch (e) { return false; }
    }

    const addPayment = async (supplier_id: string, amount: number, notes?: string) => {
        try {
            const newPayment = await apiRequest('/payments/supplier', 'POST', { supplier_id: supplier_id, amount, notes });
            setPayments(prev => ({...prev, supplierPayments: [...(prev.supplierPayments || []), newPayment]}));
            toast({ title: `تم تسجيل دفعة بمبلغ ${amount.toLocaleString()}` });
            return true;
        } catch (e) { return false; }
    }
    
    const addPatientPayment = async (patient_id: string, amount: number, notes?: string) => {
        try {
            const newPayment = await apiRequest('/payments/patient', 'POST', { patient_id, amount, notes });
            setPayments(prev => ({...prev, patientPayments: [...(prev.patientPayments || []), newPayment]}));
            toast({ title: `تم تسجيل دفعة بمبلغ ${amount.toLocaleString()}` });
            return true;
        } catch(e) { return false; }
    }

    const addPurchaseOrder = async (data: any) => {
        try {
            const { purchase_order, updated_inventory } = await apiRequest('/purchase-orders', 'POST', data);
            setPurchaseOrders(prev => [purchase_order, ...prev]);
            setInventory(updated_inventory);
            toast({ title: "تم تسجيل قائمة الشراء بنجاح" });
            return true;
        } catch (e) { return false; }
    };
    
    const addReturnOrder = async (data: any) => {
        try {
            const { return_order, updated_inventory } = await apiRequest('/return-orders', 'POST', data);
            setSupplierReturns(prev => [return_order, ...prev]);
            setInventory(updated_inventory);
            toast({ title: "تم تسجيل قائمة الإرجاع بنجاح" });
            return true;
        } catch (e) { return false; }
    };

    const getPaginatedExpenses = React.useCallback(async (page: number, perPage: number, search: string) => {
        try {
            const params = new URLSearchParams({
                paginate: "true",
                page: String(page),
                per_page: String(perPage),
                search: search,
            });
            const data = await apiRequest(`/expenses?${params.toString()}`);
            return data;
        } catch (e) {
            return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<Expense>;
        }
    }, []);

    const addExpense = async (amount: number, description: string) => {
        try {
            const newExpense = await apiRequest('/expenses', 'POST', { amount, description });
            setExpenses(prev => [newExpense, ...prev]);
            toast({ title: "تم إضافة المصروف بنجاح" });
            return true;
        } catch (e) { return false; }
    };
    
    const updateExpense = async (id: string, amount: number, description: string) => {
        try {
            const updatedExpense = await apiRequest(`/expenses/${id}`, 'PUT', { amount, description });
            setExpenses(prev => prev.map(ex => ex.id === id ? updatedExpense : ex));
            toast({ title: "تم تعديل المصروف بنجاح" });
            return true;
        } catch (e) { return false; }
    };
    
    const deleteExpense = async (id: string) => {
        try {
            await apiRequest(`/expenses/${id}`, 'DELETE');
            setExpenses(prev => prev.filter(ex => ex.id !== id));
            toast({ title: "تم حذف المصروف بنجاح" });
            return true;
        } catch (e) { return false; }
    };

    const getRecurringExpenses = async () => {
        try {
            const data = await apiRequest('/recurring-expenses');
            return data || [];
        } catch (e) {
            return [];
        }
    };

    const addRecurringExpense = async (data: any) => {
        try {
            await apiRequest('/recurring-expenses', 'POST', data);
            return true;
        } catch (e) {
            return false;
        }
    };

    const deleteRecurringExpense = async (id: string) => {
        try {
            await apiRequest(`/recurring-expenses/${id}`, 'DELETE');
            return true;
        } catch (e) {
            return false;
        }
    };
    
    const getPaginatedTasks = React.useCallback(async (page: number, perPage: number, filters: { user_id?: string, completed?: boolean }) => {
        try {
            const params = new URLSearchParams({
                paginate: "true",
                page: String(page),
                per_page: String(perPage),
            });
            if(filters.user_id) params.append('user_id', filters.user_id);
            if(filters.completed !== undefined) params.append('completed', String(filters.completed));
            
            const data = await apiRequest(`/tasks?${params.toString()}`);
            return data;
        } catch (e) {
            return { data: [], current_page: 1, last_page: 1 } as unknown as PaginatedResponse<Task>;
        }
    }, []);

    const getMineTasks = React.useCallback(async (user_id: string) => {
        try {
            const data = await apiRequest(`/users/${user_id}/tasks`);
            return data;
        } catch (e) {
            return [];
        }
    }, []);

    const addTask = async (description: string, user_id: string) => {
        try {
            const newTask = await apiRequest('/tasks', 'POST', { description, user_id });
            setTasks(prev => [newTask, ...prev]);
            toast({ title: "تمت إضافة المهمة بنجاح" });
            return true;
        } catch (e) { return false; }
    };

    const updateTask = async (id: string, data: Partial<Task>) => {
        try {
            const updatedTask = await apiRequest(`/tasks/${id}`, 'PUT', data);
            toast({ title: data.completed ? "تم إنجاز المهمة!" : "تم تحديث المهمة" });
            return true;
        } catch (e) { return false; }
    };

    const updateStatusTask = async (id: string, data: Partial<Task>) => {
        console.log("Calling:", `/tasks/${id}/completed`);

        try {
            const updatedTask = await apiRequest(`/tasks/${id}/completed`, 'PUT', data);
            toast({ title: data.completed ? "تم إنجاز المهمة!" : "تم تحديث المهمة" });
            return true;
        } catch (e) { return false; }
    };

    const deleteTask = async (id: string) => {
        try {
            await apiRequest(`/tasks/${id}`, 'DELETE');
            setTasks(prev => prev.filter(t => t.id !== id));
            toast({ title: "تم حذف المهمة" });
            return true;
        } catch (e) { return false; }
    };


    const restoreItem = async (itemId: string) => {
        try {
            const { restored_item, item_type } = await apiRequest(`/trash/${itemId}`, 'PUT');
            setTrash(prev => prev.filter(t => t.id !== itemId));
            switch(item_type) {
                case 'medication': setInventory(prev => [restored_item, ...prev]); break;
                case 'patient': setPatients(prev => [restored_item, ...prev]); break;
                case 'supplier': setSuppliers(prev => [restored_item, ...prev]); break;
                case 'user': setUsers(prev => [restored_item, ...prev]); break;
                case 'task': setTasks(prev => [restored_item, ...prev]); break;
                case 'sale': setSales(prev => [restored_item, ...prev]); break;
            }
            toast({ title: "تم استعادة العنصر بنجاح" });
            return true;
        } catch(e) { return false; }
    }
    
    const permDelete = async (itemId: string) => {
         try {
            await apiRequest(`/trash/${itemId}`, 'DELETE');
            setTrash(prev => prev.filter(t => t.id !== itemId));
            toast({ title: "تم حذف العنصر نهائيًا" });
            return true;
        } catch(e) { return false; }
    }
    
    const clearTrash = async () => {
        try {
            await apiRequest('/trash/clear', 'DELETE');
            setTrash([]);
            toast({ title: "تم تفريغ سلة المحذوفات" });
            return true;
        } catch(e) { return false; }
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
        } catch(e) {}
    }
    
    const getArchivedMonths = async (): Promise<MonthlyArchive[]> => {
        try {
            return await apiRequest('/archives');
        } catch(e) {
            return [];
        }
    }
    
    const getArchivedMonthData = async (archiveId: string): Promise<ArchivedMonthData | null> => {
        try {
            return await apiRequest(`/archives/${archiveId}`);
        } catch(e) {
            return null;
        }
    }

    const addRepresentative = async (rep: Omit<MedicalRepresentative, 'id'>) => {
        // This is a placeholder. In a real scenario, this would make an API call
        // to your backend to save the new representative.
        const newRep = { ...rep, id: `manual-${Date.now()}` };
        // setRepresentatives(prev => [...prev, newRep]);
        toast({ title: "تمت إضافة المندوب بنجاح" });
        return newRep;
    };
    
    const addSupportRequest = async (data: SupportRequestPayload) => {
        try {
            await apiRequest('/support-requests', 'POST', data);
            return true;
        } catch(e) {
            return false;
        }
    };
    
    const updateSupportRequestStatus = async (id: string, status: 'new' | 'contacted') => {
        try {
            const updatedRequest = await apiRequest(`/support-requests/${id}/status`, 'PUT', { status });
            setSupportRequests(prev => prev.map(req => req.id === id ? updatedRequest : req));
        } catch (e) {}
    }

    const getNotifications = React.useCallback(async (): Promise<Notification[]> => {
        const generatedNotifications: Notification[] = [];
        const today = startOfToday();
    
        // Inventory Notifications
        inventory.forEach(med => {
            if (med.stock <= 0) {
                generatedNotifications.push({ id: `out_of_stock_${med.id}`, type: 'out_of_stock', message: `نفد من المخزون: ${med.name}.`, data: { medicationId: med.id }, read: false, created_at: new Date().toISOString() });
            } else if (med.stock < med.reorder_point) {
                generatedNotifications.push({ id: `low_stock_${med.id}`, type: 'low_stock', message: `مخزون منخفض: ${med.name}. الكمية المتبقية: ${med.stock}`, data: { medicationId: med.id }, read: false, created_at: new Date().toISOString() });
            }
    
            if (med.expiration_date) {
                const expDate = parseISO(med.expiration_date);
                if (expDate < today) {
                    generatedNotifications.push({ id: `expired_${med.id}`, type: 'expired', message: `دواء منتهي: ${med.name}. الرجاء نقله إلى التالف.`, data: { medicationId: med.id }, read: false, created_at: new Date().toISOString() });
                } else {
                    const daysLeft = differenceInDays(expDate, today);
                    if (daysLeft <= settings.expirationThresholdDays) {
                         generatedNotifications.push({ id: `expiring_soon_${med.id}`, type: 'expiring_soon', message: `قريب الانتهاء: ${med.name} خلال ${daysLeft} يوم.`, data: { medicationId: med.id }, read: false, created_at: new Date().toISOString() });
                    }
                }
            }
        });

        // Sales Notifications (Admin only)
        if(currentUser?.role === 'Admin') {
            sales.forEach(sale => {
                if (sale.discount && sale.discount > 20000) { 
                     generatedNotifications.push({ id: `large_discount_${sale.id}`, type: 'large_discount', message: `خصم كبير بقيمة ${sale.discount.toLocaleString()} في الفاتورة #${sale.id}.`, data: { saleId: sale.id }, read: false, created_at: sale.date });
                }
                sale.items.forEach(item => {
                    if (!item.is_return && item.price < item.purchase_price) {
                         generatedNotifications.push({ id: `below_cost_${sale.id}_${item.medication_id}`, type: 'sale_below_cost', message: `تم بيع ${item.name} بأقل من الكلفة في الفاتورة #${sale.id}.`, data: { saleId: sale.id, medicationId: item.medication_id }, read: false, created_at: sale.date });
                    }
                })
            });
        }

        // Task Notifications
        tasks.forEach(task => {
            if (!task.completed && task.user_id === currentUser?.id) {
                generatedNotifications.push({ id: `task_assigned_${task.id}`, type: 'task_assigned', message: `مهمة جديدة: ${task.description}`, data: { taskId: task.id, userId: task.user_id }, read: false, created_at: task.created_at });
            }
        });
        
        // Month End Reminder (Admin only)
        if (currentUser?.role === 'Admin' && isSameDay(new Date(), endOfMonth(new Date()))) {
            generatedNotifications.push({ id: 'month_end_reminder', type: 'month_end_reminder', message: 'تذكير: اليوم هو نهاية الشهر. لا تنسَ إقفال الحسابات.', data: {}, read: false, created_at: new Date().toISOString() });
        }

        // Supplier Debt Limit (Admin only)
        if (currentUser?.role === 'Admin' && payments && payments.supplierPayments) {
            suppliers.forEach(supplier => {
                if (!supplier.debt_limit || supplier.debt_limit <= 0) return;

                const purchases = purchaseOrders.filter(p => p.supplier_id === supplier.id).reduce((sum, p) => sum + p.total_amount, 0);
                const returns = supplierReturns.filter(r => r.supplier_id === supplier.id).reduce((sum, r) => sum + r.total_amount, 0);
                
                const supplierPaymentsData = payments.supplierPayments.filter(p => p.supplier_id === supplier.id).reduce((sum, p) => sum + p.amount, 0);
                const netDebt = purchases - returns - supplierPaymentsData;

                if(netDebt > supplier.debt_limit) {
                    generatedNotifications.push({ id: `debt_limit_${supplier.id}`, type: 'supplier_debt_limit', message: `تجاوز حد الدين للمورد ${supplier.name}. الدين الحالي: ${netDebt.toLocaleString()}`, data: { supplierId: supplier.id }, read: false, created_at: new Date().toISOString() });
                }
            });
        }
        
        // New Purchase Order
        purchaseOrders.forEach(po => {
            if (isSameDay(new Date(po.date), today)) {
                 generatedNotifications.push({ id: `new_po_${po.id}`, type: 'new_purchase_order', message: `تم استلام قائمة شراء جديدة #${po.id} من ${po.supplier_name}.`, data: { purchaseOrderId: po.id }, read: false, created_at: po.date });
            }
        });
    
        return Promise.resolve(generatedNotifications.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    }, [inventory, sales, tasks, settings.expirationThresholdDays, currentUser, suppliers, purchaseOrders, supplierReturns, payments]);


    const updatePreferenceScore = React.useCallback((medicationId: string, preferred: boolean) => {
        const scoreChange = preferred ? 5 : -1;
        setSettings(prev => {
            const newScores = { ...(prev.suggestion_preference_score || {}) };
            newScores[medicationId] = (newScores[medicationId] || 100) + scoreChange;
            return { ...prev, suggestion_preference_score: newScores };
        });
        // In a real app, you would debounce this and save to the backend.
    }, []);

    const getExchangeItems = async (): Promise<ExchangeItem[]> => {
        try {
            return await apiRequest('/exchange/items');
        } catch (e) {
            return [];
        }
    };
    
    const postExchangeItem = async (item: Omit<ExchangeItem, 'id' | 'pharmacyName' | 'pharmacy_id'>): Promise<ExchangeItem | null> => {
        try {
            const newItem = await apiRequest('/exchange/items', 'POST', item);
            return newItem;
        } catch (e) {
            return null;
        }
    };

    const deleteExchangeItem = async (itemId: string): Promise<boolean> => {
        try {
            await apiRequest(`/exchange/items/${itemId}`, 'DELETE');
            return true;
        } catch (e) {
            return false;
        }
    };
    
    const getDrugRequests = async (): Promise<DrugRequest[]> => {
        try {
            return await apiRequest('/exchange/requests');
        } catch (e) {
            return [];
        }
    };
    
    const postDrugRequest = async (request: Omit<DrugRequest, 'id' | 'pharmacy_id' | 'pharmacyName' | 'province' | 'status' | 'responses' | 'ignoredBy'>): Promise<DrugRequest | null> => {
        try {
            const newRequest = await apiRequest('/exchange/requests', 'POST', request);
            return newRequest;
        } catch (e) {
            return null;
        }
    };

    const deleteDrugRequest = async (requestId: string): Promise<boolean> => {
        try {
            await apiRequest(`/exchange/requests/${requestId}`, 'DELETE');
            return true;
        } catch (e) {
            return false;
        }
    };
    
    const respondToDrugRequest = async (requestId: string, price: number): Promise<DrugRequest | null> => {
        try {
            const updatedRequest = await apiRequest(`/exchange/requests/${requestId}/respond`, 'POST', { price });
            return updatedRequest;
        } catch (e) {
            return null;
        }
    };
    
    const ignoreDrugRequest = async (requestId: string): Promise<boolean> => {
        try {
            await apiRequest(`/exchange/requests/${requestId}/ignore`, 'POST');
            return true;
        } catch (e) {
            return false;
        }
    };

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
    
    const scopedData: ScopedDataContextType = {
        inventory: [inventory, setInventory],
        sales: [sales, setSales],
        suppliers: [suppliers, setSuppliers],
        patients: [patients, setPatients],
        trash: [trash, setTrash],
        payments: [payments, setPayments],
        purchaseOrders: [purchaseOrders, setPurchaseOrders],
        supplierReturns: [supplierReturns, setSupplierReturns],
        timeLogs: [timeLogs, setTimeLogs],
        settings: [settings, setScopedSettings],
        expenses: [expenses, setExpenses],
        tasks: [tasks, setTasks],
    };

    const isAuthenticated = !!currentUser;

    return (
        <AuthContext.Provider value={{ 
            currentUser, users, setUsers, isAuthenticated, loading, 
            login, logout, registerUser, deleteUser, updateUser, 
            updateUserPermissions, updateUserHourlyRate, createPharmacyAdmin, toggleUserStatus, scopedData,
            getAllPharmacySettings, getPharmacyData, clearPharmacyData, closeMonth,
            advertisements, addAdvertisement, updateAdvertisement, deleteAdvertisement, incrementAdView,
            offers, addOffer, deleteOffer, incrementOfferView,
            addMedication, updateMedication, deleteMedication, bulkAddOrUpdateInventory, getPaginatedInventory, searchAllInventory, markAsDamaged, toggleFavoriteMedication,
            getPaginatedExpiringSoon,
            getPaginatedItemMovements, getMedicationMovements,
            addSale, updateSale, deleteSale, getPaginatedSales, searchAllSales,
            addSupplier, updateSupplier, deleteSupplier, getPaginatedSuppliers,
            addPatient, updatePatient, deletePatient, getPaginatedPatients, searchAllPatients,
            addPayment, addPatientPayment,
            addPurchaseOrder,
            addReturnOrder, getPaginatedPurchaseOrders, getPaginatedReturnOrders,
            getPaginatedExpenses, addExpense, updateExpense, deleteExpense, getRecurringExpenses, addRecurringExpense, deleteRecurringExpense,
            getPaginatedTasks, getMineTasks, addTask, updateTask, updateStatusTask, deleteTask,
            restoreItem, permDelete, clearTrash, getPaginatedTrash,
            getPaginatedUsers,
            activeInvoices, currentInvoiceIndex, updateActiveInvoice, switchToInvoice, createNewInvoice, closeInvoice,
            addRepresentative,
            verifyPin, updateUserPinRequirement,
            getArchivedMonths, getArchivedMonthData,
            getOrderRequestCart, addToOrderRequestCart, removeFromOrderRequestCart, updateOrderRequestItem, duplicateOrderRequestItem, updatePreferenceScore,
            purchaseDraft, setPurchaseDraft,
            getNotifications,
            supportRequests, addSupportRequest, updateSupportRequestStatus,
            getExchangeItems, postExchangeItem, deleteExchangeItem,
            getDrugRequests, postDrugRequest, deleteDrugRequest, respondToDrugRequest, ignoreDrugRequest
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
