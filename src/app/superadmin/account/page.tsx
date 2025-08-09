
"use client";

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const editSuperAdminSchema = z.object({
    name: z.string().min(3, { message: "الاسم مطلوب" }),
    email: z.string().email({ message: "بريد إلكتروني غير صالح" }),
    pin: z.string().optional().refine(val => val === '', { message: "رمز PIN يجب أن يكون 6 رموز على الأقل" }),
    confirmPin: z.string().optional(),
}).refine(data => {
    if (data.pin) {
        return data.pin === data.confirmPin;
    }
    return true;
}, {
    message: "رموز PIN غير متطابقة",
    path: ["confirmPin"],
});

type EditSuperAdminFormValues = z.infer<typeof editSuperAdminSchema>;

export default function SuperAdminAccountPage() {
    const { currentUser, updateUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const form = useForm<EditSuperAdminFormValues>({
        resolver: zodResolver(editSuperAdminSchema),
        defaultValues: { name: "", email: "", pin: "", confirmPin: "" },
    });
    
    React.useEffect(() => {
        if (currentUser && currentUser.role !== 'SuperAdmin') {
            router.push('/');
        }
        if (currentUser) {
            form.reset({
                name: currentUser.name,
                email: currentUser.email,
                pin: '',
                confirmPin: ''
            });
        }
    }, [currentUser, router, form]);

    const onSubmit = async (data: EditSuperAdminFormValues) => {
        if (!currentUser) return;
        
        const success = await updateUser(currentUser.id, data.name, data.email!, data.pin || undefined);
        if (success) {
            toast({ title: "تم تحديث الحساب بنجاح" });
            router.push('/superadmin');
        } else {
            toast({ variant: 'destructive', title: "خطأ", description: "البريد الإلكتروني مستخدم بالفعل." });
        }
    };
    
    if (!currentUser || currentUser.role !== 'SuperAdmin') {
        return null;
    }

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>إعدادات حساب المدير العام</CardTitle>
                    <CardDescription>تعديل بيانات تسجيل الدخول الخاصة بك.</CardDescription>
                </CardHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardContent className="space-y-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الاسم الكامل</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>البريد الإلكتروني</FormLabel>
                                    <FormControl><Input type="email" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <p className="text-sm text-muted-foreground pt-2">اترك حقول رمز PIN فارغة إذا كنت لا ترغب في تغييره.</p>
                             <FormField control={form.control} name="pin" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>رمز PIN الجديد</FormLabel>
                                    <FormControl><Input type="password"   {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="confirmPin" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>تأكيد رمز PIN الجديد</FormLabel>
                                    <FormControl><Input type="password"   {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </CardContent>
                        <CardFooter className="gap-2">
                             <Button type="button" variant="outline" asChild>
                                <Link href="/superadmin">إلغاء</Link>
                            </Button>
                            <Button type="submit" variant="success">حفظ التغييرات</Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
    );
}
