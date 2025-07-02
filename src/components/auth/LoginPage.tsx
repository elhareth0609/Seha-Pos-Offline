'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { PackagePlus, LogIn, UserPlus } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
                description: 'الرجاء التأكد من البريد الإلكتروني ورمز PIN.'
            });
            setPin('');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-sm text-center shadow-2xl animate-in fade-in zoom-in-95">
                <CardHeader>
                    <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full">
                        <PackagePlus className="h-12 w-12 text-primary" />
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
                                <Button variant="link" size="sm" className="text-muted-foreground">
                                    هل نسيت رمز PIN؟
                                </Button>
                            </AlertDialogTrigger>
                           <ForgotPinDialog />
                        </AlertDialog>
                    </CardFooter>
                </form>
                <Separator className="my-4" />
                <CardFooter className="flex-col gap-4">
                    <p className="text-sm text-muted-foreground">ليس لديك حساب؟</p>
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/signup">
                            <UserPlus className="me-2 h-4 w-4" />
                            إنشاء حساب جديد
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
