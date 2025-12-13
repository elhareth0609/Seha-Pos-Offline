
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
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
    const location = useLocation();
    const pathname = location.pathname;
    const navigate = useNavigate();

    React.useEffect(() => {
        console.log('[Layout] Effect Triggered. State:', {
            loading,
            hasCurrentUser: !!currentUser,
            isAuthenticated,
            pathname
        });

        // STRICT CHECK: Do nothing while loading
        if (loading) {
            console.log('[Layout] Still loading, waiting...');
            return;
        }

        // If user is not authenticated and trying to access a protected route, redirect to login
        if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
            console.log('[Layout] Not authenticated & Protected Route -> Redirecting to /login');
            // Double check that we are REALLY not authenticated
            navigate('/login');
            return;
        }

        // REDIRECT from root / to /sales if authenticated
        // This fixes the "Navbar not seen" issue because / is public (no navbar) but logged in users shouldn't stay there.
        if (isAuthenticated && pathname === '/') {
            console.log('[Layout] Authenticated at root -> Redirecting to /sales');
            navigate('/sales');
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
                    navigate('/sales');
                }
            }
        }

    }, [isAuthenticated, currentUser, loading, pathname, navigate]);


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // Normalize pathname (remove trailing slash for matching)
    const normalizedPathname = pathname.endsWith('/') && pathname !== '/'
        ? pathname.slice(0, -1)
        : pathname;

    console.log('🔍 Checking route:', { pathname, normalizedPathname, isPublic: PUBLIC_ROUTES.includes(normalizedPathname) });

    // Public routes are rendered without the AppShell and ThemeProvider
    if (PUBLIC_ROUTES.includes(normalizedPathname)) {
        console.log('✅ Rendering public route:', normalizedPathname);
        return <>{children}</>;
    }

    // If on a protected route but user data is not yet available, show loader
    // This should only happen briefly during the authentication check
    if (!currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // Handle regular user routes with AppShell and ThemeProvider
    console.log('✅ Rendering Protected AppShell (Navbar should be visible)');
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
