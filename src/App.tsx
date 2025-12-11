import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from "next-themes";
import { AppShell } from '@/components/layout/app-shell';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { UserPermissions } from '@/lib/types';

// Import pages
import LandingPage from './app/(landing)/page';
import LoginPage from './app/login/page';
import WelcomePage from './app/welcome/page';
import SalesPage from './app/sales/page';
import ReportsPage from './app/reports/page';
import PatientsPage from './app/patients/page';

const allNavItems = [
    { href: "/sales", permissionKey: 'manage_sales' },
    { href: "/reports", permissionKey: 'manage_reports' },
    { href: "/patients", permissionKey: 'manage_patients' },
];

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/welcome'];

function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const { loading, isAuthenticated, currentUser } = useAuth();
    // Use hash for routing in Electron environment
    const getHashPath = () => {
        const hash = window.location.hash;
        return hash ? hash.slice(1) : '/'; // Remove # and return path or default to '/'
    };
    const [pathname, setPathname] = React.useState(getHashPath());
    
    // Update pathname when hash changes
    React.useEffect(() => {
        const handleHashChange = () => {
            setPathname(getHashPath());
        };
        
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);
    
    // Update pathname on initial load
    React.useEffect(() => {
        setPathname(getHashPath());
    }, []);
    
    // Update pathname when authentication state changes
    React.useEffect(() => {
        if (isAuthenticated && currentUser) {
            setPathname(getHashPath());
        }
    }, [isAuthenticated, currentUser]);

    React.useEffect(() => {
        console.log('loading', loading)
        console.log('currentUser', currentUser)
        console.log('isAuthenticated', isAuthenticated)
        if (loading) return;

        // If user is not authenticated and trying to access a protected route, redirect to login
        if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
            window.location.hash = '#/login';
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
    }, [isAuthenticated, currentUser, loading, pathname]);

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

function App() {
    // Ensure hash routing works properly in Electron
    React.useEffect(() => {
        if (!window.location.hash) {
            window.location.hash = '#/' ;
        }
    }, []);
    
    return (
        <Router>
            <AuthProvider>
                <LayoutWrapper>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/welcome" element={<WelcomePage />} />
                        <Route path="/sales" element={<SalesPage />} />
                        <Route path="/reports" element={<ReportsPage />} />
                        <Route path="/patients" element={<PatientsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <Toaster />
                </LayoutWrapper>
            </AuthProvider>
        </Router>
    );
}

export default App;
