
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, PackagePlus } from 'lucide-react';

export default function SetupPage() {
    const { setupAdmin } = useAuth();
    const { toast } = useToast();

    // The component will now automatically trigger the setup with default credentials
    // on first mount, removing the form.
    React.useEffect(() => {
        const runSetup = async () => {
            try {
                // Use default credentials for the initial setup.
                await setupAdmin('Super Admin', 'superadmin@midgram.com', '0000');
                toast({ 
                    title: 'اكتمل الإعداد!', 
                    description: `تم إعداد حساب المدير العام الافتراضي. سيتم إعادة تحميل الصفحة.`,
                    duration: 5000,
                });
                // Reload to reflect the new state (isSetup will be true)
                setTimeout(() => window.location.reload(), 2000);
            } catch (error) {
                 toast({ variant: 'destructive', title: 'خطأ', description: 'حدثت مشكلة أثناء إعداد الحساب.' });
            }
        };
        runSetup();
    }, [setupAdmin, toast]);


    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
                <CardHeader className="text-center">
                     <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full">
                        <PackagePlus className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">مرحبًا بك في Midgram</CardTitle>
                    <CardDescription>
                        جاري إعداد النظام لأول مرة. الرجاء الانتظار...
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p>يتم الآن إنشاء حساب المدير العام الافتراضي.</p>
                </CardContent>
            </Card>
        </div>
    );
}
