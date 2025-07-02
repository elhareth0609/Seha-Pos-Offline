"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';
import { Loader2 } from 'lucide-react';
import SetupPage from '@/components/layout/setup-page';

export default function AppLayoutClient({ children }: { children: React.ReactNode }) {
    const { loading, isSetup } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!isSetup) {
        return <SetupPage />;
    }

    return <AppShell>{children}</AppShell>;
}
