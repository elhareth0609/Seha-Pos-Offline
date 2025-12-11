
'use client';

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { LogIn, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

function SuperAdminLoginDialog() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSuperAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const email = formData.get('email') as string;
        const pin = formData.get('pin') as string;
        
        const user = await login(email, pin);
        if (user) {
            if (user.role === 'SuperAdmin') {
                navigate('/superadmin');
            } else {
                navigate('/');
            }
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>تسجيل دخول المدير العام</DialogTitle>
                <DialogDescription>
                    هذه البوابة مخصصة لمسؤولي الشركة فقط.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSuperAdminLogin} className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label htmlFor="superadmin-email">البريد الإلكتروني</Label>
                    <Input id="superadmin-email" name="email" type="email" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="superadmin-pin">رمز PIN</Label>
                    <Input id="superadmin-pin" name="pin" type="password" required />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" type="button">إلغاء</Button></DialogClose>
                    <Button type="submit">دخول</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}

export default function LoginPage() {
    const { login, isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, loading, navigate]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const email = formData.get('email') as string;
        const pin = formData.get('pin') as string;
        console.log(email, pin);

        // Validate PIN: at least 8 characters and at least one letter
        if (pin.length < 8) {
            // alert("رمز PIN يجب أن يكون 8 أحرف على الأقل");
            toast({ variant: 'destructive', title: 'رمز PIN يجب أن يكون 8 أحرف على الأقل' });
            return;
        }
        if (!/[a-zA-Z]/.test(pin)) {
            toast({ variant: 'destructive', title: 'رمز PIN يجب أن يحتوي على حرف واحد على الأقل' });
            // alert("رمز PIN يجب أن يحتوي على حرف واحد على الأقل");
            return;
        }

        
        await login(email, pin);
    };

    if (loading || isAuthenticated) {
        return null; // Or a loading spinner
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <div className="relative w-full max-w-sm">
                 <Card className="w-full shadow-2xl animate-in fade-in zoom-in-95">
                    <CardHeader className="text-center">
                         <div className="mx-auto mb-4">
                            <img src="/favicon.png" alt="Site Icon" className="h-12 w-12" />
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
                                <Input id="login-email" name="email" type="email" placeholder="example@email.com" required />
                            </div>
                            <div className="space-y-2 text-right">
                                <Label htmlFor="login-pin">رمز PIN</Label>
                                <Input id="login-pin" name="pin" type="password" required placeholder="••••" />
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
                 <Dialog>
                    <DialogTrigger asChild>
                         <Button variant="ghost" className="absolute bottom-4 left-4 gap-2 p-0 h-auto text-muted-foreground hover:text-primary hover:bg-transparent opacity-50 hover:opacity-100">
                            <ShieldAlert className="h-5 w-5" />
                        </Button>
                    </DialogTrigger>
                    <SuperAdminLoginDialog />
                </Dialog>
            </div>
        </div>
    );
}

