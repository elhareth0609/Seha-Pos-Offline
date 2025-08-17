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
        getMedicationMovements
    } = useAuth();
    
    const [inventory] = scopedData.inventory;
    const [currentPage, setCurrentPage] = React.useState(1);
    const [perPage, setPerPage] = React.useState(10);
    const [loading, setLoading] = React.useState(true);
    const [totalPages, setTotalPages] = React.useState(1);
    const [isClient, setIsClient] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [suggestions, setSuggestions] = React.useState<Medication[]>([]);
    const [selectedMed, setSelectedMed] = React.useState<Medication | null>(null);
    const [transactions, setTransactions] = React.useState<TransactionHistoryItem[]>([]);
    
    // Function to fetch medication movements from API
    const fetchMedicationMovements = React.useCallback(async (medicationId: string, page: number, limit: number) => {
        setLoading(true);
        try {
            const response = await getPaginatedItemMovements(page, limit, "", medicationId);
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
    
    // Function to fetch inventory (all medications)
    const fetchInventory = React.useCallback(async (search: string) => {
        setLoading(true);
        try {
            // Use the inventory endpoint instead of item movements
            const params = new URLSearchParams({
                paginate: "true",
                page: "1",
                per_page: "20",
                search: search,
            });
            const response = await apiRequest(`/medications?${params.toString()}`);
            
            // Check if response contains medication data
            if (response.data && response.data.length > 0 && response.data[0].name) {
                // This is inventory data
                setSuggestions(response.data.slice(0, 5));
            }
        } catch (error) {
            console.error("Failed to fetch inventory", error);
            toast({ variant: "destructive", title: "فشل تحميل المخزون" });
        } finally {
            setLoading(false);
        }
    }, []);
    
    React.useEffect(() => {
        setIsClient(true);
    }, []);
    
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        
        if (value.length > 0) {
            fetchInventory(value);
        } else {
            setSuggestions([]);
        }
    };
    
    const handleSelectMed = async (med: Medication) => {
        setSelectedMed(med);
        setSearchTerm("");
        setSuggestions([]);
        
        // Reset to first page when selecting a new medication
        setCurrentPage(1);
        
        // Fetch data for the selected medication using its ID
        const response = await getPaginatedItemMovements(1, perPage, "", med.id.toString());
        setTransactions(response.data);
        setTotalPages(response.last_page);
        setCurrentPage(response.current_page);
    };
    
    const handleClearSelection = () => {
        setSelectedMed(null);
        setSearchTerm("");
        setTransactions([]);
    };
    
    // Handle pagination - only run when selectedMed, currentPage, or perPage changes
    React.useEffect(() => {
        if (selectedMed) {
            fetchMedicationMovements(selectedMed.id.toString(), currentPage, perPage);
        }
    }, [currentPage, perPage, selectedMed]); // Removed fetchMedicationMovements from dependencies to prevent infinite loop
    
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
                            ابحث عن أي دواء بالاسم التجاري، العلمي أو الباركود لعرض سجله الكامل.
                        </CardDescription>
                    </div>
                </div>
                <div className="pt-4 relative">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="ابحث بالاسم التجاري، العلمي أو الباركود..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="max-w-lg"
                            disabled={!!selectedMed}
                        />
                        {selectedMed && (
                            <Button variant="outline" onClick={handleClearSelection}>
                                إلغاء الاختيار
                            </Button>
                        )}
                    </div>
                    {suggestions.length > 0 && (
                        <Card className="absolute z-50 w-full mt-1 bg-background shadow-lg border max-w-lg">
                            <CardContent className="p-0">
                                <ul className="divide-y divide-border">
                                    {suggestions.map(med => (
                                        <li key={med.id} 
                                            onMouseDown={() => handleSelectMed(med)}
                                            className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center"
                                        >
                                            <div>
                                                <div>{med.name}</div>
                                                <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>
                                            </div>
                                            <span className="text-sm text-muted-foreground font-mono">الرصيد: {med.stock}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {!selectedMed ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <PackageSearch className="h-16 w-16 mx-auto mb-4" />
                        <p>الرجاء اختيار دواء لعرض سجله.</p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-6">
                            <Card className="bg-muted/50">
                                <CardHeader>
                                    <CardTitle>{selectedMed.name}</CardTitle>
                                    <CardDescription>الرصيد الحالي في المخزون: <span className="font-bold text-foreground font-mono">{selectedMed.stock}</span></CardDescription>
                                </CardHeader>
                            </Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
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
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-sm" /><div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-24" /></div></div></TableCell>
                                        <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                    </TableRow>
                                )) : transactions.length > 0 ? transactions.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono">{new Date(item.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
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
                                            <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                لا توجد حركات مسجلة لهذا الدواء.
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