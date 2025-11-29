
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Stethoscope, UserPlus, Trash2, Pencil, KeyRound, Copy, Tag, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import type { Doctor, DoctorSuggestion } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DoctorsPage() {
    const { currentUser, getDoctors, addDoctor, updateDoctor, deleteDoctor, getDoctorSuggestions } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [doctors, setDoctors] = React.useState<Doctor[]>([]);
    const [suggestions, setSuggestions] = React.useState<DoctorSuggestion[]>([]);
    const [loading, setLoading] = React.useState(true);
    
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [newDoctorName, setNewDoctorName] = React.useState('');

    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [editingDoctor, setEditingDoctor] = React.useState<Doctor | null>(null);

    const [isSuggestionsOpen, setIsSuggestionsOpen] = React.useState(false);
    const [selectedDoctorForSuggestions, setSelectedDoctorForSuggestions] = React.useState<Doctor | null>(null);

    React.useEffect(() => {
        if (currentUser && currentUser.role === 'Employee' && !currentUser.permissions?.manage_doctors) {
            router.replace('/dashboard');
            console.log('Employee without manage_doctors permission');
        }
    }, [currentUser, router]);

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [docs, suggs] = await Promise.all([getDoctors(), getDoctorSuggestions()]);
            setDoctors(docs);
            setSuggestions(suggs);
            setLoading(false);
        };
        fetchData();
    }, [getDoctors, getDoctorSuggestions]);

    const handleAddDoctor = async () => {
        if (!newDoctorName.trim()) {
            toast({ variant: 'destructive', title: 'اسم الطبيب مطلوب' });
            return;
        }
        const newDoctor = await addDoctor(newDoctorName);
        if (newDoctor) {
            setDoctors(prev => [newDoctor, ...prev]);
            setNewDoctorName('');
            setIsAddDialogOpen(false);
        }
    };

    const handleUpdateDoctor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingDoctor) return;

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const name = formData.get('name') as string;
        const login_key = formData.get('login_key') as string;

        const updatedDoctor = await updateDoctor(editingDoctor.id, { name, login_key });
        if (updatedDoctor) {
            setDoctors(prev => prev.map(d => d.id === updatedDoctor.id ? updatedDoctor : d));
            setIsEditDialogOpen(false);
            setEditingDoctor(null);
        }
    };

    const handleDeleteDoctor = async (doctorId: string) => {
        const success = await deleteDoctor(doctorId);
        if (success) {
            setDoctors(prev => prev.filter(d => d.id !== doctorId));
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ title: "تم نسخ الرمز!" });
    };

    const showSuggestions = (doctor: Doctor) => {
        setSelectedDoctorForSuggestions(doctor);
        setIsSuggestionsOpen(true);
    };

    const doctorSuggestions = React.useMemo(() => {
        if (!selectedDoctorForSuggestions) return [];
        return suggestions.filter(s => s.doctor_id === selectedDoctorForSuggestions.id);
    }, [selectedDoctorForSuggestions, suggestions]);


    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <Stethoscope className="h-10 w-10 text-primary" />
                            <div>
                                <CardTitle className="text-3xl">إدارة الأطباء</CardTitle>
                                <CardDescription>
                                    إضافة وتعديل الأطباء المرتبطين بالصيدلية وعرض مقترحاتهم.
                                </CardDescription>
                            </div>
                        </div>
                        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="success"><UserPlus className="me-2"/> إضافة طبيب</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>إضافة طبيب جديد</DialogTitle>
                                    <DialogDescription>سيتم إنشاء رمز دخول فريد للطبيب تلقائياً.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-2">
                                    <Label htmlFor="doctor-name">اسم الطبيب</Label>
                                    <Input id="doctor-name" value={newDoctorName} onChange={e => setNewDoctorName(e.target.value)} required autoFocus />
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                    <Button onClick={handleAddDoctor}>إضافة</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {doctors.map(doctor => (
                            <Card key={doctor.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{doctor.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-2">
                                    <div className="flex items-center gap-2 text-sm">
                                        <KeyRound className="h-4 w-4 text-muted-foreground"/>
                                        <span className="font-mono">{doctor.login_key}</span>
                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyToClipboard(doctor.login_key)}>
                                            <Copy className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Tag className="h-4 w-4"/>
                                        <span>لديه {suggestions.filter(s => s.doctor_id === doctor.id).length} مقترحات</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => showSuggestions(doctor)}>
                                        <MessageSquare className="me-2"/>
                                        عرض المقترحات
                                    </Button>
                                    <Button variant="secondary" onClick={() => { setEditingDoctor(doctor); setIsEditDialogOpen(true); }}>
                                        <Pencil className="me-2"/>
                                        تعديل
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon"><Trash2/></Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>هل أنت متأكد من حذف الطبيب؟</AlertDialogTitle>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="sm:space-x-reverse">
                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteDoctor(doctor.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تعديل بيانات الطبيب: {editingDoctor?.name}</DialogTitle>
                    </DialogHeader>
                    {editingDoctor && (
                        <form onSubmit={handleUpdateDoctor} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="edit-doctor-name">اسم الطبيب</Label>
                                <Input id="edit-doctor-name" name="name" defaultValue={editingDoctor.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-login-key">رمز الدخول</Label>
                                <Input id="edit-login-key" name="login_key" defaultValue={editingDoctor.login_key} required />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                <Button type="submit" variant="success">حفظ التغييرات</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>مقترحات الطبيب: {selectedDoctorForSuggestions?.name}</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="max-h-80 my-4">
                        <div className="space-y-3 p-1">
                            {doctorSuggestions.length > 0 ? doctorSuggestions.map(sugg => (
                                <div key={sugg.id} className="p-3 border rounded-md bg-muted/50">
                                    <p>{sugg.suggestion}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{new Date(sugg.created_at).toLocaleString()}</p>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground py-8">لا توجد مقترحات من هذا الطبيب.</p>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
