
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { LogIn } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = React.useState('');
    const [pin, setPin] = React.useState('');
    const { login, isAuthenticated, loading, currentUser } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!loading && isAuthenticated) {
             if (currentUser?.role === 'SuperAdmin') {
                router.replace('/superadmin');
            } else {
                router.replace('/dashboard');
            }
        }
    }, [isAuthenticated, loading, router, currentUser]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await login(email, pin);
    };

    if (loading || isAuthenticated) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-muted/40">
                {/* You can add a loader here if you want */}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <div className="relative w-full max-w-sm">
                 <Card className="w-full shadow-2xl animate-in fade-in zoom-in-95">
                    <CardHeader className="text-center">
                         <div className="mx-auto mb-4">
                             <Link href="/">
                                <img src="/icon.png" alt="Site Icon" className="h-12 w-12" />
                            </Link>
                        </div>
                        <CardTitle className="text-2xl">مرحبًا بعودتك!</CardTitle>
                        <CardDescription>
                            الرجاء تسجيل الدخول للمتابعة.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                             <div className="space-y-2 text-right">
                                <Label htmlFor="login-email">البريد الإلكتروني</Label>
                                <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required />
                            </div>
                            <div className="space-y-2 text-right">
                                <Label htmlFor="login-pin">كلمة المرور (PIN)</Label>
                                <Input id="login-pin" type="password"  value={pin} onChange={(e) => setPin(e.target.value)}  required placeholder="••••••" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button type="submit" className="w-full">
                                <LogIn className="me-2 h-4 w-4" />
                                تسجيل الدخول
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
