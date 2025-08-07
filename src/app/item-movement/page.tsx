
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
import type { Medication, Sale, PurchaseOrder, ReturnOrder } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { Repeat, PackageSearch, ArrowUp, ArrowDown, ShoppingCart, Truck, Undo2, RotateCcw } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

type TransactionHistoryItem = {
    date: string;
    type: 'شراء' | 'بيع' | 'مرتجع زبون' | 'مرتجع للمورد';
    quantity: number; // positive for in, negative for out
    price: number;
    balance: number;
    documentId: string;
    actor: string;
};

export default function ItemMovementPage() {
    const { scopedData } = useAuth();
    const [inventory] = scopedData.inventory;
    const [sales] = scopedData.sales;
    const [purchaseOrders] = scopedData.purchaseOrders;
    const [supplierReturns] = scopedData.supplierReturns;
    
    const [isClient, setIsClient] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [suggestions, setSuggestions] = React.useState<Medication[]>([]);
    const [selectedMed, setSelectedMed] = React.useState<Medication | null>(null);
    const [transactions, setTransactions] = React.useState<TransactionHistoryItem[]>([]);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.length > 0) {
            const lowercasedFilter = value.toLowerCase();
            const filtered = inventory.filter(item => 
                (item.name || '').toLowerCase().startsWith(lowercasedFilter) || 
                (item.id || '').toLowerCase().includes(lowercasedFilter) ||
                (item.scientific_names && item.scientific_names.some(name => name.toLowerCase().startsWith(lowercasedFilter)))
            );
            setSuggestions(filtered.slice(0, 5));
        } else {
            setSuggestions([]);
        }
    };

    const handleSelectMed = (med: Medication) => {
        setSelectedMed(med);
        setSearchTerm("");
        setSuggestions([]);

        const purchases = purchaseOrders
            .flatMap(po => (po.items || []).map(item => ({ ...item, date: po.date, supplier_name: po.supplier_name, documentId: po.id })))
            .filter(item => item.medication_id === med.id)
            .map(item => ({
                date: item.date,
                type: 'شراء' as const,
                quantity: item.quantity,
                price: item.purchase_price,
                documentId: item.documentId,
                actor: item.supplier_name,
            }));

        const saleEvents = sales
            .flatMap(s => (s.items || []).map(item => ({ ...item, date: s.date, patientName: s.patientName || 'زبون', documentId: s.id })))
            .filter(item => item.medication_id === med.id)
            .map(item => ({
                date: item.date,
                type: item.isReturn ? 'مرتجع زبون' as const : 'بيع' as const,
                quantity: item.isReturn ? item.quantity : -item.quantity,
                price: item.price,
                documentId: item.documentId,
                actor: item.patientName,
            }));

        const returnsToSupplier = supplierReturns
            .flatMap(r => (r.items || []).map(item => ({ ...item, date: r.date, supplier_name: r.supplier_name, documentId: r.id })))
            .filter(item => item.medication_id === med.id)
            .map(item => ({
                date: item.date,
                type: 'مرتجع للمورد' as const,
                quantity: -item.quantity,
                price: item.purchase_price,
                documentId: item.documentId,
                actor: item.supplier_name,
            }));
        
        const allEvents = [...purchases, ...saleEvents, ...returnsToSupplier]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0;
        const transactionsWithBalance = allEvents.map(event => {
            runningBalance += event.quantity;
            return {
                ...event,
                balance: runningBalance,
            };
        });

        setTransactions(transactionsWithBalance.reverse());
    };

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
                    <Input 
                        placeholder="ابحث بالاسم التجاري، العلمي أو الباركود..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="max-w-lg"
                    />
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
                                {transactions.length > 0 ? transactions.map((item, index) => (
                                    <TableRow key={index}>
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
                )}
            </CardContent>
        </Card>
    );
}
