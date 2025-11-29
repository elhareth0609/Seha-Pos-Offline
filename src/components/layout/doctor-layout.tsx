
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from "next-themes";

export function DoctorLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticatedDoctor, loading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && !isAuthenticatedDoctor) {
            router.replace('/doctor/login');
        }
    }, [isAuthenticatedDoctor, loading, router]);
    
    if (loading || !isAuthenticatedDoctor) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={['light', 'dark']}
        >
            {children}
        </ThemeProvider>
    );
}
