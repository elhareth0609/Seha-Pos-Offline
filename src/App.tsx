import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from '@/hooks/use-auth';
import { ThemeProvider } from "next-themes";
import { AppShell } from '@/components/layout/app-shell';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { UserPermissions } from '@/lib/types';
import { electronStorage } from '@/lib/electron-storage';

// Import pages
import LandingPage from './app/(landing)/page';
import LoginPage from './app/login/page';
import WelcomePage from './app/welcome/page';
import SalesPage from './app/sales/page';
import ReportsPage from './app/reports/page';
// import PatientsPage from './app/patients/page';

const allNavItems = [
    { href: "/sales", permissionKey: 'manage_sales' },
    { href: "/reports", permissionKey: 'manage_reports' },
    // { href: "/patients", permissionKey: 'manage_patients' },
];

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/welcome'];

function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const { loading, isAuthenticated, currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const pathname = location.pathname;
    const [isRedirecting, setIsRedirecting] = React.useState(false);

    React.useEffect(() => {
        // console.log('loading', loading)
        // console.log('currentUser', currentUser)
        // console.log('isAuthenticated', isAuthenticated)
        // console.log('pathname', pathname)

        if (loading || isRedirecting) return;

        // If user is authenticated and on the root route, redirect to sales
        if (isAuthenticated && pathname === '/') {
            console.log('[App] Authenticated at root, redirecting to /sales');
            setIsRedirecting(true);
            navigate('/sales');
            setTimeout(() => setIsRedirecting(false), 200);
            return;
        }

        // If user is not authenticated and trying to access a protected route, redirect to login
        if (!isAuthenticated && !PUBLIC_ROUTES.includes(pathname)) {
            console.log('[App] Not authenticated, redirecting to /login');
            setIsRedirecting(true);
            navigate('/login');
            setTimeout(() => setIsRedirecting(false), 200);
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
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={['light', 'dark', 'theme-pink']}
        >
            <AppShell>{children}</AppShell>
        </ThemeProvider>
    );
}

function App() {
    // Ensure hash routing works properly in Electron
    React.useEffect(() => {
        // Check if user is already authenticated
        const token = electronStorage.getItem('authToken');
        const currentUser = electronStorage.getItem('currentUser');

        // Only redirect to sales if both token and user exist
        // This prevents redirecting when session has expired but token wasn't properly cleared
        if (token && currentUser) {
            // Only redirect if not already on a hash route
            if (!window.location.hash || window.location.hash === '#/') {
                window.location.hash = '#/sales';
            }
        } else if (!window.location.hash) {
            // If not authenticated and no hash, set default hash
            window.location.hash = '#/';
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
                        {/* <Route path="/patients" element={<PatientsPage />} /> */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                    <Toaster />
                </LayoutWrapper>
            </AuthProvider>
        </Router>
    );
}

export default App;
