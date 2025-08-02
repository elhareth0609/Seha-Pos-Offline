
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
    const [isInitialRedirectDone, setIsInitialRedirectDone] = React.useState(false);

    React.useEffect(() => {
        if (loading) return;

        if (isAuthenticated && !isInitialRedirectDone) {
            if (currentUser?.role === 'SuperAdmin') {
                if (!pathname.startsWith('/superadmin')) {
                    router.replace('/superadmin');
                }
            } else {
                if (pathname.startsWith('/superadmin')) {
                    router.replace('/sales');
                } else if (pathname === '/') {
                    router.replace('/sales');
                }
            }
            setIsInitialRedirectDone(true);
        }
    }, [loading, isAuthenticated, currentUser, pathname, router, isInitialRedirectDone]);

    if (loading || (isAuthenticated && !isInitialRedirectDone)) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!isSetup && false) {
        return <SetupPage />;
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // Render layout based on role after loading and initial redirect checks
    if(pathname?.startsWith('/superadmin')) {
        if (currentUser?.role === 'SuperAdmin') {
            return <>{children}</>;
        }
        // While redirecting, show a loader
        return (
             <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    // For non-superadmin users
    if (currentUser?.role !== 'SuperAdmin') {
        return <AppShell>{children}</AppShell>;
    }
    
    // Fallback loader while redirecting superadmin from a non-superadmin page
    return (
         <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
    );
}
