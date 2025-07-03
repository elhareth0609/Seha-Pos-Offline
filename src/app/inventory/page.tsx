
"use client"

import * as React from "react"
import * as XLSX from 'xlsx';
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
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { inventory as fallbackInventory } from "@/lib/data"
import type { Medication } from "@/lib/types"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { MoreHorizontal, ListFilter, Trash2, Pencil, X, Printer, Upload } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useReactToPrint } from 'react-to-print';
import Barcode from '@/components/ui/barcode';


export default function InventoryPage() {
  const [allInventory, setAllInventory] = useLocalStorage<Medication[]>('inventory', fallbackInventory);
  const [filteredInventory, setFilteredInventory] = React.useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  
  const [editingMed, setEditingMed] = React.useState<Medication | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false)

  const { toast } = useToast();

  const [printingMed, setPrintingMed] = React.useState<Medication | null>(null);
  const printComponentRef = React.useRef(null);
  const medToPrintRef = React.useRef<Medication | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handlePrint = useReactToPrint({
      content: () => printComponentRef.current,
      documentTitle: `barcode-${medToPrintRef.current?.id || ''}`,
      onAfterPrint: () => {
        medToPrintRef.current = null;
        setPrintingMed(null);
      }
  });

  const triggerPrint = (med: Medication) => {
      medToPrintRef.current = med;
      setPrintingMed(med);
  }
  
  React.useEffect(() => {
    if (printingMed) {
        handlePrint();
    }
  }, [printingMed, handlePrint]);


  React.useEffect(() => {
    setIsClient(true)
  }, [])


  const categories = React.useMemo(() => ["all", ...Array.from(new Set(allInventory.map(item => item.category)))], [allInventory]);

  React.useEffect(() => {
    if (isClient) {
        let tempInventory = allInventory;

        if (searchTerm) {
        tempInventory = tempInventory.filter((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        }
        
        if (categoryFilter !== "all") {
            tempInventory = tempInventory.filter(item => item.category === categoryFilter);
        }

        setFilteredInventory(tempInventory);
    }
  }, [searchTerm, allInventory, categoryFilter, isClient]);

  const getStockStatus = (stock: number, reorderPoint: number) => {
    if (stock <= 0) return <Badge variant="destructive">نفد من المخزون</Badge>
    if (stock < reorderPoint) return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">مخزون منخفض</Badge>
    return <Badge variant="secondary" className="bg-green-300 text-green-900">متوفر</Badge>
  }

  const handleDelete = (medId: string) => {
      setAllInventory(prev => prev.filter(m => m.id !== medId));
      toast({ title: "تم حذف الدواء", description: "تمت إزالة الدواء من المخزون بنجاح." });
  }

  const openEditModal = (med: Medication) => {
      setEditingMed(med);
      setIsEditModalOpen(true);
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingMed) return;

      const formData = new FormData(e.currentTarget);
      const updatedMed: Medication = {
          ...editingMed,
          name: formData.get('name') as string,
          reorderPoint: parseInt(formData.get('reorderPoint') as string, 10),
          price: parseFloat(formData.get('price') as string),
          category: formData.get('category') as string,
          saleUnit: formData.get('saleUnit') as string,
      }
      
      setAllInventory(prev => prev.map(m => m.id === updatedMed.id ? updatedMed : m));
      toast({ title: "تم تحديث الدواء", description: `تم تحديث بيانات ${updatedMed.name} بنجاح.` });
      setIsEditModalOpen(false);
      setEditingMed(null);
  }
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: "array", cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length < 2) {
                 toast({ variant: 'destructive', title: 'ملف فارغ', description: 'الملف لا يحتوي على بيانات.' });
                 return;
            }

            const headers: string[] = jsonData[0].map(h => String(h).toLowerCase().trim().replace(/\s+/g, ''));
            const rows = jsonData.slice(1);

            const requiredHeaders = ['id', 'name', 'stock', 'price', 'purchaseprice'];
            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h.toLowerCase()));
            if (missingHeaders.length > 0) {
                toast({ variant: 'destructive', title: 'أعمدة ناقصة', description: `الملف يجب أن يحتوي على الأعمدة التالية: ${requiredHeaders.join(', ')}` });
                return;
            }
            
            let updatedCount = 0;
            let addedCount = 0;
            const inventoryToUpdate = [...allInventory];

            rows.forEach((rowArray) => {
                const row: any = {};
                headers.forEach((header, i) => {
                    row[header] = rowArray[i];
                });

                const medId = String(row.id || '').trim();
                if (!medId) return;

                const existingIndex = inventoryToUpdate.findIndex(m => m.id === medId);
                const isUpdate = existingIndex > -1;
                
                let expDate = row.expirationdate;
                let formattedExpDate: string;
                if (expDate instanceof Date) {
                    expDate.setMinutes(expDate.getMinutes() - expDate.getTimezoneOffset());
                    formattedExpDate = expDate.toISOString().split('T')[0];
                } else if (typeof expDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(expDate)) {
                    formattedExpDate = expDate;
                } else {
                    const futureDate = new Date();
                    futureDate.setFullYear(futureDate.getFullYear() + 1);
                    formattedExpDate = futureDate.toISOString().split('T')[0];
                }

                const medData: Partial<Medication> = {
                    id: medId,
                    name: String(row.name || (isUpdate ? inventoryToUpdate[existingIndex].name : 'Unnamed Product')).trim(),
                    stock: parseInt(row.stock, 10) || 0,
                    price: parseFloat(row.price) || 0,
                    purchasePrice: parseFloat(row.purchaseprice) || 0,
                    reorderPoint: parseInt(row.reorderpoint, 10) || 10,
                    category: String(row.category || 'Uncategorized').trim(),
                    expirationDate: formattedExpDate,
                    supplierName: String(row.suppliername || 'Default Supplier').trim(),
                    supplierId: String(row.supplierid || 'SUP-DEFAULT').trim(),
                    saleUnit: String(row.saleunit || 'علبة').trim(),
                };

                if (isUpdate) {
                    inventoryToUpdate[existingIndex] = { ...inventoryToUpdate[existingIndex], ...medData };
                    updatedCount++;
                } else {
                    const newMed: Medication = {
                        id: medData.id!,
                        name: medData.name!,
                        stock: medData.stock!,
                        reorderPoint: medData.reorderPoint!,
                        category: medData.category!,
                        supplierId: medData.supplierId!,
                        supplierName: medData.supplierName!,
                        price: medData.price!,
                        purchasePrice: medData.purchasePrice!,
                        expirationDate: medData.expirationDate!,
                        saleUnit: medData.saleUnit!,
                    };
                    inventoryToUpdate.push(newMed);
                    addedCount++;
                }
            });

            setAllInventory(inventoryToUpdate);
            toast({ title: "اكتمل الاستيراد", description: `تم إضافة ${addedCount} صنفًا وتحديث ${updatedCount} صنفًا.` });
        } catch (error) {
            console.error("Error importing from Excel:", error);
            toast({ variant: 'destructive', title: 'خطأ في الاستيراد', description: 'حدث خطأ أثناء معالجة الملف. تأكد من أن الملف بالتنسيق الصحيح.' });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };
    reader.readAsArrayBuffer(file);
  };


  if (!isClient) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-5 w-72" />
                <div className="pt-4 flex gap-2">
                    <Skeleton className="h-10 max-w-sm flex-1" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>الباركود</TableHead>
                                <TableHead>الاسم</TableHead>
                                <TableHead>الفئة</TableHead>
                                <TableHead>وحدة البيع</TableHead>
                                <TableHead>المورد</TableHead>
                                <TableHead className="text-center">المخزون</TableHead>
                                <TableHead className="text-center">نقطة إعادة الطلب</TableHead>
                                <TableHead>تاريخ الانتهاء</TableHead>
                                <TableHead className="text-center">سعر البيع</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
  }
  
  return (
    <>
    {printingMed && (
        <div className="hidden">
            <div ref={printComponentRef} className="p-8 text-center">
                <h3 className="text-lg font-bold mb-4">{printingMed.name}</h3>
                <Barcode value={printingMed.id} />
                <p className="pt-2 text-xs">{printingMed.price.toLocaleString('ar-IQ')} ع.د</p>
            </div>
        </div>
    )}
    <Card>
      <CardHeader>
        <CardTitle>إدارة المخزون</CardTitle>
        <CardDescription>
          إدارة وتتبع مخزون الأدوية الخاص بك.
        </CardDescription>
        <div className="pt-4 flex gap-2">
          <Input 
            placeholder="ابحث بالاسم أو الباركود..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
           <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-1">
                        <ListFilter className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            تصفية
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuLabel>تصفية حسب الفئة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={categoryFilter} onValueChange={setCategoryFilter}>
                        {categories.map(cat => (
                             <DropdownMenuRadioItem key={cat} value={cat}>{cat === 'all' ? 'الكل' : cat}</DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
             <Button variant="outline" onClick={handleImportClick}>
                <Upload className="me-2 h-4 w-4" />
                استيراد Excel
            </Button>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
            />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الباركود</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead>وحدة البيع</TableHead>
              <TableHead>المورد</TableHead>
              <TableHead className="text-center">المخزون</TableHead>
              <TableHead className="text-center">نقطة إعادة الطلب</TableHead>
              <TableHead>تاريخ الانتهاء</TableHead>
              <TableHead className="text-center">سعر البيع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead><span className="sr-only">الإجراءات</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium font-mono text-xs">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.saleUnit || '-'}</TableCell>
                <TableCell>{item.supplierName}</TableCell>
                <TableCell className="text-center">{item.stock}</TableCell>
                <TableCell className="text-center">{item.reorderPoint}</TableCell>
                <TableCell>{new Date(item.expirationDate).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell className="text-center">{item.price.toLocaleString('ar-IQ')} ع.د</TableCell>
                <TableCell>{getStockStatus(item.stock, item.reorderPoint)}</TableCell>
                <TableCell>
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
                             <Dialog>
                                <DialogTrigger asChild>
                                    <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                      <Trash2 className="me-2 h-4 w-4" />
                                      حذف
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>هل أنت متأكد تمامًا؟</DialogTitle>
                                        <DialogDescription>
                                            هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الدواء بشكل دائم من مخزونك.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                        <Button variant="destructive" onClick={() => handleDelete(item.id)}>نعم، قم بالحذف</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تعديل بيانات الدواء</DialogTitle>
                    <DialogDescription>
                       قم بتحديث تفاصيل الدواء. ملاحظة: لا يمكن تعديل المخزون من هنا.
                    </DialogDescription>
                </DialogHeader>
                 {editingMed && (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">اسم الدواء</Label>
                            <Input id="edit-name" name="name" defaultValue={editingMed.name} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="edit-reorderPoint">نقطة إعادة الطلب</Label>
                                <Input id="edit-reorderPoint" name="reorderPoint" type="number" defaultValue={editingMed.reorderPoint} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-price">سعر البيع (ع.د)</Label>
                                <Input id="edit-price" name="price" type="number" step="1" defaultValue={editingMed.price} required />
                            </div>
                        </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-category">الفئة</Label>
                                <Input id="edit-category" name="category" defaultValue={editingMed.category} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-saleUnit">وحدة البيع</Label>
                                <Input id="edit-saleUnit" name="saleUnit" defaultValue={editingMed.saleUnit || ''} />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                            <Button type="submit">حفظ التغييرات</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    </Card>
    </>
  )
}
