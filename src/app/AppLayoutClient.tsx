
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2 } from 'lucide-react';
import SetupPage from '@/components/auth/SetupPage';
import LoginPage from '@/components/auth/LoginPage';
import { db } from '@/hooks/use-firestore';
import { doc, getDoc } from 'firebase/firestore';


export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
    const { loading, isAuthenticated, isSetup, setIsSetup } = useAuth();
    
    React.useEffect(() => {
        // Check if the initial setup has been done by looking for a specific document
        const checkSetup = async () => {
            const setupDocRef = doc(db, "settings", "main");
            const docSnap = await getDoc(setupDocRef);
            setIsSetup(docSnap.exists());
        };

        checkSetup();
    }, [setIsSetup]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!isSetup) {
        return <SetupPage />;
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    return <AppShell>{children}</AppShell>;
}
