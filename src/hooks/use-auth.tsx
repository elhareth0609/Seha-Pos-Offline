
"use client";

import * as React from 'react';
import type { User, UserPermissions, TimeLog, AppSettings, Medication, Sale, Supplier, Patient, TrashItem, SupplierPayment, PurchaseOrder, ReturnOrder, Advertisement, SaleItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from './use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

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
        payments: SupplierPayment[];
        purchaseOrders: PurchaseOrder[];
        supplierReturns: ReturnOrder[];
        timeLogs: TimeLog[];
    };
    all_users_in_pharmacy: User[];
    advertisements: Advertisement[];
};

type ActiveInvoice = {
  cart: SaleItem[];
  discountValue: string;
  discountType: 'fixed' | 'percentage';
  patientId: string | null;
  paymentMethod: 'cash' | 'card';
};

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  isAuthenticated: boolean;
  isSetup: boolean;
  loading: boolean;
  setupAdmin: (name: string, email: string, pin: string) => Promise<boolean>;
  createPharmacyAdmin: (name: string, email: string, pin: string) => Promise<boolean>;
  login: (email: string, pin: string) => Promise<User | null>;
  logout: () => void;
  registerUser: (name: string, email: string, pin: string) => Promise<boolean>;
  deleteUser: (userId: string, permanent?: boolean) => Promise<boolean>;
  updateUser: (userId: string, name: string, email: string, pin?: string) => Promise<boolean>;
  updateUserPermissions: (userId: string, permissions: UserPermissions) => Promise<boolean>;
  updateUserHourlyRate: (userId: string, rate: number) => Promise<boolean>;
  toggleUserStatus: (userId: string) => Promise<boolean>;
  getAllPharmacySettings: () => Promise<Record<string, AppSettings>>;
  getPharmacyData: (pharmacyId: string) => Promise<{ sales: Sale[], inventory: Medication[] }>;
  
  advertisements: Advertisement[];
  addAdvertisement: (title: string, imageUrl: string) => Promise<void>;
  updateAdvertisement: (adId: string, data: Partial<Omit<Advertisement, 'id' | 'createdAt'>>) => Promise<void>;
  deleteAdvertisement: (adId: string) => Promise<void>;

  scopedData: ScopedDataContextType;
  
  activeInvoice: ActiveInvoice;
  setActiveInvoice: React.Dispatch<React.SetStateAction<ActiveInvoice>>;
  resetActiveInvoice: () => void;
}

export interface ScopedDataContextType {
    inventory: [Medication[], (value: Medication[] | ((val: Medication[]) => Medication[])) => void];
    sales: [Sale[], (value: Sale[] | ((val: Sale[]) => Sale[])) => void];
    suppliers: [Supplier[], (value: Supplier[] | ((val: Supplier[]) => Supplier[])) => void];
    patients: [Patient[], (value: Patient[] | ((val: Patient[]) => Patient[])) => void];
    trash: [TrashItem[], (value: TrashItem[] | ((val: TrashItem[]) => TrashItem[])) => void];
    payments: [SupplierPayment[], (value: SupplierPayment[] | ((val: SupplierPayment[]) => SupplierPayment[])) => void];
    purchaseOrders: [PurchaseOrder[], (value: PurchaseOrder[] | ((val: PurchaseOrder[]) => PurchaseOrder[])) => void];
    supplierReturns: [ReturnOrder[], (value: ReturnOrder[] | ((val: ReturnOrder[]) => ReturnOrder[])) => void];
    timeLogs: [TimeLog[], (value: TimeLog[] | ((val: TimeLog[]) => TimeLog[])) => void];
    settings: [AppSettings, (value: AppSettings | ((val: AppSettings) => AppSettings)) => void];
}

const AuthContext = React.createContext<AuthContextType | null>(null);

const fallbackAppSettings: AppSettings = {
    pharmacyName: "صيدلية جديدة",
    pharmacyAddress: "",
    pharmacyPhone: "",
    pharmacyEmail: "",
    expirationThresholdDays: 90,
    invoiceFooterMessage: "شكرًا لزيارتكم!",
}

const emptyDataSetter = () => { console.warn("Attempted to set data without a valid user context."); };

const emptyScopedData: ScopedDataContextType = {
    inventory: [[], emptyDataSetter as any],
    sales: [[], emptyDataSetter as any],
    suppliers: [[], emptyDataSetter as any],
    patients: [[], emptyDataSetter as any],
    trash: [[], emptyDataSetter as any],
    payments: [[], emptyDataSetter as any],
    purchaseOrders: [[], emptyDataSetter as any],
    supplierReturns: [[], emptyDataSetter as any],
    timeLogs: [[], emptyDataSetter as any],
    settings: [fallbackAppSettings, emptyDataSetter as any],
};

const initialActiveInvoice: ActiveInvoice = {
    cart: [],
    discountValue: '0',
    discountType: 'fixed',
    patientId: null,
    paymentMethod: 'cash',
};

// Helper to handle API requests
async function apiRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: object) {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const responseData = await response.json();
    
    if (!response.ok) {
        // Use message from Laravel's JSON response if available
        const errorMessage = responseData.message || 'An API error occurred';
        throw new Error(errorMessage);
    }

    // Laravel wraps responses in a 'data' key, let's handle that.
    return responseData.data ?? responseData;
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    const [users, setUsers] = React.useState<User[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [isSetup, setIsSetup] = React.useState(true);
    const router = useRouter();

    // Pharmacy-scoped data states
    const [inventory, setInventory] = React.useState<Medication[]>([]);
    const [sales, setSales] = React.useState<Sale[]>([]);
    const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
    const [patients, setPatients] = React.useState<Patient[]>([]);
    const [trash, setTrash] = React.useState<TrashItem[]>([]);
    const [payments, setPayments] = React.useState<SupplierPayment[]>([]);
    const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>([]);
    const [supplierReturns, setSupplierReturns] = React.useState<ReturnOrder[]>([]);
    const [timeLogs, setTimeLogs] = React.useState<TimeLog[]>([]);
    const [settings, setSettings] = React.useState<AppSettings>(fallbackAppSettings);
    
    // Global data states
    const [advertisements, setAdvertisements] = React.useState<Advertisement[]>([]);
    
    // Active invoice state
    const [activeInvoice, setActiveInvoice] = React.useState<ActiveInvoice>(initialActiveInvoice);

    const resetActiveInvoice = React.useCallback(() => {
        setActiveInvoice(initialActiveInvoice);
    }, []);

    const setAllData = (data: AuthResponse) => {
        setCurrentUser(data.user);
        setUsers(data.all_users_in_pharmacy || []);
        setAdvertisements(data.advertisements || []);
        
        const pd = data.pharmacy_data;
        if(pd) {
            setInventory(pd.inventory || []);
            setSales(pd.sales || []);
            setSuppliers(pd.suppliers || []);
            setPatients(pd.patients || []);
            setTrash(pd.trash || []);
            setPayments(pd.payments || []);
            setPurchaseOrders(pd.purchaseOrders || []);
            setSupplierReturns(pd.supplierReturns || []);
            setTimeLogs(pd.timeLogs || []);
            setSettings(pd.settings || fallbackAppSettings);
        }
        localStorage.setItem('authToken', data.token);
    };

    React.useEffect(() => {
        const checkInitialState = async () => {
            try {
                const setupStatus = await apiRequest('/setup/status');
                setIsSetup(setupStatus.is_setup);

                const token = localStorage.getItem('authToken');
                if (token) {
                    const data: AuthResponse = await apiRequest('/user');
                    setAllData(data);
                }
            } catch (error) {
                console.error("Initial check failed:", error);
                localStorage.removeItem('authToken');
            } finally {
                setLoading(false);
            }
        };

        checkInitialState();
    }, []);

    const setupAdmin = async (name: string, email: string, pin: string) => {
        setLoading(true);
        try {
            const data: AuthResponse = await apiRequest('/setup', 'POST', { name, email, pin });
            setAllData(data);
            setIsSetup(true);
            return true;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل الإعداد', description: error.message });
            return false;
        } finally {
            setLoading(false);
        }
    };
    
    const login = async (email: string, pin: string) => {
        setLoading(true);
        try {
            const data: AuthResponse = await apiRequest('/login', 'POST', { email, pin });
            setAllData(data);
            return data.user;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل تسجيل الدخول', description: error.message });
            return null;
        } finally {
            setLoading(false);
        }
    };
    
    const logout = async () => {
        try {
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
    
    const createPharmacyAdmin = async (name: string, email: string, pin: string) => {
        try {
            const newUser = await apiRequest('/superadmin/pharmacies', 'POST', { name, email, pin });
            setUsers(prev => [...prev, newUser]);
            return true;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل إنشاء المدير', description: error.message });
            return false;
        }
    };

    const registerUser = async (name: string, email: string, pin: string) => {
       try {
            const newUser = await apiRequest('/admin/users', 'POST', { name, email, pin });
            setUsers(prev => [...prev, newUser]);
            return true;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل إضافة الموظف', description: error.message });
            return false;
        }
    }
    
    const updateUser = async (userId: string, name: string, email: string, pin?: string) => {
        try {
            const updatedUser = await apiRequest(`/users/${userId}`, 'PUT', { name, email, pin });
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            if (currentUser?.id === userId) setCurrentUser(updatedUser);
            return true;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل تحديث المستخدم', description: error.message });
            return false;
        }
    };
    
    const deleteUser = async (userId: string, permanent: boolean = false) => {
        try {
            await apiRequest(`/users/${userId}`, 'DELETE', { permanent });
            setUsers(prev => prev.filter(u => u.id !== userId));
            return true;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل حذف المستخدم', description: error.message });
            return false;
        }
    };
    
    const toggleUserStatus = async (userId: string) => {
        try {
            const { status } = await apiRequest(`/users/${userId}/status`, 'PUT');
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
            return true;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل تغيير الحالة', description: error.message });
            return false;
        }
    };
    
    const updateUserPermissions = async (userId: string, permissions: UserPermissions) => {
        try {
            await apiRequest(`/users/${userId}/permissions`, 'PUT', { permissions });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions } : u));
            return true;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل تحديث الصلاحيات', description: error.message });
            return false;
        }
    };
    
    const updateUserHourlyRate = async (userId: string, rate: number) => {
        try {
            await apiRequest(`/users/${userId}/hourly-rate`, 'PUT', { hourly_rate: rate });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, hourlyRate: rate } : u));
            return true;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'فشل تحديث سعر الساعة', description: error.message });
            return false;
        }
    };
    
    const getAllPharmacySettings = async (): Promise<Record<string, AppSettings>> => {
        try {
            return await apiRequest('/superadmin/pharmacies/settings');
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'فشل جلب الإعدادات', description: e.message });
            return {};
        }
    };

    const getPharmacyData = async (pharmacyId: string) => {
         try {
            return await apiRequest(`/superadmin/pharmacies/${pharmacyId}`);
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'فشل جلب بيانات الصيدلية', description: e.message });
            return { sales: [], inventory: [] };
        }
    };

    const addAdvertisement = async (title: string, imageUrl: string) => {
         try {
            const newAd = await apiRequest('/advertisements', 'POST', { title, image_url: imageUrl });
            setAdvertisements(prev => [...prev, newAd]);
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'فشل إضافة الإعلان', description: e.message });
        }
    };

    const updateAdvertisement = async (adId: string, data: Partial<Omit<Advertisement, 'id' | 'createdAt'>>) => {
        try {
            const updatedAd = await apiRequest(`/advertisements/${adId}`, 'PUT', { show_on: data.showOn });
            setAdvertisements(prev => prev.map(ad => ad.id === adId ? updatedAd : ad));
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'فشل تحديث الإعلان', description: e.message });
        }
    };

    const deleteAdvertisement = async (adId: string) => {
        try {
            await apiRequest(`/advertisements/${adId}`, 'DELETE');
            setAdvertisements(prev => prev.filter(ad => ad.id !== adId));
        } catch(e: any) {
            toast({ variant: 'destructive', title: 'فشل حذف الإعلان', description: e.message });
        }
    };

    // --- Scoped Data Setters ---

    const createSetter = <T extends {id: any}>(
        setter: React.Dispatch<React.SetStateAction<T[]>>,
        resource: string
    ) => async (value: T[] | ((val: T[]) => T[])) => {
        // This is now just an optimistic update. The actual API call should be made in the component.
        // For example, when adding a new item, the component will call the API,
        // and on success, it will update the state using this setter.
        setter(value);
    };

    const setScopedSettings = async (value: AppSettings | ((val: AppSettings) => AppSettings)) => {
       const newSettings = typeof value === 'function' ? value(settings) : value;
       try {
           const updatedSettings = await apiRequest('/settings', 'POST', newSettings);
           setSettings(updatedSettings);
       } catch (error: any) {
           toast({ variant: 'destructive', title: 'فشل حفظ الإعدادات', description: error.message });
       }
    };
    
    const scopedData: ScopedDataContextType = {
        inventory: [inventory, createSetter(setInventory, 'medications')],
        sales: [sales, createSetter(setSales, 'sales')],
        suppliers: [suppliers, createSetter(setSuppliers, 'suppliers')],
        patients: [patients, createSetter(setPatients, 'patients')],
        trash: [trash, createSetter(setTrash, 'trash')],
        payments: [payments, createSetter(setPayments, 'payments')],
        purchaseOrders: [purchaseOrders, createSetter(setPurchaseOrders, 'purchase-orders')],
        supplierReturns: [supplierReturns, createSetter(setSupplierReturns, 'return-orders')],
        timeLogs: [timeLogs, createSetter(setTimeLogs, 'time-logs')],
        settings: [settings, setScopedSettings],
    };

    const isAuthenticated = !!currentUser;

    return (
        <AuthContext.Provider value={{ 
            currentUser, users, setUsers, isAuthenticated, loading, isSetup, 
            setupAdmin, login, logout, registerUser, deleteUser, updateUser, 
            updateUserPermissions, updateUserHourlyRate, createPharmacyAdmin, toggleUserStatus, scopedData,
            getAllPharmacySettings, getPharmacyData,
            advertisements, addAdvertisement, updateAdvertisement, deleteAdvertisement,
            activeInvoice, setActiveInvoice, resetActiveInvoice
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

    