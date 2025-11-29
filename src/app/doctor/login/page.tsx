
"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DoctorLoginPage() {
    const [loginKey, setLoginKey] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const { loginDoctor } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginKey.trim()) {
            toast({ variant: 'destructive', title: 'رمز الدخول مطلوب' });
            return;
        }
        setLoading(true);
        const doctor = await loginDoctor(loginKey);
        if (doctor) {
            router.replace(`/doctor/${doctor.login_key}`);
        } else {
            toast({ variant: 'destructive', title: 'رمز الدخول غير صالح' });
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95">
                <CardHeader className="text-center">
                     <div className="mx-auto mb-4">
                        <img src="/favicon.png" alt="Site Icon" className="h-12 w-12" />
                    </div>
                    <CardTitle className="text-2xl">بوابة الطبيب</CardTitle>
                    <CardDescription>
                        الرجاء إدخال رمز الدخول الخاص بك.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 text-right">
                            <Label htmlFor="login-key">رمز الدخول</Label>
                            <Input 
                                id="login-key" 
                                value={loginKey} 
                                onChange={(e) => setLoginKey(e.target.value)} 
                                required 
                                autoFocus
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'جاري التحقق...' : <><LogIn className="me-2 h-4 w-4" /> دخول</>}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
