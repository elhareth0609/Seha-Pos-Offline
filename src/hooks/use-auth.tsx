"use client";

import * as React from 'react';
import { useLocalStorage } from './use-local-storage';
import { users as fallbackUsers } from '@/lib/data';
import type { User } from '@/lib/types';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  logout: () => void; // Keep logout to allow resetting state if needed, though not a real logout
}

const AuthContext = React.createContext<AuthContextType | null>(null);

// Create a static admin user that represents the main operator of the app
const adminUser: User = {
  id: 'ADMIN001',
  name: 'المدير العام',
  role: 'Admin',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // We use local storage to persist the "session", but there's no real login.
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // On initial load, we set the admin user as the current user.
    // This replaces the need for a login page.
    if (currentUser === null) {
        setCurrentUser(adminUser);
    }
    setLoading(false);
  }, [currentUser, setCurrentUser]);

  const logout = () => {
    // In a real app, this would clear tokens. Here we just clear the user.
    // But since we auto-log-in, this will just reset to the admin.
    // We'll make it inaccessible from the UI for now.
    setCurrentUser(null);
    window.location.reload(); // Force a reload to restart the session
  };
  
  // The user is considered authenticated if the currentUser object exists.
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, loading, logout }}>
      {!loading && children}
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
