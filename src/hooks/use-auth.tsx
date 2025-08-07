
"use client";

import * as React from 'react';
import type { User, UserPermissions, TimeLog, AppSettings, Medication, Sale, Supplier, Patient, TrashItem, SupplierPayment, PurchaseOrder, ReturnOrder, Advertisement, SaleItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from './use-toast';

// This is a placeholder for your Laravel API URL.
// You should set this in your .env.local file.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || 'An API error occurred');
    }

    return response.json();
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
                // Check if the system has been set up (i.e., if a SuperAdmin exists)
                const setupStatus = await apiRequest('/setup/status');
                setIsSetup(setupStatus.is_setup);

                // If a token exists, try to re-authenticate
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
        // This function will need a dedicated API endpoint in Laravel
        toast({ title: "ملاحظة: تحتاج هذه الميزة إلى واجهة برمجية مخصصة" });
        return false;
    };
    
    const getAllPharmacySettings = async (): Promise<Record<string, AppSettings>> => {
        // This function will need a dedicated API endpoint in Laravel for SuperAdmins
        toast({ title: "ملاحظة: تحتاج هذه الميزة إلى واجهة برمجية مخصصة" });
        return {};
    };

    const getPharmacyData = async (pharmacyId: string) => {
        // This function will need a dedicated API endpoint in Laravel for SuperAdmins
        toast({ title: "ملاحظة: تحتاج هذه الميزة إلى واجهة برمجية مخصصة" });
        return { sales: [], inventory: [] };
    };

    const addAdvertisement = async (title: string, imageUrl: string) => {
        // This function will need a dedicated API endpoint in Laravel for SuperAdmins
        toast({ title: "ملاحظة: تحتاج هذه الميزة إلى واجهة برمجية مخصصة" });
    };

    const updateAdvertisement = async (adId: string, data: Partial<Omit<Advertisement, 'id' | 'createdAt'>>) => {
        // This function will need a dedicated API endpoint in Laravel for SuperAdmins
        toast({ title: "ملاحظة: تحتاج هذه الميزة إلى واجهة برمجية مخصصة" });
    };

    const deleteAdvertisement = async (adId: string) => {
        // This function will need a dedicated API endpoint in Laravel for SuperAdmins
        toast({ title: "ملاحظة: تحتاج هذه الميزة إلى واجهة برمجية مخصصة" });
    };

    const createSetter = <T,>(
        setter: React.Dispatch<React.SetStateAction<T[]>>,
    ) => async (value: T[] | ((val: T[]) => T[])) => {
        // The logic for updating data should now happen inside each component
        // which calls a specific API endpoint. This setter just updates the local state.
        setter(value);
    };

    const setScopedSettings = async (value: AppSettings | ((val: AppSettings) => AppSettings)) => {
       const newSettings = typeof value === 'function' ? value(settings) : value;
       try {
           await apiRequest('/settings', 'POST', newSettings);
           setSettings(newSettings);
       } catch (error: any) {
           toast({ variant: 'destructive', title: 'فشل حفظ الإعدادات', description: error.message });
       }
    };
    
    // This scopedData now mostly just provides the state and a local setter.
    // The responsibility of calling the API is moved to the components themselves
    // to make the system more modular.
    const scopedData: ScopedDataContextType = {
        inventory: [inventory, createSetter(setInventory)],
        sales: [sales, createSetter(setSales)],
        suppliers: [suppliers, createSetter(setSuppliers)],
        patients: [patients, createSetter(setPatients)],
        trash: [trash, createSetter(setTrash)],
        payments: [payments, createSetter(setPayments)],
        purchaseOrders: [purchaseOrders, createSetter(setPurchaseOrders)],
        supplierReturns: [supplierReturns, createSetter(setSupplierReturns)],
        timeLogs: [timeLogs, createSetter(setTimeLogs)],
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
