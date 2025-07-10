
"use client";

import * as React from 'react';
import { useLocalStorage } from './use-local-storage';
import type { User, UserPermissions } from '@/lib/types';
import { users as fallbackUsers } from '@/lib/data';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  setUsers: (users: User[] | ((val: User[]) => User[])) => void;
  isAuthenticated: boolean;
  isSetup: boolean;
  loading: boolean;
  setupAdmin: (name: string, email: string, pin: string, image1DataUri: string, image2DataUri: string) => void;
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
  const [users, setUsers] = useLocalStorage<User[]>('users', fallbackUsers);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('currentUser', null);
  const [loading, setLoading] = React.useState(true);

  const isSetup = users.length > 0;

  React.useEffect(() => {
    setLoading(false);
  }, []);

  const setupAdmin = (name: string, email: string, pin: string, image1DataUri: string, image2DataUri: string) => {
    const adminUser: User = {
      id: 'ADMIN001',
      name: name,
      email: email,
      role: 'Admin',
      pin: pin,
      permissions: allPermissions,
      image1DataUri,
      image2DataUri
    };
    setUsers([adminUser]);
    setCurrentUser(adminUser);
  };
  
  const registerUser = async (name: string, email: string, pin: string): Promise<boolean> => {
      const userExists = users.some(u => u.email && u.email.toLowerCase() === email.toLowerCase());
      if (userExists) {
        return false;
      }
      
      const newUser: User = {
          id: `USR${Date.now()}`,
          name,
          email,
          pin,
          role: 'Employee',
          permissions: defaultEmployeePermissions,
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

  const isAuthenticated = !!currentUser;

  return (
    <AuthContext.Provider value={{ currentUser, users, setUsers, isAuthenticated, loading, isSetup, setupAdmin, login, logout, registerUser, checkUserExists, resetPin, updateUserPermissions }}>
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
