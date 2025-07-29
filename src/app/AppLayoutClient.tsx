
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
        if (!loading && isAuthenticated) {
            if (currentUser?.role === 'SuperAdmin' && !pathname.startsWith('/superadmin')) {
                router.replace('/superadmin');
            } else if (currentUser?.role !== 'SuperAdmin' && pathname.startsWith('/superadmin')) {
                router.replace('/');
            }
        }
    }, [loading, isAuthenticated, currentUser, pathname, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    console.log(isSetup);
    if (!isSetup) {
        return <SetupPage />;
    }

    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // This final check prevents a flicker of the wrong layout before redirection.
    if (currentUser?.role === 'SuperAdmin' && !pathname.startsWith('/superadmin')) {
        return (
             <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if (currentUser?.role !== 'SuperAdmin' && pathname.startsWith('/superadmin')) {
         return (
             <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if(pathname.startsWith('/superadmin')) {
        return <>{children}</>;
    }

    return <AppShell>{children}</AppShell>;
}
