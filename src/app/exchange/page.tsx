
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { Medication, ExchangeItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftRight, Phone, Search, Package, CalendarDays, Pilcrow, DollarSign, PlusCircle, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const iraqProvinces = [
    "بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "دهوك", "كركوك", 
    "الأنبار", "صلاح الدين", "ديالى", "واسط", "بابل", "كربلاء", "النجف", 
    "القادسية", "ميسان", "ذي قار", "المثنى"
];

// Dummy data with province
const dummyExchangeItems: (ExchangeItem & { province: string })[] = [
    { id: '1', pharmacyId: 'ph-1', pharmacyName: 'صيدلية الشفاء', province: 'بغداد', medicationName: 'Amoxil 500mg', quantity: 50, expirationDate: '2025-12-31', price: 1500, contactPhone: '07701112222', scientificName: 'Amoxicillin' },
    { id: '2', pharmacyId: 'ph-2', pharmacyName: 'صيدلية دجلة', province: 'البصرة', medicationName: 'Cataflam 50mg', quantity: 30, expirationDate: '2025-08-01', price: 2000, contactPhone: '07803334444', scientificName: 'Diclofenac Potassium' },
    { id: '3', pharmacyId: 'ph-3', pharmacyName: 'صيدلية بغداد الحديثة', province: 'بغداد', medicationName: 'Panadol Extra', quantity: 100, expirationDate: '2026-05-20', price: 1000, contactPhone: '07905556666', scientificName: 'Paracetamol, Caffeine' },
    { id: '4', pharmacyId: 'ph-currentUser', pharmacyName: 'صيدليتي', province: 'بغداد', medicationName: 'Zinnat 250mg', quantity: 25, expirationDate: '2025-10-10', price: 5000, contactPhone: '07712345678', scientificName: 'Cefuroxime' },

];


export default function ExchangePage() {
    const { currentUser, scopedData, searchAllInventory } = useAuth();
    const { toast } = useToast();

    const [exchangeItems, setExchangeItems] = React.useState<(ExchangeItem & { province: string })[]>(dummyExchangeItems);
    const [loading, setLoading] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isOfferDialogOpen, setIsOfferDialogOpen] = React.useState(false);

    // Filters state
    const [provinceFilter, setProvinceFilter] = React.useState(currentUser?.province || 'all');
    const [activeTab, setActiveTab] = React.useState('all');

    // Form state for new offer
    const [medicationSearch, setMedicationSearch] = React.useState('');
    const [suggestions, setSuggestions] = React.useState<Medication[]>([]);
    const [selectedMed, setSelectedMed] = React.useState<Medication | null>(null);
    const [quantity, setQuantity] = React.useState('');
    const [price, setPrice] = React.useState('');
    const [contactPhone, setContactPhone] = React.useState(currentUser?.pharmacyPhone || '');

    const handleMedicationSearch = async (term: string) => {
        setMedicationSearch(term);
        if (term.length > 1) {
            const results = await searchAllInventory(term);
            setSuggestions(results.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectMedication = (med: Medication) => {
        setSelectedMed(med);
        setMedicationSearch(med.name);
        setSuggestions([]);
    };

    const handlePostOffer = () => {
        if (!selectedMed || !quantity || !price || !contactPhone) {
            toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'الرجاء ملء جميع الحقول المطلوبة.' });
            return;
        }

        const newOffer: ExchangeItem & { province: string } = {
            id: `ex-${Date.now()}`,
            pharmacyId: currentUser?.pharmacy_id || 'unknown',
            pharmacyName: scopedData.settings[0].pharmacyName,
            province: currentUser?.province || 'غير محدد',
            medicationName: selectedMed.name,
            scientificName: selectedMed.scientific_names?.join(', '),
            quantity: parseInt(quantity, 10),
            expirationDate: selectedMed.expiration_date,
            price: parseFloat(price),
            contactPhone: contactPhone,
        };

        setExchangeItems(prev => [newOffer, ...prev]);
        toast({ title: 'تم نشر عرضك بنجاح!' });
        setIsOfferDialogOpen(false);
        // Reset form
        setMedicationSearch('');
        setSelectedMed(null);
        setQuantity('');
        setPrice('');
    };

    const handleDeleteOffer = (offerId: string) => {
        setExchangeItems(prev => prev.filter(item => item.id !== offerId));
        toast({ title: "تم حذف العرض بنجاح" });
    }
    
    const filteredItems = React.useMemo(() => {
        return exchangeItems.filter(item => {
            const matchesSearch = item.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.scientificName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  item.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesProvince = provinceFilter === 'all' || item.province === provinceFilter;
            
            if (activeTab === 'mine') {
                return item.pharmacyId === currentUser?.pharmacy_id && matchesSearch;
            }

            return matchesSearch && matchesProvince;
        });
    }, [exchangeItems, searchTerm, provinceFilter, activeTab, currentUser]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <ArrowLeftRight className="h-10 w-10 text-primary" />
                            <div>
                                <CardTitle className="text-3xl">سوق التبادل</CardTitle>
                                <CardDescription>
                                    اعرض الأدوية الفائضة لديك أو تصفح عروض الصيدليات الأخرى.
                                </CardDescription>
                            </div>
                        </div>
                        <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="success"><PlusCircle className="me-2" /> اعرض دواء للتبادل</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>عرض دواء جديد للتبادل</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="relative space-y-2">
                                        <Label htmlFor="med-search">1. ابحث عن الدواء في مخزونك</Label>
                                        <Input
                                            id="med-search"
                                            placeholder="ابحث بالاسم..."
                                            value={medicationSearch}
                                            onChange={(e) => handleMedicationSearch(e.target.value)}
                                        />
                                        {suggestions.length > 0 && (
                                            <Card className="absolute z-50 w-full mt-1 bg-background shadow-lg border">
                                                <CardContent className="p-0">
                                                    <ul className="divide-y divide-border">
                                                        {suggestions.map(med => (
                                                            <li key={med.id} onClick={() => handleSelectMedication(med)} className="p-3 hover:bg-accent cursor-pointer rounded-md">
                                                                {med.name}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label>2. حدد الكمية والسعر</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="الكمية المعروضة" disabled={!selectedMed} />
                                            <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="السعر المقترح للقطعة" disabled={!selectedMed} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="contact-phone">3. رقم الهاتف للتواصل</Label>
                                        <Input id="contact-phone" type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="07701234567" required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                    <Button onClick={handlePostOffer} disabled={!selectedMed}>نشر العرض</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                 <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <TabsList className="grid w-full sm:w-auto grid-cols-2">
                                <TabsTrigger value="all">كل العروض</TabsTrigger>
                                <TabsTrigger value="mine">عروضي</TabsTrigger>
                            </TabsList>
                             <div className="relative flex-1">
                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="ابحث في العروض بالاسم التجاري، العلمي أو اسم الصيدلية..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10"
                                />
                            </div>
                            {activeTab === 'all' && (
                                 <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="اختر محافظة..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">كل المحافظات</SelectItem>
                                        {iraqProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </Tabs>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
                ) : filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <Card key={item.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="truncate">{item.medicationName}</CardTitle>
                                        <CardDescription>{item.scientificName}</CardDescription>
                                    </div>
                                    {activeTab === 'mine' && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>هل أنت متأكد من حذف هذا العرض؟</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        لا يمكن التراجع عن هذا الإجراء.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter className="sm:space-x-reverse">
                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteOffer(item.id)} className="bg-destructive hover:bg-destructive/90">نعم، قم بالحذف</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm flex-grow">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2"><Package /> الكمية المعروضة:</span>
                                    <span className="font-bold font-mono">{item.quantity}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2"><DollarSign /> السعر:</span>
                                    <span className="font-bold font-mono text-green-600">{item.price.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2"><CalendarDays /> تاريخ الانتهاء:</span>
                                    <span className="font-mono">{new Date(item.expirationDate).toLocaleDateString('ar-EG')}</span>
                                </div>
                                 <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-2"><Pilcrow /> الصيدلية:</span>
                                    <span className="font-semibold">{item.pharmacyName} ({item.province})</span>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button variant="outline" className="w-full" asChild>
                                    <a href={`tel:${item.contactPhone}`}>
                                        <Phone className="me-2" />
                                        تواصل مباشر ({item.contactPhone})
                                    </a>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-16 text-muted-foreground">
                        <Package className="h-16 w-16 mx-auto mb-4" />
                        <p>لا توجد عروض متاحة تطابق بحثك.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

    