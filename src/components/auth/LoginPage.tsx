
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { PackagePlus, AlertCircle, LogIn } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

function ForgotPinDialog() {
    const { getPinHint } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = React.useState('');
    const [hint, setHint] = React.useState<string | null>(null);

    const handleShowHint = () => {
        if (!email) {
            toast({ variant: 'destructive', title: 'الرجاء إدخال البريد الإلكتروني' });
            return;
        }
        const pinHint = getPinHint(email);
        setHint(pinHint);
    }

    return (
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>هل نسيت رمز PIN؟</AlertDialogTitle>
                <AlertDialogDescription asChild>
                    <div className="space-y-4 pt-4">
                        <p>أدخل بريدك الإلكتروني المسجل لعرض تلميح استعادة الرمز الخاص بك.</p>
                         <div className="space-y-2">
                            <Label htmlFor="hint-email">البريد الإلكتروني</Label>
                            <Input id="hint-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
                        </div>
                        {hint !== null && (
                             hint ? (
                                <>
                                <p>التلميح الخاص بك هو:</p>
                                <div className="p-3 bg-accent rounded-md border text-accent-foreground text-center font-medium">
                                    {hint}
                                </div>
                                </>
                            ) : (
                                <div className="flex items-start gap-3 text-destructive">
                                    <AlertCircle className="h-5 w-5 mt-1 shrink-0"/>
                                    <span>لم يتم العثور على حساب بهذا البريد الإلكتروني أو لم تقم بتعيين تلميح. الطريقة الوحيدة للاستعادة هي مسح بيانات التطبيق.</span>
                                </div>
                            )
                        )}
                    </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="pt-4 gap-2 sm:justify-between">
                <Button onClick={handleShowHint}>عرض التلميح</Button>
                <AlertDialogCancel onClick={() => { setEmail(''); setHint(null); }}>إغلاق</AlertDialogCancel>
            </AlertDialogFooter>
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
            </Card>
        </div>
    );
}
