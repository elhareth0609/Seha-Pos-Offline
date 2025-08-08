"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2 } from 'lucide-react';
import SetupPage from '@/components/auth/SetupPage';
import LoginPage from '@/components/auth/LoginPage';
import { usePathname, useRouter } from 'next/navigation';

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
    const { loading, isSetup, isAuthenticated, currentUser } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    React.useEffect(() => {
        if (loading || !isAuthenticated || !currentUser) return;
        
        if (currentUser.role === 'SuperAdmin' && !pathname.startsWith('/superadmin')) {
            router.replace('/superadmin');
        } else if (currentUser.role !== 'SuperAdmin' && (pathname === '/' || pathname.startsWith('/superadmin'))) {
            router.replace('/sales');
        }
    }, [loading, isAuthenticated, currentUser, pathname, router]);

    // Show loading spinner
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // Show setup page if not set up
    if (!isSetup) {
        return <SetupPage />;
    }

    // Show login page if not authenticated
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // Wait for currentUser to be available
    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // Check if SuperAdmin needs to be redirected - show loading instead of flashing dashboard
    if (currentUser.role === 'SuperAdmin' && !pathname.startsWith('/superadmin')) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // Check if non-SuperAdmin needs to be redirected from SuperAdmin routes or root
    if (currentUser.role !== 'SuperAdmin' && (pathname === '/' || pathname.startsWith('/superadmin'))) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // Handle SuperAdmin routes
    if (pathname?.startsWith('/superadmin')) {
        if (currentUser.role === 'SuperAdmin') {
            return <>{children}</>;
        }
        // This shouldn't happen due to redirect check above, but just in case
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // Handle regular user routes
    return <AppShell>{children}</AppShell>;
}