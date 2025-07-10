
"use client";

import * as React from 'react';
import { useFirestoreCollection, useFirestoreDocument, db } from './use-firestore';
import type { User, UserPermissions } from '@/lib/types';
import { doc, setDoc } from 'firebase/firestore';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  isSetup: boolean;
  loading: boolean;
  setupAdmin: (name: string, email: string, pin: string, image1DataUri: string, image2DataUri: string) => Promise<void>;
  login: (email: string, pin: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (name: string, email: string, pin: string) => Promise<boolean>;
  resetPin: (email: string, newPin: string) => Promise<boolean>;
  checkUserExists: (email: string) => Promise<boolean>;
  updateUserPermissions: (userId: string, permissions: UserPermissions) => Promise<boolean>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

const defaultEmployeePermissions: UserPermissions = {
    sales: true,
    inventory: true,
    purchases: false,
    suppliers: false,
    reports: false,
    itemMovement: true,
    patients: true,
    expiringSoon: true,
    guide: true,
    settings: false,
    trash: false,
};

const allPermissions: UserPermissions = {
    sales: true,
    inventory: true,
    purchases: true,
    suppliers: true,
    reports: true,
    itemMovement: true,
    patients: true,
    expiringSoon: true,
    guide: true,
    settings: true,
    trash: true,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: users, loading: usersLoading, add: addUser, setData: setUser } = useFirestoreCollection<User>('users');
  const { data: settingsDoc, loading: settingsLoading } = useFirestoreDocument('settings', 'main');
  
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isSetup, setIsSetup] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    // Determine setup status once settings are loaded
    if (!settingsLoading) {
      setIsSetup(!!settingsDoc);
    }
  }, [settingsDoc, settingsLoading]);

  React.useEffect(() => {
    // Overall loading state depends on both users and settings
    setLoading(usersLoading || settingsLoading);
  }, [usersLoading, settingsLoading]);


  const setupAdmin = async (name: string, email: string, pin: string, image1DataUri: string, image2DataUri: string) => {
    const adminUser: User = {
      id: 'ADMIN001',
      name,
      email,
      role: 'Admin',
      pin,
      permissions: allPermissions,
      image1DataUri,
      image2DataUri,
    };
    // Use `setDoc` with a specific ID for the admin user
    await setDoc(doc(db, "users", adminUser.id), adminUser);
    // Also mark setup as complete
    await setDoc(doc(db, "settings", "main"), { initialized: true });

    setCurrentUser(adminUser);
    setIsSetup(true);
  };
  
  const registerUser = async (name: string, email: string, pin: string): Promise<boolean> => {
      const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return false;
      }
      
      const newUser: Omit<User, 'id'> = {
          name,
          email,
          pin,
          role: 'Employee',
          permissions: defaultEmployeePermissions,
      };
      await addUser(newUser);
      return true;
  }
  
  const checkUserExists = async (email: string): Promise<boolean> => {
      return (users || []).some(u => u && u.email && u.email.toLowerCase() === email.toLowerCase());
  }
  
  const resetPin = async (email: string, newPin: string): Promise<boolean> => {
      const userToUpdate = (users || []).find(u => u && u.email && u.email.toLowerCase() === email.toLowerCase());
      if (userToUpdate) {
        await setUser(userToUpdate.id, { ...userToUpdate, pin: newPin });
        return true;
      }
      return false;
  }

  const updateUserPermissions = async (userId: string, permissions: UserPermissions): Promise<boolean> => {
      const userToUpdate = (users || []).find(u => u.id === userId);
      if (userToUpdate && userToUpdate.role === 'Employee') {
        await setUser(userId, { ...userToUpdate, permissions });
        return true;
      }
      return false;
  }

  const login = async (email: string, pin: string): Promise<boolean> => {
    const userToLogin = (users || []).find(u => u && u.email && u.email.toLowerCase() === email.toLowerCase() && u.pin === pin);
    if (userToLogin) {
      setCurrentUser(userToLogin);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };
  
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, users: users || [], isAuthenticated, loading, isSetup, setupAdmin, login, logout, registerUser, checkUserExists, resetPin, updateUserPermissions }}>
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
