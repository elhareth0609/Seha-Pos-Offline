
'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackagePlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SetupPage() {
    const { setupAdmin, isSetup } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const setupRun = React.useRef(false);
    
    React.useEffect(() => {
        // Prevent this effect from running twice in strict mode or on re-renders.
        if (isSetup || setupRun.current) return;
        setupRun.current = true;

        const runSetup = async () => {
            try {
                await setupAdmin('Super Admin', 'superadmin@midgram.com', '0000');
                toast({ 
                    title: 'اكتمل الإعداد!', 
                    description: `تم إعداد حساب المدير العام الافتراضي. سيتم إعادة تحميل الصفحة.`,
                    duration: 5000,
                });
                setTimeout(() => window.location.reload(), 2000);
            } catch (error) {
                 toast({ variant: 'destructive', title: 'خطأ', description: 'حدثت مشكلة أثناء إعداد الحساب.' });
            }
        };
        runSetup();
    }, [isSetup, setupAdmin, toast, router]);


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
