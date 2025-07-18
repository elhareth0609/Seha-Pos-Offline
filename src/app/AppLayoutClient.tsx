
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2 } from 'lucide-react';
import SetupPage from '@/components/auth/SetupPage';
import LoginPage from '@/components/auth/LoginPage';
import { usePathname } from 'next/navigation';

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
    const { loading, isSetup, isAuthenticated, currentUser } = useAuth();
    const pathname = usePathname();

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
    
    // SuperAdmin has access to their own page without full login shell
    if (pathname === '/superadmin' && currentUser?.role === 'SuperAdmin') {
        return <>{children}</>;
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    return <AppShell>{children}</AppShell>;
}
