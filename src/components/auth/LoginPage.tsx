
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LogIn, PackagePlus, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';

function SuperAdminLoginDialog() {
    const { login } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = React.useState('');
    const [pin, setPin] = React.useState('');

    const handleSuperAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = await login(email, pin);
        // if (user) {
        //     if (user.role === 'SuperAdmin') {
        //         router.push('/superadmin');
        //     } else {
        //         router.push('/');
        //     }
        // } else {
        //     toast({ variant: 'destructive', title: 'بيانات الدخول غير صحيحة' });
        // }
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
                    <Input id="superadmin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="superadmin-pin">رمز PIN</Label>
                    <Input id="superadmin-pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={6} required />
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
    const [email, setEmail] = React.useState('');
    const [pin, setPin] = React.useState('');
    const { login } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const user = await login(email, pin);
        // if (user) {
        //      if (user.role === 'SuperAdmin') {
        //         router.push('/superadmin');
        //     } else {
        //         router.push('/');
        //     }
        // } else {
        //     toast({
        //         variant: 'destructive',
        //         title: 'بيانات الدخول غير صحيحة',
        //         description: 'الرجاء التأكد من البريد الإلكتروني ورمز PIN أو أن الحساب فعال.'
        //     });
        //     setPin('');
        // }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <div className="container grid lg:grid-cols-2 gap-16 items-center">
                <div className="hidden lg:flex flex-col items-start text-right">
                     <div className="flex items-center gap-3 mb-4">
                        <PackagePlus className="h-14 w-14 text-primary" />
                        <h1 className="text-5xl font-bold">Midgram</h1>
                    </div>
                    <p className="text-xl text-muted-foreground mt-2">
                        نظام إدارة صيدليات متكامل، مصمم لتبسيط عملياتك اليومية من المبيعات والمخزون إلى المشتريات والتقارير المالية.
                    </p>
                    <Dialog>
                        <DialogTrigger asChild>
                             <Button variant="ghost" className="mt-8 gap-2 p-0 h-auto text-muted-foreground hover:text-primary hover:bg-transparent opacity-50 hover:opacity-100">
                                <ShieldAlert className="h-5 w-5" />
                            </Button>
                        </DialogTrigger>
                        <SuperAdminLoginDialog />
                    </Dialog>
                </div>
                <Card className="w-full max-w-sm mx-auto shadow-2xl animate-in fade-in zoom-in-95">
                    <CardHeader className="text-center">
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
                                <Label htmlFor="login-pin">رمز PIN</Label>
                                <Input id="login-pin" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} maxLength={6} required placeholder="••••" />
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
