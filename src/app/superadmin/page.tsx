
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import type { User, Advertisement, Offer } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MoreVertical, PlusCircle, Trash2, ToggleLeft, ToggleRight, Settings, LogOut, Eye, EyeOff, FileText, Users, Building, ImagePlus, Image as ImageIcon, LayoutDashboard, ShoppingCart,LockKeyhole, LockOpen, LockIcon, Boxes, BadgePercent } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';


const addAdminSchema = z.object({
    name: z.string().min(3, { message: "الاسم مطلوب" }),
    email: z.string().email({ message: "بريد إلكتروني غير صالح" }),
    pin: z.string().min(6, { message: "يجب أن يتكون رمز PIN من 6 أحرف على الأقل." }),
});

type AddAdminFormValues = z.infer<typeof addAdminSchema>;

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

function AdminRow({ admin, onDelete, onToggleStatus }: { admin: User, onDelete: (user: User) => void, onToggleStatus: (user: User) => void }) {
    const [showPin, setShowPin] = React.useState(false);

    return (
        <TableRow>
            <TableCell className="font-medium">{admin.name}</TableCell>
            <TableCell className="hidden sm:table-cell">{admin.email}</TableCell>
            <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-2">
                    <span className="font-mono">{showPin ? admin.pin : '••••••'}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPin(p => !p)}>
                        {showPin ? <LockOpen className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
                    </Button>
                </div>
            </TableCell>
            <TableCell>
                <Badge variant={admin.status === 'active' ? 'secondary' : 'destructive'} className={admin.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                    {admin.status === 'active' ? 'فعال' : 'معلق'}
                </Badge>
            </TableCell>
            <TableCell className="text-left">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => onToggleStatus(admin)}>
                            {admin.status === 'active' ? <ToggleLeft className="me-2"/> : <ToggleRight className="me-2" />}
                            {admin.status === 'active' ? 'تعليق الحساب' : 'إعادة تفعيل'}
                        </DropdownMenuItem>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                    <Trash2 className="me-2" /> حذف نهائي
                                </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        هذا الإجراء لا يمكن التراجع عنه. سيتم حذف حساب المدير <span className="font-bold">{admin.name}</span> وكل بيانات صيدليته نهائيًا.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onDelete(admin)} className="bg-destructive hover:bg-destructive/90">
                                        نعم، قم بالحذف
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    )
}

export default function SuperAdminPage() {
    const { 
        currentUser, users, createPharmacyAdmin, deleteUser, toggleUserStatus, logout, 
        advertisements, addAdvertisement, updateAdvertisement, deleteAdvertisement, 
        offers, addOffer, deleteOffer,
        getPaginatedUsers 
    } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [pharmacyAdmins, setPharmacyAdmins] = React.useState<User[]>([]);
    const [totalPages, setTotalPages] = React.useState(1);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [perPage, setPerPage] = React.useState(10);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");

    const [isAddAdminOpen, setIsAddAdminOpen] = React.useState(false);

    // Ads State
    const [isAddAdOpen, setIsAddAdOpen] = React.useState(false);
    const [adTitle, setAdTitle] = React.useState("");
    const [adImageFile, setAdImageFile] = React.useState<File | null>(null);
    const [adImagePreview, setAdImagePreview] = React.useState<string | null>(null);
    
    // Offers State
    const [isAddOfferOpen, setIsAddOfferOpen] = React.useState(false);
    const [offerTitle, setOfferTitle] = React.useState("");
    const [offerImageFile, setOfferImageFile] = React.useState<File | null>(null);
    const [offerImagePreview, setOfferImagePreview] = React.useState<string | null>(null);

    
    const addAdminForm = useForm<AddAdminFormValues>({
        resolver: zodResolver(addAdminSchema),
        defaultValues: { name: "", email: "", pin: "" },
    });
    
    const fetchData = React.useCallback(async (page: number, limit: number, search: string) => {
        setLoading(true);
        try {
            const data = await getPaginatedUsers('Admin', page, limit, search);
            setPharmacyAdmins(data.data);
            setTotalPages(data.last_page);
            setCurrentPage(data.current_page);
        } catch (error) {
            console.error("Failed to fetch admins", error);
        } finally {
            setLoading(false);
        }
    }, [getPaginatedUsers]);

    React.useEffect(() => {
        if (currentUser && currentUser.role === 'SuperAdmin') {
             const handler = setTimeout(() => {
                fetchData(currentPage, perPage, searchTerm);
            }, 300);
            return () => clearTimeout(handler);
        }
    }, [currentUser, currentPage, perPage, searchTerm, fetchData]);


    React.useEffect(() => {
        if (currentUser && currentUser.role !== 'SuperAdmin') {
            router.push('/');
        }
    }, [currentUser, router]);

    const handleAddAdmin = async (data: AddAdminFormValues) => {
        const success = await createPharmacyAdmin(data.name, data.email, data.pin);
        if (success) {
            toast({ title: "تم إنشاء حساب المدير بنجاح" });
            fetchData(1, perPage, ""); // Refresh
            setIsAddAdminOpen(false);
            addAdminForm.reset();
        } else {
            toast({ variant: 'destructive', title: "خطأ", description: "البريد الإلكتروني مستخدم بالفعل." });
        }
    };
    
    const handleDeleteAdmin = (user: User) => {
        deleteUser(user.id, true).then(success => {
            if(success) {
                toast({title: `تم حذف حساب ${user.name} نهائياً`});
                fetchData(currentPage, perPage, searchTerm); // Refresh
            } else {
                toast({variant: 'destructive', title: "خطأ", description: "لم يتمكن من حذف الحساب."})
            }
        });
    }

    const handleToggleStatus = (user: User) => {
        toggleUserStatus(user.id).then(success => {
             if(success) {
                toast({title: `تم تغيير حالة حساب ${user.name}`});
                fetchData(currentPage, perPage, searchTerm); // Refresh
             }
        })
    }
    
    const handleAdImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAdImageFile(file);
            setAdImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleOfferImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setOfferImageFile(file);
            setOfferImagePreview(URL.createObjectURL(file));
        }
    };

    const handleAddAdvertisement = async () => {
        if (!adTitle.trim() || !adImageFile) {
            toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'الرجاء إدخال عنوان واختيار صورة.' });
            return;
        }
        const imageDataUri = await fileToDataUri(adImageFile);
        await addAdvertisement(adTitle, imageDataUri);
        setIsAddAdOpen(false);
        setAdTitle("");
        setAdImageFile(null);
        setAdImagePreview(null);
    };

    const handleAddOffer = async () => {
        if (!offerTitle.trim() || !offerImageFile) {
            toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'الرجاء إدخال عنوان واختيار صورة للعرض.' });
            return;
        }
        const imageDataUri = await fileToDataUri(offerImageFile);
        await addOffer(offerTitle, imageDataUri);
        setIsAddOfferOpen(false);
        setOfferTitle("");
        setOfferImageFile(null);
        setOfferImagePreview(null);
    };

    const handleShowOnPageChange = (adId: string, page: keyof Advertisement['show_on'], checked: boolean) => {
        const ad = advertisements.find(a => a.id === adId);
        if (ad) {
            const new_show_on = { ...ad.show_on, [page]: checked };
            updateAdvertisement(adId, { show_on: new_show_on });
        }
    }

    const totalEmployees = users.filter(u => u.role === 'Employee').length;

    if (!currentUser || currentUser.role !== 'SuperAdmin') {
        return null;
    }

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم الشركة</h1>
                    <p className="text-muted-foreground">إدارة حسابات مديري الصيدليات والإعلانات والعروض.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/superadmin/account">
                            <Settings className="me-2"/>
                            إعدادات الحساب
                        </Link>
                    </Button>
                    <Button variant="secondary" onClick={logout}>
                        <LogOut className="me-2"/>
                        تسجيل الخروج
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">عدد الصيدليات</CardTitle><Building className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold font-mono">{pharmacyAdmins.length}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold font-mono">{totalEmployees}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">عدد الإعلانات</CardTitle><ImageIcon className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold font-mono">{advertisements.length}</div></CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">عدد العروض</CardTitle><BadgePercent className="h-4 w-4 text-muted-foreground" /></CardHeader>
                    <CardContent><div className="text-2xl font-bold font-mono">{offers.length}</div></CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-1">
                <Card className="lg:col-span-2">
                    <CardHeader>
                         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle>مدراء الصيدليات</CardTitle>
                                <CardDescription>قائمة بجميع حسابات مدراء الصيدليات المسجلين.</CardDescription>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" asChild>
                                    <Link href="/superadmin/reports"><FileText className="me-2"/> عرض التقارير</Link>
                                </Button>
                                <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                                    <DialogTrigger asChild>
                                        <Button><PlusCircle className="me-2"/> إنشاء حساب مدير</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>إنشاء حساب مدير صيدلية</DialogTitle>
                                        </DialogHeader>
                                        <Form {...addAdminForm}>
                                            <form onSubmit={addAdminForm.handleSubmit(handleAddAdmin)} className="space-y-4 py-2">
                                                <FormField control={addAdminForm.control} name="name" render={({ field }) => (
                                                    <FormItem><FormLabel>اسم المدير</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={addAdminForm.control} name="email" render={({ field }) => (
                                                    <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={addAdminForm.control} name="pin" render={({ field }) => (
                                                    <FormItem><FormLabel>رمز PIN</FormLabel><FormControl><Input type="password"   {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <DialogFooter className="pt-4">
                                                    <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                                    <Button type="submit" variant="success">إنشاء الحساب</Button>
                                                </DialogFooter>
                                            </form>
                                        </Form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                        <div className="pt-4 flex flex-wrap gap-2">
                            <Input 
                                placeholder="ابحث بالاسم أو البريد..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                            <div className="flex items-center gap-2">
                                <Label htmlFor="per-page" className="shrink-0">لكل صفحة:</Label>
                                <Select value={String(perPage)} onValueChange={(val) => setPerPage(Number(val))}>
                                    <SelectTrigger id="per-page" className="w-20 h-9">
                                    <SelectValue placeholder={perPage} />
                                    </SelectTrigger>
                                    <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>اسم المدير</TableHead>
                                    <TableHead className="hidden sm:table-cell">البريد الإلكتروني</TableHead>
                                    <TableHead className="hidden lg:table-cell">رمز PIN</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? Array.from({length: perPage}).map((_,i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                )) : pharmacyAdmins.map(admin => (
                                    <AdminRow 
                                        key={admin.id} 
                                        admin={admin} 
                                        onDelete={handleDeleteAdmin} 
                                        onToggleStatus={handleToggleStatus}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <span className="text-sm text-muted-foreground">
                                الصفحة {currentPage} من {totalPages}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1 || loading}
                                >
                                    السابق
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || loading}
                                >
                                    التالي
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 lg:grid-cols-2">
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>إدارة العروض</CardTitle>
                            <CardDescription>إضافة وحذف العروض الترويجية.</CardDescription>
                        </div>
                        <Dialog open={isAddOfferOpen} onOpenChange={setIsAddOfferOpen}>
                            <DialogTrigger asChild>
                                <Button size="icon"><ImagePlus /></Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>إضافة عرض جديد</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Label>عنوان العرض</Label>
                                        <Input value={offerTitle} onChange={(e) => setOfferTitle(e.target.value)} placeholder="مثال: خصم 20% على منتجات العناية بالبشرة" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>صورة العرض</Label>
                                        <Input type="file" accept="image/*" onChange={handleOfferImageChange} />
                                    </div>
                                    {offerImagePreview && (
                                        <div className="flex justify-center">
                                            <Image src={offerImagePreview} alt="معاينة العرض" width={200} height={100} className="rounded-md object-contain" />
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                    <Button onClick={handleAddOffer} variant="success">إضافة</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {offers.map(offer => (
                                <div key={offer.id} className="p-3 border rounded-md flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Image src={offer.image_url} alt={offer.title} width={64} height={36} className="rounded-sm object-cover" />
                                        <div>
                                            <p className="font-semibold">{offer.title}</p>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Eye className="h-3 w-3" />
                                                <span>{offer.views || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>هل أنت متأكد من حذف هذا العرض؟</AlertDialogTitle>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => deleteOffer(offer.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>إدارة الإعلانات</CardTitle>
                            <CardDescription>إضافة وحذف وتخصيص الإعلانات.</CardDescription>
                        </div>
                        <Dialog open={isAddAdOpen} onOpenChange={setIsAddAdOpen}>
                            <DialogTrigger asChild>
                                <Button size="icon"><ImagePlus /></Button>
                            </DialogTrigger>
                             <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>إضافة إعلان جديد</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Label>عنوان الإعلان</Label>
                                        <Input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="مثال: عرض خاص" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>صورة الإعلان</Label>
                                        <Input type="file" accept="image/*" onChange={handleAdImageChange} />
                                    </div>
                                    {adImagePreview && (
                                        <div className="flex justify-center">
                                            <Image src={adImagePreview} alt="معاينة الإعلان" width={200} height={100} className="rounded-md object-contain" />
                                        </div>
                                    )}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                    <Button onClick={handleAddAdvertisement} variant="success">إضافة</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {advertisements.map(ad => (
                                <div key={ad.id} className="p-3 border rounded-md flex flex-col gap-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <Image src={ad.image_url} alt={ad.title} width={64} height={36} className="rounded-sm object-cover" />
                                            <div>
                                                <p className="font-semibold">{ad.title}</p>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                  <Eye className="h-3 w-3" />
                                                  <span>{ad.views || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>هل أنت متأكد من حذف هذا الإعلان؟</AlertDialogTitle>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => deleteAdvertisement(ad.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">عرض في الصفحات التالية:</Label>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <Checkbox id={`dashboard-${ad.id}`} checked={ad.show_on?.dashboard} onCheckedChange={(c) => handleShowOnPageChange(ad.id, 'dashboard', !!c)} />
                                                <Label htmlFor={`dashboard-${ad.id}`} className="flex items-center gap-1 cursor-pointer"><LayoutDashboard className="h-3 w-3"/> تحكم</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox id={`sales-${ad.id}`} checked={ad.show_on?.sales} onCheckedChange={(c) => handleShowOnPageChange(ad.id, 'sales', !!c)} />
                                                <Label htmlFor={`sales-${ad.id}`} className="flex items-center gap-1 cursor-pointer"><ShoppingCart className="h-3 w-3"/> مبيعات</Label>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Checkbox id={`reports-${ad.id}`} checked={ad.show_on?.reports} onCheckedChange={(c) => handleShowOnPageChange(ad.id, 'reports', !!c)} />
                                                <Label htmlFor={`reports-${ad.id}`} className="flex items-center gap-1 cursor-pointer"><FileText className="h-3 w-3"/> تقارير</Label>
                                            </div>
                                             <div className="flex items-center gap-2">
                                                <Checkbox id={`inventory-${ad.id}`} checked={ad.show_on?.inventory} onCheckedChange={(c) => handleShowOnPageChange(ad.id, 'inventory', !!c)} />
                                                <Label htmlFor={`inventory-${ad.id}`} className="flex items-center gap-1 cursor-pointer"><Boxes className="h-3 w-3"/> مخزون</Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
