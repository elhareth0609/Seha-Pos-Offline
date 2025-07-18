
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { LogIn, User, ShieldAlert } from 'lucide-react';
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
} from "@/components/ui/dialog";
import Image from 'next/image';
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
    const { login, users } = useAuth();
    const { toast } = useToast();
    const [selectedUser, setSelectedUser] = React.useState<string>("");
    
    const pharmacyUsers = users.filter(u => u.role !== 'SuperAdmin');

    React.useEffect(() => {
        if (pharmacyUsers.length > 0 && !selectedUser) {
            setSelectedUser(pharmacyUsers[0].id)
            setEmail(pharmacyUsers[0].email || '')
        }
    }, [pharmacyUsers, selectedUser])

    const handleUserSelect = (userId: string) => {
        const user = pharmacyUsers.find(u => u.id === userId);
        if (user) {
            setSelectedUser(user.id);
            setEmail(user.email || '');
            setPin('');
            document.getElementById('login-pin')?.focus();
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await login(email, pin);
        if (!success) {
            toast({
                variant: 'destructive',
                title: 'بيانات الدخول غير صحيحة',
                description: 'الرجاء التأكد من رمز PIN.'
            });
            setPin('');
        }
    };
    
    const currentUser = pharmacyUsers.find(u => u.id === selectedUser);

    return (
        <div className="relative flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-sm text-center shadow-2xl animate-in fade-in zoom-in-95">
                <CardHeader>
                    {currentUser?.image1DataUri ? (
                       <Image src={currentUser.image1DataUri} alt={currentUser.name} width={96} height={96} className="mx-auto rounded-full object-cover h-24 w-24 border-4 border-background shadow-lg" />
                    ) : (
                        <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full h-24 w-24 flex items-center justify-center border-4 border-background shadow-lg">
                            <User className="h-12 w-12 text-primary" />
                        </div>
                    )}
                    <CardTitle className="text-2xl pt-2">{currentUser?.name || 'تسجيل الدخول'}</CardTitle>
                    <CardDescription>
                       الرجاء إدخال رمز PIN للمتابعة.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2 text-right">
                            <Label htmlFor="login-pin">رمز PIN</Label>
                            <Input id="login-pin" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} maxLength={4} required placeholder="••••" autoFocus/>
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
                {pharmacyUsers.length > 1 && (
                    <div className="p-4 border-t">
                        <p className="text-xs text-muted-foreground mb-2">أو قم بتسجيل الدخول كمستخدم آخر:</p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {pharmacyUsers.filter(u => u.id !== selectedUser).map(user => (
                                <div key={user.id} className="flex flex-col items-center gap-1">
                                    <button onClick={() => handleUserSelect(user.id)} className="p-0.5 border-2 border-transparent rounded-full hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary">
                                        {user.image1DataUri ? (
                                            <Image src={user.image1DataUri} alt={user.name} width={40} height={40} className="rounded-full object-cover" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                <User className="h-5 w-5" />
                                            </div>
                                        )}
                                    </button>
                                    <span className="text-xs font-medium text-muted-foreground">{user.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </Card>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="absolute bottom-4 left-4 text-muted-foreground opacity-50 hover:opacity-100">
                        <ShieldAlert className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <SuperAdminLoginDialog />
            </Dialog>
        </div>
    );
}
