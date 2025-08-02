
"use client";

import * as React from 'react';
import type { User, UserPermissions, TimeLog, AppSettings, Medication, Sale, Supplier, Patient, TrashItem, SupplierPayment, PurchaseOrder, ReturnOrder, Advertisement } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { 
    getAllUsers, 
    setUser, 
    getPharmacySubCollection, 
    setPharmacySubCollectionDoc,
    getPharmacyDoc,
    setPharmacyDoc,
    deletePharmacyData,
    getUserById,
    checkSuperAdminExists,
    getCollectionData,
    setDocumentInCollection,
    deleteDocumentFromCollection
} from './use-firestore';
import { auth, firebaseConfig } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser, getAuth } from 'firebase/auth';
import { deleteApp, getApps, initializeApp } from 'firebase/app';
import { toast } from './use-toast';

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
  
  // Ad management
  advertisements: Advertisement[];
  addAdvertisement: (title: string, imageUrl: string) => Promise<void>;
  updateAdvertisement: (adId: string, data: Partial<Omit<Advertisement, 'id' | 'createdAt'>>) => Promise<void>;
  deleteAdvertisement: (adId: string) => Promise<void>;

  scopedData: ScopedDataContextType;

}

export interface ScopedDataContextType {
    inventory: [Medication[], (value: Medication[] | ((val: Medication[]) => Medication[])) => void];
    sales: [Sale[], (value: Sale[] | ((val: Sale[]) => Sale[])) => void];
    suppliers: [Supplier[], (value: Supplier[] | ((val: Supplier[]) => Supplier[])) => void];
    patients: [Patient[], (value: Patient[] | ((val: Patient[]) => Patient[])) => void];
    trash: [TrashItem[], (value: TrashItem[] | ((val: TrashItem[]) => TrashItem[])) => void];
    payments: [SupplierPayment[], (value: SupplierPayment[] | ((val: SupplierPayment[]) => Supplier[])) => void];
    purchaseOrders: [PurchaseOrder[], (value: PurchaseOrder[] | ((val: PurchaseOrder[]) => PurchaseOrder[])) => void];
    supplierReturns: [ReturnOrder[], (value: ReturnOrder[] | ((val: ReturnOrder[]) => ReturnOrder[])) => void];
    timeLogs: [TimeLog[], (value: TimeLog[] | ((val: TimeLog[]) => TimeLog[])) => void];
    settings: [AppSettings, (value: AppSettings | ((val: AppSettings) => AppSettings)) => void];
}

const AuthContext = React.createContext<AuthContextType | null>(null);

const defaultEmployeePermissions: UserPermissions = {
    sales: true, inventory: true, purchases: false, suppliers: false, reports: false, itemMovement: true, patients: true, expiringSoon: true, guide: true, settings: false, trash: false,
};

const adminPermissions: UserPermissions = {
    sales: true, inventory: true, purchases: true, suppliers: true, reports: true, itemMovement: true, patients: true, expiringSoon: true, guide: true, settings: true, trash: true,
};

const fallbackAppSettings: AppSettings = {
    pharmacyName: "صيدلية جديدة",
    pharmacyAddress: "",
    pharmacyPhone: "",
    pharmacyEmail: "",
    expirationThresholdDays: 90,
    invoiceFooterMessage: "شكرًا لزيارتكم!",
}

const emptyDataSetter = () => { console.warn("Attempted to set data without a valid pharmacy context."); };

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [users, setUsers] = React.useState<User[]>([]);
    const [currentUser, setCurrentUser] = React.useState<User | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [isSetup, setIsSetup] = React.useState(true);
    const [activeTimeLogId, setActiveTimeLogId] = React.useState<string | null>(null);
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

    const pharmacyId = currentUser?.pharmacyId;

    React.useEffect(() => {
        const checkSetup = async () => {
            try {
                const superAdminExists = await checkSuperAdminExists();
                setIsSetup(superAdminExists);
            } catch (error) {
                console.error("Error checking setup:", error);
                setIsSetup(true);
            }
        };
        checkSetup();
    }, []);

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const userDoc = await getUserById(firebaseUser.uid);
                    if (userDoc && userDoc.status === 'active') {
                        setCurrentUser(userDoc);
                        const allUsers = await getAllUsers();
                        setUsers(allUsers);
                    } else {
                        await signOut(auth);
                        setCurrentUser(null);
                        setUsers([]);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    await signOut(auth);
                    setCurrentUser(null);
                    setUsers([]);
                }
            } else {
                setCurrentUser(null);
                setUsers([]);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    
    // Global data fetching (for all users)
    React.useEffect(() => {
        const fetchGlobalData = async () => {
             const ads = await getCollectionData<Advertisement>('advertisements');
             setAdvertisements(ads.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        };

        if (currentUser) {
            fetchGlobalData();
        }
    }, [currentUser]);

    React.useEffect(() => {
        const fetchPharmacyData = async () => {
            if (pharmacyId && currentUser) {
                try {
                    setInventory(await getPharmacySubCollection<Medication>(pharmacyId, 'inventory'));
                    setSales(await getPharmacySubCollection<Sale>(pharmacyId, 'sales'));
                    setSuppliers(await getPharmacySubCollection<Supplier>(pharmacyId, 'suppliers'));
                    setPatients(await getPharmacySubCollection<Patient>(pharmacyId, 'patients'));
                    setTrash(await getPharmacySubCollection<TrashItem>(pharmacyId, 'trash'));
                    setPayments(await getPharmacySubCollection<SupplierPayment>(pharmacyId, 'payments'));
                    setPurchaseOrders(await getPharmacySubCollection<PurchaseOrder>(pharmacyId, 'purchaseOrders'));
                    setSupplierReturns(await getPharmacySubCollection<ReturnOrder>(pharmacyId, 'supplierReturns'));
                    setTimeLogs(await getPharmacySubCollection<TimeLog>(pharmacyId, 'timeLogs'));
                    const pharmSettings = await getPharmacyDoc<AppSettings>(pharmacyId, 'config', 'main');
                    setSettings(pharmSettings || fallbackAppSettings);
                } catch (error) {
                    console.error("Error fetching pharmacy data:", error);
                }
            } else {
                setInventory([]); setSales([]); setSuppliers([]); setPatients([]);
                setTrash([]); setPayments([]); setPurchaseOrders([]);
                setSupplierReturns([]); setTimeLogs([]); setSettings(fallbackAppSettings);
            }
        };
        
        if (currentUser) {
            fetchPharmacyData();
        }
    }, [currentUser, pharmacyId]);

    const createSetter = <T extends { id: string }>(
        state: T[],
        setter: React.Dispatch<React.SetStateAction<T[]>>,
        collectionName: string
    ) => async (value: T[] | ((val: T[]) => T[])) => {
        if (pharmacyId && currentUser) {
            const newValue = typeof value === 'function' ? value(state) : value;
            try {
                for (const item of newValue) {
                    const cleanItem = { ...item };
                    Object.keys(cleanItem).forEach(key => {
                        if ((cleanItem as any)[key] === undefined) {
                            (cleanItem as any)[key] = null;
                        }
                    });
                    
                    await setPharmacySubCollectionDoc(pharmacyId, collectionName, item.id, cleanItem);
                }
                setter(newValue);
            } catch (error) {
                console.error(`Error updating ${collectionName}:`, error);
            }
        }
    };
    
    const setScopedSettings = async (value: AppSettings | ((val: AppSettings) => AppSettings)) => {
        if (pharmacyId && currentUser) {
            try {
                const newSettings = typeof value === 'function' ? value(settings) : value;
                await setPharmacyDoc(pharmacyId, 'config', 'main', newSettings);
                setSettings(newSettings);
            } catch (error) {
                console.error("Error updating settings:", error);
            }
        }
    };

    const scopedData: ScopedDataContextType = {
        inventory: [inventory, createSetter(inventory, setInventory, 'inventory')],
        sales: [sales, createSetter(sales, setSales, 'sales')],
        suppliers: [suppliers, createSetter(suppliers, setSuppliers, 'suppliers')],
        patients: [patients, createSetter(patients, setPatients, 'patients')],
        trash: [trash, createSetter(trash, setTrash, 'trash')],
        payments: [payments, createSetter(payments, setPayments, 'payments')],
        purchaseOrders: [purchaseOrders, createSetter(purchaseOrders, setPurchaseOrders, 'purchaseOrders')],
        supplierReturns: [supplierReturns, createSetter(supplierReturns, setSupplierReturns, 'supplierReturns')],
        timeLogs: [timeLogs, createSetter(timeLogs, setTimeLogs, 'timeLogs')],
        settings: [settings, setScopedSettings],
    };

    const setupAdmin = async (name: string, email: string, pin: string) => {
        if (isSetup) return false;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
            const superAdmin: User = {
                id: userCredential.user.uid, name, email, pin,
                role: 'SuperAdmin', status: 'active',
                createdAt: new Date().toISOString(),
            };
            await setUser(userCredential.user.uid, superAdmin, false);
            setUsers([superAdmin]);
            setIsSetup(true);
            return true;
        } catch (error) {
            console.error("Error setting up super admin:", error);
            return false;
        }
    };

    const getAllPharmacySettings = async (): Promise<Record<string, AppSettings>> => {
        if (!currentUser || currentUser.role !== 'SuperAdmin') return {};
        const pharmacySettings: Record<string, AppSettings> = {};
        const adminUsers = users.filter(u => u.role === 'Admin' && u.pharmacyId);
        
        for (const admin of adminUsers) {
            if (admin.pharmacyId) {
                try {
                    const settings = await getPharmacyDoc<AppSettings>(admin.pharmacyId, 'config', 'main');
                    pharmacySettings[admin.pharmacyId] = settings || { ...fallbackAppSettings, pharmacyName: `${admin.name}'s Pharmacy`, pharmacyEmail: admin.email || "" };
                } catch (error) {
                    console.error(`Error fetching settings for pharmacy ${admin.pharmacyId}:`, error);
                    pharmacySettings[admin.pharmacyId] = { ...fallbackAppSettings, pharmacyName: `${admin.name}'s Pharmacy`, pharmacyEmail: admin.email || "" };
                }
            }
        }
        return pharmacySettings;
    };

    const getPharmacyData = async (pharmacyId: string) => {
        if (!currentUser || currentUser.role !== 'SuperAdmin') throw new Error('Only SuperAdmin can access pharmacy data');
        try {
            const [sales, inventory] = await Promise.all([
                getPharmacySubCollection<Sale>(pharmacyId, 'sales'),
                getPharmacySubCollection<Medication>(pharmacyId, 'inventory')
            ]);
            return { sales, inventory };
        } catch (error) {
            console.error(`Error fetching data for pharmacy ${pharmacyId}:`, error);
            return { sales: [], inventory: [] };
        }
    };

    const createPharmacyAdmin = async (name: string, email: string, pin: string): Promise<boolean> => {
        if (!currentUser || currentUser.role !== 'SuperAdmin') return false;
        if (users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase())) return false;
        const tempAppName = 'temp-user-creation-app';
        let tempApp;
        try {
            tempApp = getApps().find(app => app.name === tempAppName) || initializeApp(firebaseConfig, tempAppName);
            const tempAuth = getAuth(tempApp);
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, pin);
            await deleteApp(tempApp);
            const pharmacyId = `PHARM_${userCredential.user.uid}`;
            const newAdmin: User = {
                id: userCredential.user.uid, pharmacyId, name, email, pin,
                role: 'Admin', status: 'active',
                permissions: adminPermissions, createdAt: new Date().toISOString(), hourlyRate: 0,
            };
            await setUser(userCredential.user.uid, newAdmin, true);
            await setPharmacyDoc(pharmacyId, 'config', 'main', {...fallbackAppSettings, pharmacyName: `${name}'s Pharmacy`, pharmacyEmail: email});
            setUsers(prev => [...prev, newAdmin]);
            return true;
        } catch (error) {
            console.error("Error creating pharmacy admin:", error);
            if (tempApp) await deleteApp(tempApp);
            return false;
        }
    };

    const registerUser = async (name: string, email: string, pin: string): Promise<boolean> => {
        if (!currentUser || currentUser.role !== 'Admin' || !currentUser.pharmacyId) return false;
        if (users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase())) return false;
        const tempAppName = 'temp-user-creation-app';
        let tempApp;
        try {
            tempApp = getApps().find(app => app.name === tempAppName) || initializeApp(firebaseConfig, tempAppName);
            const tempAuth = getAuth(tempApp);
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, pin);
            await deleteApp(tempApp);
            const newUser: User = {
                id: userCredential.user.uid, pharmacyId: currentUser.pharmacyId, name, email, pin,
                role: 'Employee', status: 'active', permissions: defaultEmployeePermissions,
                createdAt: new Date().toISOString(), hourlyRate: 0,
            };
            await setUser(userCredential.user.uid, newUser, true);
            setUsers(prev => [...prev, newUser]);
            return true;
        } catch (error) {
            console.error("Error registering user:", error);
            if (tempApp) await deleteApp(tempApp);
            return false;
        }
    }

    const login = async (email: string, pin: string): Promise<User | null> => {
        try {
            await signInWithEmailAndPassword(auth, email, pin);
            return null;
        } catch(error) {
            toast({ variant: "destructive", title: "فشل تسجيل الدخول", description: "يرجى التحقق من البريد الإلكتروني أو الرقم السري." });
            return null;
        }
    };

    const logout = async () => {
        await signOut(auth);
        setCurrentUser(null);
        setUsers([]);
        router.push('/');
    };
  
    const deleteUser = async (userId: string, permanent: boolean = false): Promise<boolean> => {
        if (!currentUser || (currentUser.role !== 'SuperAdmin' && currentUser.role !== 'Admin')) return false;
        
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return false;

        if (currentUser.role === 'Admin' && userToDelete.pharmacyId !== currentUser.pharmacyId) return false;

        if (permanent && currentUser.role === 'SuperAdmin') {
            if (userToDelete.pharmacyId) {
                await deletePharmacyData(userToDelete.pharmacyId);
            }
            // Also delete all employees of that pharmacy from the users state
            const employeesToDelete = users.filter(u => u.pharmacyId === userToDelete.pharmacyId);
            const employeeIdsToDelete = employeesToDelete.map(e => e.id);
            // This part is tricky as we can't easily delete the auth credentials without re-auth
            // For now, we just remove them from the 'users' collection
            for (const id of employeeIdsToDelete) {
                 await deleteDocumentFromCollection('users', id);
            }
            setUsers(prev => prev.filter(u => u.pharmacyId !== userToDelete.pharmacyId));
        }
        await toggleUserStatus(userToDelete.id, true);
        return true;
    };
    
    const updateUser = async (userId: string, name: string, email: string, pin?: string): Promise<boolean> => {
        if (!currentUser) return false;
        const userToUpdate = users.find(u => u.id === userId);
        if(!userToUpdate) return false;
        const canUpdate = currentUser.id === userId || (currentUser.role === 'Admin' && userToUpdate.pharmacyId === currentUser.pharmacyId) || currentUser.role === 'SuperAdmin';
        if (!canUpdate) return false;
        try {
            const updatedUser = { ...userToUpdate, name, email, pin: pin || userToUpdate.pin };
            await setUser(userId, updatedUser, true);
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            if (currentUser?.id === userId) setCurrentUser(updatedUser);
            return true;
        } catch (error) {
            console.error("Error updating user:", error);
            return false;
        }
    };

    const updateUserPermissions = async (userId: string, permissions: UserPermissions): Promise<boolean> => {
        if (!currentUser) return false;
        const userToUpdate = users.find(u => u.id === userId);
        if(!userToUpdate) return false;
        const canUpdate = (currentUser.role === 'Admin' && userToUpdate.pharmacyId === currentUser.pharmacyId) || currentUser.role === 'SuperAdmin';
        if (!canUpdate) return false;
        try {
            const updatedUser = { ...userToUpdate, permissions };
            await setUser(userId, updatedUser, true);
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            return true;
        } catch (error) {
            console.error("Error updating user permissions:", error);
            return false;
        }
    };

    const updateUserHourlyRate = async (userId: string, rate: number): Promise<boolean> => {
        if (!currentUser) return false;
        const userToUpdate = users.find(u => u.id === userId);
        if(!userToUpdate) return false;
        const canUpdate = (currentUser.role === 'Admin' && userToUpdate.pharmacyId === currentUser.pharmacyId) || currentUser.role === 'SuperAdmin';
        if (!canUpdate) return false;
        try {
            const updatedUser = { ...userToUpdate, hourlyRate: rate };
            await setUser(userId, updatedUser, true);
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            if (currentUser?.id === userId) setCurrentUser(updatedUser);
            return true;
        } catch (error) {
            console.error("Error updating user hourly rate:", error);
            return false;
        }
    };

    const toggleUserStatus = async (userId: string, isDeletion: boolean = false): Promise<boolean> => {
        if (!currentUser) return false;
        const userToUpdate = users.find(u => u.id === userId);
        if (!userToUpdate) return false;
        
        const canUpdate = (currentUser.role === 'Admin' && userToUpdate.pharmacyId === currentUser.pharmacyId) || currentUser.role === 'SuperAdmin';
        if (!canUpdate) return false;

        try {
            const newStatus: "active" | "suspended" = isDeletion ? 'suspended' : (userToUpdate.status === 'active' ? 'suspended' : 'active');
            
            const usersToUpdate = [userToUpdate];
            // If the user is an Admin, cascade the status change to their employees
            if (userToUpdate.role === 'Admin' && userToUpdate.pharmacyId) {
                const employees = users.filter(u => u.pharmacyId === userToUpdate.pharmacyId && u.role === 'Employee');
                usersToUpdate.push(...employees);
            }

            const updatedUsersList = [...users];

            for (const user of usersToUpdate) {
                const updatedUser = { ...user, status: newStatus };
                await setUser(user.id, updatedUser, true);
                const userIndex = updatedUsersList.findIndex(u => u.id === user.id);
                if(userIndex > -1) {
                    updatedUsersList[userIndex] = updatedUser;
                }
            }
            
            setUsers(updatedUsersList);
            return true;
        } catch (error) {
            console.error("Error toggling user status:", error);
            return false;
        }
    }
    
    // Ad Management functions
    const addAdvertisement = async (title: string, imageUrl: string) => {
        if (!currentUser || currentUser.role !== 'SuperAdmin') {
            toast({ variant: 'destructive', title: 'غير مصرح به' });
            return;
        }
        const adId = `AD_${Date.now()}`;
        const newAd: Advertisement = {
            id: adId,
            title,
            imageUrl,
            isActive: true,
            createdAt: new Date().toISOString(),
            showOn: {
                dashboard: true,
                sales: true,
                reports: true,
            }
        };
        await setDocumentInCollection<Advertisement>('advertisements', adId, newAd);
        setAdvertisements(prev => [newAd, ...prev]);
        toast({ title: 'تمت إضافة الإعلان بنجاح' });
    };

    const updateAdvertisement = async (adId: string, data: Partial<Omit<Advertisement, 'id' | 'createdAt'>>) => {
        if (!currentUser || currentUser.role !== 'SuperAdmin') {
            toast({ variant: 'destructive', title: 'غير مصرح به' });
            return;
        }
        const existingAd = advertisements.find(ad => ad.id === adId);
        if (!existingAd) return;

        const updatedAd = { ...existingAd, ...data };
        await setDocumentInCollection<Advertisement>('advertisements', adId, updatedAd);
        setAdvertisements(prev => prev.map(ad => ad.id === adId ? updatedAd : ad));
    };

    const deleteAdvertisement = async (adId: string) => {
        if (!currentUser || currentUser.role !== 'SuperAdmin') {
            toast({ variant: 'destructive', title: 'غير مصرح به' });
            return;
        }
        await deleteDocumentFromCollection('advertisements', adId);
        setAdvertisements(prev => prev.filter(ad => ad.id !== adId));
        toast({ title: 'تم حذف الإعلان' });
    };


    const isAuthenticated = !!currentUser;

    return (
        <AuthContext.Provider value={{ 
            currentUser, users, setUsers, isAuthenticated, loading, isSetup, 
            setupAdmin, login, logout, registerUser, deleteUser, updateUser, 
            updateUserPermissions, updateUserHourlyRate, createPharmacyAdmin, toggleUserStatus, scopedData,
            getAllPharmacySettings, getPharmacyData,
            advertisements, addAdvertisement, updateAdvertisement, deleteAdvertisement
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
