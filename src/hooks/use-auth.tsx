
"use client";

import * as React from 'react';
import { useLocalStorage } from './use-local-storage';
import type { User } from '@/lib/types';
import { users as fallbackUsers } from '@/lib/data';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isSetup: boolean;
  loading: boolean;
  setupAdmin: (name: string, email: string, pin: string, pinHint?: string) => void;
  login: (email: string, pin: string) => Promise<boolean>;
  logout: () => void;
  getPinHint: (email: string) => string | null;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useLocalStorage<User[]>('users', fallbackUsers);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  const isSetup = users.length > 0;

  React.useEffect(() => {
    setLoading(false);
  }, []);

  const setupAdmin = (name: string, email: string, pin: string, pinHint?: string) => {
    const adminUser: User = {
      id: 'ADMIN001',
      name: name,
      email: email,
      role: 'Admin',
      pin: pin,
      pinHint: pinHint,
    };
    const otherUsers: User[] = [
        { id: "USR002", name: "سارة الموظفة", email: "sara@medstock.app", role: "Employee", pin: "0000"},
        { id: "USR003", name: "أحمد الصيدلي", email: "ahmad@medstock.app", role: "Employee", pin: "1111"},
    ];
    setUsers([adminUser, ...otherUsers]);
    setCurrentUser(adminUser);
  };

  const login = async (email: string, pin: string): Promise<boolean> => {
    const userToLogin = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pin === pin);
    if (userToLogin) {
      setCurrentUser(userToLogin);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };
  
  const getPinHint = (email: string) => {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user && user.pinHint) {
          return user.pinHint;
      }
      return null;
  }
  
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, loading, isSetup, setupAdmin, login, logout, getPinHint }}>
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
