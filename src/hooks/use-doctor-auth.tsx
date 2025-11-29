
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from './use-toast';
import type { Doctor, Medication } from '@/lib/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface DoctorAuthContextType {
    currentDoctor: Doctor | null;
    isAuthenticatedDoctor: boolean;
    loading: boolean;
    login: (loginKey: string) => Promise<boolean>;
    logout: () => void;
    searchMedication: (query: string) => Promise<Medication[]>;
    addSuggestion: (suggestion: string) => Promise<boolean>;
}

const DoctorAuthContext = React.createContext<DoctorAuthContextType | null>(null);

async function apiRequest(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: object) {
    const token = localStorage.getItem('doctorToken');
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'An API error occurred');
        }
        
        if (response.status === 204) return null;

        return await response.json();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        throw error;
    }
}

export function DoctorAuthProvider({ children }: { children: React.ReactNode }) {
    const [currentDoctor, setCurrentDoctor] = React.useState<Doctor | null>(null);
    const [loading, setLoading] = React.useState(true);
    const router = useRouter();

    React.useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem('doctorToken');
            if (token) {
                try {
                    const data = await apiRequest('/doctor/profile');
                    setCurrentDoctor(data.data);
                } catch (error) {
                    localStorage.removeItem('doctorToken');
                }
            }
            setLoading(false);
        };
        initializeAuth();
    }, []);

    const login = async (loginKey: string) => {
        setLoading(true);
        try {
            const { doctor, token } = await apiRequest('/doctor/login', 'POST', { login_key: loginKey });
            localStorage.setItem('doctorToken', token);
            setCurrentDoctor(doctor);
            router.push(`/doctor/${doctor.login_key}`);
            return true;
        } catch (error) {
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('doctorToken');
        setCurrentDoctor(null);
        router.push('/doctor/login');
    };

    const searchMedication = async (query: string): Promise<Medication[]> => {
        try {
            const result = await apiRequest(`/doctor/inventory/search?q=${query}`);
            return result.data || [];
        } catch (error) {
            return [];
        }
    };

    const addSuggestion = async (suggestion: string): Promise<boolean> => {
        try {
            await apiRequest('/doctor/suggestions', 'POST', { suggestion });
            return true;
        } catch (error) {
            return false;
        }
    };
    
    const isAuthenticatedDoctor = !!currentDoctor;

    return (
        <DoctorAuthContext.Provider value={{ currentDoctor, isAuthenticatedDoctor, loading, login, logout, searchMedication, addSuggestion }}>
            {children}
        </DoctorAuthContext.Provider>
    );
}

export function useDoctorAuth() {
    const context = React.useContext(DoctorAuthContext);
    if (context === null) {
        throw new Error('useDoctorAuth must be used within a DoctorAuthProvider');
    }
    return context;
}
