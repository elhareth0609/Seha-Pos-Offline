
"use client";

import * as React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LogOut, PackageSearch, Search, Send, X } from 'lucide-react';
import type { Medication } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function DoctorSearchPage() {
    const { currentDoctor, isAuthenticatedDoctor, loading, logoutDoctor, searchMedicationForDoctor, addDoctorSuggestion } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<Medication[]>([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [searchPerformed, setSearchPerformed] = React.useState(false);

    const [suggestion, setSuggestion] = React.useState('');
    const [isSubmittingSuggestion, setIsSubmittingSuggestion] = React.useState(false);

    React.useEffect(() => {
        if (!loading && !isAuthenticatedDoctor) {
            router.replace('/doctor/login');
        }
        // Validate login key
        if (!loading && isAuthenticatedDoctor && currentDoctor?.login_key !== params.loginKey) {
            logoutDoctor();
        }
    }, [loading, isAuthenticatedDoctor, currentDoctor, params.loginKey, router, logoutDoctor]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchTerm.trim()) return;

        setIsSearching(true);
        setSearchPerformed(true);
        const results = await searchMedicationForDoctor(searchTerm);
        setSearchResults(results);
        setIsSearching(false);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setSearchResults([]);
        setSearchPerformed(false);
    };

    const handleAddSuggestion = async () => {
        if (!suggestion.trim()) {
            toast({ variant: 'destructive', title: 'المقترح فارغ' });
            return;
        }
        setIsSubmittingSuggestion(true);
        const newSuggestion = await addDoctorSuggestion(suggestion);
        if (newSuggestion) {
            toast({ title: 'شكراً لك!', description: 'تم إرسال مقترحك إلى الصيدلية.' });
            setSuggestion('');
        }
        setIsSubmittingSuggestion(false);
    };

    if (loading || !isAuthenticatedDoctor) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/40 p-4 sm:p-8">
            <header className="max-w-4xl mx-auto flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-xl font-bold">مرحباً د. {currentDoctor?.name}</h1>
                    <p className="text-sm text-muted-foreground">يمكنك البحث عن توفر الأدوية هنا.</p>
                </div>
                <Button variant="ghost" onClick={logoutDoctor}>
                    <LogOut className="me-2" />
                    تسجيل الخروج
                </Button>
            </header>

            <main className="max-w-4xl mx-auto space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>البحث عن دواء</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="ابحث بالاسم التجاري أو العلمي..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            {searchTerm && (
                                <Button type="button" variant="ghost" size="icon" onClick={handleClearSearch}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                            <Button type="submit" disabled={isSearching}>
                                {isSearching ? 'جاري البحث...' : <Search />}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {searchPerformed && (
                    <Card>
                        <CardHeader>
                            <CardTitle>نتائج البحث</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isSearching ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-full" />
                                    <Skeleton className="h-10 w-full" />
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="space-y-2">
                                    {searchResults.map(med => (
                                        <div key={med.id} className="p-3 border rounded-md">
                                            <p className="font-semibold">{med.name}</p>
                                            <p className="text-sm text-muted-foreground">{med.scientific_names?.join(', ')}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <PackageSearch className="h-12 w-12 mx-auto mb-2" />
                                    <p>الدواء غير متوفر حاليًا في الصيدلية.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>إضافة مقترح</CardTitle>
                        <CardDescription>إذا لم تجد الدواء الذي تبحث عنه، يمكنك اقتراحه على الصيدلية.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Textarea
                                placeholder="اكتب اسم الدواء المقترح وأي تفاصيل أخرى (اختياري)..."
                                value={suggestion}
                                onChange={(e) => setSuggestion(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleAddSuggestion} disabled={isSubmittingSuggestion}>
                            {isSubmittingSuggestion ? 'جاري الإرسال...' : <><Send className="me-2" /> إرسال المقترح</>}
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}

