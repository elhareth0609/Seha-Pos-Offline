
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import type { UserPermissions } from '@/lib/types';
import { ThemeProvider } from "next-themes";


const allNavItems = [
    { href: "/dashboard", permissionKey: null },
    { href: "/sales", permissionKey: 'manage_sales' },
    { href: "/inventory", permissionKey: 'manage_inventory' },
    { href: "/exchange", permissionKey: 'manage_exchange' },
    //   { href: "/representatives", permissionKey: 'manage_representatives' },
    { href: "/purchases", permissionKey: 'manage_purchases' },
    { href: "/suppliers", permissionKey: 'manage_suppliers' },
    { href: "/reports", permissionKey: 'manage_reports' },
    { href: "/expenses", permissionKey: 'manage_expenses' },
    { href: "/tasks", permissionKey: 'manage_tasks' },
    { href: "/item-movement", permissionKey: 'manage_itemMovement' },
    { href: "/patients", permissionKey: 'manage_patients' },
    { href: "/expiring-soon", permissionKey: 'manage_expiringSoon' },
    { href: "/trash", permissionKey: 'manage_trash' },
    { href: "/guide", permissionKey: 'manage_guide' },
    { href: "/doctors", permissionKey: 'manage_doctors' },
    { href: "/settings", permissionKey: 'manage_settings' },
    { href: "/hr", permissionKey: 'manage_hr' },
];

const PUBLIC_ROUTES = ['/', '/login', '/signup'];

function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const { loading, isAuthenticated, currentUser } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    React.useEffect(() => {
        if (loading) return;

        // If user is not authenticated and trying to access a protected route, redirect to login
        // Allow doctor routes to handle their own auth
        if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname) && !pathname.startsWith('/doctor/')) {
            router.replace('/login');
            return;
        }

        // If user is authenticated, handle role-based redirects and permissions
        if (isAuthenticated && currentUser) {
            if (currentUser.role === 'SuperAdmin' && !pathname.startsWith('/superadmin')) {
                router.replace('/superadmin');
                return;
            }

            if (currentUser.role !== 'SuperAdmin' && pathname.startsWith('/superadmin')) {
                router.replace('/dashboard');
                return;
            }

            if (currentUser.role === 'Employee') {
                const currentNavItem = allNavItems.find(item =>
                    item.href === pathname || (item.href !== '/' && pathname.startsWith(`${item.href}/`))
                );
                const requiredPermission = currentNavItem?.permissionKey;
                const userPermissions = currentUser.permissions as UserPermissions;

                if (requiredPermission && (!userPermissions || !userPermissions[requiredPermission as keyof UserPermissions])) {
                    router.replace('/dashboard');
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
    if (PUBLIC_ROUTES.includes(pathname) || pathname?.startsWith('/doctor/')) {
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

    // Check if SuperAdmin needs to be redirected - show loading instead of flashing dashboard
    if (currentUser.role === 'SuperAdmin' && !pathname.startsWith('/superadmin')) {
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
