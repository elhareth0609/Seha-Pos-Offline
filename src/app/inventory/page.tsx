
"use client"
import * as React from "react"
import * as XLSX from 'xlsx';
import Image from 'next/image';
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
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { Medication, AppSettings } from "@/lib/types"
import { MoreHorizontal, Trash2, Pencil, Printer, Upload, Package, Plus, X, Filter, ShoppingBasket, Percent } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import Barcode from '@/components/ui/barcode';
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdCarousel from "@/components/ui/ad-carousel";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PinDialog } from "@/components/auth/PinDialog";


const dosage_forms = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Cream", "Gel", "Suppository", "Inhaler", "Drops", "Powder", "Lotion"];

// Helper function to convert file to data URI
const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

type MedFormData = Partial<Medication> & { profit_margin?: number };

export default function InventoryPage() {
  const { 
    scopedData, 
    updateMedication, 
    deleteMedication, 
    bulkAddOrUpdateInventory, 
    addMedication,
    getPaginatedInventory,
    currentUser,
    verifyPin,
    addToOrderRequestCart,
  } = useAuth();
  
  const [paginatedInventory, setPaginatedInventory] = React.useState<Medication[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterStockStatus, setFilterStockStatus] = React.useState<string>("all");
  const [filterDosageForm, setFilterDosageForm] = React.useState<string>("all");
  const [filterExpirationStatus, setFilterExpirationStatus] = React.useState<string>("all");
  
  const [editingMed, setEditingMed] = React.useState<MedFormData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newMed, setNewMed] = React.useState<MedFormData>({
    id: '', name: '', barcodes: [], scientific_names: [], stock: 0,
    reorder_point: 10, price: 0, purchase_price: 0, expiration_date: '',
    dosage: '', dosage_form: '', image_url: '', profit_margin: 0,
  });
  
  const [addImageFile, setAddImageFile] = React.useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = React.useState<string>('');
  
  const [editImageFile, setEditImageFile] = React.useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = React.useState<string>('');
  
  const { toast } = useToast();
  const [printingMed, setPrintingMed] = React.useState<Medication | null>(null);
  const printComponentRef = React.useRef<HTMLDivElement>(null);
  const medToPrintRef = React.useRef<Medication | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  const [itemToDelete, setItemToDelete] = React.useState<Medication | null>(null);
  const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false);


  // Fetch data
  const fetchData = React.useCallback(async (page: number, limit: number, search: string) => {
    setLoading(true);
    try {
        const filters = {
            stock_status: filterStockStatus,
            dosage_form: filterDosageForm,
            expiration_status: filterExpirationStatus,
        };
        const data = await getPaginatedInventory(page, limit, search, filters);
        setPaginatedInventory(data.data);
        setTotalPages(data.last_page);
        setCurrentPage(data.current_page);
    } catch (error) {
        console.error("Failed to fetch inventory", error);
        toast({ variant: "destructive", title: "فشل تحميل المخزون" });
    } finally {
        setLoading(false);
    }
  }, [getPaginatedInventory, toast, filterStockStatus, filterDosageForm, filterExpirationStatus]);
  
  React.useEffect(() => {
    fetchData(currentPage, perPage, searchTerm);
  }, [currentPage, perPage, fetchData]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else fetchData(1, perPage, searchTerm);
    }, 500); // Debounce search
    return () => clearTimeout(handler);
  }, [searchTerm, perPage, fetchData, filterStockStatus, filterDosageForm, filterExpirationStatus]);

  const clearFilters = () => {
    setFilterStockStatus("all");
    setFilterDosageForm("all");
    setFilterExpirationStatus("all");
    setSearchTerm("");
    setIsFiltersOpen(false);
  };
  
  const handlePrint = () => {
    if (medToPrintRef.current) {
        const printWindow = window.open('', '_blank');
        if (printWindow && printComponentRef.current) {
            printWindow.document.write('<html><head><title>Print Barcode</title></head><body>');
            printWindow.document.write(printComponentRef.current.innerHTML);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.print();
        }
    }
  };

  const triggerPrint = (med: Medication) => {
      medToPrintRef.current = med;
      setPrintingMed(med);
  }
  
  React.useEffect(() => {
    if (printingMed) {
        handlePrint();
        setPrintingMed(null);
    }
  }, [printingMed]);
  
  const getStockStatus = (stock: number, reorder_point: number) => {
    if (stock <= 0) return <Badge variant="destructive">نفد من المخزون</Badge>
    if (stock < reorder_point) return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">مخزون منخفض</Badge>
    return <Badge variant="secondary" className="bg-green-300 text-green-900">متوفر</Badge>
  }
  
  const handleDelete = async () => {
    if (!itemToDelete) return;

    if (currentUser?.require_pin_for_delete) {
        setIsPinDialogOpen(true);
    } else {
        const success = await deleteMedication(itemToDelete.id);
        if (success) {
            fetchData(currentPage, perPage, searchTerm);
            setItemToDelete(null);
        }
    }
  };

  const handlePinConfirm = async (pin: string) => {
      if (!itemToDelete) return;

      const isValid = await verifyPin(pin, true);
      if (isValid) {
          setIsPinDialogOpen(false);
          const success = await deleteMedication(itemToDelete.id);
          if (success) {
              fetchData(currentPage, perPage, searchTerm);
              setItemToDelete(null);
          }
      } else {
          toast({ variant: 'destructive', title: 'رمز الحذف غير صحيح' });
      }
  };
  
    const calculateProfitMargin = (purchasePrice: number, sellPrice: number) => {
        if (!purchasePrice || purchasePrice <= 0) return 0;
        return ((sellPrice - purchasePrice) / purchasePrice) * 100;
    };

    const calculateSellPrice = (purchasePrice: number, margin: number) => {
        if (!purchasePrice || purchasePrice <= 0) return 0;
        return purchasePrice * (1 + margin / 100);
    };

    const handlePriceChange = (setter: React.Dispatch<React.SetStateAction<MedFormData | null>>, name: 'price' | 'profit_margin' | 'purchase_price', value: string) => {
        const numericValue = parseFloat(value) || 0;
        setter(prev => {
            if (!prev) return null;
            let { purchase_price = 0, price = 0, profit_margin = 0 } = prev;

            if (name === 'price') {
                price = numericValue;
                profit_margin = calculateProfitMargin(purchase_price, price);
            } else if (name === 'profit_margin') {
                profit_margin = numericValue;
                price = calculateSellPrice(purchase_price, profit_margin);
            } else if (name === 'purchase_price') {
                purchase_price = numericValue;
                if (price > 0) { // Recalculate profit if sell price is already set
                    profit_margin = calculateProfitMargin(purchase_price, price);
                } else if (profit_margin > 0) { // Recalculate sell price if margin is set
                    price = calculateSellPrice(purchase_price, profit_margin);
                }
            }
            return { ...prev, purchase_price, price, profit_margin };
        });
    };
  
  const openEditModal = (med: Medication) => {
      setEditingMed({
          ...med,
          profit_margin: calculateProfitMargin(med.purchase_price, med.price)
      });
      setEditImagePreview(med.image_url || '');
      setIsEditModalOpen(true);
  }
  
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingMed) return;
      
      let image_url = editingMed.image_url || '';
      if (editImageFile) {
          image_url = await fileToDataUri(editImageFile);
      }

      const updatedMedData: Partial<Medication> = {
          id: editingMed.id,
          barcodes: editingMed.barcodes,
          name: editingMed.name,
          scientific_names: editingMed.scientific_names,
          stock: editingMed.stock,
          reorder_point: editingMed.reorder_point,
          price: editingMed.price,
          purchase_price: editingMed.purchase_price,
          expiration_date: editingMed.expiration_date,
          dosage: editingMed.dosage,
          dosage_form: editingMed.dosage_form,
          image_url: image_url
      }
      
      const success = await updateMedication(editingMed.id!, updatedMedData);
      if (success) {
        setIsEditModalOpen(false);
        setEditingMed(null);
        setEditImageFile(null);
        setEditImagePreview('');
        fetchData(currentPage, perPage, searchTerm);
        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث بيانات الدواء ${updatedMedData.name} بنجاح.`,
        });
      }
  }
  
  const openAddModal = () => {
    setNewMed({
      id: '', name: '', barcodes: [], scientific_names: [], stock: 0,
      reorder_point: 10, price: 0, purchase_price: 0, expiration_date: '',
      dosage: '', dosage_form: '', image_url: '', profit_margin: 0
    });
    setAddImageFile(null);
    setAddImagePreview('');
    setIsAddModalOpen(true);
  };
  
  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    let image_url = newMed.image_url || '';
    if (addImageFile) {
        image_url = await fileToDataUri(addImageFile);
    }
    
    const { profit_margin, ...newMedData } = newMed;
    const finalMedData = {
        ...newMedData,
        image_url
    }
    
    const success = await addMedication(finalMedData);
    if (success) {
      setIsAddModalOpen(false);
      setAddImageFile(null);
      setAddImagePreview('');
      fetchData(1, perPage, ""); // Refresh to first page
      toast({
        title: "تمت الإضافة بنجاح",
        description: `تم إضافة الدواء ${newMedData.name} بنجاح.`,
      });
    }
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setIsImporting(true);
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (jsonData.length < 2) {
          toast({ variant: 'destructive', title: 'ملف فارغ', description: 'الملف لا يحتوي على بيانات.' });
          setIsImporting(false);
          return;
        }

        const headerRow: string[] = jsonData[0].map(h => String(h).toLowerCase().trim());
        const rows = jsonData.slice(1);
        const barcodeAliases = ['barcode', 'product_number', 'الباركود'];
        const nameAliases = ['name', 'الاسم'];
        const stockAliases = ['stock', 'الكمية', 'quantity'];
        
        const barcodeIndex = headerRow.findIndex(h => barcodeAliases.some(alias => h.includes(alias)));
        const nameIndex = headerRow.findIndex(h => nameAliases.some(alias => h.includes(alias)));
        const stockIndex = headerRow.findIndex(h => stockAliases.some(alias => h.includes(alias)));
        
        if (barcodeIndex === -1 || nameIndex === -1) {
          toast({ variant: 'destructive', title: 'أعمدة ناقصة', description: `الملف يجب أن يحتوي على عمود للباركود (مثل product_number أو barcode) وعمود للاسم (name).` });
          setIsImporting(false);
          return;
        }

        const medicationsToProcess: Partial<Medication>[] = [];
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 2);
        const formattedExpDate = futureDate.toISOString().split('T')[0];

        for (const row of rows) {
            const barcode = String(row[barcodeIndex] || '').trim();
            const medName = String(row[nameIndex] || 'Unnamed Product').trim();
            const stock = stockIndex > -1 ? parseInt(String(row[stockIndex]), 10) : 0;
            if (!barcode || !medName) continue;
            medicationsToProcess.push({
                barcodes: [barcode],
                name: medName,
                stock: isNaN(stock) ? 0 : stock,
                reorder_point: 10,
                price: 0,
                purchase_price: 0,
                expiration_date: formattedExpDate,
            });
        }
        
        await bulkAddOrUpdateInventory(medicationsToProcess);
        fetchData(1, perPage, ""); // Refresh data
        toast({ title: "تم الاستيراد بنجاح", description: `تم استيراد ${medicationsToProcess.length} دواء بنجاح.` });

      } catch (error) {
        console.error('Error importing from Excel:', error);
        toast({ variant: 'destructive', title: 'خطأ في الاستيراد', description: 'حدث خطأ أثناء معالجة الملف. تأكد من أن الملف بصيغة Excel الصحيحة.' });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleAddImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAddImageFile(file);
      setAddImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleRemoveAddImage = () => {
    setAddImageFile(null);
    setAddImagePreview('');
  };
  
  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleRemoveEditImage = () => {
    setEditImageFile(null);
    setEditImagePreview('');
    if (editingMed) {
        setEditingMed({ ...editingMed, image_url: '' });
    }
  };
  
  return (
    <>
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        <div ref={printComponentRef}>
           {printingMed && <Barcode value={(printingMed.barcodes[0] || printingMed.id)} />}
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <CardTitle>إدارة المخزون</CardTitle>
              <CardDescription>
                إدارة وتتبع مخزون الأدوية الخاص بك.
              </CardDescription>
            </div>
            <div className="w-full max-w-sm">
                <AdCarousel page="inventory"/>
            </div>
          </div>
          <div className="pt-4 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Input 
                placeholder="ابحث بالاسم، الاسم العلمي أو الباركود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <div className="flex gap-2">
                <Button variant="success" onClick={openAddModal}>
                  <Plus className="me-2 h-4 w-4" />
                  إضافة دواء
                </Button>
                <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
                  <Upload className="me-2 h-4 w-4" />
                  {isImporting ? "جاري الاستيراد..." : "استيراد Excel"}
                </Button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".xlsx, .xls"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="per-page" className="shrink-0">لكل صفحة:</Label>
                <Select value={String(perPage)} onValueChange={(val) => setPerPage(Number(val))}>
                  <SelectTrigger id="per-page" className="w-20 h-9">
                    <SelectValue placeholder={perPage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
               <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="gap-1">
                      <Filter className="h-4 w-4" />
                      فلاتر متقدمة
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent asChild>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t mt-4">
                        <div className="space-y-1">
                            <Label htmlFor="filter-stock-status">حالة المخزون</Label>
                            <Select value={filterStockStatus} onValueChange={setFilterStockStatus}>
                                <SelectTrigger id="filter-stock-status"><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="in_stock">متوفر</SelectItem>
                                    <SelectItem value="low_stock">مخزون منخفض</SelectItem>
                                    <SelectItem value="out_of_stock">نفد من المخزون</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="filter-dosage-form">الشكل الدوائي</Label>
                            <Select value={filterDosageForm} onValueChange={setFilterDosageForm}>
                                <SelectTrigger id="filter-dosage-form">
                                  <SelectValue placeholder="الكل" />
                                </SelectTrigger>
                                <SelectContent className="max-h-64">
                                    <SelectItem value="all">الكل</SelectItem>
                                    {dosage_forms.map(form => <SelectItem key={form} value={form}>{form}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label htmlFor="filter-expiration-status">حالة الصلاحية</Label>
                            <Select value={filterExpirationStatus} onValueChange={setFilterExpirationStatus}>
                                <SelectTrigger id="filter-expiration-status"><SelectValue placeholder="الكل" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">الكل</SelectItem>
                                    <SelectItem value="expired">منتهي الصلاحية</SelectItem>
                                    <SelectItem value="expiring_soon">قريب الانتهاء</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="col-span-full flex justify-end">
                            <Button variant="ghost" onClick={clearFilters}>مسح الفلاتر</Button>
                        </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>المعرف</TableHead>
                <TableHead>الباركود</TableHead>
                <TableHead>الاسم</TableHead>
                <TableHead className="text-center">المخزون</TableHead>
                <TableHead className="text-center">نقطة إعادة الطلب</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
                <TableHead className="text-center">سعر البيع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
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
              )) : paginatedInventory.length > 0 ? paginatedInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell className="font-mono text-xs">{item.barcodes?.join(', ')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        {typeof item.image_url === 'string' && item.image_url !== "" ? (
                            <Image src={item.image_url} alt={item.name} width={40} height={40} className="rounded-sm object-cover h-10 w-10" />
                        ) : (
                            <div className="h-10 w-10 flex items-center justify-center rounded-sm bg-muted text-muted-foreground">
                                <Package className="h-5 w-5" />
                            </div>
                        )}
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <div className="text-xs text-muted-foreground">{item.scientific_names?.join(', ')}</div>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">{item.stock}</TableCell>
                  <TableCell className="text-center font-mono">{item.reorder_point}</TableCell>
                  <TableCell className="font-mono">{new Date(item.expiration_date).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell className="text-center font-mono">{item.price.toLocaleString()}</TableCell>
                  <TableCell>{getStockStatus(item.stock, item.reorder_point)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => addToOrderRequestCart(item)} 
                        className="hover:text-blue-600 group"
                      >
                        <ShoppingBasket className="h-5 w-5 text-blue-600 group-hover:text-white" />
                      </Button>
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                              </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                              <DropdownMenuItem onSelect={() => openEditModal(item)}>
                                  <Pencil className="me-2 h-4 w-4" />
                                  تعديل
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => triggerPrint(item)}>
                                  <Printer className="me-2 h-4 w-4" />
                                  طباعة الباركود
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <button 
                                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive"
                                            onClick={() => setItemToDelete(item)}
                                        >
                                          <Trash2 className="me-2 h-4 w-4" />
                                          حذف
                                        </button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                سيتم حذف هذا الدواء. هذه العملية لا يمكن التراجع عنها.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter className='sm:space-x-reverse'>
                                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
                                                نعم، قم بالحذف
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                          </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                        لا يوجد مخزون لعرضه.
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
        </CardContent>
      </Card>
      
      {/* Edit Medication Dialog */}
        <Dialog open={isEditModalOpen} onOpenChange={(open) => { setIsEditModalOpen(open); if (!open) setEditingMed(null); }}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>تعديل بيانات الدواء</DialogTitle>
                </DialogHeader>
                  {editingMed && (
                      <form onSubmit={handleUpdate} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="edit-barcodes">الباركود (يفصل بفاصلة ,)</Label>
                                  <Input id="edit-barcodes" value={editingMed.barcodes?.join(', ')} onChange={e => setEditingMed(p => p ? {...p, barcodes: e.target.value.split(',').map(s => s.trim())} : null)} required />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="edit-name">الاسم التجاري</Label>
                                  <Input id="edit-name" value={editingMed.name} onChange={e => setEditingMed(p => p ? {...p, name: e.target.value} : null)} required />
                              </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="edit-scientific_names">الاسم العلمي (يفصل بفاصلة ,)</Label>
                                  <Input id="edit-scientific_names" value={editingMed.scientific_names?.join(', ')}  onChange={e => setEditingMed(p => p ? {...p, scientific_names: e.target.value.split(',').map(s => s.trim())} : null)} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="edit-image_url">صورة الدواء</Label>
                                  <div className="flex items-center gap-4">
                                      <Input id="edit-image_url" type="file" accept="image/*" onChange={handleEditImageChange} className="pt-2 text-xs h-10 flex-1" />
                                      {typeof editImagePreview === 'string' && editImagePreview !== "" && (
                                          <div className="relative w-16 h-16 shrink-0">
                                              <Image src={editImagePreview} alt="معاينة" fill className="rounded-md object-cover" />
                                              <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={handleRemoveEditImage}>
                                                  <X className="h-3 w-3" />
                                              </Button>
                                          </div>
                                      )}
                                  </div>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-dosage">الجرعة</Label>
                                <Input id="edit-dosage" value={editingMed.dosage} onChange={e => setEditingMed(p => p ? {...p, dosage: e.target.value} : null)} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="edit-dosage_form">الشكل الدوائي</Label>
                                  <Select value={editingMed.dosage_form} onValueChange={val => setEditingMed(p => p ? {...p, dosage_form: val} : null)}>
                                      <SelectTrigger id="edit-dosage_form">
                                        <SelectValue placeholder="اختر الشكل" />
                                      </SelectTrigger>
                                      <SelectContent className="max-h-64">
                                          {dosage_forms.map(form => <SelectItem key={form} value={form}>{form}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-stock">رصيد المخزون</Label>
                                <Input id="edit-stock" type="number" value={editingMed.stock} onChange={e => setEditingMed(p => p ? {...p, stock: parseInt(e.target.value)} : null)} required />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="edit-reorder_point">نقطة إعادة الطلب</Label>
                                  <Input id="edit-reorder_point" type="number" value={editingMed.reorder_point} onChange={e => setEditingMed(p => p ? {...p, reorder_point: parseInt(e.target.value)} : null)} required />
                              </div>
                          </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>سعر الشراء</Label>
                                    <Input type="number" value={editingMed.purchase_price} onChange={e => handlePriceChange(setEditingMed, 'purchase_price', e.target.value)} required />
                                </div>
                                <div className="flex items-end gap-2">
                                    <div className="space-y-2 flex-grow">
                                        <Label>سعر البيع</Label>
                                        <Input type="number" value={editingMed.price} onChange={e => handlePriceChange(setEditingMed, 'price', e.target.value)} required />
                                    </div>
                                    <div className="space-y-2 w-24">
                                        <Label>النسبة %</Label>
                                        <div className="relative">
                                            <Input type="number" value={editingMed.profit_margin?.toFixed(0)} onChange={e => handlePriceChange(setEditingMed, 'profit_margin', e.target.value)} className="pe-7" />
                                            <Percent className="absolute top-1/2 -translate-y-1/2 start-1.5 h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="edit-expiration_date">تاريخ الانتهاء</Label>
                                  <Input id="edit-expiration_date" type="date" value={editingMed.expiration_date ? new Date(editingMed.expiration_date).toISOString().split('T')[0] : ''} onChange={e => setEditingMed(p => p ? {...p, expiration_date: e.target.value} : null)} required />
                              </div>
                          </div>
                          <DialogFooter>
                              <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                              <Button type="submit" variant="success">حفظ التغييرات</Button>
                          </DialogFooter>
                      </form>
                  )}
            </DialogContent>
        </Dialog>
        
        {/* Add Medication Dialog */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>إضافة دواء جديد</DialogTitle>
                    <DialogDescription>
                         أدخل تفاصيل الدواء الجديد.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-barcodes">الباركود (يفصل بفاصلة ,)</Label>
                            <Input id="add-barcodes" value={newMed.barcodes?.join(', ')} onChange={e => setNewMed(p => ({...p, barcodes: e.target.value.split(',').map(s => s.trim())}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-name">الاسم التجاري</Label>
                            <Input id="add-name" value={newMed.name} onChange={e => setNewMed(p => ({...p, name: e.target.value}))} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-scientific_names">الاسم العلمي (يفصل بفاصلة ,)</Label>
                            <Input id="add-scientific_names" value={newMed.scientific_names?.join(', ')} onChange={e => setNewMed(p => ({...p, scientific_names: e.target.value.split(',').map(s => s.trim())}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-image_url">صورة الدواء</Label>
                            <div className="flex items-center gap-4">
                                <Input id="add-image_url" type="file" accept="image/*" onChange={handleAddImageChange} className="pt-2 text-xs h-10 flex-1" />
                                {addImagePreview && (
                                    <div className="relative w-16 h-16 shrink-0">
                                        <Image src={addImagePreview} alt="معاينة" fill className="rounded-md object-cover" />
                                        <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={handleRemoveAddImage}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-dosage">الجرعة</Label>
                            <Input id="add-dosage" value={newMed.dosage} onChange={e => setNewMed(p => ({...p, dosage: e.target.value}))} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-dosage_form">الشكل الدوائي</Label>
                            <Select value={newMed.dosage_form} onValueChange={val => setNewMed(p => ({...p, dosage_form: val}))}>
                                <SelectTrigger id="add-dosage_form">
                                  <SelectValue placeholder="اختر الشكل" />
                                </SelectTrigger>
                                <SelectContent className="max-h-64">
                                    {dosage_forms.map(form => <SelectItem key={form} value={form}>{form}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-stock">رصيد المخزون</Label>
                            <Input id="add-stock" type="number" value={newMed.stock} onChange={e => setNewMed(p => ({...p, stock: parseInt(e.target.value)}))} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-reorder_point">نقطة إعادة الطلب</Label>
                            <Input id="add-reorder_point" type="number" value={newMed.reorder_point} onChange={e => setNewMed(p => ({...p, reorder_point: parseInt(e.target.value)}))} required />
                        </div>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>سعر الشراء</Label>
                            <Input type="number" value={newMed.purchase_price} onChange={e => handlePriceChange(setNewMed, 'purchase_price', e.target.value)} required />
                        </div>
                        <div className="flex items-end gap-2">
                            <div className="space-y-2 flex-grow">
                                <Label>سعر البيع</Label>
                                <Input type="number" value={newMed.price} onChange={e => handlePriceChange(setNewMed, 'price', e.target.value)} required />
                            </div>
                            <div className="space-y-2 w-24">
                                <Label>النسبة %</Label>
                                <div className="relative">
                                    <Input type="number" value={newMed.profit_margin?.toFixed(0)} onChange={e => handlePriceChange(setNewMed, 'profit_margin', e.target.value)} className="pe-7" />
                                    <Percent className="absolute top-1/2 -translate-y-1/2 start-1.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-expiration_date">تاريخ الانتهاء</Label>
                            <Input id="add-expiration_date" type="date" value={newMed.expiration_date} onChange={e => setNewMed(p => ({...p, expiration_date: e.target.value}))} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                        <Button type="submit" variant="success">إضافة الدواء</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        <PinDialog
            open={isPinDialogOpen}
            onOpenChange={setIsPinDialogOpen}
            onConfirm={handlePinConfirm}
        />
    </>
  )
}
