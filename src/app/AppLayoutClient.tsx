
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
    const { loading, isAuthenticated, isSetup, setIsSetup, currentUser } = useAuth();
    
    React.useEffect(() => {
        // Only run this check if we have an authenticated user.
        if (!currentUser) return;
    
        const checkSetup = async () => {
            const setupDocRef = doc(db, "settings", "main");
            try {
                const docSnap = await getDoc(setupDocRef);
                setIsSetup(docSnap.exists());
            } catch (error) {
                console.error("Error checking setup status:", error);
                // Handle cases where firestore might be unavailable (e.g. offline on first load)
                // We might want to assume it is not set up, or handle gracefully.
                setIsSetup(false); 
            }
        };

        checkSetup();
    }, [currentUser, setIsSetup]);


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
