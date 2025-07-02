'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { PackagePlus } from 'lucide-react';

export default function SetupPage() {
    const [adminName, setAdminName] = React.useState('');
    const { setupAdmin } = useAuth();
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminName.trim().length < 3) {
            toast({
                variant: 'destructive',
                title: 'اسم غير صالح',
                description: 'الرجاء إدخال اسم مكون من 3 أحرف على الأقل.'
            });
            return;
        }
        setupAdmin(adminName.trim());
        toast({
            title: 'اكتمل الإعداد!',
            description: `مرحباً بك، ${adminName.trim()}! تم إعداد حساب المدير.`
        });
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <PackagePlus className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">مرحبًا بك في مدستوك</CardTitle>
                    <CardDescription>
                        لنبدأ بإعداد حساب المدير الخاص بك.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="admin-name">اسم المدير</Label>
                            <Input
                                id="admin-name"
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                placeholder="مثال: علي المدير"
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">
                            إنشاء حساب وبدء الاستخدام
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
