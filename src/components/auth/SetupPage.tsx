
'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { KeyRound, PackagePlus, UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export default function SetupPage() {
    const [adminName, setAdminName] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [pin, setPin] = React.useState('');
    const [confirmPin, setConfirmPin] = React.useState('');
    const [image1, setImage1] = React.useState<File | null>(null);
    const [image2, setImage2] = React.useState<File | null>(null);
    const [image1Preview, setImage1Preview] = React.useState<string | null>(null);
    const [image2Preview, setImage2Preview] = React.useState<string | null>(null);
    const { setupAdmin } = useAuth();
    const { toast } = useToast();
    
    // Refs for file inputs
    const image1InputRef = React.useRef<HTMLInputElement>(null);
    const image2InputRef = React.useRef<HTMLInputElement>(null);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, imageNumber: 1 | 2) => {
        const file = e.target.files?.[0];
        if (file) {
            const preview = URL.createObjectURL(file);
            if (imageNumber === 1) {
                setImage1(file);
                setImage1Preview(preview);
            } else {
                setImage2(file);
                setImage2Preview(preview);
            }
        }
    };
    
    const handleRemoveImage = (imageNumber: 1 | 2) => {
        if (imageNumber === 1) {
            if (image1InputRef.current) image1InputRef.current.value = "";
            setImage1(null);
            setImage1Preview(null);
        } else {
            if (image2InputRef.current) image2InputRef.current.value = "";
            setImage2(null);
            setImage2Preview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (adminName.trim().length < 3) {
            toast({ variant: 'destructive', title: 'اسم غير صالح', description: 'الرجاء إدخال اسم مكون من 3 أحرف على الأقل.' });
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast({ variant: 'destructive', title: 'بريد إلكتروني غير صالح', description: 'الرجاء إدخال بريد إلكتروني صحيح.' });
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
        if (!image1 || !image2) {
            toast({ variant: 'destructive', title: 'صور ناقصة', description: 'الرجاء رفع الصورتين المطلوبتين.' });
            return;
        }

        try {
            const image1DataUri = await fileToDataUri(image1);
            const image2DataUri = await fileToDataUri(image2);

            setupAdmin(adminName.trim(), email.trim().toLowerCase(), pin, image1DataUri, image2DataUri);
            toast({ title: 'اكتمل الإعداد!', description: `مرحباً بك، ${adminName.trim()}! تم إعداد حساب المدير.` });
        } catch (error) {
             toast({ variant: 'destructive', title: 'خطأ في رفع الصور', description: 'حدثت مشكلة أثناء معالجة الصور. الرجاء المحاولة مرة أخرى.' });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-lg shadow-2xl animate-in fade-in zoom-in-95">
                <CardHeader className="text-center">
                     <div className="mx-auto mb-4 bg-primary/10 p-4 rounded-full">
                        <PackagePlus className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">مرحبًا بك في Midgram</CardTitle>
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
                         <div className="space-y-2">
                            <Label htmlFor="email">البريد الإلكتروني</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required />
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
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="image1">صورة الامتياز</Label>
                                <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-primary transition-colors">
                                    {image1Preview ? (
                                        <>
                                            <Image src={image1Preview} alt="Preview 1" width={100} height={100} className="mx-auto rounded-md object-cover h-24 w-24" />
                                            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-destructive/80 text-destructive-foreground hover:bg-destructive" onClick={() => handleRemoveImage(1)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="space-y-1">
                                            <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">اسحب وأفلت أو انقر للرفع</p>
                                        </div>
                                    )}
                                    <Input id="image1" ref={image1InputRef} type="file" accept="image/*" onChange={(e) => handleImageChange(e, 1)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required={!image1} />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="image2">صورة هوية النقابة</Label>
                                <div className="relative border-2 border-dashed border-muted-foreground/50 rounded-lg p-4 text-center hover:border-primary transition-colors">
                                    {image2Preview ? (
                                        <>
                                            <Image src={image2Preview} alt="Preview 2" width={100} height={100} className="mx-auto rounded-md object-cover h-24 w-24" />
                                            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 bg-destructive/80 text-destructive-foreground hover:bg-destructive" onClick={() => handleRemoveImage(2)}>
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="space-y-1">
                                            <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">اسحب وأفلت أو انقر للرفع</p>
                                        </div>
                                    )}
                                    <Input id="image2" ref={image2InputRef} type="file" accept="image/*" onChange={(e) => handleImageChange(e, 2)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required={!image2}/>
                                </div>
                            </div>
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
