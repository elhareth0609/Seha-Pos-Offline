
"use client"

import * as React from "react"
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { PurchaseOrder, Medication, Supplier, ReturnOrder, PurchaseOrderItem, ReturnOrderItem } from "@/lib/types"
import { PlusCircle, ChevronDown, Trash2, UploadCloud, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth";

const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};


export default function PurchasesPage() {
  const { toast } = useToast()
  const { scopedData } = useAuth();
  
  const {
      inventory: [inventory, setInventory],
      suppliers: [suppliers, setSuppliers],
      purchaseOrders: [purchaseOrders, setPurchaseOrders],
      supplierReturns: [supplierReturns, setSupplierReturns],
  } = scopedData;


  const [isAddSupplierOpen, setIsAddSupplierOpen] = React.useState(false);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  // Purchase Form State
  const [purchaseId, setPurchaseId] = React.useState('');
  const [purchaseSupplierId, setPurchaseSupplierId] = React.useState('');
  const [purchaseMedicationId, setPurchaseMedicationId] = React.useState('');
  const [purchaseMedicationName, setPurchaseMedicationName] = React.useState('');
  const [purchaseQuantity, setPurchaseQuantity] = React.useState('');
  const [purchaseExpirationDate, setPurchaseExpirationDate] = React.useState('');
  const [purchasePurchasePrice, setPurchasePurchasePrice] = React.useState('');
  const [purchaseSellingPrice, setPurchaseSellingPrice] = React.useState('');
  const [scientificNames, setScientificNames] = React.useState('');
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);


  // State for return form
  const [returnSlipId, setReturnSlipId] = React.useState('');
  const [returnSupplierId, setReturnSupplierId] = React.useState('');
  const [returnCart, setReturnCart] = React.useState<ReturnOrderItem[]>([]);
  const [isReturnInfoLocked, setIsReturnInfoLocked] = React.useState(false);
  const [returnMedSearchTerm, setReturnMedSearchTerm] = React.useState("");
  const [returnMedSuggestions, setReturnMedSuggestions] = React.useState<Medication[]>([]);
  const [selectedMedForReturn, setSelectedMedForReturn] = React.useState<Medication | null>(null);
  const [returnItemQuantity, setReturnItemQuantity] = React.useState("1");
  const [returnItemReason, setReturnItemReason] = React.useState("");


  // State for advanced search
  const [purchaseHistorySearchTerm, setPurchaseHistorySearchTerm] = React.useState('');
  const [returnHistorySearchTerm, setReturnHistorySearchTerm] = React.useState('');
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = React.useState<PurchaseOrder[]>([]);
  const [filteredSupplierReturns, setFilteredSupplierReturns] = React.useState<ReturnOrder[]>([]);

  React.useEffect(() => {
    const term = purchaseHistorySearchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredPurchaseOrders(purchaseOrders);
    } else {
      const filtered = (purchaseOrders || []).filter(po => 
        po.id.toLowerCase().includes(term) ||
        po.supplierName.toLowerCase().startsWith(term) ||
        po.date.includes(term) ||
        (po.items || []).some(item => (item.name || '').toLowerCase().startsWith(term))
      );
      setFilteredPurchaseOrders(filtered);
    }
  }, [purchaseHistorySearchTerm, purchaseOrders]);

  React.useEffect(() => {
    const term = returnHistorySearchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredSupplierReturns(supplierReturns);
    } else {
      const filtered = (supplierReturns || []).filter(ret => 
        ret.id.toLowerCase().includes(term) ||
        ret.supplierName.toLowerCase().startsWith(term) ||
        ret.date.includes(term) ||
        (ret.items || []).some(item => (item.name || '').toLowerCase().startsWith(term))
      );
      setFilteredSupplierReturns(filtered);
    }
  }, [returnHistorySearchTerm, supplierReturns]);


  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setImageFile(file);
          setImagePreview(URL.createObjectURL(file));
      }
  };

  const resetForm = () => {
    setPurchaseMedicationId('');
    setPurchaseMedicationName('');
    setScientificNames('');
    setPurchaseQuantity('');
    setPurchaseExpirationDate('');
    setPurchasePurchasePrice('');
    setPurchaseSellingPrice('');
    setImageFile(null);
    setImagePreview(null);
    document.getElementById('medicationId')?.focus();
  };

  const handleAddPurchase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const supplier = suppliers.find(s => s.id === purchaseSupplierId);
    if (!purchaseId || !supplier || !purchaseMedicationName.trim()) {
        toast({ variant: "destructive", title: "حقول أساسية ناقصة", description: "رقم القائمة، المورد، والاسم التجاري حقول مطلوبة." });
        return;
    }

    let medicationId = purchaseMedicationId.trim();
    if (!medicationId) {
        medicationId = Date.now().toString();
    }
    
    const quantity = parseInt(purchaseQuantity, 10);
    const purchasePrice = parseFloat(purchasePurchasePrice);
    const sellingPrice = parseFloat(purchaseSellingPrice);

    if (isNaN(quantity) || isNaN(purchasePrice) || isNaN(sellingPrice)) {
       toast({ variant: "destructive", title: "قيم غير صالحة", description: "الكمية والسعر يجب أن تكون أرقاماً." });
       return;
    }
    
    const scientificNamesArray = scientificNames.split(',').map(name => name.trim()).filter(Boolean);
    
    let imageUrl: string | undefined = undefined;
    if (imageFile) {
        imageUrl = await fileToDataUri(imageFile);
    }
    
    const itemTotal = purchasePrice * quantity;

    let newInventory = [...(inventory || [])];
    let medicationIndex = newInventory.findIndex(m => m.id === medicationId);

    if (medicationIndex !== -1) {
      // Medication exists, update it
      const existingMed = newInventory[medicationIndex];
      existingMed.stock += quantity;
      existingMed.price = sellingPrice;
      existingMed.purchasePrice = purchasePrice;
      existingMed.expirationDate = purchaseExpirationDate;
      existingMed.name = purchaseMedicationName;
      existingMed.scientificNames = scientificNamesArray;
      if (imageUrl) existingMed.imageUrl = imageUrl;
      newInventory[medicationIndex] = existingMed;
      toast({
          title: "تم تحديث الرصيد",
          description: `تمت إضافة ${quantity} إلى رصيد ${purchaseMedicationName}. الرصيد الجديد: ${existingMed.stock}`,
        });

    } else {
      // New medication, add it
      const newMedication: Medication = {
          id: medicationId,
          name: purchaseMedicationName,
          scientificNames: scientificNamesArray,
          imageUrl: imageUrl,
          stock: quantity,
          reorderPoint: 20, // default
          price: sellingPrice,
          purchasePrice: purchasePrice,
          expirationDate: purchaseExpirationDate,
      };
      newInventory.unshift(newMedication);
      toast({
          title: "تم استلام البضاعة",
          description: `تمت إضافة ${quantity} من ${purchaseMedicationName} إلى المخزون.`,
        });
    }

    setInventory(newInventory);
    
    let newPurchaseOrders = [...(purchaseOrders || [])];
    let purchaseOrderIndex = newPurchaseOrders.findIndex(po => po.id === purchaseId);
    
    const newPurchaseItem: PurchaseOrderItem = {
        medicationId: medicationId,
        name: purchaseMedicationName,
        quantity: quantity,
        purchasePrice: purchasePrice,
    };

    if (purchaseOrderIndex > -1) {
        newPurchaseOrders[purchaseOrderIndex].items.push(newPurchaseItem);
        newPurchaseOrders[purchaseOrderIndex].totalAmount += itemTotal;
    } else {
        const newOrder: PurchaseOrder = {
          id: purchaseId,
          supplierId: supplier.id,
          supplierName: supplier.name,
          date: new Date().toISOString().split("T")[0],
          items: [newPurchaseItem],
          status: "Received",
          totalAmount: itemTotal,
        };
        newPurchaseOrders.unshift(newOrder);
    }

    setPurchaseOrders(newPurchaseOrders);
    
    resetForm();
  };

  const handleAddSupplier = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("supplierName") as string;
    const contact = formData.get("supplierContact") as string;
    if (!name) {
        toast({ variant: "destructive", title: "اسم المورد مطلوب" });
        return;
    }
    const newSupplier: Supplier = {
        id: `SUP${Date.now()}`,
        name,
        contactPerson: contact,
    };
    setSuppliers(prev => [newSupplier, ...(prev || [])]);
    setPurchaseSupplierId(newSupplier.id); // Select the new supplier automatically

    setIsAddSupplierOpen(false);
    toast({ title: "تمت إضافة المورد بنجاح" });
  };

  const handleReturnSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReturnMedSearchTerm(value);
    if (value.length > 0) {
        const lowercasedFilter = value.toLowerCase();
        const filtered = (inventory || []).filter(med => 
            (med.name.toLowerCase().startsWith(lowercasedFilter) || med.id.includes(lowercasedFilter)) && med.stock > 0
        );
        setReturnMedSuggestions(filtered.slice(0, 5));
    } else {
        setReturnMedSuggestions([]);
    }
  };
  
  const handleSelectMedForReturn = (med: Medication) => {
    setSelectedMedForReturn(med);
    setReturnMedSearchTerm(med.name);
    setReturnMedSuggestions([]);
    document.getElementById("return-quantity")?.focus();
  };

  const handleAddItemToReturnCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnSlipId || !returnSupplierId) {
        toast({ variant: "destructive", title: "حقول ناقصة", description: "الرجاء إدخال رقم قائمة الاسترجاع واختيار المورد." });
        return;
    }
    if (!selectedMedForReturn) {
        toast({ variant: "destructive", title: "لم يتم اختيار دواء", description: "الرجاء البحث واختيار دواء لإضافته." });
        return;
    }
    const quantity = parseInt(returnItemQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
        toast({ variant: "destructive", title: "كمية غير صالحة", description: "الرجاء إدخال كمية صحيحة." });
        return;
    }
    if (quantity > selectedMedForReturn.stock) {
        toast({ variant: "destructive", title: "كمية غير كافية", description: `الرصيد المتوفر من ${selectedMedForReturn.name} هو ${selectedMedForReturn.stock} فقط.`});
        return;
    }

    const newItem: ReturnOrderItem = {
        medicationId: selectedMedForReturn.id,
        name: selectedMedForReturn.name,
        quantity: quantity,
        purchasePrice: selectedMedForReturn.purchasePrice,
        reason: returnItemReason
    };
    
    setReturnCart(prev => [...prev, newItem]);
    setIsReturnInfoLocked(true);
    
    setSelectedMedForReturn(null);
    setReturnMedSearchTerm("");
    setReturnItemQuantity("1");
    setReturnItemReason("");
    document.getElementById("return-med-search")?.focus();
  };
  
  const handleRemoveFromReturnCart = (medId: string) => {
    setReturnCart(prev => prev.filter(item => item.medicationId !== medId));
  }

  const handleFinalizeReturn = () => {
    if (returnCart.length === 0) {
      toast({ variant: "destructive", title: "القائمة فارغة", description: "الرجاء إضافة أصناف إلى قائمة الاسترجاع أولاً." });
      return;
    }

    const supplier = suppliers.find(s => s.id === returnSupplierId);
    if (!supplier) return;

    let totalAmount = 0;
    const newInventory = [...(inventory || [])];

    returnCart.forEach(item => {
        totalAmount += item.quantity * item.purchasePrice;
        const medIndex = newInventory.findIndex(m => m.id === item.medicationId);
        if (medIndex > -1) {
            newInventory[medIndex].stock -= item.quantity;
        }
    });
    
    const newReturnOrder: ReturnOrder = {
        id: returnSlipId,
        supplierId: supplier.id,
        supplierName: supplier.name,
        date: new Date().toISOString().split('T')[0],
        items: returnCart,
        totalAmount,
    };
    
    setInventory(newInventory);
    setSupplierReturns(prev => [newReturnOrder, ...(prev || [])]);
    
    toast({ title: "تم تسجيل الاسترجاع بنجاح", description: `تم تسجيل قائمة الاسترجاع رقم ${returnSlipId}.`});
    
    setReturnSlipId("");
    setReturnSupplierId("");
    setReturnCart([]);
    setIsReturnInfoLocked(false);
  }
  
  return (
     <Tabs defaultValue="new-purchase" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="new-purchase">استلام بضاعة</TabsTrigger>
        <TabsTrigger value="purchase-history">سجل المشتريات</TabsTrigger>
        <TabsTrigger value="new-return">إرجاع للمورد</TabsTrigger>
        <TabsTrigger value="return-history">سجل الاسترجاع</TabsTrigger>
      </TabsList>
      <TabsContent value="new-purchase">
        <Card>
          <CardHeader>
            <CardTitle>استلام بضاعة جديدة</CardTitle>
            <CardDescription>
              استخدم هذا النموذج لتسجيل الأدوية المستلمة من الموردين وتحديث المخزون.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleAddPurchase}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="purchaseId">رقم قائمة الشراء</Label>
                        <Input id="purchaseId" required value={purchaseId} onChange={e => setPurchaseId(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="supplierId">المورد</Label>
                             <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="link" size="sm" className="p-0 h-auto"><PlusCircle className="me-1 h-3 w-3"/> إضافة مورد</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>إضافة مورد جديد</DialogTitle></DialogHeader>
                                    <form onSubmit={handleAddSupplier} className="space-y-4 pt-2">
                                        <div className="space-y-2"><Label htmlFor="supplierName">اسم المورد</Label><Input id="supplierName" name="supplierName" required /></div>
                                        <div className="space-y-2"><Label htmlFor="supplierContact">الشخص المسؤول (اختياري)</Label><Input id="supplierContact" name="supplierContact" /></div>
                                        <DialogFooter className="pt-2"><DialogClose asChild><Button variant="outline" type="button">إلغاء</Button></DialogClose><Button type="submit" variant="success">إضافة</Button></DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <Select name="supplierId" required value={purchaseSupplierId} onValueChange={setPurchaseSupplierId}>
                            <SelectTrigger id="supplierId"><SelectValue placeholder="اختر موردًا" /></SelectTrigger>
                            <SelectContent>{(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                
                <div className="border-t pt-6 space-y-4">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2"><Label htmlFor="medicationId">الباركود (يترك فارغاً للتوليد)</Label><Input id="medicationId" value={purchaseMedicationId} onChange={e => setPurchaseMedicationId(e.target.value)} /></div>
                            <div className="space-y-2"><Label htmlFor="tradeName">الاسم التجاري</Label><Input id="tradeName" required value={purchaseMedicationName} onChange={e => setPurchaseMedicationName(e.target.value)} /></div>
                            <div className="space-y-2 sm:col-span-2"><Label htmlFor="scientificNames">الاسم العلمي (يفصل بينها بفاصلة ,)</Label><Input id="scientificNames" value={scientificNames} onChange={e => setScientificNames(e.target.value)} /></div>
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="itemImage">صورة المنتج (اختياري)</Label>
                            <Input id="itemImage" type="file" accept="image/*" onChange={handleImageChange} className="pt-2 text-xs h-10" />
                            {imagePreview && (
                                <div className="relative mt-2 w-24 h-24">
                                  <Image src={imagePreview} alt="معاينة" layout="fill" className="rounded-md object-cover" />
                                  <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                            )}
                        </div>
                     </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2"><Label htmlFor="quantity">الكمية</Label><Input id="quantity" type="number" required value={purchaseQuantity} onChange={e => setPurchaseQuantity(e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="expirationDate">تاريخ الانتهاء</Label><Input id="expirationDate" type="date" required value={purchaseExpirationDate} onChange={e => setPurchaseExpirationDate(e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="purchasePricePerPurchaseUnit">سعر الشراء</Label><Input id="purchasePricePerPurchaseUnit" type="number" required value={purchasePurchasePrice} onChange={e => setPurchasePurchasePrice(e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="sellingPricePerSaleUnit">سعر البيع</Label><Input id="sellingPricePerSaleUnit" type="number" required value={purchaseSellingPrice} onChange={e => setPurchaseSellingPrice(e.target.value)} /></div>
                    </div>
                </div>

              <Button type="submit" className="w-full" variant="success">إضافة للمخزون والقائمة</Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="purchase-history">
        <Card>
          <CardHeader>
            <CardTitle>سجل المشتريات</CardTitle>
            <CardDescription>قائمة بجميع طلبات الشراء المستلمة. اضغط على أي صف لعرض التفاصيل.</CardDescription>
            <div className="pt-4">
              <Input 
                placeholder="ابحث برقم القائمة، اسم المورد، التاريخ، أو اسم المادة..."
                value={purchaseHistorySearchTerm}
                onChange={(e) => setPurchaseHistorySearchTerm(e.target.value)}
                className="max-w-lg"
              />
            </div>
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>رقم القائمة</TableHead>
                        <TableHead>المورد</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>الإجمالي</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredPurchaseOrders.length > 0 ? filteredPurchaseOrders.map(po => (
                        <React.Fragment key={po.id}>
                            <TableRow onClick={() => toggleRow(po.id)} className="cursor-pointer border-b">
                                <TableCell className="font-mono">{po.id}</TableCell>
                                <TableCell>{po.supplierName}</TableCell>
                                <TableCell className="font-mono">{new Date(po.date).toLocaleDateString('ar-EG')}</TableCell>
                                <TableCell className="font-mono">{po.totalAmount.toLocaleString('ar-IQ')} د.ع</TableCell>
                                <TableCell>
                                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedRows.has(po.id) && "rotate-180")} />
                                </TableCell>
                            </TableRow>
                            {expandedRows.has(po.id) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="p-0">
                                        <div className="p-4 bg-muted/50">
                                            <h4 className="mb-2 font-semibold">أصناف القائمة:</h4>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>المنتج</TableHead>
                                                        <TableHead>الكمية</TableHead>
                                                        <TableHead>سعر الشراء</TableHead>
                                                        <TableHead className="text-left">الإجمالي</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {(po.items || []).length > 0 ? po.items.map((item) => (
                                                        <TableRow key={item.medicationId}>
                                                            <TableCell>{item.name}</TableCell>
                                                            <TableCell className="font-mono">{item.quantity}</TableCell>
                                                            <TableCell className="font-mono">{item.purchasePrice.toLocaleString('ar-IQ')} د.ع</TableCell>
                                                            <TableCell className="font-mono text-left">{(item.quantity * item.purchasePrice).toLocaleString('ar-IQ')} د.ع</TableCell>
                                                        </TableRow>
                                                    )) : (
                                                      <TableRow>
                                                        <TableCell colSpan={4} className="text-center text-muted-foreground">لا توجد أصناف في هذه القائمة.</TableCell>
                                                      </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    )) : (
                      <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">
                              لا توجد نتائج مطابقة للبحث.
                          </TableCell>
                      </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="new-return">
         <Card>
            <CardHeader>
                <CardTitle>إنشاء قائمة إرجاع للمورد</CardTitle>
                <CardDescription>
                استخدم هذا النموذج لإنشاء قائمة بالأدوية المرتجعة للمورد.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="returnSlipId">رقم قائمة الاسترجاع</Label>
                        <Input id="returnSlipId" value={returnSlipId} onChange={e => setReturnSlipId(e.target.value)} placeholder="مثال: RET-2024-001" required disabled={isReturnInfoLocked} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="return-supplierId">المورد</Label>
                        <Select value={returnSupplierId} onValueChange={setReturnSupplierId} required disabled={isReturnInfoLocked}>
                            <SelectTrigger id="return-supplierId"><SelectValue placeholder="اختر موردًا" /></SelectTrigger>
                            <SelectContent>
                                {(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <form onSubmit={handleAddItemToReturnCart} className="p-4 border rounded-md space-y-4">
                    <div className="relative space-y-2">
                        <Label htmlFor="return-med-search">ابحث عن دواء (بالاسم أو الباركود)</Label>
                        <Input 
                            id="return-med-search" 
                            value={returnMedSearchTerm} 
                            onChange={handleReturnSearchChange} 
                            placeholder="ابحث هنا..."
                            autoComplete="off"
                        />
                         {returnMedSuggestions.length > 0 && (
                            <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg border">
                                <CardContent className="p-0">
                                    <ul className="divide-y divide-border">
                                        {returnMedSuggestions.map(med => (
                                            <li key={med.id} 
                                                onMouseDown={() => handleSelectMedForReturn(med)}
                                                className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center"
                                            >
                                                <span>{med.name}</span>
                                                <span className="text-sm text-muted-foreground font-mono">الرصيد: {med.stock}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="return-quantity">الكمية المرتجعة</Label>
                            <Input id="return-quantity" type="number" value={returnItemQuantity} onChange={e => setReturnItemQuantity(e.target.value)} required min="1" disabled={!selectedMedForReturn} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reason">سبب الإرجاع</Label>
                            <Input id="reason" value={returnItemReason} onChange={e => setReturnItemReason(e.target.value)} placeholder="مثال: تالف، قريب الانتهاء" disabled={!selectedMedForReturn} />
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={!selectedMedForReturn}>إضافة إلى القائمة</Button>
                </form>
                
                {returnCart.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">أصناف في قائمة الاسترجاع الحالية:</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المنتج</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>السبب</TableHead>
                          <TableHead>القيمة</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnCart.map(item => (
                          <TableRow key={item.medicationId}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="font-mono">{item.quantity}</TableCell>
                            <TableCell>{item.reason}</TableCell>
                            <TableCell className="font-mono">{(item.quantity * item.purchasePrice).toLocaleString('ar-IQ')} د.ع</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveFromReturnCart(item.medicationId)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleFinalizeReturn} variant="destructive" className="w-full" disabled={returnCart.length === 0}>
                إتمام عملية الاسترجاع
              </Button>
            </CardFooter>
        </Card>
      </TabsContent>
       <TabsContent value="return-history">
        <Card>
          <CardHeader>
            <CardTitle>سجل الاسترجاع</CardTitle>
            <CardDescription>قائمة بجميع عمليات الاسترجاع للموردين. اضغط على أي صف لعرض التفاصيل.</CardDescription>
             <div className="pt-4">
              <Input 
                placeholder="ابحث برقم القائمة، اسم المورد، التاريخ، أو اسم المادة..."
                value={returnHistorySearchTerm}
                onChange={(e) => setReturnHistorySearchTerm(e.target.value)}
                className="max-w-lg"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>رقم القائمة</TableHead>
                        <TableHead>المورد</TableHead>
                        <TableHead>التاريخ</TableHead>
                        <TableHead>قيمة الاسترجاع</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredSupplierReturns.length > 0 ? filteredSupplierReturns.map(ret => (
                        <React.Fragment key={ret.id}>
                            <TableRow onClick={() => toggleRow(ret.id)} className="cursor-pointer">
                                <TableCell className="font-mono">{ret.id}</TableCell>
                                <TableCell>{ret.supplierName}</TableCell>
                                <TableCell className="font-mono">{new Date(ret.date).toLocaleDateString('ar-EG')}</TableCell>
                                <TableCell className="font-mono">{ret.totalAmount.toLocaleString('ar-IQ')} د.ع</TableCell>
                                <TableCell>
                                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedRows.has(ret.id) && "rotate-180")} />
                                </TableCell>
                            </TableRow>
                            {expandedRows.has(ret.id) && (
                                <TableRow>
                                    <TableCell colSpan={5} className="p-0">
                                        <div className="p-4 bg-muted/50">
                                            <h4 className="mb-2 font-semibold">أصناف القائمة:</h4>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>المنتج</TableHead>
                                                        <TableHead>الكمية</TableHead>
                                                        <TableHead>سعر الشراء</TableHead>
                                                        <TableHead>السبب</TableHead>
                                                        <TableHead className="text-left">القيمة</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {(ret.items || []).length > 0 ? ret.items.map((item) => (
                                                        <TableRow key={item.medicationId}>
                                                            <TableCell>{item.name}</TableCell>
                                                            <TableCell className="font-mono">{item.quantity}</TableCell>
                                                            <TableCell className="font-mono">{item.purchasePrice.toLocaleString('ar-IQ')} د.ع</TableCell>
                                                            <TableCell>{item.reason}</TableCell>
                                                            <TableCell className="font-mono text-left">{(item.quantity * item.purchasePrice).toLocaleString('ar-IQ')} د.ع</TableCell>
                                                        </TableRow>
                                                    )) : (
                                                      <TableRow>
                                                        <TableCell colSpan={5} className="text-center text-muted-foreground">لا توجد أصناف في هذا الإرجاع.</TableCell>
                                                      </TableRow>
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    )) : (
                      <TableRow>
                          <TableCell colSpan={5} className="text-center h-24">
                              لا توجد نتائج مطابقة للبحث.
                          </TableCell>
                      </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
