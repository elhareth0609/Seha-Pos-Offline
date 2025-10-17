
"use client"
import * as React from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { Medication, TransactionHistoryItem } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Repeat, PackageSearch, ArrowUp, ArrowDown, ShoppingCart, Truck, Undo2, RotateCcw } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

export default function ItemMovementPage() {
    const { 
        scopedData, 
        getPaginatedItemMovements,
    } = useAuth();
    
    const [inventory] = scopedData.inventory;
    const [currentPage, setCurrentPage] = React.useState(1);
    const [perPage, setPerPage] = React.useState(10);
    const [loading, setLoading] = React.useState(false);
    const [totalPages, setTotalPages] = React.useState(1);
    const [isClient, setIsClient] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [suggestions, setSuggestions] = React.useState<Medication[]>([]);
    const [selectedMed, setSelectedMed] = React.useState<Medication | null>(null);
    const [transactions, setTransactions] = React.useState<TransactionHistoryItem[]>([]);
    const [searchByScientificName, setSearchByScientificName] = React.useState(false);
    
    const fetchMedicationMovements = React.useCallback(async (medicationId: string | null, page: number, limit: number, scientificName?: string) => {
        setLoading(true);
        try {
            const response = await getPaginatedItemMovements(page, limit, "", medicationId || "", scientificName);
            setTransactions(response.data);
            setTotalPages(response.last_page);
            setCurrentPage(response.current_page);
        } catch (error) {
            console.error("Failed to fetch medication movements", error);
            toast({ variant: "destructive", title: "فشل تحميل حركة المادة" });
        } finally {
            setLoading(false);
        }
    }, [getPaginatedItemMovements, toast]);
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://midgram-pos.sadeem-labs.com/api';
    async function apiRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', body?: object) {
        const token = localStorage.getItem('authToken');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            });
    
            if (response.status === 204) return null;
    
            const responseData = await response.json();
            
            if (!response.ok) {
                const errorMessage = responseData.message || 'An API error occurred';
                throw new Error(errorMessage);
            }
    
            return responseData.data ?? responseData;
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ في الشبكة', description: error.message });
            throw error;
        }
    }
    
    const fetchSuggestions = React.useCallback(async (search: string) => {
        if (search.length < 2) {
            setSuggestions([]);
            return;
        }
        setLoading(true);
        try {
            const params = new URLSearchParams({
                paginate: "true",
                page: "1",
                per_page: "20",
                search: search,
            });
            const response = await apiRequest(`/medications?${params.toString()}`);
            
            if (response.data && response.data.length > 0) {
                const uniqueSuggestions = Array.from(new Map(response.data.map((item: Medication) => 
                    [searchByScientificName && item.scientific_names ? item.scientific_names[0] : item.name, item]
                )).values());
                setSuggestions(uniqueSuggestions as Medication[]);
            } else {
                setSuggestions([]);
            }
        } catch (error) {
            console.error("Failed to fetch inventory", error);
            toast({ variant: "destructive", title: "فشل تحميل المخزون" });
        } finally {
            setLoading(false);
        }
    }, [searchByScientificName]);
    
    React.useEffect(() => {
        setIsClient(true);
    }, []);
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        fetchSuggestions(value);
    };
    
    const handleSelectSuggestion = async (suggestion: Medication) => {
        if (searchByScientificName) {
            const scientificName = suggestion.scientific_names?.[0];
            if (!scientificName) return;
            setSearchTerm(scientificName);
            setSelectedMed(null); // Clear single med selection
            setSuggestions([]);
            await fetchMedicationMovements(null, 1, perPage, scientificName);
        } else {
            setSelectedMed(suggestion);
            setSearchTerm("");
            setSuggestions([]);
            await fetchMedicationMovements(suggestion.id.toString(), 1, perPage);
        }
    };
    
    const handleClearSelection = () => {
        setSelectedMed(null);
        setSearchTerm("");
        setTransactions([]);
        setTotalPages(1);
        setCurrentPage(1);
    };
    
    React.useEffect(() => {
        if (selectedMed) {
            fetchMedicationMovements(selectedMed.id.toString(), currentPage, perPage);
        } else if (searchByScientificName && searchTerm) {
            fetchMedicationMovements(null, currentPage, perPage, searchTerm);
        }
    }, [currentPage, perPage]);
    
    const getTypeBadge = (type: TransactionHistoryItem['type']) => {
        switch (type) {
            case 'شراء':
                return <Badge variant="secondary" className="bg-blue-200 text-blue-900"><Truck className="me-1 h-3 w-3" /> {type}</Badge>;
            case 'بيع':
                return <Badge variant="secondary" className="bg-red-200 text-red-900"><ShoppingCart className="me-1 h-3 w-3" /> {type}</Badge>;
            case 'مرتجع زبون':
                return <Badge variant="secondary" className="bg-green-200 text-green-900"><RotateCcw className="me-1 h-3 w-3" /> {type}</Badge>;
            case 'مرتجع للمورد':
                return <Badge variant="secondary" className="bg-yellow-200 text-yellow-900"><Undo2 className="me-1 h-3 w-3" /> {type}</Badge>;
            default:
                return <Badge>{type}</Badge>;
        }
    };

    const getAggregatedStock = () => {
        if (!searchByScientificName || !searchTerm) return null;
        const totalStock = inventory
            .filter(med => med.scientific_names?.some(sn => sn.toLowerCase() === searchTerm.toLowerCase()))
            // .reduce((sum, med) => sum + med.stock, 0);
            .reduce((sum, med) => {
                const stock = typeof med.stock === 'number' ? med.stock : parseFloat(String(med.stock || 0));
                return sum + (isNaN(stock) ? 0 : stock);
            }, 0);
            
        return totalStock;
    };
    
    if (!isClient) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-72" />
                    <div className="pt-4">
                        <Skeleton className="h-10 max-w-lg" />
                    </div>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                    <PackageSearch className="h-16 w-16" />
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Repeat className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>تتبع حركة المادة</CardTitle>
                        <CardDescription>
                            ابحث بالاسم التجاري، العلمي أو الباركود لعرض السجل الكامل.
                        </CardDescription>
                    </div>
                </div>
                <div className="pt-4 space-y-2">
                     <div className="flex gap-2 items-center">
                        <input type="checkbox" id="search-by-scientific" checked={searchByScientificName} onChange={() => setSearchByScientificName(!searchByScientificName)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                        <label htmlFor="search-by-scientific" className="text-sm font-medium">بحث بالاسم العلمي</label>
                    </div>
                    <div className="relative">
                        <div className="flex gap-2">
                            <Input 
                                placeholder={searchByScientificName ? "ابحث بالاسم العلمي..." : "ابحث بالاسم التجاري أو الباركود..."}
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="max-w-lg"
                                disabled={!!selectedMed && !searchByScientificName}
                            />
                            {(selectedMed || (searchByScientificName && searchTerm)) && (
                                <Button variant="outline" onClick={handleClearSelection}>
                                    إلغاء الاختيار
                                </Button>
                            )}
                        </div>
                        {suggestions.length > 0 && (
                            <Card className="absolute z-50 w-full mt-1 bg-background shadow-lg border max-w-lg">
                                <CardContent className="p-0">
                                    <ul className="divide-y divide-border">
                                        {suggestions.map((med, index) => (
                                            <li key={`${med.id}-${index}-${searchByScientificName ? med.scientific_names?.[0] : med.name}`} 
                                                onMouseDown={() => handleSelectSuggestion(med)}
                                                className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center"
                                            >
                                                <div>
                                                    <div>{searchByScientificName ? med.scientific_names?.[0] : med.name}</div>
                                                    {!searchByScientificName && <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>}
                                                </div>
                                                <span className="text-sm text-muted-foreground font-mono">الرصيد: {med.stock}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {!(selectedMed || (searchByScientificName && searchTerm)) ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <PackageSearch className="h-16 w-16 mx-auto mb-4" />
                        <p>الرجاء اختيار دواء لعرض سجله.</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle>{selectedMed ? selectedMed.name : `الأدوية التي تحتوي على ${searchTerm}`}</CardTitle>
                                    <CardDescription>الرصيد الحالي في المخزون: <span className="font-bold text-foreground font-mono">{selectedMed ? selectedMed.stock : getAggregatedStock()}</span></CardDescription>
                                </CardHeader>
                            </Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        {!selectedMed && <TableHead>الاسم التجاري</TableHead>}
                                        <TableHead>النوع</TableHead>
                                        <TableHead>الكمية</TableHead>
                                        <TableHead>رصيد المخزون</TableHead>
                                        <TableHead>السعر</TableHead>
                                        <TableHead>المصدر/الوجهة</TableHead>
                                        <TableHead>رقم المستند</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                {loading ? Array.from({ length: perPage }).map((_, i) => (
                                    <TableRow key={`skel-${i}`}>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        {!selectedMed && <TableCell><Skeleton className="h-5 w-full" /></TableCell>}
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    </TableRow>
                                )) : transactions.length > 0 ? transactions.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono">{new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                                            {!selectedMed && <TableCell>{item.actor}</TableCell>}
                                            <TableCell>{getTypeBadge(item.type)}</TableCell>
                                            <TableCell className={`font-medium font-mono ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                <div className="flex items-center gap-1">
                                                    {item.quantity > 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                                                    {Math.abs(item.quantity)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono">{item.balance}</TableCell>
                                            <TableCell className="font-mono">{item.price.toLocaleString()}</TableCell>
                                            <TableCell>{item.actor}</TableCell>
                                            <TableCell className="font-mono">{item.documentId}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={selectedMed ? 7 : 8} className="text-center text-muted-foreground py-8">
                                                لا توجد حركات مسجلة.
                                            </TableCell>
                                        </TableRow>
                                    )}
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
                    </>
                )}
            </CardContent>
        </Card>
    );
}
