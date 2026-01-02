import { useEffect, useState, useCallback } from 'react';
import { useOnlineStatus } from './use-online-status-electron';
import { db } from '@/lib/db';
import { toast } from './use-toast';
import { electronStorage } from '@/lib/electron-storage';

export function useSync(refreshData: () => Promise<void>) {
    const isOnline = useOnlineStatus();
    const [isSyncing, setIsSyncing] = useState(false);

    const syncRequests = useCallback(async () => {
        if (!isOnline || isSyncing) return;

        const requests = await db.offlineRequests.toArray();
        if (requests.length === 0) return;

        setIsSyncing(true);
        let successCount = 0;
        let failCount = 0;

        try {
            toast({ title: 'جاري المزامنة...', description: 'يتم الآن إرسال البيانات المحفوظة محلياً.' });

            for (const req of requests) {
                try {
                    const headers: HeadersInit = {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    };

                    // We need to handle auth tokens here or ensure apiRequest handles it if we reuse it.
                    // Ideally, we should reuse the apiRequest logic but avoid circular dependencies.
                    // For now, let's grab the token from localStorage directly.
                    const token = electronStorage.getItem('authToken');

                    if (token) {
                        headers['Authorization'] = `Bearer ${token}`;
                    }

                    const API_URL = import.meta.env.VITE_API_URL || 'https://backend.midgram.net/api';
                    const fullUrl = req.url.startsWith('http') ? req.url : `${API_URL}${req.url}`;

                    const response = await fetch(fullUrl, {
                        method: req.method,
                        headers,
                        body: req.body ? JSON.stringify(req.body) : undefined,
                    });

                    if (response.ok) {
                        await db.offlineRequests.delete(req.id!);
                        successCount++;
                    } else {
                        const errorText = await response.text();
                        console.error(`Failed to sync request ${req.id}:`, errorText);

                        // Check if it's a validation error (422) or other client error (4xx)
                        // These errors won't be fixed by retrying, so we should remove the request
                        if (response.status >= 400 && response.status < 500) {
                            console.warn(`Request ${req.id} has a permanent error (status ${response.status}), removing from queue`);
                            await db.offlineRequests.delete(req.id!);

                            // Parse error message to show to user
                            let errorMessage = 'فشلت العملية بسبب خطأ في البيانات';
                            try {
                                const errorData = JSON.parse(errorText);
                                if (errorData.message) {
                                    errorMessage = errorData.message;
                                }
                            } catch (e) {
                                // Use default message if parsing fails
                            }

                            toast({ 
                                variant: 'destructive', 
                                title: 'فشلت العملية', 
                                description: errorMessage 
                            });
                        } else {
                            // Server errors (5xx) or network errors - increment fail count
                            failCount++;
                        }
                    }
                } catch (error) {
                    console.error(`Error syncing request ${req.id}:`, error);
                    failCount++;
                }
            }

            if (successCount > 0) {
                toast({ title: 'تمت المزامنة بنجاح', description: `تم إرسال ${successCount} عملية إلى الخادم.` });
                await refreshData(); // Refresh local data from server to ensure consistency
            }

            if (failCount > 0) {
                toast({ variant: 'destructive', title: 'فشل بعض العمليات', description: `فشل إرسال ${failCount} عملية. سيتم المحاولة لاحقاً.` });
            }

        } catch (error) {
            console.error("Sync process failed:", error);
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, isSyncing, refreshData]);

    // Auto-sync when coming online
    useEffect(() => {
        if (isOnline) {
            syncRequests();
        }
    }, [isOnline, syncRequests]);

    return { isSyncing, syncRequests };
}
