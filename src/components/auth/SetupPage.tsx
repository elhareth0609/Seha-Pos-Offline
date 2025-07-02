'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, PackagePlus } from 'lucide-react';

export default function SetupPage() {
    const [adminName, setAdminName] = React.useState('');
    const [pin, setPin] = React.useState('');
    const [confirmPin, setConfirmPin] = React.useState('');
    const [pinHint, setPinHint] = React.useState('');
    const { setupAdmin } = useAuth();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminName.trim().length < 3) {
            toast({ variant: 'destructive', title: 'اسم غير صالح', description: 'الرجاء إدخال اسم مكون من 3 أحرف على الأقل.' });
            return;
        }
        if (!/^\d{4}$/.test(pin)) {
            toast({ variant: 'destructive', title: 'رمز PIN غير صالح', description: 'يجب أن يتكون رمز PIN من 4 أرقام بالضبط.' });
            return;
        }
        if (pin !== confirmPin) {
            toast({ variant: 'destructive', title: 'رموز PIN غير متطابقة', description: 'الرجاء التأكد من تطابق رمز PIN وتأكيده.' });
            return;
        }
        setupAdmin(adminName.trim(), pin, pinHint.trim());
        toast({ title: 'اكتمل الإعداد!', description: `مرحباً بك، ${adminName.trim()}! تم إعداد حساب المدير.` });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                <CardHeader className="text-center">
                     <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full">
                        <PackagePlus className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">مرحبًا بك في مدستوك</CardTitle>
                    <CardDescription>
                        لنبدأ بإعداد حساب المدير الخاص بك. هذا الحساب سيكون له صلاحيات كاملة على النظام.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="admin-name">اسم المدير</Label>
                            <Input id="admin-name" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="مثال: علي المدير" required />
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="pin">رمز PIN (4 أرقام)</Label>
                                <Input id="pin" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} maxLength={4} required pattern="\d{4}" title="يجب أن يكون 4 أرقام" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-pin">تأكيد الرمز</Label>
                                <Input id="confirm-pin" type="password" inputMode="numeric" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} maxLength={4} required />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="pin-hint">تلميح تذكير (اختياري)</Label>
                            <Input id="pin-hint" value={pinHint} onChange={(e) => setPinHint(e.target.value)} placeholder="مثال: تاريخ ميلاد قطتي" />
                            <p className="text-xs text-muted-foreground">سيساعدك هذا التلميح في حال نسيت رمز PIN.</p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">
                            <KeyRound className="me-2 h-4 w-4" />
                            إنشاء حساب والبدء
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
