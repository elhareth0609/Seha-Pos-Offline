
"use client";

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Contact, Phone, Building, MapPin, Search } from 'lucide-react';
import type { MedicalRepresentative } from '@/lib/types';

// This is a placeholder URL. Replace it with the actual API endpoint from your Flutter app's backend.
const REPS_API_URL = 'https://your-representatives-api.com/api/reps'; 

export default function RepresentativesPage() {
    const [reps, setReps] = React.useState<MedicalRepresentative[]>([]);
    const [filteredReps, setFilteredReps] = React.useState<MedicalRepresentative[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');

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
        const lowercasedFilter = searchTerm.toLowerCase();
        const filteredData = reps.filter(item =>
            item.name.toLowerCase().includes(lowercasedFilter) ||
            item.company.toLowerCase().includes(lowercasedFilter) ||
            item.province.toLowerCase().includes(lowercasedFilter)
        );
        setFilteredReps(filteredData);
    }, [searchTerm, reps]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Contact className="h-10 w-10 text-primary" />
                        <div>
                            <CardTitle className="text-3xl">دليل المندوبين</CardTitle>
                            <CardDescription>
                                قائمة بأسماء ومعلومات التواصل لمندوبي الشركات الطبية.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="ابحث بالاسم، الشركة، أو المحافظة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full max-w-lg pl-10"
                        />
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
                                        className="rounded-full"
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
                        {reps.length > 0 ? 'لا توجد نتائج مطابقة لبحثك.' : 'لم يتم جلب بيانات المندوبين بعد.'}
                    </p>
                </div>
            )}
        </div>
    );
}
