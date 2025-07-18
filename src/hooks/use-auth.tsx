
"use client";

import * as React from 'react';
import { useLocalStorage } from './use-local-storage';
import type { User, UserPermissions, TimeLog, AppSettings, Medication, Sale, Supplier, Patient, TrashItem, SupplierPayment, InventoryData, SalesData, SuppliersData, PatientsData, TrashData, PaymentsData, TimeLogsData } from '@/lib/types';
import { users as fallbackUsers, appSettings as fallbackAppSettings } from '@/lib/data';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  setUsers: (users: User[] | ((val: User[]) => User[])) => void;
  isAuthenticated: boolean;
  isSetup: boolean;
  loading: boolean;
  setupAdmin: (name: string, email: string, pin: string) => void;
  createPharmacyAdmin: (name: string, email: string, pin: string) => Promise<boolean>;
  login: (email: string, pin: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (name: string, email: string, pin: string) => Promise<boolean>;
  resetPin: (email: string, newPin: string) => Promise<boolean>;
  checkUserExists: (email: string) => Promise<boolean>;
  deleteUser: (userId: string, permanent?: boolean) => Promise<boolean>;
  updateUser: (userId: string, name: string, email: string, pin?: string) => Promise<boolean>;
  updateUserPermissions: (userId: string, permissions: UserPermissions) => Promise<boolean>;
  updateUserHourlyRate: (userId: string, rate: number) => Promise<boolean>;
  toggleUserStatus: (userId: string) => Promise<boolean>;
  getScopedData: () => ScopedDataContextType;
}

export interface ScopedDataContextType {
    inventory: [Medication[], (value: Medication[] | ((val: Medication[]) => Medication[])) => void];
    sales: [Sale[], (value: Sale[] | ((val: Sale[]) => Sale[])) => void];
    suppliers: [Supplier[], (value: Supplier[] | ((val: Supplier[]) => Supplier[])) => void];
    patients: [Patient[], (value: Patient[] | ((val: Patient[]) => Patient[])) => void];
    trash: [TrashItem[], (value: TrashItem[] | ((val: TrashItem[]) => TrashItem[])) => void];
    payments: [SupplierPayment[], (value: SupplierPayment[] | ((val: SupplierPayment[]) => SupplierPayment[])) => void];
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useLocalStorage<User[]>('users', fallbackUsers);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  
  const [allAppSettings, setAllAppSettings] = useLocalStorage<{ [key: string]: AppSettings }>('allAppSettings', {});
  const [globalSettings, setGlobalSettings] = useLocalStorage<{initialized?: boolean}>('globalSettings', {});

  const [allTimeLogs, setAllTimeLogs] = useLocalStorage<TimeLogsData>('timeLogs', {});
  const [allInventory, setAllInventory] = useLocalStorage<InventoryData>('inventory', {});
  const [allSales, setAllSales] = useLocalStorage<SalesData>('sales', {});
  const [allSuppliers, setAllSuppliers] = useLocalStorage<SuppliersData>('suppliers', {});
  const [allPatients, setAllPatients] = useLocalStorage<PatientsData>('patients', {});
  const [allTrash, setAllTrash] = useLocalStorage<TrashData>('trash', {});
  const [allPayments, setAllPayments] = useLocalStorage<PaymentsData>('supplierPayments', {});
  
  const [activeTimeLogId, setActiveTimeLogId] = useLocalStorage<string | null>('activeTimeLogId', null);
  const [loading, setLoading] = React.useState(true);

  const isSetup = globalSettings.initialized === true;

  React.useEffect(() => {
    setLoading(false);
  }, []);

  const getScopedData = (): ScopedDataContextType => {
      const pharmacyId = currentUser?.pharmacyId;
      if (!pharmacyId) {
          const emptySetter = () => { console.warn("Attempted to set data without a valid pharmacy context."); };
          return {
              inventory: [[], emptySetter as any],
              sales: [[], emptySetter as any],
              suppliers: [[], emptySetter as any],
              patients: [[], emptySetter as any],
              trash: [[], emptySetter as any],
              payments: [[], emptySetter as any],
              timeLogs: [[], emptySetter as any],
              settings: [fallbackAppSettings, emptySetter as any],
          };
      }
      
      return {
          inventory: [allInventory[pharmacyId] || [], (val) => setAllInventory(p => ({ ...p, [pharmacyId]: typeof val === 'function' ? val(p[pharmacyId] || []) : val }))],
          sales: [allSales[pharmacyId] || [], (val) => setAllSales(p => ({ ...p, [pharmacyId]: typeof val === 'function' ? val(p[pharmacyId] || []) : val }))],
          suppliers: [allSuppliers[pharmacyId] || [], (val) => setAllSuppliers(p => ({ ...p, [pharmacyId]: typeof val === 'function' ? val(p[pharmacyId] || []) : val }))],
          patients: [allPatients[pharmacyId] || [], (val) => setAllPatients(p => ({ ...p, [pharmacyId]: typeof val === 'function' ? val(p[pharmacyId] || []) : val }))],
          trash: [allTrash[pharmacyId] || [], (val) => setAllTrash(p => ({ ...p, [pharmacyId]: typeof val === 'function' ? val(p[pharmacyId] || []) : val }))],
          payments: [allPayments[pharmacyId] || [], (val) => setAllPayments(p => ({ ...p, [pharmacyId]: typeof val === 'function' ? val(p[pharmacyId] || []) : val }))],
          timeLogs: [allTimeLogs[pharmacyId] || [], (val) => setAllTimeLogs(p => ({ ...p, [pharmacyId]: typeof val === 'function' ? val(p[pharmacyId] || []) : val }))],
          settings: [allAppSettings[pharmacyId] || fallbackAppSettings, (val) => setAllAppSettings(p => ({ ...p, [pharmacyId]: typeof val === 'function' ? val(p[pharmacyId] || fallbackAppSettings) : val }))],
      }
  };


  const setupAdmin = (name: string, email: string, pin: string) => {
    if (isSetup) return;
    const superAdmin: User = {
      id: 'SUPERADMIN001',
      name: name,
      email: email,
      role: 'SuperAdmin',
      status: 'active',
      pin: pin,
      createdAt: new Date().toISOString(),
    };
    setUsers([superAdmin]);
    setGlobalSettings({initialized: true});
  };
  
  const createPharmacyAdmin = async (name: string, email: string, pin: string): Promise<boolean> => {
    const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (userExists) return false;

    const pharmacyId = `PHARM_${Date.now()}`;
    const newAdmin: User = {
      id: `ADMIN_${pharmacyId}`,
      pharmacyId: pharmacyId,
      name,
      email,
      pin,
      role: 'Admin',
      status: 'active',
      permissions: adminPermissions,
      createdAt: new Date().toISOString(),
      hourlyRate: 0,
    };
    
    setAllAppSettings(prev => ({...prev, [pharmacyId]: {...fallbackAppSettings, pharmacyName: `${name}'s Pharmacy`}}));
    setAllInventory(prev => ({...prev, [pharmacyId]: []}));
    setAllSales(prev => ({...prev, [pharmacyId]: []}));
    setAllSuppliers(prev => ({...prev, [pharmacyId]: []}));
    setAllPatients(prev => ({...prev, [pharmacyId]: []}));
    setAllTrash(prev => ({...prev, [pharmacyId]: []}));
    setAllPayments(prev => ({...prev, [pharmacyId]: []}));
    setAllTimeLogs(prev => ({...prev, [pharmacyId]: []}));

    setUsers(prev => [...prev, newAdmin]);
    return true;
  };

  const registerUser = async (name: string, email: string, pin: string): Promise<boolean> => {
      const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (userExists) return false;
      if (!currentUser || !currentUser.pharmacyId) return false;

      const newUser: User = {
          id: `USR${Date.now()}`,
          pharmacyId: currentUser.pharmacyId,
          name,
          email,
          pin,
          role: 'Employee',
          status: 'active',
          permissions: defaultEmployeePermissions,
          createdAt: new Date().toISOString(),
          hourlyRate: 0,
      };
      setUsers(prev => [...prev, newUser]);
      return true;
  }
  
  const checkUserExists = async (email: string): Promise<boolean> => {
      return users.some(u => u && u.email && u.email.toLowerCase() === email.toLowerCase());
  }
  
  const resetPin = async (email: string, newPin: string): Promise<boolean> => {
      let userFound = false;
      const updatedUsers = users.map(u => {
          if (u && u.email && u.email.toLowerCase() === email.toLowerCase()) {
              userFound = true;
              return { ...u, pin: newPin };
          }
          return u;
      });

      if (userFound) {
          setUsers(updatedUsers);
          return true;
      }
      return false;
  }

  const updateUser = async (userId: string, name: string, email: string, pin?: string): Promise<boolean> => {
      const emailExists = users.some(u => u.id !== userId && u.email && u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
          return false;
      }
      
      setUsers(prevUsers => prevUsers.map(u => {
          if (u.id === userId) {
              return {
                  ...u,
                  name: name,
                  email: email,
                  pin: pin || u.pin,
              };
          }
          return u;
      }));
      if (currentUser?.id === userId) {
          setCurrentUser(prev => prev ? { ...prev, name, email, pin: pin || prev.pin } : null);
      }
      return true;
  };

  const updateUserPermissions = async (userId: string, permissions: UserPermissions): Promise<boolean> => {
      let userFound = false;
      const updatedUsers = users.map(u => {
          if (u.id === userId && u.role === 'Employee') {
              userFound = true;
              return { ...u, permissions };
          }
          return u;
      });

      if (userFound) {
          setUsers(updatedUsers);
          return true;
      }
      return false;
  }
  
    const updateUserHourlyRate = async (userId: string, rate: number): Promise<boolean> => {
        let userFound = false;
        const updatedUsers = users.map(u => {
            if (u.id === userId) {
                userFound = true;
                return { ...u, hourlyRate: rate };
            }
            return u;
        });

        if (userFound) {
            setUsers(updatedUsers);
            if (currentUser?.id === userId) {
                setCurrentUser(prev => prev ? { ...prev, hourlyRate: rate } : null);
            }
            return true;
        }
        return false;
    };
    
    const toggleUserStatus = async (userId: string): Promise<boolean> => {
        let userFound = false;
        setUsers(prev => prev.map(u => {
            if(u.id === userId) {
                userFound = true;
                return {...u, status: u.status === 'active' ? 'suspended' : 'active'};
            }
            return u;
        }));
        return userFound;
    }


  const login = async (email: string, pin: string): Promise<boolean> => {
    const userToLogin = users.find(u => u && u.email && u.email.toLowerCase() === email.toLowerCase() && u.pin === pin);
    
    if (userToLogin && userToLogin.status === 'active') {
      setCurrentUser(userToLogin);
      if (userToLogin.role !== 'SuperAdmin' && userToLogin.pharmacyId) {
          const newTimeLog: TimeLog = {
            id: `TL${Date.now()}`,
            userId: userToLogin.id,
            pharmacyId: userToLogin.pharmacyId,
            clockIn: new Date().toISOString(),
          };
          setAllTimeLogs(prev => ({
              ...prev,
              [userToLogin.pharmacyId!]: [...(prev[userToLogin.pharmacyId!] || []), newTimeLog]
          }));
          setActiveTimeLogId(newTimeLog.id);
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    if (activeTimeLogId && currentUser?.pharmacyId) {
        const pharmacyId = currentUser.pharmacyId;
        setAllTimeLogs(prev => ({
            ...prev,
            [pharmacyId]: (prev[pharmacyId] || []).map(log => 
                log.id === activeTimeLogId 
                    ? { ...log, clockOut: new Date().toISOString() }
                    : log
            )
        }));
        setActiveTimeLogId(null);
    }
    setCurrentUser(null);
  };

  const deleteUser = async (userId: string, permanent: boolean = false): Promise<boolean> => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return false;
    
    if (userToDelete.role === 'SuperAdmin') return false;

    if (permanent && currentUser?.role === 'SuperAdmin' && userToDelete.pharmacyId) {
        const pharmacyIdToDelete = userToDelete.pharmacyId;
        setUsers(prev => prev.filter(u => u.pharmacyId !== pharmacyIdToDelete));

        setAllInventory(p => { const newP = {...p}; delete newP[pharmacyIdToDelete!]; return newP; });
        setAllSales(p => { const newP = {...p}; delete newP[pharmacyIdToDelete!]; return newP; });
        setAllSuppliers(p => { const newP = {...p}; delete newP[pharmacyIdToDelete!]; return newP; });
        setAllPatients(p => { const newP = {...p}; delete newP[pharmacyIdToDelete!]; return newP; });
        setAllTrash(p => { const newP = {...p}; delete newP[pharmacyIdToDelete!]; return newP; });
        setAllPayments(p => { const newP = {...p}; delete newP[pharmacyIdToDelete!]; return newP; });
        setAllTimeLogs(p => { const newP = {...p}; delete newP[pharmacyIdToDelete!]; return newP; });
        setAllAppSettings(p => { const newP = {...p}; delete newP[pharmacyIdToDelete!]; return newP; });

    } else if (currentUser?.role === 'Admin' && userToDelete.role === 'Employee' && currentUser.pharmacyId) {
        const [trash, setTrash] = getScopedData().trash;
        const newTrashItem: TrashItem = {
             id: `TRASH-${Date.now()}`,
             deletedAt: new Date().toISOString(),
             itemType: 'user' as const,
             data: userToDelete,
        };
        setTrash([...trash, newTrashItem]);
        setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    } else {
      return false;
    }

    return true;
  };
  
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, users, setUsers, isAuthenticated, loading, isSetup, setupAdmin, login, logout, registerUser, checkUserExists, resetPin, deleteUser, updateUser, updateUserPermissions, updateUserHourlyRate, createPharmacyAdmin, toggleUserStatus, getScopedData }}>
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
