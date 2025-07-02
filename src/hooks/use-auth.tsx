"use client";

import * as React from 'react';
import { useLocalStorage } from './use-local-storage';
import type { User } from '@/lib/types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isSetup: boolean;
  loading: boolean;
  setupAdmin: (name: string) => void;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextType | null>(null);


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [users, setUsers] = useLocalStorage<User[]>('users', []);
  const [loading, setLoading] = React.useState(true);
  const [isSetup, setIsSetup] = React.useState(false);

  React.useEffect(() => {
    const setupDone = users.length > 0;
    setIsSetup(setupDone);
    
    // If setup is done but no one is logged in, log in the first user (admin) automatically
    if (setupDone && !currentUser) {
        setCurrentUser(users[0]);
    }

    setLoading(false);
  }, [users, currentUser, setCurrentUser]);


  const setupAdmin = (name: string) => {
    const adminUser: User = {
      id: 'ADMIN001',
      name: name,
      role: 'Admin',
    };
    const initialUsers = [
        adminUser,
        { id: "USR002", name: "سارة الموظفة", role: "Employee"},
        { id: "USR003", name: "أحمد الصيدلي", role: "Employee"},
    ];
    setUsers(initialUsers);
    setCurrentUser(adminUser);
    setIsSetup(true);
  };

  const logout = () => {
    setCurrentUser(null);
    window.location.reload(); 
  };
  
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, loading, isSetup, setupAdmin, logout }}>
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
