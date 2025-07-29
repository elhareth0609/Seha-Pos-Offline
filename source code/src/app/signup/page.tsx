
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, PackagePlus } from 'lucide-react';

export default function SignUpPage() {
    const [name, setName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [pin, setPin] = React.useState('');
    const [confirmPin, setConfirmPin] = React.useState('');
    const { registerUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim().length < 3) {
            toast({ variant: 'destructive', title: 'اسم غير صالح', description: 'الرجاء إدخال اسم مكون من 3 أحرف على الأقل.' });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast({ variant: 'destructive', title: 'بريد إلكتروني غير صالح', description: 'الرجاء إدخال بريد إلكتروني صحيح.' });
            return;
        }
        if (!/^\d{6}$/.test(pin)) {
            toast({ variant: 'destructive', title: 'رمز PIN غير صالح', description: 'يجب أن يتكون رمز PIN من 6 أرقام بالضبط.' });
            return;
        }
        if (pin !== confirmPin) {
            toast({ variant: 'destructive', title: 'رموز PIN غير متطابقة', description: 'الرجاء التأكد من تطابق رمز PIN وتأكيده.' });
            return;
        }
        
        const success = await registerUser(name.trim(), email.trim().toLowerCase(), pin);
        
        if (success) {
            toast({ title: 'تم إنشاء الحساب بنجاح!', description: `مرحباً بك، ${name.trim()}! يمكنك الآن تسجيل الدخول.` });
            router.push('/');
        } else {
            toast({ variant: 'destructive', title: 'خطأ في التسجيل', description: 'البريد الإلكتروني مستخدم بالفعل. الرجاء استخدام بريد إلكتروني آخر.' });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                <CardHeader className="text-center">
                     <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full">
                        <PackagePlus className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">إنشاء حساب جديد</CardTitle>
                    <CardDescription>
                        انضم إلى فريق العمل.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="signup-name">الاسم الكامل</Label>
                            <Input id="signup-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: أحمد الموظف" required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="signup-email">البريد الإلكتروني</Label>
                            <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="signup-pin">رمز PIN (6 أرقام)</Label>
                                <Input id="signup-pin" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} maxLength={6} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="signup-confirm-pin">تأكيد الرمز</Label>
                                <Input id="signup-confirm-pin" type="password" inputMode="numeric" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} maxLength={6} required />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-4">
                        <Button type="submit" className="w-full">
                            <UserPlus className="me-2 h-4 w-4" />
                            إنشاء الحساب
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            لديك حساب بالفعل؟{' '}
                            <Link href="/" className="underline text-primary">
                                تسجيل الدخول
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
