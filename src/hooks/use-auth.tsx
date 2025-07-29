"use client";

import * as React from 'react';
import type { User, UserPermissions, TimeLog, AppSettings, Medication, Sale, Supplier, Patient, TrashItem, SupplierPayment, PurchaseOrder, ReturnOrder } from '@/lib/types';
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
    checkSuperAdminExists
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
  scopedData: ScopedDataContextType;
  getAllPharmacySettings: () => Promise<Record<string, AppSettings>>;

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
    const [isSetup, setIsSetup] = React.useState(true);
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

    // Check if system is setup (only check for SuperAdmin existence, no user data)
    React.useEffect(() => {
        const checkSetup = async () => {
            try {
                const superAdminExists = await checkSuperAdminExists();
                setIsSetup(superAdminExists);
            } catch (error) {
                console.error("Error checking setup:", error);
                setIsSetup(false);
            }
        };
        checkSetup();
    }, []); // This runs independently and might complete AFTER setLoading(false) in the other effect.


    // Authentication state listener - only gets user data AFTER authentication
    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Only get user data after Firebase authentication
                    const userDoc = await getUserById(firebaseUser.uid);
                    if (userDoc && userDoc.status === 'active') {
                        setCurrentUser(userDoc);
                        
                        // Only fetch all users if current user is SuperAdmin or Admin
                        if (userDoc.role === 'SuperAdmin' || userDoc.role === 'Admin') {
                            const allUsers = await getAllUsers();
                            setUsers(allUsers);
                        } else {
                            // Regular employees only see themselves and other users in their pharmacy
                            const pharmacyUsers = await getAllUsers(); // This will be filtered by Firebase rules
                            setUsers(pharmacyUsers.filter(u => u.pharmacyId === userDoc.pharmacyId));
                        }
                    } else {
                        // User exists in Auth but not in Firestore or is suspended
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
    
    // Fetch pharmacy data only after authentication
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
                    console.log(pharmSettings)
                    setSettings(pharmSettings || fallbackAppSettings);
                } catch (error) {
                    console.error("Error fetching pharmacy data:", error);
                }
            } else {
                // Reset data if no pharmacyId (e.g., for SuperAdmin) or not authenticated
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
        if (pharmacyId && currentUser) {
            const newValue = typeof value === 'function' ? value(state) : value;
            try {
                for (const item of newValue) {
                    // 清理每个项目的 undefined 值
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
                console.log("Settings updated successfully:", newSettings);
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
                id: userCredential.user.uid,
                name: name,
                email: email,
                role: 'SuperAdmin',
                status: 'active',
                pin: pin,
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
  
    // const createPharmacyAdmin = async (name: string, email: string, pin: string): Promise<boolean> => {
    //     // Only SuperAdmin can create pharmacy admins
    //     if (!currentUser || currentUser.role !== 'SuperAdmin') return false;
        
    //     const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    //     if (userExists) return false;

    //     try {
    //         const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
    //         const pharmacyId = `PHARM_${userCredential.user.uid}`;
    //         const newAdmin: User = {
    //             id: userCredential.user.uid,
    //             pharmacyId: pharmacyId,
    //             name, email, pin,
    //             role: 'Admin',
    //             status: 'active',
    //             permissions: adminPermissions,
    //             createdAt: new Date().toISOString(),
    //             hourlyRate: 0,
    //         };
    //         await setUser(userCredential.user.uid, newAdmin, true);
    //         setUsers(prev => [...prev, newAdmin]);
    //         await setPharmacyDoc(pharmacyId, 'config', 'main', {...fallbackAppSettings, pharmacyName: `${name}'s Pharmacy`, pharmacyEmail: email});
    //                 // Sign out delegate and sign back in as admin
    //         if (!currentUser.email || !currentUser.pin) {
    //             throw new Error("Email or PIN is missing");
    //         }
    //         await signOut(auth);
    //         await signInWithEmailAndPassword(auth, currentUser.email, currentUser.pin);

    //         return true;
    //     } catch (error) {
    //         console.error("Error creating pharmacy admin:", error);
    //         return false;
    //     }
    // };

    // 在 use-auth.tsx 中添加新的函数
    const getAllPharmacySettings = async (): Promise<Record<string, AppSettings>> => {
        if (!currentUser || currentUser.role !== 'SuperAdmin') return {};
        
        const pharmacySettings: Record<string, AppSettings> = {};
        
        // 获取所有管理员用户
        const adminUsers = users.filter(u => u.role === 'Admin' && u.pharmacyId);
        
        // 为每个药房获取设置
        for (const admin of adminUsers) {
            if (admin.pharmacyId) {
                try {
                    const settings = await getPharmacyDoc<AppSettings>(admin.pharmacyId, 'config', 'main');
                    pharmacySettings[admin.pharmacyId] = settings || {
                        ...fallbackAppSettings,
                        pharmacyName: `${admin.name}'s Pharmacy`,
                        pharmacyEmail: admin.email || ""
                    };
                } catch (error) {
                    console.error(`Error fetching settings for pharmacy ${admin.pharmacyId}:`, error);
                    pharmacySettings[admin.pharmacyId] = {
                        ...fallbackAppSettings,
                        pharmacyName: `${admin.name}'s Pharmacy`,
                        pharmacyEmail: admin.email || ""
                    };
                }
            }
        }
        
        return pharmacySettings;
    };

    const createPharmacyAdmin = async (name: string, email: string, pin: string): Promise<boolean> => {
        // Only SuperAdmin can create pharmacy admins
        if (!currentUser || currentUser.role !== 'SuperAdmin') return false;
        
        const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
            console.error("User with this email already exists.");
            return false;
        }

        const tempAppName = 'temp-user-creation-app';
        let tempApp;

        try {
            // احصل على النسخة المؤقتة من التطبيق أو أنشئها إذا لم تكن موجودة
            tempApp = getApps().find(app => app.name === tempAppName) || initializeApp(firebaseConfig, tempAppName);
            const tempAuth = getAuth(tempApp);

            // استخدم النسخة المؤقتة لإنشاء المستخدم. هذا لن يؤثر على جلسة المستخدم الحالي
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, pin);
            const newUserUid = userCredential.user.uid;

            // الآن بعد أن تم إنشاء المستخدم، يمكننا حذف التطبيق المؤقت بأمان
            await deleteApp(tempApp);
            tempApp = undefined; // لمنع الحذف مرة أخرى في كتلة catch

            const pharmacyId = `PHARM_${newUserUid}`;
            const newAdmin: User = {
                id: newUserUid,
                pharmacyId: pharmacyId,
                name, email, pin,
                role: 'Admin',
                status: 'active',
                permissions: adminPermissions,
                createdAt: new Date().toISOString(),
                hourlyRate: 0,
            };

            await setUser(newUserUid, newAdmin, true);
            await setPharmacyDoc(pharmacyId, 'config', 'main', {...fallbackAppSettings, pharmacyName: `${name}'s Pharmacy`, pharmacyEmail: email});
            
            // قم بتحديث قائمة المستخدمين في الحالة المحلية بدون إعادة تحميل
            setUsers(prev => [...prev, newAdmin]);

            // لا حاجة لتسجيل الخروج وإعادة الدخول بعد الآن!
            return true;
        } catch (error) {
            console.error("Error creating pharmacy admin:", error);
            // تأكد من حذف التطبيق المؤقت في حالة حدوث خطأ أيضًا
            if (tempApp) {
                await deleteApp(tempApp);
            }
            return false;
        }
    };

    // const registerUser = async (name: string, email: string, pin: string): Promise<boolean> => {
    //     // Only Admin can register users in their pharmacy
    //     if (!currentUser || currentUser.role !== 'Admin' || !currentUser.pharmacyId) return false;
        
    //     const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    //     if (userExists) return false;
        
    //     try {
    //          const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
    //          const newUser: User = {
    //             id: userCredential.user.uid,
    //             pharmacyId: currentUser.pharmacyId,
    //             name, email, pin,
    //             role: 'Employee',
    //             status: 'active',
    //             permissions: defaultEmployeePermissions,
    //             createdAt: new Date().toISOString(),
    //             hourlyRate: 0,
    //         };
    //         await setUser(userCredential.user.uid, newUser, true);
    //         setUsers(prev => [...prev, newUser]);
    //         await signOut(auth);
    //         if (!currentUser.email || !currentUser.pin) {
    //             throw new Error("Email or PIN is missing");
    //         }
    //         await signInWithEmailAndPassword(auth, currentUser.email, currentUser.pin);

    //         return true;
    //     } catch (error) {
    //         console.error("Error registering user:", error);
    //         return false;
    //     }
    // }
    const registerUser = async (name: string, email: string, pin: string): Promise<boolean> => {
        // Only Admin can register users in their pharmacy
        if (!currentUser || currentUser.role !== 'Admin' || !currentUser.pharmacyId) return false;
        
        const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
        if (userExists) {
            console.error("User with this email already exists.");
            return false;
        }

        const tempAppName = 'temp-user-creation-app';
        let tempApp;
        
        try {
            tempApp = getApps().find(app => app.name === tempAppName) || initializeApp(firebaseConfig, tempAppName);
            const tempAuth = getAuth(tempApp);

            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, pin);
            const newUserUid = userCredential.user.uid;
            
            await deleteApp(tempApp);
            tempApp = undefined;

            const newUser: User = {
                id: newUserUid,
                pharmacyId: currentUser.pharmacyId,
                name, email, pin,
                role: 'Employee',
                status: 'active',
                permissions: defaultEmployeePermissions,
                createdAt: new Date().toISOString(),
                hourlyRate: 0,
            };

            await setUser(newUserUid, newUser, true);
            setUsers(prev => [...prev, newUser]);

            // لا حاجة لتسجيل الخروج وإعادة الدخول
            return true;
        } catch (error) {
            console.error("Error registering user:", error);
            if (tempApp) {
                await deleteApp(tempApp);
            }
            return false;
        }
    }

    const login = async (email: string, pin: string): Promise<User | null> => {
        try {
            // First authenticate with Firebase
            await signInWithEmailAndPassword(auth, email, pin);
            
            // The onAuthStateChanged listener will handle fetching user data
            // and setting up the session, including time logging
            return null; // We'll return the user through the auth state change
        } catch(error) {
            toast({
                variant: "destructive",
                title: "فشل تسجيل الدخول",
                description: "يرجى التحقق من البريد الإلكتروني أو الرقم السري.",
            });

            // console.error("Login error:", error);
            return null;
        }
    };

    const logout = async () => {
        const currentPharmacyId = currentUser?.pharmacyId;
        if (activeTimeLogId && currentPharmacyId) {
            try {
                const logDoc = await getPharmacyDoc<TimeLog>(currentPharmacyId, 'timeLogs', activeTimeLogId);
                if (logDoc) {
                    const updatedLog = { ...logDoc, clockOut: new Date().toISOString() };
                    await setPharmacySubCollectionDoc(currentPharmacyId, 'timeLogs', activeTimeLogId, updatedLog);
                }
                setActiveTimeLogId(null);
            } catch (error) {
                console.error("Error updating time log on logout:", error);
            }
        }
        await signOut(auth);
        setCurrentUser(null);
        setUsers([]);
        router.push('/');
    };
  
    const deleteUser = async (userId: string, permanent: boolean = false): Promise<boolean> => {
        // Only SuperAdmin or Admin can delete users
        if (!currentUser || (currentUser.role !== 'SuperAdmin' && currentUser.role !== 'Admin')) return false;
        
        const userToDelete = users.find(u => u.id === userId);
        if (!userToDelete) return false;
        
        // SuperAdmin can delete any user, Admin can only delete users in their pharmacy
        if (currentUser.role === 'Admin' && userToDelete.pharmacyId !== currentUser.pharmacyId) return false;
        
        if (permanent && currentUser.role === 'SuperAdmin' && userToDelete.pharmacyId) {
            await deletePharmacyData(userToDelete.pharmacyId);
        }
        
        await toggleUserStatus(userId);
        return true;
    };
    
    const updateUser = async (userId: string, name: string, email: string, pin?: string): Promise<boolean> => {
        if (!currentUser) return false;
        
        const userToUpdate = users.find(u => u.id === userId);
        if(!userToUpdate) return false;

        // Users can update themselves, Admin can update users in their pharmacy, SuperAdmin can update anyone
        const canUpdate = 
            currentUser.id === userId || 
            (currentUser.role === 'Admin' && userToUpdate.pharmacyId === currentUser.pharmacyId) ||
            currentUser.role === 'SuperAdmin';
            
        if (!canUpdate) return false;

        try {
            const updatedUser = {
                ...userToUpdate,
                name,
                email,
                pin: pin || userToUpdate.pin
            };
            await setUser(userId, updatedUser, true);
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            if (currentUser?.id === userId) {
                setCurrentUser(updatedUser);
            }
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
        
        // Only Admin (for their pharmacy) or SuperAdmin can update permissions
        const canUpdate = 
            (currentUser.role === 'Admin' && userToUpdate.pharmacyId === currentUser.pharmacyId) ||
            currentUser.role === 'SuperAdmin';
            
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
        
        // Only Admin (for their pharmacy) or SuperAdmin can update hourly rates
        const canUpdate = 
            (currentUser.role === 'Admin' && userToUpdate.pharmacyId === currentUser.pharmacyId) ||
            currentUser.role === 'SuperAdmin';
            
        if (!canUpdate) return false;

        try {
            const updatedUser = { ...userToUpdate, hourlyRate: rate };
            await setUser(userId, updatedUser, true);
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            if (currentUser?.id === userId) {
                setCurrentUser(updatedUser);
            }
            return true;
        } catch (error) {
            console.error("Error updating user hourly rate:", error);
            return false;
        }
    };

    // const toggleUserStatus = async (userId: string): Promise<boolean> => {
    //     if (!currentUser) return false;
        
    //     const userToUpdate = users.find(u => u.id === userId);
    //     if(!userToUpdate) return false;
        
    //     // Only SuperAdmin or Admin can toggle user status
    //     const canUpdate = 
    //         (currentUser.role === 'Admin' && userToUpdate.pharmacyId === currentUser.pharmacyId) ||
    //         currentUser.role === 'SuperAdmin';
            
    //     if (!canUpdate) return false;

    //     try {
    //         const newStatus = userToUpdate.status === 'active' ? 'suspended' : 'active';
    //         const updatedUser = { ...userToUpdate, status: newStatus };
    //         await setUser(userId, updatedUser, true);
    //         setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    //         return true;
    //     } catch (error) {
    //         console.error("Error toggling user status:", error);
    //         return false;
    //     }
    // }
    const toggleUserStatus = async (userId: string): Promise<boolean> => {
        if (!currentUser) return false;
        
        const userToUpdate = users.find(u => u.id === userId);
        if(!userToUpdate) return false;
        
        // Only SuperAdmin or Admin can toggle user status
        const canUpdate = 
            (currentUser.role === 'Admin' && userToUpdate.pharmacyId === currentUser.pharmacyId) ||
            currentUser.role === 'SuperAdmin';
            
        if (!canUpdate) return false;

        try {
            const newStatus: "active" | "suspended" = userToUpdate.status === 'active' ? 'suspended' : 'active';
            const updatedUser = { ...userToUpdate, status: newStatus };
            await setUser(userId, updatedUser, true);
            setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
            return true;
        } catch (error) {
            console.error("Error toggling user status:", error);
            return false;
        }
    }

    const isAuthenticated = !!currentUser;

    return (
        <AuthContext.Provider value={{ 
            currentUser, users, setUsers, isAuthenticated, loading, isSetup, 
            setupAdmin, login, logout, registerUser, deleteUser, updateUser, 
            updateUserPermissions, updateUserHourlyRate, createPharmacyAdmin, toggleUserStatus, scopedData,
            getAllPharmacySettings
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












// "use client";

// import * as React from 'react';
// import type { User, UserPermissions, TimeLog, AppSettings, Medication, Sale, Supplier, Patient, TrashItem, SupplierPayment, PurchaseOrder, ReturnOrder } from '@/lib/types';
// import { useRouter } from 'next/navigation';
// import { 
//     getAllUsers, 
//     setUser, 
//     getPharmacySubCollection, 
//     setPharmacySubCollectionDoc,
//     getPharmacyDoc,
//     setPharmacyDoc,
//     deletePharmacyData
// } from './use-firestore';
// import { auth } from '@/lib/firebase';
// import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

// interface AuthContextType {
//   currentUser: User | null;
//   users: User[];
//   setUsers: React.Dispatch<React.SetStateAction<User[]>>;
//   isAuthenticated: boolean;
//   isSetup: boolean;
//   loading: boolean;
//   setupAdmin: (name: string, email: string, pin: string) => Promise<boolean>;
//   createPharmacyAdmin: (name: string, email: string, pin: string) => Promise<boolean>;
//   login: (email: string, pin: string) => Promise<User | null>;
//   logout: () => void;
//   registerUser: (name: string, email: string, pin: string) => Promise<boolean>;
//   deleteUser: (userId: string, permanent?: boolean) => Promise<boolean>;
//   updateUser: (userId: string, name: string, email: string, pin?: string) => Promise<boolean>;
//   updateUserPermissions: (userId: string, permissions: UserPermissions) => Promise<boolean>;
//   updateUserHourlyRate: (userId: string, rate: number) => Promise<boolean>;
//   toggleUserStatus: (userId: string) => Promise<boolean>;
//   scopedData: ScopedDataContextType;
// }

// export interface ScopedDataContextType {
//     inventory: [Medication[], (value: Medication[] | ((val: Medication[]) => Medication[])) => void];
//     sales: [Sale[], (value: Sale[] | ((val: Sale[]) => Sale[])) => void];
//     suppliers: [Supplier[], (value: Supplier[] | ((val: Supplier[]) => Supplier[])) => void];
//     patients: [Patient[], (value: Patient[] | ((val: Patient[]) => Patient[])) => void];
//     trash: [TrashItem[], (value: TrashItem[] | ((val: TrashItem[]) => TrashItem[])) => void];
//     payments: [SupplierPayment[], (value: SupplierPayment[] | ((val: SupplierPayment[]) => SupplierPayment[])) => void];
//     purchaseOrders: [PurchaseOrder[], (value: PurchaseOrder[] | ((val: PurchaseOrder[]) => PurchaseOrder[])) => void];
//     supplierReturns: [ReturnOrder[], (value: ReturnOrder[] | ((val: ReturnOrder[]) => ReturnOrder[])) => void];
//     timeLogs: [TimeLog[], (value: TimeLog[] | ((val: TimeLog[]) => TimeLog[])) => void];
//     settings: [AppSettings, (value: AppSettings | ((val: AppSettings) => AppSettings)) => void];
// }

// const AuthContext = React.createContext<AuthContextType | null>(null);

// const defaultEmployeePermissions: UserPermissions = {
//     sales: true, inventory: true, purchases: false, suppliers: false, reports: false, itemMovement: true, patients: true, expiringSoon: true, guide: true, settings: false, trash: false,
// };

// const adminPermissions: UserPermissions = {
//     sales: true, inventory: true, purchases: true, suppliers: true, reports: true, itemMovement: true, patients: true, expiringSoon: true, guide: true, settings: true, trash: true,
// };

// const fallbackAppSettings: AppSettings = {
//     pharmacyName: "صيدلية جديدة",
//     pharmacyAddress: "",
//     pharmacyPhone: "",
//     pharmacyEmail: "",
//     expirationThresholdDays: 90,
//     invoiceFooterMessage: "شكرًا لزيارتكم!",
// }

// const emptyDataSetter = () => { console.warn("Attempted to set data without a valid pharmacy context."); };

// const emptyScopedData: ScopedDataContextType = {
//     inventory: [[], emptyDataSetter as any],
//     sales: [[], emptyDataSetter as any],
//     suppliers: [[], emptyDataSetter as any],
//     patients: [[], emptyDataSetter as any],
//     trash: [[], emptyDataSetter as any],
//     payments: [[], emptyDataSetter as any],
//     purchaseOrders: [[], emptyDataSetter as any],
//     supplierReturns: [[], emptyDataSetter as any],
//     timeLogs: [[], emptyDataSetter as any],
//     settings: [fallbackAppSettings, emptyDataSetter as any],
// };


// export function AuthProvider({ children }: { children: React.ReactNode }) {
//     const [users, setUsers] = React.useState<User[]>([]);
//     const [currentUser, setCurrentUser] = React.useState<User | null>(null);
//     const [loading, setLoading] = React.useState(true);
//     const [isSetup, setIsSetup] = React.useState(false);
//     const [activeTimeLogId, setActiveTimeLogId] = React.useState<string | null>(null);
//     const router = useRouter();

//     const [inventory, setInventory] = React.useState<Medication[]>([]);
//     const [sales, setSales] = React.useState<Sale[]>([]);
//     const [suppliers, setSuppliers] = React.useState<Supplier[]>([]);
//     const [patients, setPatients] = React.useState<Patient[]>([]);
//     const [trash, setTrash] = React.useState<TrashItem[]>([]);
//     const [payments, setPayments] = React.useState<SupplierPayment[]>([]);
//     const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>([]);
//     const [supplierReturns, setSupplierReturns] = React.useState<ReturnOrder[]>([]);
//     const [timeLogs, setTimeLogs] = React.useState<TimeLog[]>([]);
//     const [settings, setSettings] = React.useState<AppSettings>(fallbackAppSettings);

//     const pharmacyId = currentUser?.pharmacyId;

//     React.useEffect(() => {
//         const checkSetup = async () => {
//             const allUsers = await getAllUsers();
//             const superAdminExists = allUsers.some(u => u.role === 'SuperAdmin');
//             setIsSetup(superAdminExists);
//             // Don't stop loading here, let onAuthStateChanged be the source of truth for loading state
//         };
//         checkSetup();
//     }, []);

//     React.useEffect(() => {
//         const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
//             if (firebaseUser) {
//                 const allUsers = await getAllUsers();
//                 setUsers(allUsers);
//                 const userDoc = allUsers.find(u => u.id === firebaseUser.uid);
//                 if (userDoc) {
//                     setCurrentUser(userDoc);
//                 } else {
//                     // This can happen if user exists in Auth but not Firestore. Log them out.
//                     await signOut(auth);
//                     setCurrentUser(null);
//                 }
//             } else {
//                 setCurrentUser(null);
//             }
//             setLoading(false);
//         });
//         return () => unsubscribe();
//     }, []);
    
//     React.useEffect(() => {
//         const fetchPharmacyData = async () => {
//             if (pharmacyId) {
//                 setInventory(await getPharmacySubCollection<Medication>(pharmacyId, 'inventory'));
//                 setSales(await getPharmacySubCollection<Sale>(pharmacyId, 'sales'));
//                 setSuppliers(await getPharmacySubCollection<Supplier>(pharmacyId, 'suppliers'));
//                 setPatients(await getPharmacySubCollection<Patient>(pharmacyId, 'patients'));
//                 setTrash(await getPharmacySubCollection<TrashItem>(pharmacyId, 'trash'));
//                 setPayments(await getPharmacySubCollection<SupplierPayment>(pharmacyId, 'payments'));
//                 setPurchaseOrders(await getPharmacySubCollection<PurchaseOrder>(pharmacyId, 'purchaseOrders'));
//                 setSupplierReturns(await getPharmacySubCollection<ReturnOrder>(pharmacyId, 'supplierReturns'));
//                 setTimeLogs(await getPharmacySubCollection<TimeLog>(pharmacyId, 'timeLogs'));
//                 const pharmSettings = await getPharmacyDoc<AppSettings>(pharmacyId, 'config', 'main');
//                 setSettings(pharmSettings || fallbackAppSettings);
//             } else {
//                 // Reset data if no pharmacyId (e.g., for SuperAdmin)
//                 setInventory([]);
//                 setSales([]);
//                 setSuppliers([]);
//                 setPatients([]);
//                 setTrash([]);
//                 setPayments([]);
//                 setPurchaseOrders([]);
//                 setSupplierReturns([]);
//                 setTimeLogs([]);
//                 setSettings(fallbackAppSettings);
//             }
//         };
//         if (currentUser) {
//             fetchPharmacyData();
//         }
//     }, [currentUser, pharmacyId]);


//     const createSetter = <T extends { id: string }>(
//         state: T[],
//         setter: React.Dispatch<React.SetStateAction<T[]>>,
//         collectionName: string
//     ) => async (value: T[] | ((val: T[]) => T[])) => {
//         if (pharmacyId) {
//             const newValue = typeof value === 'function' ? value(state) : value;
//             // This is a simplified update. A more robust solution would diff arrays.
//             for (const item of newValue) {
//                 await setPharmacySubCollectionDoc(pharmacyId, collectionName, item.id, item);
//             }
//             setter(newValue);
//         }
//     };
    
//     const setScopedSettings = async (value: AppSettings | ((val: AppSettings) => AppSettings)) => {
//         if (pharmacyId) {
//             const newSettings = typeof value === 'function' ? value(settings) : value;
//             await setPharmacyDoc(pharmacyId, 'config', 'main', newSettings);
//             setSettings(newSettings);
//         }
//     };

//     const scopedData: ScopedDataContextType = {
//         inventory: [inventory, createSetter(inventory, setInventory, 'inventory')],
//         sales: [sales, createSetter(sales, setSales, 'sales')],
//         suppliers: [suppliers, createSetter(suppliers, setSuppliers, 'suppliers')],
//         patients: [patients, createSetter(patients, setPatients, 'patients')],
//         trash: [trash, createSetter(trash, setTrash, 'trash')],
//         payments: [payments, createSetter(payments, setPayments, 'payments')],
//         purchaseOrders: [purchaseOrders, createSetter(purchaseOrders, setPurchaseOrders, 'purchaseOrders')],
//         supplierReturns: [supplierReturns, createSetter(supplierReturns, setSupplierReturns, 'supplierReturns')],
//         timeLogs: [timeLogs, createSetter(timeLogs, setTimeLogs, 'timeLogs')],
//         settings: [settings, setScopedSettings],
//     };

//     const setupAdmin = async (name: string, email: string, pin: string) => {
//         if (isSetup) return false;
//         try {
//             const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
//             const superAdmin: User = {
//                 id: userCredential.user.uid,
//                 name: name,
//                 email: email,
//                 role: 'SuperAdmin',
//                 status: 'active',
//                 pin: pin,
//                 createdAt: new Date().toISOString(),
//             };
//             await setUser(userCredential.user.uid, superAdmin);
//             setUsers([superAdmin]);
//             setIsSetup(true);
//             return true;
//         } catch (error) {
//             console.error("Error setting up super admin:", error);
//             return false;
//         }
//     };
  
//     const createPharmacyAdmin = async (name: string, email: string, pin: string): Promise<boolean> => {
//         const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
//         if (userExists) return false;

//         try {
//             const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
//             const pharmacyId = `PHARM_${userCredential.user.uid}`;
//             const newAdmin: User = {
//                 id: userCredential.user.uid,
//                 pharmacyId: pharmacyId,
//                 name, email, pin,
//                 role: 'Admin',
//                 status: 'active',
//                 permissions: adminPermissions,
//                 createdAt: new Date().toISOString(),
//                 hourlyRate: 0,
//             };
//             await setUser(userCredential.user.uid, newAdmin);
//             setUsers(prev => [...prev, newAdmin]);
//             await setPharmacyDoc(pharmacyId, 'config', 'main', {...fallbackAppSettings, pharmacyName: `${name}'s Pharmacy`, pharmacyEmail: email});
//             return true;
//         } catch (error) {
//             console.error("Error creating pharmacy admin:", error);
//             return false;
//         }
//     };

//     const registerUser = async (name: string, email: string, pin: string): Promise<boolean> => {
//         const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
//         if (userExists) return false;
//         if (!currentUser || !currentUser.pharmacyId) return false;
        
//         try {
//              const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
//              const newUser: User = {
//                 id: userCredential.user.uid,
//                 pharmacyId: currentUser.pharmacyId,
//                 name, email, pin,
//                 role: 'Employee',
//                 status: 'active',
//                 permissions: defaultEmployeePermissions,
//                 createdAt: new Date().toISOString(),
//                 hourlyRate: 0,
//             };
//             await setUser(userCredential.user.uid, newUser);
//             setUsers(prev => [...prev, newUser]);
//             return true;
//         } catch (error) {
//             console.error("Error registering user:", error);
//             return false;
//         }
//     }
  
//     const login = async (email: string, pin: string): Promise<User | null> => {
//         try {
//             const userToLogin = users.find(u => u.email === email && u.pin === pin);
//             if (!userToLogin || userToLogin.status !== 'active') return null;

//             await signInWithEmailAndPassword(auth, email, pin);
            
//             if (userToLogin.role !== 'SuperAdmin' && userToLogin.pharmacyId) {
//                 const newTimeLog: TimeLog = {
//                     id: `TL${Date.now()}`,
//                     userId: userToLogin.id,
//                     pharmacyId: userToLogin.pharmacyId,
//                     clockIn: new Date().toISOString(),
//                 };
//                 await setPharmacySubCollectionDoc(userToLogin.pharmacyId, 'timeLogs', newTimeLog.id, newTimeLog);
//                 setActiveTimeLogId(newTimeLog.id);
//             }
//             return userToLogin;
//         } catch(error) {
//             console.error("Login error:", error);
//             return null;
//         }
//     };

//     const logout = async () => {
//         const currentPharmacyId = currentUser?.pharmacyId;
//         if (activeTimeLogId && currentPharmacyId) {
//             const logDoc = await getPharmacyDoc<TimeLog>(currentPharmacyId, 'timeLogs', activeTimeLogId);
//             if (logDoc) {
//                 const updatedLog = { ...logDoc, clockOut: new Date().toISOString() };
//                 await setPharmacySubCollectionDoc(currentPharmacyId, 'timeLogs', activeTimeLogId, updatedLog);
//             }
//             setActiveTimeLogId(null);
//         }
//         await signOut(auth);
//         setCurrentUser(null);
//         router.push('/');
//     };
  
//     const deleteUser = async (userId: string, permanent: boolean = false): Promise<boolean> => {
//         const userToDelete = users.find(u => u.id === userId);
//         if (!userToDelete) return false;
        
//         if (permanent && currentUser?.role === 'SuperAdmin' && userToDelete.pharmacyId) {
//             await deletePharmacyData(userToDelete.pharmacyId);
//         }
        
//         await toggleUserStatus(userId);
//         return true;
//     };
    
//     const updateUser = async (userId: string, name: string, email: string, pin?: string): Promise<boolean> => {
//         const userToUpdate = users.find(u => u.id === userId);
//         if(!userToUpdate) return false;

//         const updatedUser = {
//             ...userToUpdate,
//             name,
//             email,
//             pin: pin || userToUpdate.pin
//         };
//         await setUser(userId, updatedUser);
//         setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
//         if (currentUser?.id === userId) {
//             setCurrentUser(updatedUser);
//         }
//         return true;
//     };

//     const updateUserPermissions = async (userId: string, permissions: UserPermissions): Promise<boolean> => {
//       const userToUpdate = users.find(u => u.id === userId);
//       if(!userToUpdate) return false;
//       const updatedUser = { ...userToUpdate, permissions };
//       await setUser(userId, updatedUser);
//       setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
//       return true;
//     };

//     const updateUserHourlyRate = async (userId: string, rate: number): Promise<boolean> => {
//       const userToUpdate = users.find(u => u.id === userId);
//       if(!userToUpdate) return false;
//       const updatedUser = { ...userToUpdate, hourlyRate: rate };
//       await setUser(userId, updatedUser);
//       setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
//        if (currentUser?.id === userId) {
//             setCurrentUser(updatedUser);
//         }
//       return true;
//     };

//     const toggleUserStatus = async (userId: string): Promise<boolean> => {
//        const userToUpdate = users.find(u => u.id === userId);
//         if(!userToUpdate) return false;
//         const newStatus = userToUpdate.status === 'active' ? 'suspended' : 'active';
//         const updatedUser = { ...userToUpdate, status: newStatus };
//         await setUser(userId, updatedUser);
//         setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
//         return true;
//     }

//     const isAuthenticated = !!currentUser;

//     return (
//         <AuthContext.Provider value={{ 
//             currentUser, users, setUsers, isAuthenticated, loading, isSetup, 
//             setupAdmin, login, logout, registerUser, deleteUser, updateUser, 
//             updateUserPermissions, updateUserHourlyRate, createPharmacyAdmin, toggleUserStatus, scopedData
//         }}>
//         {children}
//         </AuthContext.Provider>
//     );
// }

// export function useAuth() {
//   const context = React.useContext(AuthContext);
//   if (context === null) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }
