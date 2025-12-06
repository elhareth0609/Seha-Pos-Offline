
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { UserPermissions } from '@/lib/types';
import { ThemeProvider } from "next-themes";


const allNavItems = [
    { href: "/sales", permissionKey: 'manage_sales' },
    { href: "/reports", permissionKey: 'manage_reports' },
    { href: "/patients", permissionKey: 'manage_patients' },
];

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/welcome'];

function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const { loading, isAuthenticated, currentUser } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    React.useEffect(() => {
        console.log('dddddddd')
        if (loading) return;

        // If user is not authenticated and trying to access a protected route, redirect to login
        if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
            router.replace('/login');
            return;
        }

        // If user is authenticated, handle role-based redirects and permissions
        if (isAuthenticated && currentUser) {

            if (currentUser.role === 'Employee') {
                const currentNavItem = allNavItems.find(item =>
                    item.href === pathname || (item.href !== '/' && pathname.startsWith(`${item.href}/`))
                );
                const requiredPermission = currentNavItem?.permissionKey;
                const userPermissions = currentUser.permissions as UserPermissions;

                if (requiredPermission && (!userPermissions || !userPermissions[requiredPermission as keyof UserPermissions])) {
                    router.replace('/sales');
                }
            }
        }

    }, [isAuthenticated, currentUser, loading, pathname, router]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // Public routes are rendered without the AppShell and ThemeProvider
    if (PUBLIC_ROUTES.includes(pathname)) {
        return <>{children}</>;
    }

    // If authenticated, but user data is not yet available, show loader
    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // Handle regular user routes with AppShell and ThemeProvider
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={['light', 'dark']}
        >
            <AppShell>{children}</AppShell>
        </ThemeProvider>
    );
}


export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
    return <LayoutWrapper>{children}</LayoutWrapper>
}
