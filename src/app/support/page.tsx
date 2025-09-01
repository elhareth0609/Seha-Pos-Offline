
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { LifeBuoy, Send } from 'lucide-react';

const problemSections = [
    "المبيعات والفواتير",
    "المخزون وإدارة الأدوية",
    "المشتريات والموردين",
    "التقارير والإحصائيات",
    "إدارة الموظفين والصلاحيات",
    "الإعدادات العامة",
    "مشكلة في تسجيل الدخول",
    "مشكلة أخرى",
];

const contactTimes = [
    "في أي وقت",
    "صباحًا (9ص - 12م)",
    "ظهرًا (12م - 4م)",
    "مساءً (4م - 8م)",
];

export default function SupportPage() {
    const { currentUser, settings, addSupportRequest } = useAuth();
    const { toast } = useToast();

    const [phoneNumber, setPhoneNumber] = React.useState('');
    const [problemSection, setProblemSection] = React.useState('');
    const [contactTime, setContactTime] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    
    React.useEffect(() => {
        if (settings) {
            setPhoneNumber(settings.pharmacyPhone);
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phoneNumber || !problemSection || !contactTime) {
            toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'الرجاء تعبئة جميع الحقول.' });
            return;
        }

        setIsSubmitting(true);
        const success = await addSupportRequest({
            phone_number: phoneNumber,
            problem_section: problemSection,
            contact_time: contactTime,
        });

        if (success) {
            toast({
                title: 'تم إرسال طلبك بنجاح',
                description: 'سيتواصل معك فريق الدعم الفني في أقرب وقت ممكن.',
            });
            setProblemSection('');
            setContactTime('');
        } else {
            toast({
                variant: 'destructive',
                title: 'حدث خطأ',
                description: 'لم نتمكن من إرسال طلبك. يرجى المحاولة مرة أخرى.',
            });
        }
        setIsSubmitting(false);
    };

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <LifeBuoy className="h-10 w-10 text-primary" />
                    <div>
                        <CardTitle className="text-3xl">الدعم الفني</CardTitle>
                        <CardDescription>
                            هل تواجه مشكلة؟ املأ النموذج أدناه وسيقوم فريقنا بالتواصل معك.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="phone">رقم الهاتف للتواصل</Label>
                        <Input 
                            id="phone" 
                            type="tel" 
                            value={phoneNumber} 
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="section">القسم الذي تواجه فيه المشكلة</Label>
                        <Select value={problemSection} onValueChange={setProblemSection} required>
                            <SelectTrigger id="section">
                                <SelectValue placeholder="اختر القسم..." />
                            </SelectTrigger>
                            <SelectContent>
                                {problemSections.map(section => (
                                    <SelectItem key={section} value={section}>{section}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="time">الوقت المفضل للتواصل</Label>
                         <Select value={contactTime} onValueChange={setContactTime} required>
                            <SelectTrigger id="time">
                                <SelectValue placeholder="اختر الوقت..." />
                            </SelectTrigger>
                            <SelectContent>
                                {contactTimes.map(time => (
                                    <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                        <Send className="me-2 h-4 w-4" />
                        {isSubmitting ? 'جاري الإرسال...' : 'إرسال طلب الدعم'}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
