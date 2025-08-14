
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
import type { Medication } from "@/lib/types"
import { MoreHorizontal, Trash2, Pencil, Printer, Upload, Package, Plus, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import Barcode from '@/components/ui/barcode';
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdCarousel from "@/components/ui/ad-carousel";

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

export default function InventoryPage() {
  const { scopedData, updateMedication, deleteMedication, bulkAddOrUpdateInventory, addMedication } = useAuth();
  const [allInventory] = scopedData.inventory;
  const [filteredInventory, setFilteredInventory] = React.useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const [editingMed, setEditingMed] = React.useState<Medication | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  
  // New state for add medication modal
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [newMed, setNewMed] = React.useState<Partial<Medication>>({
    id: '',
    name: '',
    scientific_names: [],
    barcodes: [],
    stock: 0,
    reorder_point: 10,
    price: 0,
    purchase_price: 0,
    expiration_date: '',
    dosage: '',
    dosage_form: '',
    image_url: ''
  });
  
  // Image states for add form
  const [addImageFile, setAddImageFile] = React.useState<File | null>(null);
  const [addImagePreview, setAddImagePreview] = React.useState<string>('');
  
  // Image states for edit form
  const [editImageFile, setEditImageFile] = React.useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = React.useState<string>('');
  
  const [isClient, setIsClient] = React.useState(false)
  const { toast } = useToast();
  const [printingMed, setPrintingMed] = React.useState<Medication | null>(null);
  const printComponentRef = React.useRef<HTMLDivElement>(null);
  const medToPrintRef = React.useRef<Medication | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  
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

  React.useEffect(() => {
    setIsClient(true)
  }, [])
  
  const sortedInventory = React.useMemo(() => {
    return [...(allInventory || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allInventory]);
  
  React.useEffect(() => {
    if (isClient) {
      const lowercasedFilter = searchTerm.toLowerCase().trim();
      if (!lowercasedFilter) {
          setFilteredInventory(sortedInventory);
          return;
      }
      const filtered = sortedInventory.filter((item) =>
          (item.name || '').toLowerCase().startsWith(lowercasedFilter) ||
          (item.barcodes && item.barcodes.some(barcode => barcode.toLowerCase().includes(lowercasedFilter))) ||
          (item.id && item.id.toString().toLowerCase().includes(lowercasedFilter)) ||
          (item.scientific_names && item.scientific_names.some(name => name.toLowerCase().startsWith(lowercasedFilter)))
      );
      setFilteredInventory(filtered);
    }
  }, [searchTerm, sortedInventory, isClient]);
  
  const getStockStatus = (stock: number, reorder_point: number) => {
    if (stock <= 0) return <Badge variant="destructive">نفد من المخزون</Badge>
    if (stock < reorder_point) return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">مخزون منخفض</Badge>
    return <Badge variant="secondary" className="bg-green-300 text-green-900">متوفر</Badge>
  }
  
  const handleDelete = async (med: Medication) => {
      await deleteMedication(med.id);
  }
  
  const openEditModal = (med: Medication) => {
      setEditingMed(med);
      setEditImagePreview(med.image_url || '');
      setIsEditModalOpen(true);
  }
  
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingMed) return;
      const formData = new FormData(e.currentTarget);
      
      let image_url = editingMed.image_url || '';
      if (editImageFile) {
          image_url = await fileToDataUri(editImageFile);
      }
      
       const scientific_namesArray = (formData.get('scientific_names') as string)
            .split(',')
            .map(name => name.trim())
            .filter(Boolean);
      
      const barcodesArray = (formData.get('barcodes') as string)
            .split(',')
            .map(bc => bc.trim())
            .filter(Boolean);

      const updatedMedData: Partial<Medication> = {
          id: editingMed.id as string,
          barcodes: barcodesArray,
          name: formData.get('name') as string,
          scientific_names: scientific_namesArray,
          stock: parseInt(formData.get('stock') as string, 10),
          reorder_point: parseInt(formData.get('reorder_point') as string, 10),
          price: parseFloat(formData.get('price') as string),
          purchase_price: parseFloat(formData.get('purchase_price') as string),
          expiration_date: formData.get('expiration_date') as string,
          dosage: formData.get('dosage') as string,
          dosage_form: formData.get('dosage_form') as string,
          image_url: image_url
      }
      
      const success = await updateMedication(editingMed.id, updatedMedData);
      if (success) {
        setIsEditModalOpen(false);
        setEditingMed(null);
        setEditImageFile(null);
        setEditImagePreview('');
        toast({
          title: "تم التحديث بنجاح",
          description: `تم تحديث بيانات الدواء ${updatedMedData.name} بنجاح.`,
        });
      }
  }
  
  // Function to handle adding a new medication
  const openAddModal = () => {
    setNewMed({
      id: '',
      name: '',
      barcodes: [],
      scientific_names: [],
      stock: 0,
      reorder_point: 10,
      price: 0,
      purchase_price: 0,
      expiration_date: '',
      dosage: '',
      dosage_form: '',
      image_url: ''
    });
    setAddImageFile(null);
    setAddImagePreview('');
    setIsAddModalOpen(true);
  };
  
  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    let image_url = newMed.image_url || '';
    if (addImageFile) {
        image_url = await fileToDataUri(addImageFile);
    }
    
    const scientific_namesArray = (formData.get('scientific_names') as string)
         .split(',')
         .map(name => name.trim())
         .filter(Boolean);

    const barcodesArray = (formData.get('barcodes') as string)
         .split(',')
         .map(bc => bc.trim())
         .filter(Boolean);
    
    const newMedData: Partial<Medication> = {
        barcodes: barcodesArray,
        name: formData.get('name') as string,
        scientific_names: scientific_namesArray,
        stock: parseInt(formData.get('stock') as string, 10),
        reorder_point: parseInt(formData.get('reorder_point') as string, 10),
        price: parseFloat(formData.get('price') as string),
        purchase_price: parseFloat(formData.get('purchase_price') as string),
        expiration_date: formData.get('expiration_date') as string,
        dosage: formData.get('dosage') as string,
        dosage_form: formData.get('dosage_form') as string,
        image_url: image_url,
    };
    
    // Generate a unique ID if not provided
    const success = await addMedication(newMedData);
    if (success) {
      setIsAddModalOpen(false);
      setAddImageFile(null);
      setAddImagePreview('');
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
    if (!file) {
      return;
    }
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
          toast({
            variant: 'destructive',
            title: 'أعمدة ناقصة',
            description: `الملف يجب أن يحتوي على عمود للباركود (مثل product_number أو barcode) وعمود للاسم (name).`,
          });
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
        toast({
          title: "تم الاستيراد بنجاح",
          description: `تم استيراد ${medicationsToProcess.length} دواء بنجاح.`,
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
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Image handlers for add form
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
  
  // Image handlers for edit form
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
          <div className="pt-4 flex gap-2">
            <Input 
              placeholder="ابحث بالاسم، الاسم العلمي أو الباركود..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
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
                                              سيتم حذف هذا الدواء. هذه العملية لا يمكن التراجع عنها.
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
      </Card>
      
      {/* Edit Medication Dialog */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>تعديل بيانات الدواء</DialogTitle>
                    <DialogDescription>
                         قم بتحديث تفاصيل الدواء.
                    </DialogDescription>
                </DialogHeader>
                   {editingMed && (
                      <form onSubmit={handleUpdate} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="edit-barcodes">الباركود (يفصل بفاصلة ,)</Label>
                                  <Input id="edit-barcodes" name="barcodes" defaultValue={editingMed.barcodes?.join(', ')} required />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="edit-name">الاسم التجاري</Label>
                                  <Input id="edit-name" name="name" defaultValue={editingMed.name} required />
                              </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <Label htmlFor="edit-scientific_names">الاسم العلمي (يفصل بفاصلة ,)</Label>
                                  <Input id="edit-scientific_names" name="scientific_names" defaultValue={editingMed.scientific_names?.join(', ')} />
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
                                <Input id="edit-dosage" name="dosage" defaultValue={editingMed.dosage} />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="edit-dosage_form">الشكل الدوائي</Label>
                                  <Select name="dosage_form" defaultValue={editingMed.dosage_form}>
                                      <SelectTrigger id="edit-dosage_form"><SelectValue placeholder="اختر الشكل" /></SelectTrigger>
                                      <SelectContent>
                                          {dosage_forms.map(form => <SelectItem key={form} value={form}>{form}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="edit-stock">رصيد المخزون</Label>
                                <Input id="edit-stock" name="stock" type="number" defaultValue={editingMed.stock} required />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="edit-reorder_point">نقطة إعادة الطلب</Label>
                                  <Input id="edit-reorder_point" name="reorder_point" type="number" defaultValue={editingMed.reorder_point} required />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="edit-purchase_price">سعر الشراء</Label>
                                <Input id="edit-purchase_price" name="purchase_price" type="number" step="1" defaultValue={editingMed.purchase_price} required />
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="edit-price">سعر البيع</Label>
                                  <Input id="edit-price" name="price" type="number" step="1" defaultValue={editingMed.price} required />
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="edit-expiration_date">تاريخ الانتهاء</Label>
                                  <Input
                                    id="edit-expiration_date"
                                    name="expiration_date"
                                    type="date"
                                    defaultValue={editingMed.expiration_date ? new Date(editingMed.expiration_date).toISOString().split('T')[0] : ''}
                                    required
                                  />
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
                            <Input id="add-barcodes" name="barcodes" defaultValue={newMed.barcodes?.join(', ')} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-name">الاسم التجاري</Label>
                            <Input id="add-name" name="name" defaultValue={newMed.name} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-scientific_names">الاسم العلمي (يفصل بفاصلة ,)</Label>
                            <Input id="add-scientific_names" name="scientific_names" defaultValue={newMed.scientific_names?.join(', ')} />
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
                            <Input id="add-dosage" name="dosage" defaultValue={newMed.dosage} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-dosage_form">الشكل الدوائي</Label>
                            <Select name="dosage_form" defaultValue={newMed.dosage_form}>
                                <SelectTrigger id="add-dosage_form"><SelectValue placeholder="اختر الشكل" /></SelectTrigger>
                                <SelectContent>
                                    {dosage_forms.map(form => <SelectItem key={form} value={form}>{form}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-stock">رصيد المخزون</Label>
                            <Input id="add-stock" name="stock" type="number" defaultValue={1} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-reorder_point">نقطة إعادة الطلب</Label>
                            <Input id="add-reorder_point" name="reorder_point" type="number" defaultValue={newMed.reorder_point} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-purchase_price">سعر الشراء</Label>
                            <Input id="add-purchase_price" name="purchase_price" type="number" step="1" defaultValue={newMed.purchase_price} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="add-price">سعر البيع</Label>
                            <Input id="add-price" name="price" type="number" step="1" defaultValue={newMed.price} required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="add-expiration_date">تاريخ الانتهاء</Label>
                            <Input id="add-expiration_date" name="expiration_date" type="date" defaultValue={newMed.expiration_date} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                        <Button type="submit" variant="success">إضافة الدواء</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    </>
  )
}
