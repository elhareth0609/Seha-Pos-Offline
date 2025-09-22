
"use client";

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import type { Medication, ExchangeItem, DrugRequest, RequestResponse } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeftRight, Phone, Search, Package, CalendarDays, Pilcrow, DollarSign, PlusCircle, Trash2, Send, Eye } from 'lucide-react';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogFooter, AlertDialogTrigger, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';

const iraqProvinces = [
    "بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "دهوك", "كركوك", 
    "الأنبار", "صلاح الدين", "ديالى", "واسط", "بابل", "كربلاء", "النجف", 
    "القادسية", "ميسان", "ذي قار", "المثنى"
];

export default function ExchangePage() {
    const { 
        currentUser, scopedData, searchAllInventory, 
        getExchangeItems, postExchangeItem, deleteExchangeItem,
        getDrugRequests, postDrugRequest, deleteDrugRequest,
        respondToDrugRequest, ignoreDrugRequest
    } = useAuth();
    const { toast } = useToast();

    // Offers State
    const [exchangeItems, setExchangeItems] = React.useState<ExchangeItem[]>([]);
    const [myOffers, setMyOffers] = React.useState<ExchangeItem[]>([]);
    
    // Requests State
    const [drugRequests, setDrugRequests] = React.useState<DrugRequest[]>([]);
    const [myRequests, setMyRequests] = React.useState<DrugRequest[]>([]);

    const [loading, setLoading] = React.useState(true);
    const [isOfferDialogOpen, setIsOfferDialogOpen] = React.useState(false);
    const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false);
    const [isResponseDialogOpen, setIsResponseDialogOpen] = React.useState(false);
    const [selectedRequestForResponse, setSelectedRequestForResponse] = React.useState<DrugRequest | null>(null);
    const [responsePrice, setResponsePrice] = React.useState('');
    const [isViewingResponses, setIsViewingResponses] = React.useState(false);
    const [selectedRequestForViewing, setSelectedRequestForViewing] = React.useState<DrugRequest | null>(null);

    // Filters state
    const [searchTerm, setSearchTerm] = React.useState('');
    const [provinceFilter, setProvinceFilter] = React.useState(currentUser?.province || 'all');

    // Offer form state
    const [medicationSearch, setMedicationSearch] = React.useState('');
    const [suggestions, setSuggestions] = React.useState<Medication[]>([]);
    const [selectedMed, setSelectedMed] = React.useState<Medication | null>(null);
    const [offerQuantity, setOfferQuantity] = React.useState('');
    const [offerPrice, setOfferPrice] = React.useState('');
    const [offerContactPhone, setOfferContactPhone] = React.useState('');
    // const [offerContactPhone, setOfferContactPhone] = React.useState(currentUser?.pharmacyPhone || '');
    const [manualMedName, setManualMedName] = React.useState('');
    const [manualScientificName, setManualScientificName] = React.useState('');
    const [manualQuantity, setManualQuantity] = React.useState('');
    const [manualPrice, setManualPrice] = React.useState('');
    const [manualExpiration, setManualExpiration] = React.useState('');
    const [manualContactPhone, setManualContactPhone] = React.useState('');
    // const [manualContactPhone, setManualContactPhone] = React.useState(currentUser?.pharmacyPhone || '');

    // Request form state
    const [requestMedName, setRequestMedName] = React.useState('');
    const [requestQuantity, setRequestQuantity] = React.useState('');
    const [requestNotes, setRequestNotes] = React.useState('');

    React.useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [offers, requests] = await Promise.all([
                getExchangeItems(),
                getDrugRequests(),
            ]);
            
            setExchangeItems(offers || []);
            setDrugRequests(requests || []);
            
            if (currentUser) {
                setMyOffers(offers?.filter(o => o.pharmacy_id === currentUser.pharmacy_id) || []);
                setMyRequests(requests?.filter(r => r.pharmacy_id === currentUser.pharmacy_id) || []);
            }
            setLoading(false);
        };
        fetchData();
    }, [currentUser, getExchangeItems, getDrugRequests]);


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
    
    const resetOfferForms = () => {
        setMedicationSearch(''); setSelectedMed(null); setOfferQuantity(''); setOfferPrice('');
        setManualMedName(''); setManualScientificName(''); setManualQuantity(''); setManualPrice(''); setManualExpiration('');
    }
    
    const handlePostOffer = async (isManual: boolean) => {
        let newOfferData: Omit<ExchangeItem, 'id' | 'pharmacyName' | 'pharmacy_id'>;

        if(isManual) {
             if (!manualMedName || !manualQuantity || !manualPrice || !manualExpiration || !manualContactPhone) {
                toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'الرجاء ملء جميع الحقول المطلوبة.' });
                return;
            }
             newOfferData = {
                province: currentUser?.province || 'غير محدد',
                medicationName: manualMedName,
                scientificName: manualScientificName,
                quantity: parseInt(manualQuantity, 10),
                expirationDate: manualExpiration,
                price: parseFloat(manualPrice),
                contactPhone: manualContactPhone,
            };
        } else {
             if (!selectedMed || !offerQuantity || !offerPrice || !offerContactPhone) {
                toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'الرجاء ملء جميع الحقول المطلوبة.' });
                return;
            }
            newOfferData = {
                province: currentUser?.province || 'غير محدد',
                medicationName: selectedMed.name,
                scientificName: selectedMed.scientific_names?.join(', '),
                quantity: parseInt(offerQuantity, 10),
                expirationDate: selectedMed.expiration_date,
                price: parseFloat(offerPrice),
                contactPhone: offerContactPhone,
            };
        }

        const createdOffer = await postExchangeItem(newOfferData);
        
        if (createdOffer) {
            setExchangeItems(prev => [createdOffer, ...prev]);
            setMyOffers(prev => [createdOffer, ...prev]);
            toast({ title: 'تم نشر عرضك بنجاح!' });
            setIsOfferDialogOpen(false);
            resetOfferForms();
        }
    };

    const handleDeleteOffer = async (offerId: string) => {
        const success = await deleteExchangeItem(offerId);
        if (success) {
            setExchangeItems(prev => prev.filter(item => item.id !== offerId));
            setMyOffers(prev => prev.filter(item => item.id !== offerId));
            toast({ title: "تم حذف العرض بنجاح" });
        }
    }

    const handlePostRequest = async () => {
        if (!requestMedName || !requestQuantity) {
            toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'الرجاء إدخال اسم الدواء والكمية المطلوبة.' });
            return;
        }

        const newRequestData = {
            medicationName: requestMedName,
            quantity: parseInt(requestQuantity),
            notes: requestNotes,
        };

        const createdRequest = await postDrugRequest(newRequestData);
        
        if (createdRequest) {
            setDrugRequests(prev => [createdRequest, ...prev]);
            setMyRequests(prev => [createdRequest, ...prev]);
            toast({ title: "تم نشر طلبك بنجاح" });
            setIsRequestDialogOpen(false);
            setRequestMedName('');
            setRequestQuantity('');
            setRequestNotes('');
        }
    }

    const handleRespondToRequest = async () => {
        const price = parseFloat(responsePrice);
        if(!selectedRequestForResponse || isNaN(price) || price <= 0) {
            toast({ variant: 'destructive', title: 'سعر غير صالح' });
            return;
        }

        const updatedRequest = await respondToDrugRequest(selectedRequestForResponse.id, price);
        
        if (updatedRequest) {
            setDrugRequests(prev => prev.map(req => 
                req.id === updatedRequest.id 
                    ? updatedRequest
                    : req
            ));
            
            toast({ title: 'تم إرسال عرضك بنجاح', description: 'سيظهر عرضك لصاحب الطلب.' });
            setIsResponseDialogOpen(false);
            setResponsePrice('');
            setSelectedRequestForResponse(null);
        }
    };

    const handleIgnoreRequest = async (requestId: string) => {
        const success = await ignoreDrugRequest(requestId);
        if (success) {
            setDrugRequests(prev => prev.map(req => 
                req.id === requestId 
                    ? { ...req, ignoredBy: [...req.ignoredBy, currentUser!.pharmacy_id] }
                    : req
            ));
        }
    };
    
    const handleDeleteRequest = async (requestId: string) => {
        const success = await deleteDrugRequest(requestId);
        if (success) {
            setDrugRequests(prev => prev.filter(req => req.id !== requestId));
            setMyRequests(prev => prev.filter(req => req.id !== requestId));
            toast({ title: "تم حذف الطلب بنجاح" });
        }
    }

    const filteredItems = React.useMemo(() => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        
        const offers = exchangeItems.filter(item => {
            const matchesSearch = item.medicationName.toLowerCase().includes(lowerCaseSearch) ||
                                  item.scientificName?.toLowerCase().includes(lowerCaseSearch) ||
                                  item.pharmacyName.toLowerCase().includes(lowerCaseSearch);
            const matchesProvince = provinceFilter === 'all' || item.province === provinceFilter;
            return matchesSearch && matchesProvince;
        });

        const requests = drugRequests.filter(req => {
            const matchesSearch = req.medicationName.toLowerCase().includes(lowerCaseSearch) || req.pharmacyName.toLowerCase().includes(lowerCaseSearch);
            const matchesProvince = provinceFilter === 'all' || req.province === provinceFilter;
            const isIgnored = currentUser ? req.ignoredBy.includes(currentUser.pharmacy_id) : false;
            const isMine = currentUser ? req.pharmacy_id === currentUser.pharmacy_id : false;
            return matchesSearch && matchesProvince && !isIgnored && !isMine;
        });

        return { offers, requests };

    }, [exchangeItems, drugRequests, searchTerm, provinceFilter, currentUser]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <ArrowLeftRight className="h-10 w-10 text-primary" />
                            <div>
                                <CardTitle className="text-3xl">Pharma Swap</CardTitle>
                                <CardDescription>
                                    اعرض الأدوية الفائضة لديك أو اطلب ما ينقصك من الصيدليات الأخرى.
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen} >
                                <DialogTrigger asChild >
                                    <Button><Send className="me-2"/> اطلب دواء</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>إنشاء طلب دواء جديد</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-2">
                                            <Label>اسم الدواء والتركيز</Label>
                                            <Input value={requestMedName} onChange={e => setRequestMedName(e.target.value)} placeholder="مثال: Amoxil 500mg" required/>
                                        </div>
                                         <div className="space-y-2">
                                            <Label>الكمية المطلوبة</Label>
                                            <Input type="number" value={requestQuantity} onChange={e => setRequestQuantity(e.target.value)} placeholder="مثال: 5" required/>
                                        </div>
                                         <div className="space-y-2">
                                            <Label>ملاحظات (اختياري)</Label>
                                            <Textarea value={requestNotes} onChange={e => setRequestNotes(e.target.value)} placeholder="مثال: مطلوب بشكل عاجل"/>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                        <Button onClick={handlePostRequest}>نشر الطلب</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="success"><PlusCircle className="me-2" /> اعرض دواء للتبادل</Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                        <DialogTitle>عرض دواء جديد للتبادل</DialogTitle>
                                    </DialogHeader>
                                    <Tabs defaultValue="inventory">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="inventory">بحث من المخزون</TabsTrigger>
                                            <TabsTrigger value="manual">إدخال يدوي</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="inventory" className="py-4 space-y-4" dir="rtl">
                                            <div className="relative space-y-2">
                                                <Label>1. ابحث عن الدواء في مخزونك</Label>
                                                <Input value={medicationSearch} onChange={(e) => handleMedicationSearch(e.target.value)} placeholder="ابحث بالاسم..." />
                                                {suggestions.length > 0 && (
                                                    <Card className="absolute z-50 w-full mt-1"><CardContent className="p-0">
                                                        <ul className="divide-y">{suggestions.map(med => (<li key={med.id} onClick={() => handleSelectMedication(med)} className="p-3 hover:bg-accent cursor-pointer">{med.name}</li>))}</ul>
                                                    </CardContent></Card>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>2. حدد الكمية والسعر</Label>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Input type="number" value={offerQuantity} onChange={e => setOfferQuantity(e.target.value)} placeholder="الكمية المعروضة" disabled={!selectedMed} />
                                                    <Input type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} placeholder="السعر للقطعة" disabled={!selectedMed} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>3. رقم الهاتف للتواصل</Label>
                                                <Input type="tel" value={offerContactPhone} onChange={e => setOfferContactPhone(e.target.value)} required />
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild><Button variant="outline" onClick={resetOfferForms}>إلغاء</Button></DialogClose>
                                                <Button onClick={() => handlePostOffer(false)} disabled={!selectedMed}>نشر العرض</Button>
                                            </DialogFooter>
                                        </TabsContent>
                                        <TabsContent value="manual" className="py-4 space-y-4" dir="rtl">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>الاسم التجاري</Label><Input value={manualMedName} onChange={e => setManualMedName(e.target.value)} required /></div>
                                                <div className="space-y-2"><Label>الاسم العلمي (اختياري)</Label><Input value={manualScientificName} onChange={e => setManualScientificName(e.target.value)} /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2"><Label>الكمية</Label><Input type="number" value={manualQuantity} onChange={e => setManualQuantity(e.target.value)} required /></div>
                                                <div className="space-y-2"><Label>تاريخ الانتهاء</Label><Input type="date" value={manualExpiration} onChange={e => setManualExpiration(e.target.value)} required /></div>
                                            </div>
                                            <div className="space-y-2"><Label>السعر المقترح للقطعة</Label><Input type="number" value={manualPrice} onChange={e => setManualPrice(e.target.value)} required /></div>
                                            <div className="space-y-2"><Label>رقم الهاتف للتواصل</Label><Input type="tel" value={manualContactPhone} onChange={e => setManualContactPhone(e.target.value)} required /></div>
                                            <DialogFooter>
                                                <DialogClose asChild><Button variant="outline" onClick={resetOfferForms}>إلغاء</Button></DialogClose>
                                                <Button onClick={() => handlePostOffer(true)}>نشر العرض</Button>
                                            </DialogFooter>
                                        </TabsContent>
                                    </Tabs>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="flex flex-col sm:flex-row gap-4">
                         <div className="relative flex-1">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input placeholder="ابحث في العروض والطلبات..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10"/>
                        </div>
                         <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="اختر محافظة..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">كل المحافظات</SelectItem>
                                {iraqProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="offers" dir="rtl">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="offers">عروض الأدوية</TabsTrigger>
                    <TabsTrigger value="requests">الأدوية المفقودة</TabsTrigger>
                    <TabsTrigger value="mine">منشوراتي</TabsTrigger>
                </TabsList>
                <TabsContent value="offers" className="mt-4" dir="rtl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
                        : filteredItems.offers.length > 0 ? filteredItems.offers.map(item => (
                            <Card key={item.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="truncate">{item.medicationName}</CardTitle>
                                    <CardDescription>{item.scientificName}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm flex-grow">
                                    <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-2"><Package /> الكمية:</span><span className="font-bold font-mono">{item.quantity}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-2"><DollarSign /> السعر:</span><span className="font-bold font-mono text-green-600">{item.price.toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-2"><CalendarDays /> الانتهاء:</span><span className="font-mono">{new Date(item.expirationDate).toLocaleDateString('ar-EG')}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-2"><Pilcrow /> الصيدلية:</span><span className="font-semibold">{item.pharmacyName} ({item.province})</span></div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full" asChild><a href={`tel:${item.contactPhone}`}><Phone className="me-2" />تواصل مباشر ({item.contactPhone})</a></Button>
                                </CardFooter>
                            </Card>
                        )) : <div className="col-span-full text-center py-16 text-muted-foreground"><Package className="h-16 w-16 mx-auto mb-4" /><p>لا توجد عروض متاحة تطابق بحثك.</p></div>}
                    </div>
                </TabsContent>
                <TabsContent value="requests" className="mt-4" dir="rtl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {loading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-60 w-full" />)
                        : filteredItems.requests.length > 0 ? filteredItems.requests.map(req => (
                            <Card key={req.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{req.medicationName}</CardTitle>
                                    <CardDescription>الكمية المطلوبة: {req.quantity}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm text-muted-foreground">{req.notes || 'لا توجد ملاحظات إضافية.'}</p>
                                </CardContent>
                                <CardFooter className="flex-col items-stretch gap-2">
                                     <p className="text-xs text-muted-foreground text-center mb-2">طلب من: {req.pharmacyName} ({req.province})</p>
                                     <div className="grid grid-cols-2 gap-2">
                                        <Button variant="destructive" onClick={() => handleIgnoreRequest(req.id)}>غير متوفر</Button>
                                        <Button variant="success" onClick={() => { setSelectedRequestForResponse(req); setIsResponseDialogOpen(true); }}>متوفر لدي</Button>
                                    </div>
                                </CardFooter>
                            </Card>
                        )) : <div className="col-span-full text-center py-16 text-muted-foreground"><Send className="h-16 w-16 mx-auto mb-4" /><p>لا توجد طلبات متاحة حاليًا.</p></div>}
                    </div>
                </TabsContent>
                <TabsContent value="mine" className="mt-4 space-y-6" dir="rtl">
                    <div>
                        <h2 className="text-xl font-bold mb-4">عروضي</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {myOffers.length > 0 ? myOffers.map(item => (
                                <Card key={item.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex justify-between"><CardTitle className="truncate">{item.medicationName}</CardTitle>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من حذف هذا العرض؟</AlertDialogTitle></AlertDialogHeader>
                                                    <AlertDialogFooter className="sm:space-x-reverse"><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteOffer(item.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3 text-sm flex-grow"><div className="flex justify-between"><span>الكمية:</span><span className="font-mono">{item.quantity}</span></div><div className="flex justify-between"><span>السعر:</span><span className="font-mono">{item.price}</span></div></CardContent>
                                </Card>
                             )) : <p className="col-span-full text-muted-foreground">لم تقم بعرض أي أدوية بعد.</p>}
                        </div>
                    </div>
                     <div>
                        <h2 className="text-xl font-bold mb-4">طلباتي</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                             {myRequests.length > 0 ? myRequests.map(req => (
                                <Card key={req.id} className="flex flex-col">
                                    <CardHeader>
                                        <div className="flex justify-between"><CardTitle>{req.medicationName}</CardTitle>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>هل أنت متأكد من حذف هذا الطلب؟</AlertDialogTitle></AlertDialogHeader>
                                                    <AlertDialogFooter className="sm:space-x-reverse"><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteRequest(req.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                        <CardDescription>الكمية المطلوبة: {req.quantity}</CardDescription>
                                    </CardHeader>
                                    <CardFooter>
                                        <Button variant="outline" className="w-full" onClick={() => { setSelectedRequestForViewing(req); setIsViewingResponses(true); }}>
                                            <Eye className="me-2"/> عرض الردود ({req.responses.length})
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )) : <p className="col-span-full text-muted-foreground">لم تقم بنشر أي طلبات بعد.</p>}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            
            <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>تقديم عرض لـ: {selectedRequestForResponse?.medicationName}</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <p>صيدليتك: <span className="font-semibold">{scopedData.settings[0].pharmacyName}</span></p>
                        <div className="space-y-2">
                            <Label>السعر الذي تعرض به القطعة</Label>
                            <Input type="number" value={responsePrice} onChange={e => setResponsePrice(e.target.value)} placeholder="أدخل السعر..." required autoFocus/>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                        <Button onClick={handleRespondToRequest}>إرسال العرض</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewingResponses} onOpenChange={setIsViewingResponses}>
                <DialogContent>
                     <DialogHeader><DialogTitle>الردود على طلب: {selectedRequestForViewing?.medicationName}</DialogTitle></DialogHeader>
                     <div className="py-4 max-h-96 overflow-y-auto space-y-3">
                         {selectedRequestForViewing?.responses && selectedRequestForViewing.responses.length > 0 ? (
                            selectedRequestForViewing.responses.map(res => (
                                <Card key={res.id}>
                                    <CardContent className="p-3 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{res.responderPharmacyName}</p>
                                            <p className="text-sm text-green-600 font-mono">{res.price.toLocaleString()}</p>
                                        </div>
                                        <Button variant="outline" size="sm" asChild><a href={`tel:${res.contactPhone}`}><Phone className="me-2"/>تواصل</a></Button>
                                    </CardContent>
                                </Card>
                            ))
                         ) : (<p className="text-muted-foreground text-center py-8">لا توجد ردود على هذا الطلب بعد.</p>)}
                     </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
