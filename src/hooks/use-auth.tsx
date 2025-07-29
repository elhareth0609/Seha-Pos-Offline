
"use client";

import * as React from 'react';
import type { User, UserPermissions, TimeLog, AppSettings, Medication, Sale, Supplier, Patient, TrashItem, SupplierPayment, PurchaseOrder, ReturnOrder } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { 
    getAllUsers, 
    setUser, 
    getPharmacySubCollection, 
    setPharmacySubCollectionDoc,
    deletePharmacySubCollection,
    getPharmacyDoc,
    setPharmacyDoc,
    deletePharmacyData
} from './use-firestore';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  isAuthenticated: boolean;
  isSetup: boolean;
  loading: boolean;
  setupAdmin: (name: string, email: string, pin: string) => Promise<boolean>;
  createPharmacyAdmin: (name: string, email: string, pin: string) => Promise<boolean>;
  login: (email: string, pin: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (name: string, email: string, pin: string) => Promise<boolean>;
  deleteUser: (userId: string, permanent?: boolean) => Promise<boolean>;
  updateUser: (userId: string, name: string, email: string, pin?: string) => Promise<boolean>;
  updateUserPermissions: (userId: string, permissions: UserPermissions) => Promise<boolean>;
  updateUserHourlyRate: (userId: string, rate: number) => Promise<boolean>;
  toggleUserStatus: (userId: string) => Promise<boolean>;
  scopedData: ScopedDataContextType;
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
    const [isSetup, setIsSetup] = React.useState(false);
    const [activeTimeLogId, setActiveTimeLogId] = React.useState<string | null>(null);
    const router = useRouter();

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

    const pharmacyId = currentUser?.pharmacyId;

    // Effect for fetching all users and checking setup status
    React.useEffect(() => {
        const fetchAllUsers = async () => {
            const allUsers = await getAllUsers();
            setUsers(allUsers);
            const superAdminExists = allUsers.some(u => u.role === 'SuperAdmin');
            setIsSetup(superAdminExists);
            setLoading(false);
        };
        fetchAllUsers();
    }, []);

    // Effect for handling auth state changes from Firebase
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const userDoc = users.find(u => u.id === firebaseUser.uid);
                if (userDoc) {
                    setCurrentUser(userDoc);
                }
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [users]);
    
    // Effect for fetching pharmacy-specific data when user changes
    React.useEffect(() => {
        const fetchPharmacyData = async () => {
            if (pharmacyId) {
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
            } else {
                // Reset data if no pharmacyId
                setInventory([]);
                setSales([]);
                setSuppliers([]);
                setPatients([]);
                setTrash([]);
                setPayments([]);
                setPurchaseOrders([]);
                setSupplierReturns([]);
                setTimeLogs([]);
                setSettings(fallbackAppSettings);
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
        if (pharmacyId) {
            const newValue = typeof value === 'function' ? value(state) : value;
            // This is a simplified update. A more robust solution would diff arrays.
            for (const item of newValue) {
                await setPharmacySubCollectionDoc(pharmacyId, collectionName, item.id, item);
            }
            setter(newValue);
        }
    };
    
    const setScopedSettings = async (value: AppSettings | ((val: AppSettings) => AppSettings)) => {
        if (pharmacyId) {
            const newSettings = typeof value === 'function' ? value(settings) : value;
            await setPharmacyDoc(pharmacyId, 'config', 'main', newSettings);
            setSettings(newSettings);
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
                id: userCredential.user.uid,
                name: name,
                email: email,
                role: 'SuperAdmin',
                status: 'active',
                pin: pin,
                createdAt: new Date().toISOString(),
            };
            await setUser(userCredential.user.uid, superAdmin);
            setUsers([superAdmin]);
            setIsSetup(true);
            return true;
        } catch (error) {
            console.error("Error setting up super admin:", error);
            return false;
        }
    };
  
    const createPharmacyAdmin = async (name: string, email: string, pin: string): Promise<boolean> => {
        const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (userExists) return false;

        try {
            // We can't sign in as this new user, so we just create them in our system.
            // The SuperAdmin shouldn't need to create a firebase auth user directly.
            // The Admin will be created on their first login. For now, we store their details.
            // This part of logic may need refinement based on user flow.
            // For now, let's assume SuperAdmin pre-creates user data, and user signs up later.
            const pharmacyId = `PHARM_${Date.now()}`;
            const adminId = `ADMIN_${pharmacyId}`; // Placeholder ID
            const newAdmin: User = {
                id: adminId,
                pharmacyId: pharmacyId,
                name, email, pin,
                role: 'Admin',
                status: 'active',
                permissions: adminPermissions,
                createdAt: new Date().toISOString(),
                hourlyRate: 0,
            };
            await setUser(adminId, newAdmin);
            setUsers(prev => [...prev, newAdmin]);
            await setPharmacyDoc(pharmacyId, 'config', 'main', {...fallbackAppSettings, pharmacyName: `${name}'s Pharmacy`, pharmacyEmail: email});
            return true;
        } catch (error) {
            console.error("Error creating pharmacy admin:", error);
            return false;
        }
    };

    const registerUser = async (name: string, email: string, pin: string): Promise<boolean> => {
        const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (userExists) return false;
        if (!currentUser || !currentUser.pharmacyId) return false;
        
        // This flow should be initiated by an admin, not a public signup page.
        // We'll just add the user doc. The user won't be able to login until an auth account is created.
        // This is a limitation of not being able to create users from the client without auth.
        // A backend function would be ideal here.
        
        try {
             const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
             const newUser: User = {
                id: userCredential.user.uid,
                pharmacyId: currentUser.pharmacyId,
                name, email, pin,
                role: 'Employee',
                status: 'active',
                permissions: defaultEmployeePermissions,
                createdAt: new Date().toISOString(),
                hourlyRate: 0,
            };
            await setUser(userCredential.user.uid, newUser);
            setUsers(prev => [...prev, newUser]);
            return true;
        } catch (error) {
            console.error("Error registering user:", error);
            return false;
        }
    }
  
    const login = async (email: string, pin: string): Promise<boolean> => {
        try {
            const userDoc = users.find(u => u.email === email && u.pin === pin);
            if (!userDoc || userDoc.status !== 'active') return false;

            await signInWithEmailAndPassword(auth, email, pin);
            
            // onAuthStateChanged will handle setting the current user
            
            if (userDoc.role !== 'SuperAdmin' && userDoc.pharmacyId) {
                const newTimeLog: TimeLog = {
                    id: `TL${Date.now()}`,
                    userId: userDoc.id,
                    pharmacyId: userDoc.pharmacyId,
                    clockIn: new Date().toISOString(),
                };
                await setPharmacySubCollectionDoc(userDoc.pharmacyId, 'timeLogs', newTimeLog.id, newTimeLog);
                setActiveTimeLogId(newTimeLog.id);
            }
            return true;
        } catch(error) {
            console.error("Login error:", error);
            return false;
        }
    };

    const logout = async () => {
        const currentPharmacyId = currentUser?.pharmacyId;
        if (activeTimeLogId && currentPharmacyId) {
            const logDoc = await getPharmacyDoc<TimeLog>(currentPharmacyId, 'timeLogs', activeTimeLogId);
            if (logDoc) {
                const updatedLog = { ...logDoc, clockOut: new Date().toISOString() };
                await setPharmacySubCollectionDoc(currentPharmacyId, 'timeLogs', activeTimeLogId, updatedLog);
            }
            setActiveTimeLogId(null);
        }
        await signOut(auth);
        setCurrentUser(null);
        router.push('/');
    };
  
    const deleteUser = async (userId: string, permanent: boolean = false): Promise<boolean> => {
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return false;
        
        if (permanent && currentUser?.role === 'SuperAdmin' && userToDelete.pharmacyId) {
            await deletePharmacyData(userToDelete.pharmacyId);
            // also need to delete the user from auth and the users collection
            // this requires admin sdk, can't do from client.
        }
        // This function is complex to implement securely on the client.
        // For now, we'll just mark as suspended.
        await toggleUserStatus(userId);
        return true;
    };
    
    const updateUser = async (userId: string, name: string, email: string, pin?: string): Promise<boolean> => {
        const userToUpdate = users.find(u => u.id === userId);
        if(!userToUpdate) return false;

        const updatedUser = {
            ...userToUpdate,
            name,
            email,
            pin: pin || userToUpdate.pin
        };
        await setUser(userId, updatedUser);
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        if (currentUser?.id === userId) {
            setCurrentUser(updatedUser);
        }
        // Updating email/password in Firebase Auth is a privileged operation and requires reauthentication.
        // It's not straightforward to do here.
        return true;
    };

    const updateUserPermissions = async (userId: string, permissions: UserPermissions): Promise<boolean> => {
      const userToUpdate = users.find(u => u.id === userId);
      if(!userToUpdate) return false;
      const updatedUser = { ...userToUpdate, permissions };
      await setUser(userId, updatedUser);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      return true;
    };

    const updateUserHourlyRate = async (userId: string, rate: number): Promise<boolean> => {
      const userToUpdate = users.find(u => u.id === userId);
      if(!userToUpdate) return false;
      const updatedUser = { ...userToUpdate, hourlyRate: rate };
      await setUser(userId, updatedUser);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
       if (currentUser?.id === userId) {
            setCurrentUser(updatedUser);
        }
      return true;
    };

    const toggleUserStatus = async (userId: string): Promise<boolean> => {
       const userToUpdate = users.find(u => u.id === userId);
        if(!userToUpdate) return false;
        const newStatus = userToUpdate.status === 'active' ? 'suspended' : 'active';
        const updatedUser = { ...userToUpdate, status: newStatus };
        await setUser(userId, updatedUser);
        setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
        return true;
    }

    const isAuthenticated = !!currentUser;

    return (
        <AuthContext.Provider value={{ 
            currentUser, users, setUsers, isAuthenticated, loading, isSetup, 
            setupAdmin, login, logout, registerUser, deleteUser, updateUser, 
            updateUserPermissions, updateUserHourlyRate, createPharmacyAdmin, toggleUserStatus, scopedData,
            // These are not implemented for Firestore yet.
            resetPin: async () => false, 
            checkUserExists: async () => false,
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
