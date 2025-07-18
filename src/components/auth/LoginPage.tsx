
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LogIn, ShieldAlert, PackagePlus } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
    DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';

function SuperAdminLoginDialog() {
    const { login } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = React.useState('');
    const [pin, setPin] = React.useState('');

    const handleSuperAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await login(email, pin);
        if (success) {
            router.push('/superadmin');
        } else {
            toast({ variant: 'destructive', title: 'بيانات الدخول غير صحيحة' });
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
                    <Input id="superadmin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="superadmin-pin">رمز PIN</Label>
                    <Input id="superadmin-pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} maxLength={4} required />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline" type="button">إلغاء</Button></DialogClose>
                    <Button type="submit">دخول</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}


function ForgotPinDialog() {
    const { resetPin, checkUserExists } = useAuth();
    const { toast } = useToast();
    
    const [step, setStep] = React.useState<'email' | 'reset'>('email');
    const [email, setEmail] = React.useState('');
    const [newPin, setNewPin] = React.useState('');
    const [confirmPin, setConfirmPin] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    const handleContinue = async () => {
        if (!email) {
            toast({ variant: 'destructive', title: 'الرجاء إدخال البريد الإلكتروني' });
            return;
        }
        const userExists = await checkUserExists(email);
        if (userExists) {
            setStep('reset');
        } else {
            toast({ variant: 'destructive', title: 'المستخدم غير موجود', description: 'لم يتم العثور على حساب بهذا البريد الإلكتروني.' });
        }
    }

    const handleResetPin = async () => {
        if (!/^\d{4}$/.test(newPin)) {
            toast({ variant: 'destructive', title: 'رمز PIN غير صالح', description: 'يجب أن يتكون رمز PIN من 4 أرقام بالضبط.' });
            return;
        }
        if (newPin !== confirmPin) {
            toast({ variant: 'destructive', title: 'رموز PIN غير متطابقة' });
            return;
        }

        setIsSubmitting(true);
        const success = await resetPin(email, newPin);
        if (success) {
            toast({ title: 'تم إعادة تعيين الرمز بنجاح', description: 'يمكنك الآن تسجيل الدخول باستخدام الرمز الجديد.' });
            document.getElementById('forgot-pin-cancel')?.click();
        } else {
            toast({ variant: 'destructive', title: 'حدث خطأ', description: 'لم نتمكن من إعادة تعيين الرمز. الرجاء المحاولة مرة أخرى.' });
        }
        setIsSubmitting(false);
    }
    
    const resetState = () => {
        setStep('email');
        setEmail('');
        setNewPin('');
        setConfirmPin('');
    }

    return (
        <AlertDialogContent onEscapeKeyDown={resetState} onPointerDownOutside={resetState}>
            <AlertDialogHeader>
                <AlertDialogTitle>إعادة تعيين رمز PIN</AlertDialogTitle>
            </AlertDialogHeader>
            {step === 'email' ? (
                <div className="space-y-4 pt-2">
                    <p className="text-sm text-muted-foreground">أدخل بريدك الإلكتروني للعثور على حسابك.</p>
                    <div className="space-y-2">
                        <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                        <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel id="forgot-pin-cancel" onClick={resetState}>إلغاء</AlertDialogCancel>
                        <Button onClick={handleContinue}>متابعة</Button>
                    </AlertDialogFooter>
                </div>
            ) : (
                <div className="space-y-4 pt-2">
                     <p className="text-sm text-muted-foreground">أدخل رمز PIN الجديد لحساب <span className="font-medium text-foreground">{email}</span>.</p>
                     <div className="space-y-2">
                        <Label htmlFor="new-pin">رمز PIN الجديد (4 أرقام)</Label>
                        <Input id="new-pin" type="password" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} maxLength={4} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="confirm-new-pin">تأكيد الرمز الجديد</Label>
                        <Input id="confirm-new-pin" type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} maxLength={4} />
                    </div>
                     <AlertDialogFooter>
                        <AlertDialogCancel id="forgot-pin-cancel" onClick={resetState}>إلغاء</AlertDialogCancel>
                        <Button onClick={handleResetPin} disabled={isSubmitting}>إعادة تعيين الرمز</Button>
                    </AlertDialogFooter>
                </div>
            )}
        </AlertDialogContent>
    )
}

export default function LoginPage() {
    const [email, setEmail] = React.useState('');
    const [pin, setPin] = React.useState('');
    const { login } = useAuth();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await login(email, pin);
        if (!success) {
            toast({
                variant: 'destructive',
                title: 'بيانات الدخول غير صحيحة',
                description: 'الرجاء التأكد من البريد الإلكتروني ورمز PIN أو أن الحساب فعال.'
            });
            setPin('');
        }
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
                            <Button variant="ghost" className="mt-8 gap-2 p-0 h-auto text-muted-foreground hover:text-primary opacity-50 hover:opacity-100">
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
                                <Input id="login-pin" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} maxLength={4} required placeholder="••••" />
                            </div>
                        </CardContent>
                        <CardFooter className="flex-col gap-4">
                            <Button type="submit" className="w-full">
                                <LogIn className="me-2 h-4 w-4" />
                                تسجيل الدخول
                            </Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="link" size="sm" className="text-muted-foreground p-0 h-auto">
                                        هل نسيت رمز PIN؟
                                    </Button>
                                </AlertDialogTrigger>
                               <ForgotPinDialog />
                            </AlertDialog>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}

    