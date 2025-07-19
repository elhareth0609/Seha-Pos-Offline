
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
import type { Medication, TrashItem } from "@/lib/types"
import { MoreHorizontal, Trash2, Pencil, Printer, Upload, Package } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useReactToPrint } from 'react-to-print';
import Barcode from '@/components/ui/barcode';
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";


export default function InventoryPage() {
  const { scopedData } = useAuth();
  const [allInventory, setAllInventory] = scopedData.inventory;
  const [trash, setTrash] = scopedData.trash;

  const [filteredInventory, setFilteredInventory] = React.useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const [editingMed, setEditingMed] = React.useState<Medication | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false)

  const { toast } = useToast();

  const [printingMed, setPrintingMed] = React.useState<Medication | null>(null);
  const printComponentRef = React.useRef(null);
  const medToPrintRef = React.useRef<Medication | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isImporting, setIsImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState(0);
  const [importMessage, setImportMessage] = React.useState("");

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

  const sortedInventory = React.useMemo(() => {
    return [...(allInventory || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allInventory]);

  React.useEffect(() => {
    if (isClient) {
      if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = sortedInventory.filter((item) =>
            (item.name || '').toLowerCase().startsWith(lowercasedFilter) ||
            (item.id && item.id.toLowerCase().includes(lowercasedFilter))
        );
        setFilteredInventory(filtered);
      } else {
        setFilteredInventory(sortedInventory);
      }
    }
  }, [searchTerm, sortedInventory, isClient]);

  const getStockStatus = (stock: number, reorderPoint: number) => {
    if (stock <= 0) return <Badge variant="destructive">نفد من المخزون</Badge>
    if (stock < reorderPoint) return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">مخزون منخفض</Badge>
    return <Badge variant="secondary" className="bg-green-300 text-green-900">متوفر</Badge>
  }

  const handleDelete = (med: Medication) => {
      const newTrashItem: TrashItem = {
        id: `TRASH-${Date.now()}`,
        deletedAt: new Date().toISOString(),
        itemType: 'medication',
        data: med,
      };
      setTrash(prev => [newTrashItem, ...(prev || [])]);
      setAllInventory(prev => (prev || []).filter(m => m.id !== med.id));
      toast({ title: "تم نقل الدواء إلى سلة المحذوفات" });
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
      }
      
      setAllInventory(prev => (prev || []).map(m => m.id === updatedMed.id ? updatedMed : m));
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
    reader.onload = async (e) => {
      try {
        setIsImporting(true);
        setImportProgress(0);
        setImportMessage("جاري قراءة الملف...");

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

        const barcodeIndex = headerRow.findIndex(h => barcodeAliases.some(alias => h.includes(alias)));
        const nameIndex = headerRow.findIndex(h => nameAliases.some(alias => h.includes(alias)));
        
        if (barcodeIndex === -1 || nameIndex === -1) {
          toast({
            variant: 'destructive',
            title: 'أعمدة ناقصة',
            description: `الملف يجب أن يحتوي على عمود للباركود (مثل product_number أو barcode) وعمود للاسم (name).`,
          });
          setIsImporting(false);
          return;
        }

        const inventoryMap = new Map((allInventory || []).map(item => [item.id, item]));
        let updatedCount = 0;
        let addedCount = 0;
        const CHUNK_SIZE = 200;
        const totalRows = rows.length;

        for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
            const chunk = rows.slice(i, i + CHUNK_SIZE);
            
            for (const row of chunk) {
                const medId = String(row[barcodeIndex] || '').trim();
                const medName = String(row[nameIndex] || 'Unnamed Product').trim();

                if (!medId || !medName) {
                    continue; // Skip empty or invalid rows
                }

                if (inventoryMap.has(medId)) {
                    // Update existing medication
                    const existingMed = inventoryMap.get(medId)!;
                    if (existingMed.name !== medName) {
                        existingMed.name = medName;
                        inventoryMap.set(medId, existingMed);
                        updatedCount++;
                    }
                } else {
                    // Add new medication
                    const futureDate = new Date();
                    futureDate.setFullYear(futureDate.getFullYear() + 2);
                    const formattedExpDate = futureDate.toISOString().split('T')[0];

                    const newMed: Medication = {
                      id: medId,
                      name: medName,
                      stock: 0,
                      reorderPoint: 10,
                      price: 0,
                      purchasePrice: 0,
                      expirationDate: formattedExpDate,
                    };
                    inventoryMap.set(medId, newMed);
                    addedCount++;
                }
            }

            const progress = Math.round(((i + chunk.length) / totalRows) * 100);
            setImportProgress(progress);
            setImportMessage(`جاري معالجة ${i + chunk.length} من ${totalRows} صنفًا...`);

            await new Promise(resolve => setTimeout(resolve, 0));
        }

        setAllInventory(Array.from(inventoryMap.values()));
        
        toast({
          title: 'اكتمل الاستيراد بنجاح',
          description: `تم إضافة ${addedCount} صنفًا جديدًا وتحديث بيانات ${updatedCount} صنفًا.`,
        });

      } catch (error) {
        console.error('Error importing from Excel:', error);
        toast({
          variant: 'destructive',
          title: 'خطأ في الاستيراد',
          description: 'حدث خطأ أثناء معالجة الملف. تأكد من أن الملف بصيغة Excel الصحيحة.',
        });
      } finally {
        setIsImporting(false);
        setImportProgress(0);
        setImportMessage("");
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
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
      <div className="hidden">
          {printingMed && (
              <div ref={printComponentRef}>
                  <Barcode value={printingMed.id} />
              </div>
          )}
      </div>
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
               <Button variant="outline" onClick={handleImportClick} disabled={isImporting}>
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
                <TableHead className="text-center">المخزون</TableHead>
                <TableHead className="text-center">نقطة إعادة الطلب</TableHead>
                <TableHead>تاريخ الانتهاء</TableHead>
                <TableHead className="text-center">سعر البيع</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length > 0 ? filteredInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.name} width={40} height={40} className="rounded-sm object-cover h-10 w-10" />
                        ) : (
                            <div className="h-10 w-10 flex items-center justify-center rounded-sm bg-muted text-muted-foreground">
                                <Package className="h-5 w-5" />
                            </div>
                        )}
                        <span>{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">{item.stock}</TableCell>
                  <TableCell className="text-center font-mono">{item.reorderPoint}</TableCell>
                  <TableCell className="font-mono">{new Date(item.expirationDate).toLocaleDateString('ar-EG')}</TableCell>
                  <TableCell className="text-center font-mono">{item.price.toLocaleString()}</TableCell>
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
                               <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                        <Trash2 className="me-2 h-4 w-4" />
                                        حذف
                                      </button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                          <AlertDialogDescription>
                                              سيتم نقل هذا الدواء إلى سلة المحذوفات. يمكنك استعادته لاحقًا.
                                          </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(item)} className={buttonVariants({ variant: "destructive" })}>
                                              نعم، قم بالحذف
                                          </AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                          </DropdownMenuContent>
                      </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                        لا يوجد مخزون لعرضه.
                    </TableCell>
                </TableRow>
              )}
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
                                  <Label htmlFor="edit-price">سعر البيع</Label>
                                  <Input id="edit-price" name="price" type="number" step="1" defaultValue={editingMed.price} required />
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
      </Card>
    </>
  )
}
