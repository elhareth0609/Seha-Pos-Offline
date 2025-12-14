"use client";

import { useEffect, useState } from 'react';
import { Card } from './card';
import { Button } from './button';
import { Download, RefreshCw, X } from 'lucide-react';

interface UpdateInfo {
    version: string;
    releaseDate?: string;
}

interface ProgressInfo {
    percent: number;
    transferred: number;
    total: number;
}

export function UpdateNotification() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [updateDownloaded, setUpdateDownloaded] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [isDownloading, setIsDownloading] = useState(false);
    const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        // Check if window.electron exists (only in Electron environment)
        if (typeof window === 'undefined' || !window.electron?.ipcRenderer) {
            return;
        }

        const handleUpdateAvailable = (info: UpdateInfo) => {
            console.log('Update available:', info);
            setUpdateAvailable(true);
            setUpdateInfo(info);
            setIsDismissed(false);
        };

        const handleUpdateDownloaded = (info: UpdateInfo) => {
            console.log('Update downloaded:', info);
            setUpdateDownloaded(true);
            setIsDownloading(false);
            setIsDismissed(false);
        };

        const handleDownloadProgress = (progress: ProgressInfo) => {
            setDownloadProgress(Math.round(progress.percent));
        };

        const handleUpdateError = (error: string) => {
            console.error('Update error:', error);
            setIsDownloading(false);
        };

        // Register listeners
        const cleanupAvailable = window.electron.ipcRenderer.on('update-available', handleUpdateAvailable);
        const cleanupDownloaded = window.electron.ipcRenderer.on('update-downloaded', handleUpdateDownloaded);
        const cleanupProgress = window.electron.ipcRenderer.on('download-progress', handleDownloadProgress);
        const cleanupError = window.electron.ipcRenderer.on('update-error', handleUpdateError);

        // Cleanup on unmount
        return () => {
            if (cleanupAvailable) cleanupAvailable();
            if (cleanupDownloaded) cleanupDownloaded();
            if (cleanupProgress) cleanupProgress();
            if (cleanupError) cleanupError();
        };
    }, []);

    const handleDownload = () => {
        setIsDownloading(true);
        window.electron?.ipcRenderer.send('download-update');
    };

    const handleInstall = () => {
        window.electron?.ipcRenderer.send('install-update');
    };

    const handleDismiss = () => {
        setIsDismissed(true);
    };

    if (isDismissed || (!updateAvailable && !updateDownloaded)) {
        return null;
    }

    return (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
            <Card className="p-4 shadow-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-950 min-w-[300px]">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        {updateDownloaded ? (
                            <p className="font-bold text-blue-900 dark:text-blue-100">
                                ✅ التحديث جاهز للتثبيت
                            </p>
                        ) : (
                            <>
                                <p className="font-bold text-blue-900 dark:text-blue-100">
                                    🎉 تحديث جديد متوفر
                                </p>
                                {updateInfo && (
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        الإصدار {updateInfo.version}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleDismiss}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-3">
                    {updateDownloaded ? (
                        <Button
                            onClick={handleInstall}
                            className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                            <RefreshCw className="ml-2 h-4 w-4" />
                            إعادة التشغيل والتحديث
                        </Button>
                    ) : (
                        <>
                            {isDownloading ? (
                                <div className="space-y-2">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${downloadProgress}%` }}
                                        />
                                    </div>
                                    <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
                                        جاري التنزيل: {downloadProgress}%
                                    </p>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleDownload}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    <Download className="ml-2 h-4 w-4" />
                                    تحميل التحديث
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}
