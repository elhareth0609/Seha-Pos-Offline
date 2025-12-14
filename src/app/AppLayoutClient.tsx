
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
    
    // For hash routing, get the path from the hash
    const getHashPath = () => {
        const hash = window.location.hash;
        return hash ? hash.slice(1) : '/'; // Remove # and return path or default to '/'
    };
    
    const pathname = location.pathname || getHashPath();
    const navigate = useNavigate();

    React.useEffect(() => {
        console.log('[Layout] Effect Triggered. State:', {
            loading,
            hasCurrentUser: !!currentUser,
            isAuthenticated,
            pathname
        });
        
        // Check network status on initial load
        console.log(`Network status: ${navigator.onLine ? 'Online' : 'Offline'}`);

        // IMMEDIATE FORCE REDIRECT - before any other checks
        // This ensures authenticated users NEVER see the / route
        if (!loading && isAuthenticated && pathname === '/') {
            console.log('[Layout] 🚀 IMMEDIATE REDIRECT to /sales');
            window.location.hash = '#/sales';
            return;
        }

        // STRICT CHECK: Do nothing while loading
        if (loading) {
            console.log('[Layout] Still loading, waiting...');
            return;
        }

        // If user is not authenticated and trying to access a protected route, redirect to login
        if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
            console.log('[Layout] Not authenticated & Protected Route -> Redirecting to /login');
            // Double check that we are REALLY not authenticated
            window.location.hash = '#/login';
            return;
        }

        // REDIRECT from root / to /sales if authenticated
        // This fixes the "Navbar not seen" issue because / is public (no navbar) but logged in users shouldn't stay there.
        if (isAuthenticated && pathname === '/') {
            console.log('[Layout] Authenticated at root -> Redirecting to /sales');
            window.location.hash = '#/sales';
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
                    window.location.hash = '#/sales';
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

    // DEBUG: Log state before blocking check
    console.log('🔍 BLOCKING CHECK:', {
        normalizedPathname,
        isRoot: normalizedPathname === '/',
        isAuthenticated,
        currentUser: !!currentUser,
        willBlock: normalizedPathname === '/' && isAuthenticated
    });

    // FORCE REBUILD: 2025-12-13-22:45
    // CRITICAL: Block rendering of `/` for authenticated users to force redirect
    // This prevents the "public route flash" and ensures navbar appears
    if (normalizedPathname === '/' && isAuthenticated) {
        console.log('🚫 Blocking render of / for authenticated user, redirect pending...');
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    // Public routes are rendered without the AppShell and ThemeProvider
    // But authenticated users should never see the root route
    if (PUBLIC_ROUTES.includes(normalizedPathname) && !(normalizedPathname === '/' && isAuthenticated)) {
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
