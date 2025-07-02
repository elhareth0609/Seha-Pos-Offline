
"use client"

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocalStorage } from '@/hooks/use-local-storage';
import { sales as fallbackSales, appSettings as fallbackSettings } from '@/lib/data';
import type { Sale, AppSettings } from '@/lib/types';
import { useReactToPrint } from 'react-to-print';
import { InvoiceTemplate } from '@/components/ui/invoice';
import { Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function ReportsPage() {
    const [sales] = useLocalStorage<Sale[]>('sales', fallbackSales);
    const [settings] = useLocalStorage<AppSettings>('appSettings', fallbackSettings);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);


    const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
    const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);
    const printComponentRef = React.useRef(null);

    const handlePrint = useReactToPrint({
        content: () => printComponentRef.current,
        documentTitle: `invoice-${selectedSale?.id || ''}`,
    });

    const openPrintDialog = (sale: Sale) => {
        setSelectedSale(sale);
        setIsPrintDialogOpen(true);
    };

    const filteredSales = sales.filter(sale => 
        sale.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (!isClient) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-72" />
                    <div className="pt-4">
                        <Skeleton className="h-10 max-w-sm" />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>رقم الفاتورة</TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>الموظف</TableHead>
                                <TableHead className="text-center">عدد الأصناف</TableHead>
                                <TableHead className="text-left">الإجمالي</TableHead>
                                <TableHead>الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                                    <TableCell className="text-left"><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="hidden">
                <InvoiceTemplate ref={printComponentRef} sale={selectedSale} settings={settings} />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>سجل المبيعات</CardTitle>
                    <CardDescription>عرض وطباعة جميع فواتير المبيعات السابقة.</CardDescription>
                     <div className="pt-4">
                        <Input 
                            placeholder="ابحث برقم الفاتورة أو اسم الموظف..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>رقم الفاتورة</TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>الموظف</TableHead>
                                <TableHead className="text-center">عدد الأصناف</TableHead>
                                <TableHead className="text-left">الإجمالي</TableHead>
                                <TableHead>الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSales.length > 0 ? filteredSales.map((sale) => (
                                <TableRow key={sale.id}>
                                    <TableCell className="font-medium">{sale.id}</TableCell>
                                    <TableCell>{new Date(sale.date).toLocaleDateString('ar-EG')}</TableCell>
                                    <TableCell>{sale.employeeName || 'غير محدد'}</TableCell>
                                    <TableCell className="text-center">{sale.items.length}</TableCell>
                                    <TableCell className="text-left font-mono">${sale.total.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button variant="outline" size="sm" onClick={() => openPrintDialog(sale)}>
                                            <Printer className="me-2 h-4 w-4" />
                                            طباعة
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        لم يتم العثور على فواتير.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

             <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>طباعة الفاتورة #{selectedSale?.id}</DialogTitle>
                        <DialogDescription>
                            معاينة سريعة قبل الطباعة.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto border rounded-md bg-gray-50">
                        <InvoiceTemplate sale={selectedSale} settings={settings} ref={null} />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">إغلاق</Button>
                        </DialogClose>
                        <Button onClick={handlePrint}>
                            <Printer className="me-2 h-4 w-4" />
                            طباعة
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
