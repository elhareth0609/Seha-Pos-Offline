"use client";

import * as React from 'react';
import { useLocalStorage } from './use-local-storage';
import type { User } from '@/lib/types';
import { users as fallbackUsers } from '@/lib/data';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;
  isSetup: boolean;
  loading: boolean;
  setupAdmin: (name: string, email: string, pin: string) => void;
  login: (email: string, pin: string) => Promise<boolean>;
  logout: () => void;
  registerUser: (name: string, email: string, pin: string) => Promise<boolean>;
  resetPin: (email: string, newPin: string) => Promise<boolean>;
  checkUserExists: (email: string) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<boolean>;
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

  const setupAdmin = (name: string, email: string, pin: string) => {
    const adminUser: User = {
      id: 'ADMIN001',
      name: name,
      email: email,
      role: 'Admin',
      pin: pin,
    };
    setUsers([adminUser]);
    setCurrentUser(adminUser);
  };
  
  const registerUser = async (name: string, email: string, pin: string): Promise<boolean> => {
      const userExists = users.some(u => u && u.email && u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
          return false; // Email already taken
      }
      const newUser: User = {
          id: `USR${(users.length + 1).toString().padStart(3, '0')}`,
          name,
          email,
          pin,
          role: 'Employee'
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

  const login = async (email: string, pin: string): Promise<boolean> => {
    const userToLogin = users.find(u => u && u.email && u.email.toLowerCase() === email.toLowerCase() && u.pin === pin);
    if (userToLogin) {
      setCurrentUser(userToLogin);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete || userToDelete.role === 'Admin') {
        return false;
    }
    setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    return true;
  };
  
  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, users, isAuthenticated, loading, isSetup, setupAdmin, login, logout, registerUser, checkUserExists, resetPin, deleteUser }}>
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
