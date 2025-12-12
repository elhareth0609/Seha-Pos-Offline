"use client";

import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useOnlineStatus } from '@/hooks/use-online-status-electron';
import { WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

export function NetworkStatus() {
    const isOnline = useOnlineStatus();
    const offlineRequestCount = useLiveQuery(async () => {
        return await db.offlineRequests.count();
    });

    // Don't show anything if online and no pending requests
    if (isOnline && (offlineRequestCount === 0 || offlineRequestCount === undefined)) {
        return null;
    }

    return (
        <div className="fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-2 fade-in duration-300 pointer-events-none">
            <Card className={cn(
                "flex items-center gap-3 p-3 shadow-lg border-2 pointer-events-auto",
                !isOnline
                    ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
            )}>
                {!isOnline ? (
                    <>
                        <div className="relative">
                            <WifiOff className="h-5 w-5" />
                            {offlineRequestCount && offlineRequestCount > 0 ? (
                                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground font-bold">
                                    !
                                </span>
                            ) : null}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">لا يوجد اتصال</span>
                            {offlineRequestCount && offlineRequestCount > 0 ? (
                                <span className="text-xs opacity-90">{offlineRequestCount} عملية بانتظار الرفع</span>
                            ) : (
                                <span className="text-xs opacity-90">وضع عدم الاتصال</span>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">جاري المزامنة...</span>
                            <span className="text-xs opacity-90">يتم رفع {offlineRequestCount} عملية</span>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
}
