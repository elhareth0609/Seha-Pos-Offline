

"use client";

import * as React from 'react';
import * as XLSX from 'xlsx';
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
import type { User, Advertisement, Offer, SupportRequest, Medication, PharmacyGroup } from '@/lib/types';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MoreVertical, PlusCircle, Trash2, ToggleLeft, ToggleRight, Settings, LogOut, Eye, EyeOff, FileText, Users, Building, ImagePlus, Image as ImageIcon, LayoutDashboard, ShoppingCart,LockKeyhole, LockOpen, LockIcon, Boxes, BadgePercent, Phone, CalendarClock, Pencil, LifeBuoy, Upload, Pill, Users2, X, Group, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { isAfter, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const iraqProvinces = [
    "بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "دهوك", "كركوك", 
    "الأنبار", "صلاح الدين", "ديالى", "واسط", "بابل", "كربلاء", "النجف", 
    "القادسية", "ميسان", "ذي قار", "المثنى"
];

const addAdminSchema = z.object({
    name: z.string().min(3, { message: "الاسم مطلوب" }),
    email: z.string().email({ message: "بريد إلكتروني غير صالح" }),
    pin: z.string().min(6, { message: "يجب أن يتكون رمز PIN من 6 أحرف على الأقل." }),
    province: z.string({ required_error: "الرجاء اختيار محافظة" }),
    dofied_id: z.string().min(1, { message: "Dofied Id مطلوب" }),
});

type AddAdminFormValues = z.infer<typeof addAdminSchema>;


const editAdminSchema = z.object({
    name: z.string().min(3, { message: "الاسم مطلوب" }),
    email: z.string().email({ message: "بريد إلكتروني غير صالح" }),
    pin: z.string().optional().refine(val => !val || val.length >= 6, { message: "رمز PIN يجب أن يكون 6 رموز على الأقل" }),
    province: z.string({ required_error: "الرجاء اختيار محافظة" }),
    dofied_id: z.string().min(1, { message: "Dofied Id مطلوب" }),
});

type EditAdminFormValues = z.infer<typeof editAdminSchema>;


const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

function AdminRow({ admin, onDelete, onToggleStatus, onEdit, pharmacySettings }: { admin: User, onDelete: (user: User) => void, onToggleStatus: (user: User) => void, onEdit: (user: User) => void, pharmacySettings: Record<string, any> }) {
    const [showPin, setShowPin] = React.useState(false);

    return (
        <TableRow>
            <TableCell className="font-medium">{pharmacySettings[admin.pharmacy_id]?.pharmacyName || "صيدلية " + admin.name}</TableCell>
            <TableCell className="hidden sm:table-cell">{admin.email}</TableCell>
            <TableCell className="hidden lg:table-cell">
                <div className="flex items-center gap-2">
                    <span className="font-mono">{showPin ? admin.pin : '••••••'}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPin(p => !p)}>
                        {showPin ? <LockOpen className="h-4 w-4" /> : <LockIcon className="h-4 w-4" />}
                    </Button>
                </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">{admin.province || 'غير محدد'}</TableCell>
            <TableCell className="hidden md:table-cell">{admin.dofied_id || 'غير محدد'}</TableCell>
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
                        <DropdownMenuItem onSelect={() => onEdit(admin)}>
                            <Pencil className="me-2"/>
                            تعديل البيانات
                        </DropdownMenuItem>
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
                                <AlertDialogFooter className='sm:space-x-reverse'>
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

function PharmacyGroupsManagement() {
    const { pharmacyGroups, getPharmacyGroups, createPharmacyGroup, updatePharmacyGroup, deletePharmacyGroup, users, getAllPharmacySettings } = useAuth();
    const [isCreateGroupOpen, setIsCreateGroupOpen] = React.useState(false);
    const [newGroupName, setNewGroupName] = React.useState('');
    const [selectedPharmacyIds, setSelectedPharmacyIds] = React.useState<string[]>([]);
    const [pharmacySettings, setPharmacySettings] = React.useState<Record<string, any>>({});
    const [pharmacySearchTerm, setPharmacySearchTerm] = React.useState('');

    const allAdmins = users.filter(u => u.role === 'Admin');

    React.useEffect(() => {
        getPharmacyGroups();
        getAllPharmacySettings().then(setPharmacySettings);
    }, []); // Empty dependency array to run only once on mount

    const unassignedPharmacies = React.useMemo(() => {
        const assignedIds = new Set(pharmacyGroups.flatMap(g => g.pharmacy_ids));
        return allAdmins.filter(admin => !assignedIds.has(admin.pharmacy_id));
    }, [pharmacyGroups, allAdmins]);

    const filteredUnassignedPharmacies = React.useMemo(() => {
        if (!pharmacySearchTerm) {
            return unassignedPharmacies;
        }
        return unassignedPharmacies.filter(admin => 
            (pharmacySettings[admin.pharmacy_id]?.pharmacyName || `صيدلية ${admin.name}`).toLowerCase().includes(pharmacySearchTerm.toLowerCase())
        );
    }, [unassignedPharmacies, pharmacySearchTerm, pharmacySettings]);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim() || selectedPharmacyIds.length === 0) {
            // Handle error toast
            return;
        }
        await createPharmacyGroup(newGroupName, selectedPharmacyIds);
        setNewGroupName('');
        setSelectedPharmacyIds([]);
        setIsCreateGroupOpen(false);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Group className="h-6 w-6 text-primary"/>إدارة مجموعات الصيدليات</CardTitle>
                    <CardDescription>عرّف المجموعات لتمكين البحث عن الأدوية بين الفروع.</CardDescription>
                </div>
                <Button onClick={() => setIsCreateGroupOpen(true)}>إنشاء مجموعة جديدة</Button>
            </CardHeader>
            <CardContent>
                {pharmacyGroups.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {pharmacyGroups.map(group => (
                            <Card key={group.id}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-lg">{group.name}</CardTitle>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4"/></Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من حذف المجموعة؟</AlertDialogTitle></AlertDialogHeader>
                                            <AlertDialogFooter className="sm:space-x-reverse"><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => deletePharmacyGroup(group.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardHeader>
                                <CardContent>
                                    <ul className="list-disc pl-5 text-muted-foreground text-sm space-y-1">
                                        {group.pharmacy_ids.map(id => (
                                            <li key={id}>{pharmacySettings[id]?.pharmacyName || `صيدلية ${id}`}</li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                        <p>لم يتم إنشاء أي مجموعات بعد. ابدأ بإنشاء مجموعة جديدة.</p>
                    </div>
                )}
            </CardContent>
             <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>إنشاء مجموعة صيدليات جديدة</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="group-name">اسم المجموعة</Label>
                            <Input id="group-name" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="مثال: مجموعة فروع بغداد"/>
                        </div>
                        <div className="space-y-2">
                            <Label>اختر الصيدليات (غير المرتبطة بمجموعة)</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="ابحث عن صيدلية..." 
                                    value={pharmacySearchTerm} 
                                    onChange={(e) => setPharmacySearchTerm(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div className="max-h-60 overflow-y-auto space-y-2 rounded-md border p-2">
                                {filteredUnassignedPharmacies.length > 0 ? filteredUnassignedPharmacies.map(admin => (
                                    <div key={admin.pharmacy_id} className="flex items-center gap-2 rounded-md p-2 hover:bg-muted">
                                        <Checkbox 
                                            id={`pharm-${admin.pharmacy_id}`}
                                            checked={selectedPharmacyIds.includes(admin.pharmacy_id)}
                                            onCheckedChange={(checked) => {
                                                setSelectedPharmacyIds(prev => 
                                                    checked ? [...prev, admin.pharmacy_id] : prev.filter(id => id !== admin.pharmacy_id)
                                                )
                                            }}
                                        />
                                        <Label htmlFor={`pharm-${admin.pharmacy_id}`} className="w-full cursor-pointer">
                                            {pharmacySettings[admin.pharmacy_id]?.pharmacyName || `صيدلية ${admin.name}`}
                                        </Label>
                                    </div>
                                )) : <p className="text-center text-sm text-muted-foreground py-4">لا توجد صيدليات متاحة.</p>}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                        <Button onClick={handleCreateGroup}>إنشاء المجموعة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    )
}

export default function SuperAdminPage() {
    const { 
        currentUser, users, createPharmacyAdmin, deleteUser, toggleUserStatus, logout, 
        advertisements, addAdvertisement, updateAdvertisement, deleteAdvertisement, 
        offers, addOffer, deleteOffer,
        getPaginatedUsers,
        updateUser,
        supportRequests, updateSupportRequestStatus,
        getAllPharmacySettings,
        uploadCentralDrugList,
    } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [pharmacyAdmins, setPharmacyAdmins] = React.useState<User[]>([]);
    const [totalPages, setTotalPages] = React.useState(1);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [perPage, setPerPage] = React.useState(10);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [pharmacySettings, setPharmacySettings] = React.useState<Record<string, any>>({});
    const [statusFilter, setStatusFilter] = React.useState("all");
    const [provinceFilter, setProvinceFilter] = React.useState("all");

    const [isAddAdminOpen, setIsAddAdminOpen] = React.useState(false);
    const [isEditAdminOpen, setIsEditAdminOpen] = React.useState(false);
    const [editingAdmin, setEditingAdmin] = React.useState<User | null>(null);

    // Ads State
    const [isAddAdOpen, setIsAddAdOpen] = React.useState(false);
    const [adTitle, setAdTitle] = React.useState("");
    const [adImageFile, setAdImageFile] = React.useState<File | null>(null);
    const [adImagePreview, setAdImagePreview] = React.useState<string | null>(null);
    
    // Offers State
    const [isAddOfferOpen, setIsAddOfferOpen] = React.useState(false);
    const [offerTitle, setOfferTitle] = React.useState("");
    const [offerContact, setOfferContact] = React.useState("");
    const [offerExpiry, setOfferExpiry] = React.useState("");
    const [offerImageFile, setOfferImageFile] = React.useState<File | null>(null);
    const [offerImagePreview, setOfferImagePreview] = React.useState<string | null>(null);
    const [offerFilter, setOfferFilter] = React.useState<'active' | 'expired'>('active');

    // Central Drug List Upload
    const [isImporting, setIsImporting] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    
    const addAdminForm = useForm<AddAdminFormValues>({
        resolver: zodResolver(addAdminSchema),
        defaultValues: { name: "", email: "", pin: "", province: "", dofied_id: "" },
    });
    
    const editAdminForm = useForm<EditAdminFormValues>({
        resolver: zodResolver(editAdminSchema),
        defaultValues: { name: "", email: "", pin: "", province: "", dofied_id: "" },
    });

    const fetchData = React.useCallback(async (page: number, limit: number, search: string, fetchSettings = false) => {
        setLoading(true);
        try {
            const filters = {
                ...(statusFilter !== 'all' && { status: statusFilter }),
                ...(provinceFilter !== 'all' && { province: provinceFilter }),
            };
            const data = await getPaginatedUsers('Admin', page, limit, search, filters);
            setPharmacyAdmins(data.data);
            setTotalPages(data.last_page);
            setCurrentPage(data.current_page);
            
            // جلب إعدادات الصيدليات (only when fetchSettings is true)
            if (fetchSettings) {
                const settings = await getAllPharmacySettings();
                setPharmacySettings(settings);
            }
        } catch (error) {
            console.error("Failed to fetch admins", error);
        } finally {
            setLoading(false);
        }
    }, [getPaginatedUsers, statusFilter, provinceFilter, getAllPharmacySettings]);

    // Fetch pharmacy settings only once on mount
    React.useEffect(() => {
        if (currentUser && currentUser.role === 'SuperAdmin') {
            getAllPharmacySettings().then(setPharmacySettings);
        }
    }, [currentUser, getAllPharmacySettings]);

    React.useEffect(() => {
        if (currentUser && currentUser.role === 'SuperAdmin') {
             const handler = setTimeout(() => {
                fetchData(currentPage, perPage, searchTerm, false); // Don't fetch settings on every change
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
        const success = await createPharmacyAdmin(data.name, data.email, data.pin, data.province, data.dofied_id);
        if (success) {
            toast({ title: "تم إنشاء حساب المدير بنجاح" });
            fetchData(1, perPage, ""); // Refresh
            setIsAddAdminOpen(false);
            addAdminForm.reset();
        } else {
            toast({ variant: 'destructive', title: "خطأ", description: "البريد الإلكتروني مستخدم بالفعل." });
        }
    };
    
    const handleEditAdmin = async (data: EditAdminFormValues) => {
        if (!editingAdmin) return;
        const success = await updateUser(editingAdmin.id, {
            name: data.name,
            email: data.email,
            pin: data.pin || undefined,
            province: data.province,
            dofied_id: data.dofied_id,
        });
        if (success) {
            toast({ title: "تم تحديث حساب المدير بنجاح" });
            fetchData(currentPage, perPage, searchTerm); // Refresh
            setIsEditAdminOpen(false);
            setEditingAdmin(null);
        } else {
            toast({ variant: 'destructive', title: "خطأ", description: "البريد الإلكتروني مستخدم بالفعل أو حدث خطأ آخر." });
        }
    };
    
    const openEditDialog = (admin: User) => {
        setEditingAdmin(admin);
        editAdminForm.reset({
            name: admin.name,
            email: admin.email,
            province: admin.province || '',
            pin: '',
            dofied_id: admin.dofied_id || ''
        });
        setIsEditAdminOpen(true);
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
        toggleUserStatus(user).then(success => {
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
                console.log("say hello Advertisement")

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
        if (!offerTitle.trim() || !offerImageFile || !offerExpiry) {
            toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'الرجاء إدخال عنوان وتاريخ انتهاء واختيار صورة للعرض.' });
            return;
        }
        console.log("say hello offer")

        const imageDataUri = await fileToDataUri(offerImageFile);
        console.log("say hello offer 1")

        await addOffer(offerTitle, imageDataUri, offerExpiry, offerContact);
        console.log("say hello offer 2")
        setIsAddOfferOpen(false);
        setOfferTitle("");
        setOfferContact("");
        setOfferExpiry("");
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

    const filteredOffers = React.useMemo(() => {
        const now = new Date();
        if (offerFilter === 'active') {
            return (offers || []).filter(offer => isAfter(parseISO(offer.expiration_date), now));
        }
        return (offers || []).filter(offer => !isAfter(parseISO(offer.expiration_date), now));
    }, [offers, offerFilter]);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                setIsImporting(true);
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    toast({ variant: 'destructive', title: 'ملف فارغ' });
                    setIsImporting(false);
                    return;
                }

                const medicationsToProcess: Partial<Medication>[] = jsonData.map(row => ({
                    name: row['الاسم التجاري'],
                    scientific_names: (row['الاسم العلمي'] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
                    barcodes: (row['الباركود'] || '').split(',').map((s: string) => s.trim()).filter(Boolean),
                    dosage: row['الجرعة'],
                    dosage_form: row['الشكل الدوائي'],
                }));
                
                await uploadCentralDrugList(medicationsToProcess);
                toast({ title: "تم رفع الملف بنجاح", description: `جاري معالجة ${medicationsToProcess.length} دواء.` });

            } catch (error) {
                console.error('Error importing from Excel:', error);
                toast({ variant: 'destructive', title: 'خطأ في الاستيراد' });
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsArrayBuffer(file);
    };

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
                        <Link href="/superadmin/drugs"><Pill className="me-2"/> قاعدة الأدوية</Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/superadmin/reports"><FileText className="me-2"/> عرض التقارير</Link>
                    </Button>
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
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">عدد الصيدليات</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{pharmacyAdmins.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي الموظفين</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{totalEmployees}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">عدد الإعلانات</CardTitle>
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{advertisements.length}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">عدد العروض</CardTitle>
                        <BadgePercent className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{offers.length}</div>
                    </CardContent>
                </Card>
            </div>

            <PharmacyGroupsManagement />

            <div className="grid gap-6 lg:grid-cols-1">
                <Card className="lg:col-span-2">
                    <CardHeader>
                         <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <CardTitle>مدراء الصيدليات</CardTitle>
                                <CardDescription>قائمة بجميع حسابات مدراء الصيدليات المسجلين.</CardDescription>
                            </div>
                            <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                                <DialogTrigger asChild>
                                    <Button><PlusCircle className="me-2"/> إنشاء حساب صيدلية</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>إنشاء حساب صيدلية</DialogTitle>
                                    </DialogHeader>
                                    <Form {...addAdminForm}>
                                        <form onSubmit={addAdminForm.handleSubmit(handleAddAdmin)} className="space-y-4 py-2">
                                            <FormField control={addAdminForm.control} name="name" render={({ field }) => (
                                                <FormItem><FormLabel>اسم الصيدلية</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={addAdminForm.control} name="email" render={({ field }) => (
                                                <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={addAdminForm.control} name="pin" render={({ field }) => (
                                                <FormItem><FormLabel>رمز PIN</FormLabel><FormControl><Input type="password"   {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={addAdminForm.control} name="province" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>المحافظة</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="اختر محافظة..." />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {iraqProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <FormField control={addAdminForm.control} name="dofied_id" render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Dofied Id</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="أدخل Dofied Id" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
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
                        <div className="pt-4 flex flex-wrap gap-2">
                            <Input 
                                placeholder="ابحث بالاسم أو البريد..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="فلتر حسب الحالة" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل الحالات</SelectItem>
                                    <SelectItem value="active">فعال</SelectItem>
                                    <SelectItem value="suspended">معلق</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                                <SelectTrigger className="w-[180px]"><SelectValue placeholder="فلتر حسب المحافظة" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل المحافظات</SelectItem>
                                    {iraqProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                       <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>اسم الصيدلية</TableHead>
                                    <TableHead className="hidden sm:table-cell">البريد الإلكتروني</TableHead>
                                    <TableHead className="hidden lg:table-cell">رمز PIN</TableHead>
                                    <TableHead className="hidden md:table-cell">المحافظة</TableHead>
                                    <TableHead className="hidden md:table-cell">Dofied Id</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead className="text-left">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? Array.from({length: perPage}).map((_,i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                )) : pharmacyAdmins.map(admin => (
                                    <AdminRow 
                                        key={admin.id} 
                                        admin={admin} 
                                        onDelete={handleDeleteAdmin} 
                                        onToggleStatus={handleToggleStatus}
                                        onEdit={openEditDialog}
                                        pharmacySettings={pharmacySettings}
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

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <LifeBuoy className="h-6 w-6 text-primary"/>
                        <CardTitle>طلبات الدعم الفني</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>اسم الصيدلية</TableHead>
                                <TableHead>رقم الهاتف</TableHead>
                                <TableHead>القسم</TableHead>
                                <TableHead>وقت التواصل</TableHead>
                                <TableHead>تاريخ الطلب</TableHead>
                                <TableHead>الحالة</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(supportRequests || []).length > 0 ? supportRequests.map(req => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{pharmacySettings[req.pharmacy_id]?.pharmacyName}</TableCell>
                                    <TableCell className="font-mono">{req.phone_number}</TableCell>
                                    <TableCell>{req.problem_section}</TableCell>
                                    <TableCell>{req.contact_time}</TableCell>
                                    <TableCell>{format(new Date(req.created_at), 'Pp', { locale: ar })}</TableCell>
                                    <TableCell>
                                        <Select 
                                            value={req.status} 
                                            onValueChange={(status) => updateSupportRequestStatus(req.id, status as 'new' | 'contacted')}
                                        >
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="new">
                                                    <Badge variant="destructive">جديد</Badge>
                                                </SelectItem>
                                                <SelectItem value="contacted">
                                                     <Badge variant="secondary" className="bg-green-100 text-green-800">تم التواصل</Badge>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        لا توجد طلبات دعم حاليًا.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            
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
                                        <Input value={offerTitle} onChange={(e) => setOfferTitle(e.target.value)} placeholder="مثال: خصم 20% على منتجات العناية بالبشرة" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>رقم التواصل (اختياري)</Label>
                                        <Input value={offerContact} onChange={(e) => setOfferContact(e.target.value)} placeholder="مثال: 07701234567" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>تاريخ انتهاء العرض</Label>
                                        <Input type="date" value={offerExpiry} onChange={(e) => setOfferExpiry(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>صورة العرض</Label>
                                        <Input type="file" accept="image/*" onChange={handleOfferImageChange} required />
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
                        <Tabs value={offerFilter} onValueChange={(v) => setOfferFilter(v as any)}>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="active">العروض السارية</TabsTrigger>
                                <TabsTrigger value="expired">العروض المنتهية</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="space-y-4 mt-4 max-h-96 overflow-y-auto">
                            {filteredOffers.map(offer => (
                                <div key={offer.id} className="p-3 border rounded-md flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Image src={offer.image_url} alt={offer.title} width={64} height={36} className="rounded-sm object-cover" />
                                        <div className="text-sm">
                                            <p className="font-semibold">{offer.title}</p>
                                            {offer.contact_number && <div className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="h-3 w-3"/><span>{offer.contact_number}</span></div>}
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground"><CalendarClock className="h-3 w-3"/><span>ينتهي في: {new Date(offer.expiration_date).toLocaleDateString('en-US')}</span></div>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3 w-3" /><span>{offer.views || 0} مشاهدة</span></div>
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
                                            <AlertDialogFooter className='sm:space-x-reverse'>
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
                        <div className="space-y-4 max-h-96 overflow-y-auto">
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
                                                <AlertDialogFooter className='sm:space-x-reverse'>
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

            <Dialog open={isEditAdminOpen} onOpenChange={setIsEditAdminOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تعديل حساب المدير: {editingAdmin?.name}</DialogTitle>
                    </DialogHeader>
                    <Form {...editAdminForm}>
                        <form onSubmit={editAdminForm.handleSubmit(handleEditAdmin)} className="space-y-4 py-2">
                            <FormField control={editAdminForm.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>اسم الصيدلية</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={editAdminForm.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={editAdminForm.control} name="pin" render={({ field }) => (
                                <FormItem><FormLabel>رمز PIN الجديد (اختياري)</FormLabel><FormControl><Input type="password" placeholder="اتركه فارغاً لعدم التغيير" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={editAdminForm.control} name="province" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>المحافظة</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="اختر محافظة..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {iraqProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={editAdminForm.control} name="dofied_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Dofied Id</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="أدخل Dofied Id" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter className="pt-4">
                                <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                                <Button type="submit" variant="success">حفظ التغييرات</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
