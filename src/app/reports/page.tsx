
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
import { Printer, DollarSign, TrendingUp, PieChart, ListFilter, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


export default function ReportsPage() {
    const [sales] = useLocalStorage<Sale[]>('sales', fallbackSales);
    const [settings] = useLocalStorage<AppSettings>('appSettings', fallbackSettings);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [employeeFilter, setEmployeeFilter] = React.useState("all");
    const [isClient, setIsClient] = React.useState(false);
    const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const employees = React.useMemo(() => {
        const employeeSet = new Set(sales.map(s => s.employeeName).filter(Boolean));
        return ['all', ...Array.from(employeeSet)];
    }, [sales]);

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

    const toggleRow = (id: string) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(id)) {
            newExpandedRows.delete(id);
        } else {
            newExpandedRows.add(id);
        }
        setExpandedRows(newExpandedRows);
    };

    const filteredSales = sales.filter(sale => {
        const term = searchTerm.toLowerCase().trim();
        const searchMatch = !term ? true : (
            sale.id.toLowerCase().includes(term) ||
            (sale.employeeName || '').toLowerCase().includes(term) ||
            sale.items.some(item => item.name.toLowerCase().includes(term)) ||
            (term === 'مرتجع' && sale.items.some(item => item.isReturn))
        );

        const employeeMatch = employeeFilter === 'all' || sale.employeeName === employeeFilter;
        return searchMatch && employeeMatch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const totalSalesValue = filteredSales.reduce((acc, sale) => acc + sale.total, 0);
    const totalProfit = filteredSales.reduce((acc, sale) => acc + (sale.profit || 0) - (sale.discount || 0), 0);
    const profitMargin = totalSalesValue > 0 ? (totalProfit / totalSalesValue) * 100 : 0;

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
                                    <TableHead>التاريخ</TableHead>
                                    <TableHead>الموظف</TableHead>
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
            <div className="hidden">
                <InvoiceTemplate ref={printComponentRef} sale={selectedSale} settings={settings} />
            </div>

             <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">إجمالي قيمة المبيعات</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalSalesValue.toLocaleString('ar-IQ')} د.ع</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">صافي الربح</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{totalProfit.toLocaleString('ar-IQ')} د.ع</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{profitMargin.toFixed(2)}%</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>سجل المبيعات</CardTitle>
                    <CardDescription>عرض وطباعة جميع فواتير المبيعات السابقة. اضغط على الصف لعرض التفاصيل.</CardDescription>
                     <div className="pt-4 flex gap-2">
                        <Input 
                            placeholder="ابحث برقم الفاتورة، الموظف، المادة، أو اكتب 'مرتجع'..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="gap-1">
                                    <ListFilter className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                        تصفية بالموظف
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>تصفية حسب الموظف</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup value={employeeFilter} onValueChange={setEmployeeFilter}>
                                    {employees.map(emp => (
                                        <DropdownMenuRadioItem key={emp} value={emp}>{emp === 'all' ? 'الكل' : emp}</DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>رقم الفاتورة</TableHead>
                                <TableHead>التاريخ</TableHead>
                                <TableHead>الموظف</TableHead>
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
                                        <TableCell className="font-medium">{sale.id}</TableCell>
                                        <TableCell>{new Date(sale.date).toLocaleDateString('ar-EG')}</TableCell>
                                        <TableCell>{sale.employeeName || 'غير محدد'}</TableCell>
                                        <TableCell className="text-center">{sale.items.length}</TableCell>
                                        <TableCell className="text-left font-mono">{sale.total.toLocaleString('ar-IQ')} د.ع</TableCell>
                                        <TableCell className="text-left font-mono text-green-600">{((sale.profit || 0) - (sale.discount || 0)).toLocaleString('ar-IQ')} د.ع</TableCell>
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
                                                            {sale.items.map((item, index) => (
                                                                <TableRow key={`${sale.id}-${item.medicationId}-${index}`} className={cn(item.isReturn && "text-destructive")}>
                                                                    <TableCell>{item.name} {item.saleUnit && `(${item.saleUnit})`}</TableCell>
                                                                    <TableCell>{item.quantity}</TableCell>
                                                                    <TableCell>{item.price.toLocaleString('ar-IQ')} د.ع</TableCell>
                                                                    <TableCell>{(item.quantity * item.price).toLocaleString('ar-IQ')} د.ع</TableCell>
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

    