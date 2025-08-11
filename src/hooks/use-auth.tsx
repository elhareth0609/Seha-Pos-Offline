
"use client";

import * as React from 'react';
import type { User, UserPermissions, TimeLog, AppSettings, Medication, Sale, Supplier, Patient, TrashItem, SupplierPayment, PurchaseOrder, ReturnOrder, Advertisement, SaleItem } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { toast } from './use-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://midgram-pos.sadeem-labs.com/api';

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
  addAdvertisement: (title: string, image_url: string) => Promise<void>;
  updateAdvertisement: (adId: string, data: Partial<Omit<Advertisement, 'id' | 'created_at'>>) => Promise<void>;
  deleteAdvertisement: (adId: string) => Promise<void>;
  clearPharmacyData: () => Promise<void>;
  
  scopedData: ScopedDataContextType;

  // Inventory Management
  addMedication: (data: Partial<Medication>) => Promise<boolean>;
  updateMedication: (medId: string, data: Partial<Medication>) => Promise<boolean>;
  deleteMedication: (medId: string) => Promise<boolean>;
  bulkAddOrUpdateInventory: (items: Partial<Medication>[]) => Promise<boolean>;

  // Sales
  addSale: (saleData: any) => Promise<Sale | null>;
  
  // Suppliers
  addSupplier: (data: Partial<Supplier>) => Promise<Supplier | null>;
  updateSupplier: (supplier_id: string, data: Partial<Supplier>) => Promise<boolean>;
  deleteSupplier: (supplier_id: string) => Promise<boolean>;

  // Patients
  addPatient: (name: string, phone?: string) => Promise<Patient | null>;
  updatePatient: (patientId: string, data: Partial<Patient>) => Promise<boolean>;
  deletePatient: (patientId: string) => Promise<boolean>;
  
  // Payments
  addPayment: (supplier_id: string, amount: number, notes?: string) => Promise<boolean>;
  
  // Purchases and Returns
  addPurchaseOrder: (data: any) => Promise<boolean>;
  addReturnOrder: (data: any) => Promise<boolean>;
  
  // Trash
  restoreItem: (itemId: string) => Promise<boolean>;
  permDelete: (itemId: string) => Promise<boolean>;
  clearTrash: () => Promise<boolean>;
  
  activeInvoice: ActiveInvoice;
  setActiveInvoice: React.Dispatch<React.SetStateAction<ActiveInvoice>>;
  resetActiveInvoice: () => void;
}

export interface ScopedDataContextType {
    inventory: [Medication[], React.Dispatch<React.SetStateAction<Medication[]>>];
    sales: [Sale[], React.Dispatch<React.SetStateAction<Sale[]>>];
    suppliers: [Supplier[], React.Dispatch<React.SetStateAction<Supplier[]>>];
    patients: [Patient[], React.Dispatch<React.SetStateAction<Patient[]>>];
    trash: [TrashItem[], React.Dispatch<React.SetStateAction<TrashItem[]>>];
    payments: [SupplierPayment[], React.Dispatch<React.SetStateAction<SupplierPayment[]>>];
    purchaseOrders: [PurchaseOrder[], React.Dispatch<React.SetStateAction<PurchaseOrder[]>>];
    supplierReturns: [ReturnOrder[], React.Dispatch<React.SetStateAction<ReturnOrder[]>>];
    timeLogs: [TimeLog[], React.Dispatch<React.SetStateAction<TimeLog[]>>];
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

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (response.status === 204) { // No Content
            return null;
        }

        const responseData = await response.json();
        
        if (!response.ok) {
            const errorMessage = responseData.message || 'An API error occurred';
            throw new Error(errorMessage);
        }

        return responseData.data ?? responseData;
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ في الشبكة', description: error.message });
        throw error;
    }
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
            return false;
        }
    };

    const registerUser = async (name: string, email: string, pin: string) => {
       try {
            const newUser = await apiRequest('/admin/users', 'POST', { name, email, pin });
            setUsers(prev => [...prev, newUser]);
            return true;
        } catch (error: any) {
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
            return false;
        }
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
        } catch (error: any) {
            return false;
        }
    };
    
    const toggleUserStatus = async (userId: string) => {
        try {
            const { status } = await apiRequest(`/users/${userId}/status`, 'PUT');
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
            return true;
        } catch (error: any) {
            return false;
        }
    };
    
    const updateUserPermissions = async (userId: string, permissions: UserPermissions) => {
        try {
            await apiRequest(`/users/${userId}/permissions`, 'PUT', { permissions });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions } : u));
            toast({ title: "تم تحديث الصلاحيات بنجاح" });
            return true;
        } catch (error: any) {
            return false;
        }
    };
    
    const updateUserHourlyRate = async (userId: string, rate: number) => {
        try {
            await apiRequest(`/users/${userId}/hourly-rate`, 'PUT', { hourly_rate: rate });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, hourly_rate: rate } : u));
            toast({ title: "تم تحديث سعر الساعة" });
            return true;
        } catch (error: any) {
            return false;
        }
    };
    
    const getAllPharmacySettings = async (): Promise<Record<string, AppSettings>> => {
        try {
            return await apiRequest('/superadmin/pharmacies/settings');
        } catch(e: any) {
            return {};
        }
    };

    const getPharmacyData = async (pharmacyId: string) => {
         try {
            return await apiRequest(`/superadmin/pharmacies/${pharmacyId}`);
        } catch(e: any) {
            return { sales: [], inventory: [] };
        }
    };
    
    const clearPharmacyData = async () => {
        try {
            await apiRequest('/settings/clear-data', 'DELETE');
            toast({ title: "تم مسح البيانات بنجاح" });
            logout();
        } catch (e: any) {
            // Error already handled by apiRequest
        }
    };


    const addAdvertisement = async (title: string, image_url: string) => {
         try {
            const newAd = await apiRequest('/advertisements', 'POST', { title, image_url });
            setAdvertisements(prev => [...prev, newAd]);
        } catch(e: any) {
             // Error already handled by apiRequest
        }
    };

    const updateAdvertisement = async (adId: string, data: Partial<Omit<Advertisement, 'id' | 'created_at'>>) => {
        try {
            const updatedAd = await apiRequest(`/advertisements/${adId}`, 'PUT', data);
            setAdvertisements(prev => prev.map(ad => ad.id === adId ? updatedAd : ad));
        } catch(e: any) {
             // Error already handled by apiRequest
        }
    };

    const deleteAdvertisement = async (adId: string) => {
        try {
            await apiRequest(`/advertisements/${adId}`, 'DELETE');
            setAdvertisements(prev => prev.filter(ad => ad.id !== adId));
        } catch(e: any) {
            // Error already handled by apiRequest
        }
    };

    // --- Scoped Data Functions ---
    const addMedication = async (data: Partial<Medication>) => {
        try {
            const newMed = await apiRequest('/medications', 'POST', data);
            setInventory(prev => [...prev, newMed]);
            return true;
        } catch (e) { return false; }
    }
    const updateMedication = async (medId: string, data: Partial<Medication>) => {
        try {
            const updatedMed = await apiRequest(`/medications/${medId}`, 'PUT', data);
            setInventory(prev => prev.map(m => m.id === medId ? updatedMed : m));
            toast({ title: "تم تحديث الدواء بنجاح" });
            return true;
        } catch (e) { return false; }
    }
    
    const deleteMedication = async (medId: string) => {
        try {
            const trashedItem = await apiRequest(`/medications/${medId}`, 'DELETE');
            setInventory(prev => prev.filter(m => m.id !== medId));
            setTrash(prev => [...prev, trashedItem]);
            toast({ title: "تم نقل الدواء إلى سلة المحذوفات" });
            return true;
        } catch (e) { return false; }
    }
    
    const bulkAddOrUpdateInventory = async (items: Partial<Medication>[]) => {
        try {
            const { updated_inventory, new_count, updated_count } = await apiRequest('/medications/bulk', 'POST', { items });
            setInventory(updated_inventory);
            toast({ title: "اكتمل الاستيراد", description: `تمت إضافة ${new_count} أصناف جديدة وتحديث ${updated_count} أصناف.` });
            return true;
        } catch (e) { return false; }
    }

    const addSale = async (saleData: any) => {
        try {
            const newSale = await apiRequest('/sales', 'POST', saleData);
            setSales(prev => [newSale, ...prev]);
            // Update inventory state based on the sale
            const updatedInventory = [...inventory];
            newSale.items.forEach((item: SaleItem) => {
                const medIndex = updatedInventory.findIndex(m => m.id === item.id);
                // const medIndex = updatedInventory.findIndex(m => m.id === item.medication_id);
                if (medIndex !== -1) {
                    updatedInventory[medIndex].stock += (item.is_return ? item.quantity : -item.quantity);
                }
            });
            setInventory(updatedInventory);
            return newSale;
        } catch (e) { 
            return null; 
        }
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
            const newPayment = await apiRequest('/payments', 'POST', { supplier_id: supplier_id, amount, notes });
            setPayments(prev => [...prev, newPayment]);
            toast({ title: `تم تسجيل دفعة بمبلغ ${amount.toLocaleString()}` });
            return true;
        } catch (e) { return false; }
    }

    const addPurchaseOrder = async (data: any) => {
        try {
            const { purchase_order, updated_inventory } = await apiRequest('/purchase-orders', 'POST', data);
            setPurchaseOrders(prev => [purchase_order, ...prev]);
            setInventory(updated_inventory); // The backend returns the whole updated inventory
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

    const restoreItem = async (itemId: string) => {
        try {
            const { restored_item, item_type } = await apiRequest(`/trash/${itemId}`, 'PUT');
            setTrash(prev => prev.filter(t => t.id !== itemId));
            // Add the restored item back to its respective list
            switch(item_type) {
                case 'medication': setInventory(prev => [restored_item, ...prev]); break;
                case 'patient': setPatients(prev => [restored_item, ...prev]); break;
                case 'supplier': setSuppliers(prev => [restored_item, ...prev]); break;
                case 'user': setUsers(prev => [restored_item, ...prev]); break;
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

    const setScopedSettings = async (value: AppSettings | ((val: AppSettings) => AppSettings)) => {
       const newSettings = typeof value === 'function' ? value(settings) : value;
       try {
           const updatedSettings = await apiRequest('/settings', 'POST', newSettings);
           setSettings(updatedSettings);
           toast({ title: "تم حفظ الإعدادات" });
       } catch (error: any) {
           // Error handled by apiRequest
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
    };

    const isAuthenticated = !!currentUser;

    return (
        <AuthContext.Provider value={{ 
            currentUser, users, setUsers, isAuthenticated, loading, isSetup, 
            setupAdmin, login, logout, registerUser, deleteUser, updateUser, 
            updateUserPermissions, updateUserHourlyRate, createPharmacyAdmin, toggleUserStatus, scopedData,
            getAllPharmacySettings, getPharmacyData, clearPharmacyData,
            advertisements, addAdvertisement, updateAdvertisement, deleteAdvertisement,
            addMedication, updateMedication, deleteMedication, bulkAddOrUpdateInventory,
            addSale,
            addSupplier, updateSupplier, deleteSupplier,
            addPatient, updatePatient, deletePatient,
            addPayment,
            addPurchaseOrder,
            addReturnOrder,
            restoreItem, permDelete, clearTrash,
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

    
