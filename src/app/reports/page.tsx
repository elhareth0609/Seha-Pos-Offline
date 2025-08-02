
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
import type { Sale, AppSettings } from '@/lib/types';
import { InvoiceTemplate } from '@/components/ui/invoice';
import { Printer, DollarSign, TrendingUp, PieChart, ChevronDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format, isWithinInterval, parseISO } from "date-fns"
import { useAuth } from '@/hooks/use-auth';
import { Label } from '@/components/ui/label';
import AdCarousel from '@/components/ui/ad-carousel';

// Modern print function that works with React 18+
const printElement = (element: HTMLElement, title: string = 'Print') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  // Get all stylesheets from the current document
  const stylesheets = Array.from(document.styleSheets)
    .map(stylesheet => {
      try {
        return Array.from(stylesheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        // Handle cross-origin stylesheets
        if (stylesheet.href) {
          return `@import url("${stylesheet.href}");`;
        }
        return '';
      }
    })
    .join('\n');

  // Get inline styles
  const inlineStyles = Array.from(document.querySelectorAll('style'))
    .map(style => style.innerHTML)
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          ${stylesheets}
          ${inlineStyles}
          @media print {
            body { margin: 0; }
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          }
        </style>
      </head>
      <body dir="rtl">
        ${element.outerHTML}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  
  // Wait for content to load then print
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
};

export default function ReportsPage() {
    const { scopedData } = useAuth();
    const [sales] = scopedData.sales;
    const [settings] = scopedData.settings;
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isClient, setIsClient] = React.useState(false);
    const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
    const [dateFrom, setDateFrom] = React.useState<string>("");
    const [dateTo, setDateTo] = React.useState<string>("");

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const [isPrintDialogOpen, setIsPrintDialogOpen] = React.useState(false);
    const [selectedSale, setSelectedSale] = React.useState<Sale | null>(null);
    const printComponentRef = React.useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        if (printComponentRef.current && selectedSale) {
            printElement(printComponentRef.current, `invoice-${selectedSale.id}`);
        }
    };

    const openPrintDialog = (sale: Sale) => {
        setSelectedSale(sale);
        setIsPrintDialogOpen(true);
    };

    const toggleRow = (id: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(id)) {
            newExpandedRows.delete(id);
        } else {
            newExpandedRows.add(id);
        }
        setExpandedRows(newExpandedRows);
    };
    
    const clearFilters = () => {
        setSearchTerm("");
        setDateFrom("");
        setDateTo("");
    };

    const filteredSales = (sales || []).filter(sale => {
        const term = searchTerm.toLowerCase().trim();
        const saleDate = parseISO(sale.date);
        
        let dateMatch = true;
        if (dateFrom && dateTo) {
            const from = new Date(dateFrom);
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            dateMatch = isWithinInterval(saleDate, { start: from, end: to });
        } else if (dateFrom) {
            dateMatch = saleDate >= new Date(dateFrom);
        } else if (dateTo) {
            const to = new Date(dateTo);
            to.setHours(23, 59, 59, 999);
            dateMatch = saleDate <= to;
        }

        const searchMatch = !term ? true : (
            sale.id.toLowerCase().includes(term) ||
            (sale.patientName || '').toLowerCase().startsWith(term) ||
            (sale.items || []).some(item => item.name.toLowerCase().startsWith(term)) ||
            (term === 'مرتجع' && (sale.items || []).some(item => item.isReturn))
        );

        return dateMatch && searchMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const totalSalesValue = filteredSales.reduce((acc, sale) => acc + (sale.total || 0), 0);
    const totalProfit = filteredSales.reduce((acc, sale) => acc + (sale.profit || 0) - (sale.discount || 0), 0);

    if (!isClient) {
        return (
            <div className="space-y-6">
                 <div className="grid gap-4 md:grid-cols-3">
                    <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                    <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
                </div>
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-72" />
                        <div className="pt-4 flex gap-2">
                            <Skeleton className="h-10 max-w-sm flex-1" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>رقم الفاتورة</TableHead>
                                    <TableHead>التاريخ والوقت</TableHead>
                                    <TableHead>المريض</TableHead>
                                    <TableHead className="text-center">عدد الأصناف</TableHead>
                                    <TableHead className="text-left">الإجمالي</TableHead>
                                    <TableHead className="text-left">الربح</TableHead>
                                    <TableHead>الإجراءات</TableHead>
                                    <TableHead className="w-12"></TableHead>
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
                                        <TableCell className="text-left"><Skeleton className="h-5 w-16" /></TableCell>
                                        <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="flex flex-col justify-center">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي قيمة المبيعات</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{totalSalesValue.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="flex flex-col justify-center">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 font-mono">{totalProfit.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <AdCarousel page="reports" />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>سجل المبيعات</CardTitle>
                    <CardDescription>عرض وطباعة جميع فواتير المبيعات السابقة. اضغط على الصف لعرض التفاصيل.</CardDescription>
                     <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="search-term">بحث</Label>
                            <Input 
                                id="search-term"
                                placeholder="ابحث برقم الفاتورة، المريض، المادة، أو اكتب 'مرتجع'..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="date-from">من تاريخ</Label>
                            <Input id="date-from" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date-to">إلى تاريخ</Label>
                            <Input id="date-to" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                    </div>
                     <div className="pt-2">
                        <Button onClick={clearFilters} variant="link" className="p-0 h-auto">إزالة كل الفلاتر</Button>
                     </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>رقم الفاتورة</TableHead>
                                <TableHead>التاريخ والوقت</TableHead>
                                <TableHead>المريض</TableHead>
                                <TableHead className="text-center">الأصناف</TableHead>
                                <TableHead className="text-left">الإجمالي</TableHead>
                                <TableHead className="text-left">الربح</TableHead>
                                <TableHead>الإجراءات</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSales.length > 0 ? filteredSales.map((sale) => (
                                <React.Fragment key={sale.id}>
                                    <TableRow onClick={() => toggleRow(sale.id)} className="cursor-pointer">
                                        <TableCell className="font-medium font-mono">{sale.id}</TableCell>
                                        <TableCell className="font-mono">{new Date(sale.date).toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</TableCell>
                                        <TableCell>{sale.patientName || 'غير محدد'}</TableCell>
                                        <TableCell className="text-center font-mono">{(sale.items || []).length}</TableCell>
                                        <TableCell className="text-left font-mono">{sale.total.toLocaleString()}</TableCell>
                                        <TableCell className="text-left font-mono text-green-600">{((sale.profit || 0) - (sale.discount || 0)).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openPrintDialog(sale); }}>
                                                <Printer className="me-2 h-4 w-4" />
                                                طباعة
                                            </Button>
                                        </TableCell>
                                         <TableCell>
                                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedRows.has(sale.id) && "rotate-180")} />
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows.has(sale.id) && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="p-0">
                                                <div className="p-4 bg-muted/50">
                                                    <h4 className="mb-2 font-semibold">أصناف الفاتورة:</h4>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>المنتج</TableHead>
                                                                <TableHead>الكمية</TableHead>
                                                                <TableHead>السعر</TableHead>
                                                                <TableHead>الإجمالي</TableHead>
                                                                <TableHead>الحالة</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {(sale.items || []).map((item, index) => (
                                                                <TableRow key={`${sale.id}-${item.medicationId}-${index}`} className={cn(item.isReturn && "text-destructive")}>
                                                                    <TableCell>{item.name}</TableCell>
                                                                    <TableCell className="font-mono">{item.quantity}</TableCell>
                                                                    <TableCell className="font-mono">{item.price.toLocaleString()}</TableCell>
                                                                    <TableCell className="font-mono">{(item.quantity * item.price).toLocaleString()}</TableCell>
                                                                    <TableCell>
                                                                        {item.isReturn && <Badge variant="destructive">مرتجع</Badge>}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        لم يتم العثور على فواتير مطابقة.
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
                        <div className="hidden">
                            <InvoiceTemplate ref={printComponentRef} sale={selectedSale} settings={settings} />
                        </div>
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
        </div>
    )
}
