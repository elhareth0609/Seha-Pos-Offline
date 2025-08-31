
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
import type { Sale, SaleItem, User, PaginatedResponse } from '@/lib/types';
import { InvoiceTemplate } from '@/components/ui/invoice';
import { Printer, DollarSign, TrendingUp, ChevronDown, Trash2, Pencil, FileArchive } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Label } from '@/components/ui/label';
import AdCarousel from '@/components/ui/ad-carousel';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PinDialog } from '@/components/auth/PinDialog';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';


// Modern print function that works with React 18+
const printElement = (element: HTMLElement, title: string = 'Print') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const stylesheets = Array.from(document.styleSheets)
    .map(stylesheet => {
      try {
        return Array.from(stylesheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        if (stylesheet.href) {
          return `@import url("${stylesheet.href}");`;
        }
        return '';
      }
    })
    .join('\n');

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
  
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
};

export default function ReportsPage() {
    const { currentUser, users, scopedData, deleteSale, createNewInvoice, updateActiveInvoice, getPaginatedSales, verifyPin } = useAuth();
    const [settings] = scopedData.settings;
    
    const [sales, setSales] = React.useState<Sale[]>([]);
    const [totalPages, setTotalPages] = React.useState(1);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [perPage, setPerPage] = React.useState(10);
    const [loading, setLoading] = React.useState(true);
    
    const [searchTerm, setSearchTerm] = React.useState("");
    const [isClient, setIsClient] = React.useState(false);
    const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
    const [dateFrom, setDateFrom] = React.useState<string>("");
    const [dateTo, setDateTo] = React.useState<string>("");
    const [employeeId, setEmployeeId] = React.useState<string>("all");
    const [paymentMethod, setPaymentMethod] = React.useState<string>("all");
    const [invoiceType, setInvoiceType] = React.useState<string>("all");
    
    const [itemToDelete, setItemToDelete] = React.useState<Sale | null>(null);
    const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false);
    const { toast } = useToast();

    const router = useRouter();

    const canManagePreviousSales = currentUser?.role === 'Admin' || currentUser?.permissions?.manage_previous_sales;

    const fetchData = React.useCallback(async (page: number, limit: number, search: string, from: string, to: string, empId: string, pMethod: string, invType: string) => {
        setLoading(true);
        try {
            const data = await getPaginatedSales(page, limit, search, from, to, empId, pMethod);
            
            let filteredData = data.data;

            if (invType !== 'all') {
                filteredData = filteredData.filter(sale => {
                    const isReturnInvoice = sale.items.every(item => item.is_return);
                    return invType === 'returns' ? isReturnInvoice : !isReturnInvoice;
                });
            }

            setSales(filteredData);
            setTotalPages(data.last_page);
            setCurrentPage(data.current_page);
        } catch (error) {
            console.error("Failed to fetch sales", error);
        } finally {
            setLoading(false);
        }
    }, [getPaginatedSales]);

    React.useEffect(() => {
        setIsClient(true);
        const handler = setTimeout(() => {
            fetchData(currentPage, perPage, searchTerm, dateFrom, dateTo, employeeId, paymentMethod, invoiceType);
        }, 300);
        return () => clearTimeout(handler);
    }, [currentPage, perPage, searchTerm, dateFrom, dateTo, employeeId, paymentMethod, invoiceType, fetchData]);
    

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
        setEmployeeId("all");
        setPaymentMethod("all");
        setInvoiceType("all");
    };

    const handleDeleteSale = async () => {
        if (!itemToDelete) return;

        if (currentUser?.require_pin_for_delete) {
            setIsPinDialogOpen(true);
        } else {
            const success = await deleteSale(itemToDelete.id);
            if (success) {
                fetchData(currentPage, perPage, searchTerm, dateFrom, dateTo, employeeId, paymentMethod, invoiceType);
                setItemToDelete(null);
            }
        }
    }
    
    const handlePinConfirmDelete = async (pin: string) => {
        if (!itemToDelete) return;
        const isValid = await verifyPin(pin);
        if (isValid) {
            setIsPinDialogOpen(false);
            const success = await deleteSale(itemToDelete.id);
            if (success) {
                fetchData(currentPage, perPage, searchTerm, dateFrom, dateTo, employeeId, paymentMethod, invoiceType);
                setItemToDelete(null);
            }
        } else {
            toast({ variant: 'destructive', title: "رمز PIN غير صحيح" });
        }
    };

    const handleEditSale = (sale: Sale) => {
        const saleToEdit = sales.find(s => s.id === sale.id);
        if (saleToEdit) {
            createNewInvoice(); // Create a new tab for editing
            updateActiveInvoice(() => ({
                cart: saleToEdit.items.map((i: SaleItem) => ({ ...i, id: i.medication_id })),
                discountValue: (saleToEdit.discount || 0).toString(),
                discountType: 'fixed',
                patientId: saleToEdit.patient_id || null,
                paymentMethod: saleToEdit.payment_method || 'cash',
                saleIdToUpdate: saleToEdit.id,
            }));
            router.push('/sales');
        }
    };

    const totalSalesValue = sales.reduce((acc, sale) => {
        const total = typeof sale.total === 'number' ? sale.total : parseFloat(String(sale.total || 0));
        return acc + (isNaN(total) ? 0 : total);
    }, 0);
    const totalProfit = sales.reduce((acc, sale) => {
        const  total = (typeof sale.profit === 'number' ? sale.profit : parseFloat(String(sale.profit || 0))) -
        (typeof sale.discount === 'number' ? sale.discount : parseFloat(String(sale.discount || 0)));
        return acc + (isNaN(total) ? 0 : total);
    }, 0);
    
    const pharmacyUsers = React.useMemo(() => {
        return users.filter(u => u.pharmacy_id === currentUser?.pharmacy_id);
    }, [users, currentUser]);


    if (!isClient) {
        return (
            <div className="space-y-6">
                 <div className="grid gap-4 md:grid-cols-3">
                    <Card><CardHeader><Skeleton className="h-5 w-3/4" /></CardHeader> <CardContent><Skeleton className="h-8 w-1/2" /></CardContent></Card>
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
                        <CardTitle className="text-sm font-medium">إجمالي قيمة المبيعات (المعروضة)</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-mono">{totalSalesValue.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="flex flex-col justify-center">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">صافي الربح (المعروض)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 font-mono">{totalProfit.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <div className="flex items-stretch">
                    <AdCarousel page="reports" />
                </div>
            </div>
            
            {/* {currentUser?.role === 'Admin' && (
            <Card>
                <CardHeader>
                    <CardTitle>العمليات الدورية</CardTitle>
                    <CardDescription>
                       تنفيذ عمليات نهاية الفترة المحاسبية مثل إقفال الشهر.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" className='border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700' asChild>
                        <Link href="/close-month">
                            <FileArchive className="me-2 h-4 w-4"/>
                            إقفال وأرشفة الشهر
                        </Link>
                    </Button>
                </CardContent>
            </Card>
            )} */}


            <Card>
                <CardHeader>
                    <CardTitle>سجل المبيعات</CardTitle>
                    <CardDescription>عرض وطباعة جميع فواتير المبيعات السابقة. اضغط على الصف لعرض التفاصيل.</CardDescription>
                     <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="search-term">بحث</Label>
                            <Input 
                                id="search-term"
                                placeholder="ابحث برقم الفاتورة، المريض، أو المادة..."
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
                        <div className="space-y-2">
                            <Label htmlFor="employee-filter">الموظف</Label>
                            <Select value={employeeId} onValueChange={setEmployeeId}>
                                <SelectTrigger id="employee-filter">
                                    <SelectValue placeholder="اختر موظفًا"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل الموظفين</SelectItem>
                                    {pharmacyUsers.map(user => (
                                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-method-filter">طريقة الدفع</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger id="payment-method-filter">
                                    <SelectValue placeholder="الكل"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="cash">نقداً</SelectItem>
                                    <SelectItem value="card">بطاقة إلكترونية</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice-type-filter">نوع الفاتورة</Label>
                            <Select value={invoiceType} onValueChange={setInvoiceType}>
                                <SelectTrigger id="invoice-type-filter">
                                    <SelectValue placeholder="الكل"/>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="sales">بيع فقط</SelectItem>
                                    <SelectItem value="returns">مرتجع فقط</SelectItem>
                                </SelectContent>
                            </Select>
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
                            {loading ? Array.from({ length: perPage }).map((_, i) => (
                                <TableRow key={`skel-${i}`}>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                </TableRow>
                            )) : sales.length > 0 ? sales.map((sale) => (
                                <React.Fragment key={sale.id}>
                                    <TableRow onClick={() => toggleRow(sale.id)} className="cursor-pointer">
                                        <TableCell className="font-medium font-mono">{sale.id}</TableCell>
                                        <TableCell className="font-mono">{new Date(sale.date).toLocaleString('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</TableCell>
                                        <TableCell>{sale.patientName || 'غير محدد'}</TableCell>
                                        <TableCell className="text-center font-mono">{(sale.items || []).length}</TableCell>
                                        <TableCell className="text-left font-mono">{sale.total.toLocaleString()}</TableCell>
                                        <TableCell className="text-left font-mono text-green-600">{((sale.profit || 0) - (sale.discount || 0)).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openPrintDialog(sale); }}>
                                                    <Printer className="me-2 h-4 w-4" />
                                                    طباعة
                                                </Button>
                                                {canManagePreviousSales && (
                                                    <>
                                                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditSale(sale); }}>
                                                            <Pencil className="me-2 h-4 w-4" />
                                                            تعديل
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setItemToDelete(sale); }}>
                                                                    <Trash2 className="me-2 h-4 w-4" />
                                                                    حذف
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        سيتم حذف هذه الفاتورة نهائياً. هذه العملية ستعيد كميات الأصناف المباعة إلى المخزون.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={handleDeleteSale} className={buttonVariants({ variant: "destructive" })}>
                                                                        نعم، قم بالحذف
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </>
                                                )}
                                            </div>
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
                                                                <TableRow key={`${sale.id}-${item.medication_id}-${index}`} className={cn(item.is_return && "text-destructive")}>
                                                                    <TableCell>{item.name}</TableCell>
                                                                    <TableCell className="font-mono">{item.quantity}</TableCell>
                                                                    <TableCell className="font-mono">{item.price.toLocaleString()}</TableCell>
                                                                    <TableCell className="font-mono">{(item.quantity * item.price).toLocaleString()}</TableCell>
                                                                    <TableCell>
                                                                        {item.is_return && <Badge variant="destructive">مرتجع</Badge>}
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
                    <div className="flex items-center justify-between pt-4">
                        <span className="text-sm text-muted-foreground">
                            صفحة {currentPage} من {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                disabled={currentPage === 1 || loading}
                            >
                                السابق
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                                disabled={currentPage === totalPages || loading}
                            >
                                التالي
                            </Button>
                        </div>
                    </div>
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
            <PinDialog 
                open={isPinDialogOpen}
                onOpenChange={setIsPinDialogOpen}
                onConfirm={handlePinConfirmDelete}
            />
        </div>
    )
}
