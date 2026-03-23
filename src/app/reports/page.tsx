

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
import type { Sale, SaleItem, Patient } from '@/lib/types';
import { InvoiceTemplate } from '@/components/ui/invoice';
import { Printer, DollarSign, TrendingUp, ChevronDown, FileDown, Loader2 } from 'lucide-react';
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

const dosage_forms = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Cream", "Gel", "Suppository", "Inhaler", "Drops", "Powder", "Lotion", "spray", "مستلزمات طبية", "معجون أسنان", "Oral vial", "Solution", "Suspension", "Sachet", "اخرى"];
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Label } from '@/components/ui/label';
import AdCarousel from '@/components/ui/ad-carousel';
// import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PinDialog } from '@/components/auth/PinDialog';
import { useToast } from '@/hooks/use-toast';
// import { useNavigate } from 'react-router-dom';
import { printElement } from '@/lib/print-utils';




export default function ReportsPage() {
    const { currentUser, users, scopedData, deleteSale, updateActiveInvoice, getPaginatedSales, verifyPin, switchToInvoice, getPaginatedPatients, getDoctors, searchAllPatients, exportSales } = useAuth();
    const [settings] = scopedData.settings;
    const [sales, setSales] = React.useState<Sale[]>([]);
    const [totalPages, setTotalPages] = React.useState(1);
    const [currentPage, setCurrentPage] = React.useState(1);
    const [perPage, setPerPage] = React.useState(10);
    const [loading, setLoading] = React.useState(true);
    const [allPatients, setAllPatients] = React.useState<Patient[]>([]);
    const [doctors, setDoctors] = React.useState<any[]>([]);
    const [totalSalesDisplayed, setTotalSalesDisplayed] = React.useState(0);
    const [totalProfitDisplayed, setTotalProfitDisplayed] = React.useState(0);

    const [searchTerm, setSearchTerm] = React.useState("");
    const [isClient, setIsClient] = React.useState(false);
    const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());
    const [dateFrom, setDateFrom] = React.useState<string>("");
    const [dateTo, setDateTo] = React.useState<string>("");
    const [employeeId, setEmployeeId] = React.useState<string>("all");
    const [patientId, setPatientId] = React.useState<string>("all");
    const [paymentMethod, setPaymentMethod] = React.useState<string>("all");
    const [invoiceType, setInvoiceType] = React.useState<string>("all");
    const [doctorId, setDoctorId] = React.useState<string>("all");
    const [filterDosageForm, setFilterDosageForm] = React.useState<string>("all");
    const [filterItemName, setFilterItemName] = React.useState<string>("");
    const [discountFilter, setDiscountFilter] = React.useState<string>("all");

    const [itemToDelete, setItemToDelete] = React.useState<Sale | null>(null);
    const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false);
    const { toast } = useToast();

    // const navigate = useNavigate();

    // const canManagePreviousSales = currentUser?.role === 'Admin' || currentUser?.permissions?.manage_previous_sales;
    const showProfitColumn = currentUser?.role === 'Admin' || currentUser?.permissions?.manage_sales_performance_period;

    const fetchDropdownData = React.useCallback(async () => {
        try {
            const [patientsData, doctorsData] = await Promise.all([
                searchAllPatients(""),
                getDoctors(),
            ]);

            setAllPatients(patientsData);
            setDoctors(doctorsData);

        } catch (error) {
            console.error("Failed to fetch dropdown data", error);
        }
    }, [searchAllPatients, getDoctors]);

    const fetchData = React.useCallback(async (page: number, limit: number, search: string, from: string, to: string, empId: string, pMethod: string, docId: string, invType: string, patId: string, dosageForm: string, itemName: string, discountFilterValue: string) => {
        setLoading(true);
        try {
            const data = await getPaginatedSales(page, limit, search, from, to, empId, pMethod, docId, patId, invType, dosageForm, itemName, discountFilterValue);

            let filteredData = data.data;

            // Add patientName to each sale based on patient_id
            setSales(filteredData);
            setTotalPages(data.last_page);
            setCurrentPage(data.current_page);

            if (data.totals) {
                setTotalSalesDisplayed(data.totals.total_sales || 0);
                setTotalProfitDisplayed(data.totals.total_profit || 0);
            } else {
                const pageSales = filteredData.reduce((acc, sale) => {
                    const total = typeof sale.total === 'number' ? sale.total : parseFloat(String(sale.total || 0));
                    return acc + (isNaN(total) ? 0 : total);
                }, 0);
                const pageProfit = filteredData.reduce((acc, sale) => {
                    const total = typeof sale.profit === 'number' ? sale.profit : parseFloat(String(sale.profit || 0));
                    return acc + (isNaN(total) ? 0 : total);
                }, 0);
                setTotalSalesDisplayed(pageSales);
                setTotalProfitDisplayed(pageProfit);
            }
        } catch (error) {
            console.error("Failed to fetch sales", error);
        } finally {
            setLoading(false);
        }
    }, [getPaginatedSales]);

    const handleExport = () => {
        exportSales(searchTerm, dateFrom, dateTo, employeeId, paymentMethod, doctorId, patientId, filterDosageForm, filterItemName, discountFilter);
    };

    React.useEffect(() => {
        setIsClient(true);
        fetchDropdownData();
    }, [fetchDropdownData]);

    React.useEffect(() => {
        if (isClient) {
            const handler = setTimeout(() => {
                fetchData(currentPage, perPage, searchTerm, dateFrom, dateTo, employeeId, paymentMethod, doctorId, invoiceType, patientId, filterDosageForm, filterItemName, discountFilter);
            }, 300);
            return () => clearTimeout(handler);
        }
    }, [isClient, currentPage, perPage, searchTerm, dateFrom, dateTo, employeeId, paymentMethod, invoiceType, doctorId, patientId, filterDosageForm, filterItemName, discountFilter, fetchData]);


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
        setPatientId("all");
        setPaymentMethod("all");
        setInvoiceType("all");
        setDoctorId("all");
        setFilterDosageForm("all");
        setFilterItemName("");
        setDiscountFilter("all");
    };

    // const handleDeleteSale = async () => {
    //     if (!itemToDelete) return;

    //     if (currentUser?.require_pin_for_delete) {
    //         setIsPinDialogOpen(true);
    //     } else {
    //         const success = await deleteSale(itemToDelete.id);
    //         if (success) {
    //             fetchData(currentPage, perPage, searchTerm, dateFrom, dateTo, employeeId, paymentMethod, doctorId, invoiceType, patientId, filterDosageForm, filterItemName, discountFilter);
    //             setItemToDelete(null);
    //         }
    //     }
    // }

    const handlePinConfirmDelete = async (pin: string) => {
        if (!itemToDelete) return;
        const isValid = await verifyPin(pin);
        if (isValid) {
            setIsPinDialogOpen(false);
            const success = await deleteSale(itemToDelete.id);
            if (success) {
                fetchData(currentPage, perPage, searchTerm, dateFrom, dateTo, employeeId, paymentMethod, doctorId, invoiceType, patientId, filterDosageForm, filterItemName, discountFilter);
                setItemToDelete(null);
            }
        } else {
            toast({ variant: 'destructive', title: "رمز PIN غير صحيح" });
        }
    };

    // const handleEditSale = (sale: Sale) => {
    //     const saleToEdit = sales.find(s => s.id === sale.id);
    //     if (saleToEdit) {
    //         switchToInvoice(0); // Switch to the first invoice tab
    //         updateActiveInvoice(() => ({ // Replace its content
    //             cart: saleToEdit.items.map((i: SaleItem) => ({ 
    //                 ...i, 
    //                 id: i.medication_id,
    //                 original_quantity: i.quantity,
    //                 original_unit_type: i.unit_type || 'strip'
    //             })),
    //             discountValue: (saleToEdit.discount || 0).toString(),
    //             discountType: 'fixed',
    //             patientId: saleToEdit.patient_id || null,
    //             doctorId: saleToEdit.doctor_id || null,
    //             paymentMethod: saleToEdit.payment_method || 'cash',
    //             saleIdToUpdate: saleToEdit.id,
    //         }), 0);
    //         navigate('/sales');
    //     }
    // };
    // Removed client-side calculation. Using API values.

    const pharmacyUsers = React.useMemo(() => {
        return users.filter(u => u.pharmacy_id === currentUser?.pharmacy_id);
    }, [users, currentUser]);


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
                                    <TableHead>الطبيب</TableHead>
                                    <TableHead className="text-center">عدد الأصناف</TableHead>
                                    <TableHead className="text-left">الإجمالي</TableHead>
                                    {showProfitColumn && (
                                        <TableHead className="text-left">الربح</TableHead>
                                    )}
                                    <TableHead>الإجراءات</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell className="text-center"><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                                        <TableCell className="text-left"><Skeleton className="h-5 w-16" /></TableCell>
                                        {showProfitColumn && (
                                            <TableCell className="text-left"><Skeleton className="h-5 w-16" /></TableCell>
                                        )}
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
                {showProfitColumn && (
                    <>
                        <Card className="flex flex-col justify-center">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">إجمالي قيمة المبيعات (المعروضة)</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold font-mono">{totalSalesDisplayed.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                        <Card className="flex flex-col justify-center">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">صافي الربح (المعروض)</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600 font-mono">{totalProfitDisplayed.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                    </>
                )}

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
                    <div className="flex justify-between items-center">
                        <CardTitle>سجل المبيعات</CardTitle>
                        <Button variant="outline" onClick={handleExport} className="">
                            تصدير Excel
                        </Button>
                    </div>
                    <CardDescription>عرض وطباعة جميع فواتير المبيعات السابقة. اضغط على الصف لعرض التفاصيل.</CardDescription>
                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                        <div className="space-y-2 lg:col-span-2">
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
                            <DatePicker 
                                id="date-from" 
                                value={dateFrom} 
                                onChange={(value: string) => setDateFrom(value)} 
                                showTime
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date-to">إلى تاريخ</Label>
                            <DatePicker 
                                id="date-to" 
                                value={dateTo} 
                                onChange={(value: string) => setDateTo(value)} 
                                showTime
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="employee-filter">الموظف</Label>
                            <Select value={employeeId} onValueChange={setEmployeeId}>
                                <SelectTrigger id="employee-filter">
                                    <SelectValue placeholder="اختر موظفًا" />
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
                            <Label htmlFor="patient-filter">المريض</Label>
                            <Select value={patientId} onValueChange={setPatientId}>
                                <SelectTrigger id="patient-filter">
                                    <SelectValue placeholder="اختر مريضًا" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل المرضى</SelectItem>
                                    {allPatients.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="doctor-filter">الطبيب</Label>
                            <Select value={doctorId} onValueChange={setDoctorId}>
                                <SelectTrigger id="doctor-filter">
                                    <SelectValue placeholder="اختر طبيبًا" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">كل الأطباء</SelectItem>
                                    {doctors.map(doc => (
                                        <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-method-filter">طريقة الدفع</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger id="payment-method-filter">
                                    <SelectValue placeholder="الكل" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="cash">نقداً</SelectItem>
                                    <SelectItem value="card">بطاقة إلكترونية</SelectItem>
                                    <SelectItem value="credit">آجل (دين)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="discount-filter">الخصم</Label>
                            <Select value={discountFilter} onValueChange={setDiscountFilter}>
                                <SelectTrigger id="discount-filter">
                                    <SelectValue placeholder="الكل" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="has_discount">مع خصم</SelectItem>
                                    <SelectItem value="no_discount">بدون خصم</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoice-type-filter">نوع الفاتورة</Label>
                            <Select value={invoiceType} onValueChange={setInvoiceType}>
                                <SelectTrigger id="invoice-type-filter">
                                    <SelectValue placeholder="الكل" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="sales">بيع فقط</SelectItem>
                                    <SelectItem value="returns">مرتجع فقط</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dosage-form-filter">الشكل الدوائي</Label>
                            <Select value={filterDosageForm} onValueChange={setFilterDosageForm}>
                                <SelectTrigger id="dosage-form-filter">
                                    <SelectValue placeholder="الكل" />
                                </SelectTrigger>
                                <SelectContent className="max-h-64">
                                    <SelectItem value="all">الكل</SelectItem>
                                    {dosage_forms.map(form => (
                                        <SelectItem key={form} value={form}>{form}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="item-name-filter">اسم الصنف</Label>
                            <Input
                                id="item-name-filter"
                                placeholder="ابحث باسم الصنف..."
                                value={filterItemName}
                                onChange={(e) => setFilterItemName(e.target.value)}
                            />
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
                                <TableHead className="text-right">رقم الفاتورة</TableHead>
                                <TableHead className="text-right">التاريخ والوقت</TableHead>
                                <TableHead className="text-right">الأصناف</TableHead>
                                <TableHead className="text-right">الإجمالي</TableHead>
                                <TableHead className="text-right">الخصم</TableHead>
                                <TableHead className="text-right">إجمالي الكلفة</TableHead>
                                {currentUser && (currentUser.role === 'Admin' || currentUser?.permissions?.manage_sales_performance_period) && (
                                    <TableHead className="text-right">الربح</TableHead>
                                )}
                                <TableHead className="text-right">الحالة</TableHead>
                                <TableHead className="text-right">الإجراءات</TableHead>
                                <TableHead className="w-12"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? Array.from({ length: perPage }).map((_, i) => (
                                <TableRow key={`skel-${i}`}>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    {currentUser && (currentUser.role === 'Admin' || currentUser?.permissions?.manage_sales_performance_period) && (
                                        <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                                    )}
                                    <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-9 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                                </TableRow>
                            )) : sales.length > 0 ? sales.map((sale) => (
                                <React.Fragment key={sale.id}>
                                    <TableRow onClick={() => toggleRow(sale.id)} className="cursor-pointer">
                                        <TableCell className="text-right font-medium font-mono">{sale.id}</TableCell>
                                        <TableCell className="text-right font-mono">{new Date(sale.date).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</TableCell>
                                        <TableCell className="text-right font-mono">{(sale.items || []).length}</TableCell>
                                        <TableCell className="text-right font-mono">{(Number(sale.total || 0)).toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono">{(Number(sale.discount || 0)).toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-mono">{
                                            (sale.items || []).reduce((acc, item) => {
                                                const price = Number(item.purchase_price || 0);
                                                const qty = Number(item.quantity || 0);
                                                const line = price * qty;
                                                return item.is_return ? acc - line : acc + line;
                                            }, 0).toLocaleString()
                                        }</TableCell>
                                        {showProfitColumn && (
                                            <TableCell className="text-right font-mono text-green-600">{(Number(sale.profit || 0)).toLocaleString()}</TableCell>
                                        )}
                                        <TableCell className="text-right font-mono">
                                            {sale.items.some(item => item.is_return) ? (
                                                <Badge variant="destructive">مرتجع</Badge>
                                            ) : (
                                                <Badge variant="default">بيع</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openPrintDialog(sale); }}>
                                                    <Printer className="me-2 h-4 w-4" />
                                                    طباعة
                                                </Button>
                                                {/* {canManagePreviousSales && (
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
                                                                    <DialogTitle>هل أنت متأكد؟</DialogTitle>
                                                                    <AlertDialogDescription>
                                                                        سيتم حذف هذه الفاتورة نهائياً. هذه العملية ستعيد كميات الأصناف المباعة إلى المخزون.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter className='sm:space-x-reverse'>
                                                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={handleDeleteSale} className={buttonVariants({ variant: "destructive" })}>
                                                                        نعم، قم بالحذف
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </>
                                                )} */}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedRows.has(sale.id) && "rotate-180")} />
                                        </TableCell>
                                    </TableRow>
                                    {expandedRows.has(sale.id) && (
                                        <TableRow>
                                            <TableCell colSpan={showProfitColumn ? 10 : 9} className="p-0">
                                                <div className="p-4 bg-muted/50">
                                                    <h4 className="mb-2 font-semibold">أصناف الفاتورة:</h4>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>المنتج</TableHead>
                                                                <TableHead>الكمية</TableHead>
                                                                <TableHead>سعر الشراء</TableHead>
                                                                <TableHead>سعر البيع</TableHead>
                                                                <TableHead>الإجمالي</TableHead>
                                                                <TableHead>النوع</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {(sale.items || []).map((item, index) => (
                                                                <TableRow key={`${sale.id}-${item.medication_id}-${index}`} className={cn(item.is_return && "text-destructive")}>
                                                                    <TableCell>{item.name} {item.dosage_form && <span className="text-xs text-muted-foreground">({item.dosage_form})</span>}</TableCell>
                                                                    <TableCell className="font-mono">{item.quantity}</TableCell>
                                                                    <TableCell className="font-mono">{item.purchase_price.toLocaleString()}</TableCell>
                                                                    <TableCell className="font-mono">{item.price.toLocaleString()}</TableCell>
                                                                    <TableCell className="font-mono">{(item.quantity * item.price).toLocaleString()}</TableCell>
                                                                    <TableCell>
                                                                        {item.unit_type === 'box' ? <Badge variant="destructive">علبة</Badge> : <Badge variant="default">شريط</Badge>}
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
                                    <TableCell colSpan={showProfitColumn ? 10 : 9} className="text-center py-8 text-muted-foreground">
                                        {(filterDosageForm !== 'all' || filterItemName) ? 'لا توجد فواتير تحتوي على هذا الصنف أو الشكل الدوائي.' : 'لم يتم العثور على فواتير مطابقة.'}
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
                            <InvoiceTemplate ref={printComponentRef} sale={selectedSale} settings={settings} user={currentUser || null} />
                        </div>
                        <InvoiceTemplate sale={selectedSale} settings={settings} ref={null} user={currentUser || null} />
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
