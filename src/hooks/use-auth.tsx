"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from './use-local-storage';
import { users as fallbackUsers } from '@/lib/data';
import type { User } from '@/lib/types';

interface AuthContextType {
  currentUser: User | null;
  login: (pin: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [users] = useLocalStorage<User[]>('users', fallbackUsers);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    // On initial load, we can determine if we are authenticated or not
    setLoading(false);
  }, [currentUser]);

  const login = async (pin: string): Promise<boolean> => {
    const user = users.find(u => u.pin === pin);
    if (user) {
      setCurrentUser(user);
      router.push('/');
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    router.push('/login');
  };
  
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isAuthenticated, loading }}>
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
