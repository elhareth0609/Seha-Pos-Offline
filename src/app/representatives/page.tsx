
"use client";

import * as React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Contact, Phone, Building, MapPin, Search } from 'lucide-react';
import type { MedicalRepresentative } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// API Endpoint for representatives
const REPS_API_URL = 'https://us-central1-midgram-e4985.cloudfunctions.net/getRepresentatives'; 

export default function RepresentativesPage() {
    const [reps, setReps] = React.useState<MedicalRepresentative[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);

    const fetchReps = React.useCallback(async (page: number, search: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: '50', // Fetch 20 reps per page
                ...(search && { name: search })
            });

            const response = await fetch(`${REPS_API_URL}?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const result = await response.json();
            
            if (result.success && result.data) {
                setReps(result.data.representatives || []);
                setTotalPages(result.data.pagination.totalPages || 1);
                setCurrentPage(result.data.pagination.page || 1);
            } else {
                setReps([]);
            }

        } catch (error) {
            console.error("Failed to fetch representatives:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        const handler = setTimeout(() => {
            fetchReps(1, searchTerm); // Reset to page 1 on new search
        }, 500); // Debounce search
        return () => clearTimeout(handler);
    }, [searchTerm, fetchReps]);

    React.useEffect(() => {
        fetchReps(currentPage, searchTerm);
    }, [currentPage, fetchReps]);


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
                                    قائمة بأسماء ومعلومات التواصل لمندوبي الشركات الطبية.
                                </CardDescription>
                            </div>
                        </div>
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

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>المندوب</TableHead>
                                <TableHead>الشركة / المكتب</TableHead>
                                <TableHead>المدينة</TableHead>
                                <TableHead>رقم الهاتف</TableHead>
                                {/* <TableHead>الحالة</TableHead> */}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 10 }).map((_, i) => (
                                    <TableRow key={`skel-${i}`}>
                                        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-1"><Skeleton className="h-4 w-24" /><Skeleton className="h-3 w-16" /></div></div></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                                        {/* <TableCell><Skeleton className="h-6 w-16" /></TableCell> */}
                                    </TableRow>
                                ))
                            ) : reps.length > 0 ? (
                                reps.map(rep => (
                                    <TableRow key={rep.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                {/* <Image 
                                                    src={rep.image_url || '/placeholder-user.png'} 
                                                    alt={rep.comm_name} 
                                                    width={40}
                                                    height={40}
                                                    className="rounded-full bg-muted object-cover h-10 w-10"
                                                /> */}
                                                <span className="font-medium">{rep.comm_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{rep.office_name}</TableCell>
                                        <TableCell>{rep.city}</TableCell>
                                        <TableCell className="font-mono text-right" dir="ltr">{rep.phone_number}</TableCell>
                                        {/* <TableCell>
                                            <Badge variant={rep.status === 'active' ? 'secondary' : 'destructive'} className={rep.status === 'active' ? 'bg-green-100 text-green-800' : ''}>
                                                {rep.status === 'active' ? 'فعال' : 'محذوف'}
                                            </Badge>
                                        </TableCell> */}
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">
                                        لا توجد بيانات لعرضها.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                 <CardFooter className="flex items-center justify-between pt-4">
                      <span className="text-sm text-muted-foreground">
                          صفحة {currentPage} من {totalPages}
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
                              disabled={currentPage >= totalPages || loading}
                          >
                              التالي
                          </Button>
                      </div>
                  </CardFooter>
            </Card>
        </div>
    );
}
