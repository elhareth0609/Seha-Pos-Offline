
"use client";

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Contact, Phone, Building, MapPin, Search, PlusCircle } from 'lucide-react';
import type { MedicalRepresentative } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';


// This is a placeholder URL. Replace it with the actual API endpoint from your Flutter app's backend.
const REPS_API_URL = 'https://your-representatives-api.com/api/reps'; 

const iraqProvinces = [
    "بغداد", "البصرة", "نينوى", "أربيل", "السليمانية", "دهوك", "كركوك", 
    "الأنبار", "صلاح الدين", "ديالى", "واسط", "بابل", "كربلاء", "النجف", 
    "القادسية", "ميسان", "ذي قار", "المثنى"
];

export default function RepresentativesPage() {
    const { addRepresentative, currentUser } = useAuth();
    const [reps, setReps] = React.useState<MedicalRepresentative[]>([]);
    const [filteredReps, setFilteredReps] = React.useState<MedicalRepresentative[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    
    // Add Rep Dialog State
    const [isAddRepOpen, setIsAddRepOpen] = React.useState(false);
    const [newRepName, setNewRepName] = React.useState('');
    const [newRepCompany, setNewRepCompany] = React.useState('');
    const [newRepPhone, setNewRepPhone] = React.useState('');
    const [newRepProvince, setNewRepProvince] = React.useState('');


    React.useEffect(() => {
        const fetchReps = async () => {
            setLoading(true);
            try {
                // In a real scenario, you would add an API key or token for authentication
                const response = await fetch(REPS_API_URL);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data: MedicalRepresentative[] = await response.json();
                setReps(data);
                setFilteredReps(data);
            } catch (error) {
                console.error("Failed to fetch representatives:", error);
                // Here you might want to show a toast notification to the user
            } finally {
                setLoading(false);
            }
        };

        // fetchReps(); // Disabled for now to prevent errors with placeholder URL
        setLoading(false); // Set loading to false for demonstration purposes
    }, []);

    React.useEffect(() => {
        let filteredData = reps;
        
        // Filter based on the current user's pharmacy province
        if (currentUser?.province) {
            filteredData = filteredData.filter(item => item.province === currentUser.province);
        }

        // Filter by search term (name and company)
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            filteredData = filteredData.filter(item =>
                item.name.toLowerCase().includes(lowercasedFilter) ||
                item.company.toLowerCase().includes(lowercasedFilter)
            );
        }
        
        setFilteredReps(filteredData);
    }, [searchTerm, reps, currentUser]);
    
    const handleAddRep = () => {
        if (!newRepName || !newRepCompany || !newRepPhone || !newRepProvince) {
            // You can add a toast notification here for validation
            return;
        }
        const newRep: MedicalRepresentative = {
            id: `manual-${Date.now()}`, // Temporary ID for manually added reps
            name: newRepName,
            company: newRepCompany,
            phone_number: newRepPhone,
            province: newRepProvince,
            photo_url: '', // No photo for manually added reps, will use placeholder
        };
        
        // This should be replaced with a call to useAuth's addRepresentative in a real scenario
        setReps(prev => [...prev, newRep]);
        
        // Reset form and close dialog
        setIsAddRepOpen(false);
        setNewRepName('');
        setNewRepCompany('');
        setNewRepPhone('');
        setNewRepProvince('');
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <Contact className="h-10 w-10 text-primary" />
                            <div>
                                <CardTitle className="text-3xl">دليل المندوبين</CardTitle>
                                <CardDescription>
                                    قائمة بأسماء ومعلومات التواصل لمندوبي الشركات الطبية في محافظتك.
                                </CardDescription>
                            </div>
                        </div>
                         <Dialog open={isAddRepOpen} onOpenChange={setIsAddRepOpen}>
                            <DialogTrigger asChild>
                                <Button><PlusCircle className="me-2"/> إضافة مندوب</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>إضافة مندوب جديد</DialogTitle>
                                    <DialogDescription>أدخل بيانات المندوب لحفظها في الدليل.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-1">
                                        <Label htmlFor="rep-name">الاسم</Label>
                                        <Input id="rep-name" value={newRepName} onChange={e => setNewRepName(e.target.value)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="rep-company">الشركة</Label>
                                        <Input id="rep-company" value={newRepCompany} onChange={e => setNewRepCompany(e.target.value)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="rep-phone">رقم الهاتف</Label>
                                        <Input id="rep-phone" type="tel" value={newRepPhone} onChange={e => setNewRepPhone(e.target.value)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <Label htmlFor="rep-province">المحافظة</Label>
                                        <Select onValueChange={setNewRepProvince} required>
                                            <SelectTrigger id="rep-province"><SelectValue placeholder="اختر محافظة..." /></SelectTrigger>
                                            <SelectContent>
                                                {iraqProvinces.map(province => (
                                                    <SelectItem key={province} value={province}>{province}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                    <Button onClick={handleAddRep} variant="success">إضافة</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="ابحث بالاسم أو الشركة..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full max-w-lg pl-10"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <Card key={i} className="p-4 space-y-3">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-16 w-16 rounded-full" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </Card>
                    ))}
                </div>
            ) : filteredReps.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredReps.map(rep => (
                        <Card key={rep.id} className="flex flex-col p-4 transition-all hover:shadow-lg hover:border-primary">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="relative h-20 w-20">
                                    <Image 
                                        src={rep.photo_url || '/placeholder-user.png'} 
                                        alt={rep.name} 
                                        layout="fill"
                                        objectFit="cover"
                                        className="rounded-full bg-muted"
                                    />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-primary">{rep.name}</h3>
                                    <p className="text-sm text-muted-foreground">{rep.company}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm flex-grow">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-4 w-4" />
                                    <span>{rep.province}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-4 w-4" />
                                    <span className="font-mono">{rep.phone_number}</span>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="text-center py-16 text-muted-foreground">
                    <Contact className="h-16 w-16 mx-auto mb-4" />
                    <p className="font-semibold">لا توجد بيانات لعرضها</p>
                    <p className="text-sm">
                        {reps.length > 0 ? 'لا يوجد مندوبون لهذه المحافظة أو مطابقون لبحثك.' : 'لم يتم جلب بيانات المندوبين بعد.'}
                    </p>
                </div>
            )}
        </div>
    );
}
