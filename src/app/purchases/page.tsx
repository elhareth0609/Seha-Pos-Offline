
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
import { PlusCircle, ChevronDown, Trash2, X } from "lucide-react"
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

const dosage_forms = ["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Cream", "Gel", "Suppository", "Inhaler", "Drops", "Powder", "Lotion"];


export default function PurchasesPage() {
  const { toast } = useToast()
  const { scopedData, addSupplier, addPurchaseOrder, addReturnOrder } = useAuth();
  
  const {
      inventory: [inventory],
      suppliers: [suppliers],
      purchaseOrders: [purchaseOrders],
      supplierReturns: [supplierReturns],
  } = scopedData;


  const [isAddSupplierOpen, setIsAddSupplierOpen] = React.useState(false);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  // Purchase Form State
  const [purchase_id, setPurchaseId] = React.useState('');
  const [purchaseSupplierId, setPurchaseSupplierId] = React.useState('');
  const [purchaseItems, setPurchaseItems] = React.useState<any[]>([]);
  
  // State for return form
  const [returnSlipId, setReturnSlipId] = React.useState('');
  const [returnSupplierId, setReturnSupplierId] = React.useState('');
  const [returnCart, setReturnCart] = React.useState<ReturnOrderItem[]>([]);
  const [is_returnInfoLocked, setIsReturnInfoLocked] = React.useState(false);
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

  const [supplier_name, setSupplierName] = React.useState("");
  const [supplierContact, setSupplierContact] = React.useState("");

  React.useEffect(() => {
    const term = purchaseHistorySearchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredPurchaseOrders(purchaseOrders);
    } else {
      const filtered = (purchaseOrders || []).filter(po => 
        String(po.id).toLowerCase().includes(term) ||
        po.supplier_name.toLowerCase().startsWith(term) ||
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
        String(ret.id).toLowerCase().includes(term) ||
        ret.supplier_name.toLowerCase().startsWith(term) ||
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
  
  const handleFinalizePurchase = async () => {
    const supplier = suppliers.find(s => s.id === purchaseSupplierId);
    if (!purchase_id || !supplier || purchaseItems.length === 0) {
        toast({ variant: "destructive", title: "بيانات ناقصة", description: "رقم القائمة، المورد، والأصناف مطلوبة." });
        return;
    }
    
    const purchaseData = {
        id: purchase_id,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        date: new Date().toISOString().split('T')[0],
        items: purchaseItems.map(item => ({
            barcode: item.barcode, // Corrected from medication_id to barcode
            name: item.name,
            quantity: item.quantity,
            purchase_price: item.purchase_price,
            expiration_date: item.expiration_date,
            scientific_names: item.scientific_names,
            image_url: item.image_url,
            price: item.price,
            dosage: item.dosage,
            dosage_form: item.dosage_form,
        })),
    }

    const success = await addPurchaseOrder(purchaseData);
    if (success) {
        setPurchaseId('');
        setPurchaseSupplierId('');
        setPurchaseItems([]);
    }
  }

  const handleAddSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const name = formData.get("supplier_name") as string;
      const contact_person = formData.get("supplierContact") as string;

      if (!name) {
          toast({ variant: "destructive", title: "اسم المورد مطلوب" });
          return;
      }
      
      const newSupplier = await addSupplier({ name, contact_person });

      if (newSupplier) {
        setPurchaseSupplierId(newSupplier.id);
        setIsAddSupplierOpen(false);
        (e.target as HTMLFormElement).reset();
      }
  };

  const handleReturnSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReturnMedSearchTerm(value);
    if (value.length > 0) {
        const lowercasedFilter = value.toLowerCase();
        const filtered = (inventory || []).filter(med => 
            (med.name.toLowerCase().startsWith(lowercasedFilter) || 
              String(med.id).includes(lowercasedFilter) ||
              med.barcode.includes(lowercasedFilter) ||
              (med.scientific_names && med.scientific_names.some(name => name.toLowerCase().startsWith(lowercasedFilter)))) && 
              med.stock > 0
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
        id: selectedMedForReturn.id,
        medication_id: selectedMedForReturn.id,
        name: selectedMedForReturn.name,
        quantity: quantity,
        purchase_price: selectedMedForReturn.purchase_price,
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
    setReturnCart(prev => prev.filter(item => item.medication_id !== medId));
  }

  const handleFinalizeReturn = async () => {
    if (returnCart.length === 0) {
      toast({ variant: "destructive", title: "القائمة فارغة", description: "الرجاء إضافة أصناف إلى قائمة الاسترجاع أولاً." });
      return;
    }

    const supplier = suppliers.find(s => s.id === returnSupplierId);
    if (!supplier) return;
    
    const returnData = {
        id: returnSlipId,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        date: new Date().toISOString().split('T')[0],
        items: returnCart.map(item => ({
            id: item.id,
            medication_id: item.medication_id,
            name: item.name,
            quantity: item.quantity,
            purchase_price: item.purchase_price,
            reason: item.reason
        }))
    }
    
    const success = await addReturnOrder(returnData);
    
    if(success) {
      setReturnSlipId("");
      setReturnSupplierId("");
      setReturnCart([]);
      setIsReturnInfoLocked(false);
    }
  }

  function AddPurchaseItemForm({ onAddItem }: { onAddItem: (item: any) => void }) {
    const [barcode, setBarcode] = React.useState('');
    const [medicationName, setMedicationName] = React.useState('');
    const [scientific_names, setScientificNames] = React.useState('');
    const [dosage, setDosage] = React.useState('');
    const [dosage_form, setDosageForm] = React.useState('');
    const [quantity, setQuantity] = React.useState('');
    const [purchase_price, setPurchasePrice] = React.useState('');
    const [sellingPrice, setSellingPrice] = React.useState('');
    const [expiration_date, setExpirationDate] = React.useState('');
    const [imageFile, setImageFile] = React.useState<File | null>(null);
    const [imagePreview, setImagePreview] = React.useState<string>('');

    const resetForm = () => {
        setBarcode('');
        setMedicationName('');
        setScientificNames('');
        setDosage('');
        setDosageForm('');
        setQuantity('');
        setPurchasePrice('');
        setSellingPrice('');
        setExpirationDate('');
        setImageFile(null);
        setImagePreview('');
    };

    const prefillFormWithMedData = React.useCallback((med: Medication) => {
        setMedicationName(med.name || '');
        setScientificNames((med.scientific_names || []).join(', '));
        setDosage(med.dosage || '');
        setDosageForm(med.dosage_form || '');
        setSellingPrice(String(med.price || ''));
        setPurchasePrice(String(med.purchase_price || ''));
        setImagePreview(med.image_url || '');
    }, []);

    React.useEffect(() => {
        const Barcode = barcode.trim();
        if (Barcode) {
            const existingMed = (inventory || []).find(m => m.barcode === Barcode);
            if (existingMed) {
                prefillFormWithMedData(existingMed);
            }
        }
    }, [barcode, inventory, prefillFormWithMedData]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        let Barcode = barcode.trim();
        if(!Barcode) {
            Barcode = Date.now().toString();
        }
        
        let expDate = expiration_date;
        if (!expDate) {
            toast({ variant: 'destructive', title: "تاريخ الصلاحية مطلوب", description: "الرجاء إدخال تاريخ صلاحية صالح." });
            return;
        }
        
        let image_url: string = imagePreview || '';
        if (imageFile) {
            image_url = await fileToDataUri(imageFile);
        }
        
        const newItem = {
            barcode: barcode,
            name: medicationName,
            scientific_names: scientific_names.split(',').map(s => s.trim()).filter(Boolean),
            dosage,
            dosage_form: dosage_form,
            quantity: parseInt(quantity, 10),
            purchase_price: parseFloat(purchase_price),
            price: parseFloat(sellingPrice),
            expiration_date: expDate,
            image_url: image_url,

        };

        if (!newItem.name || !newItem.quantity || !newItem.purchase_price || !newItem.price) {
            toast({ variant: 'destructive', title: "حقول ناقصة", description: "الاسم، الكمية، سعر الشراء، وسعر البيع مطلوبة." });
            return;
        }
        
        onAddItem(newItem);
        resetForm();
    };

    return (
        <form onSubmit={handleSubmit} className="border-t pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="barcode">الباركود (يترك فارغاً للتوليد)</Label>
                    <Input id="barcode" value={barcode} onChange={e => setBarcode(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="tradeName">الاسم التجاري</Label>
                    <Input id="tradeName" required value={medicationName} onChange={e => setMedicationName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="scientific_names">الاسم العلمي (يفصل بفاصلة ,)</Label>
                    <Input id="scientific_names" value={scientific_names} onChange={e => setScientificNames(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="dosage">الجرعة (مثال: 500mg)</Label>
                    <Input id="dosage" value={dosage} onChange={e => setDosage(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="dosage_form">الشكل الدوائي</Label>
                    <Select name="dosage_form" value={dosage_form} onValueChange={setDosageForm}>
                        <SelectTrigger id="dosage_form"><SelectValue placeholder="اختر الشكل" /></SelectTrigger>
                        <SelectContent>
                            {dosage_forms.map(form => <SelectItem key={form} value={form}>{form}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="quantity">الكمية</Label>
                    <Input id="quantity" type="number" required value={quantity} onChange={e => setQuantity(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="purchase_pricePerPurchaseUnit">سعر الشراء</Label>
                    <Input id="purchase_pricePerPurchaseUnit" type="number" required value={purchase_price} onChange={e => setPurchasePrice(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="sellingPricePerSaleUnit">سعر البيع</Label>
                    <Input id="sellingPricePerSaleUnit" type="number" required value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="expiration_date">تاريخ الانتهاء</Label>
                    <Input id="expiration_date" type="date" value={expiration_date} onChange={e => setExpirationDate(e.target.value)} required/>
                </div>
                <div className="md:col-span-3 flex flex-col gap-2">
                    <Label htmlFor="itemImage">صورة المنتج (اختياري)</Label>
                    <div className="flex items-center gap-4">
                        <Input id="itemImage" type="file" accept="image/*" onChange={handleImageChange} className="pt-2 text-xs h-10 flex-1" />
                        {imagePreview && (
                            <div className="relative w-16 h-16 shrink-0">
                                <Image src={imagePreview} alt="معاينة" fill className="rounded-md object-cover" />
                                <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-5 w-5 rounded-full" onClick={() => { setImageFile(null); setImagePreview(''); }}>
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Button type="submit" className="w-full">إضافة إلى القائمة</Button>
        </form>
    );
  }

  return (
     <Tabs defaultValue="new-purchase" className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-10">
        <TabsTrigger value="new-purchase">استلام بضاعة</TabsTrigger>
        <TabsTrigger value="purchase-history">سجل المشتريات</TabsTrigger>
        <TabsTrigger value="new-return">إرجاع للمورد</TabsTrigger>
        <TabsTrigger value="return-history">سجل الاسترجاع</TabsTrigger>
      </TabsList>
      <TabsContent value="new-purchase" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle>استلام بضاعة جديدة</CardTitle>
            <CardDescription>
              أضف الأصناف المستلمة إلى القائمة أدناه ثم اضغط على "إتمام عملية الاستلام" لحفظها.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="purchase_id">رقم قائمة الشراء</Label>
                        <Input id="purchase_id" required value={purchase_id} onChange={e => setPurchaseId(e.target.value)} disabled={purchaseItems.length > 0} />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="supplier_id">المورد</Label>
                             <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="link" size="sm" className="p-0 h-auto"><PlusCircle className="me-1 h-3 w-3"/> إضافة مورد</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>إضافة مورد جديد</DialogTitle>
                                    </DialogHeader>
                                      <form onSubmit={handleAddSupplier} className="space-y-4 pt-2">
                                          <div className="space-y-2">
                                              <Label htmlFor="supplier_name">اسم المورد</Label>
                                              <Input id="supplier_name" name="supplier_name" required />
                                          </div>
                                          <div className="space-y-2">
                                              <Label htmlFor="supplierContact">الشخص المسؤول (اختياري)</Label>
                                              <Input id="supplierContact" name="supplierContact" />
                                          </div>
                                          <DialogFooter className="pt-2">
                                              <DialogClose asChild><Button variant="outline" type="button">إلغاء</Button></DialogClose>
                                              <Button type="submit" variant="success">إضافة</Button>
                                          </DialogFooter>
                                      </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <Select name="supplier_id" required value={purchaseSupplierId} onValueChange={setPurchaseSupplierId} disabled={purchaseItems.length > 0}>
                            <SelectTrigger id="supplier_id"><SelectValue placeholder="اختر موردًا" /></SelectTrigger>
                            <SelectContent>{(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                
                <AddPurchaseItemForm onAddItem={(item) => setPurchaseItems(prev => [...prev, item])} />
                
                {purchaseItems.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">أصناف في القائمة الحالية:</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المنتج</TableHead>
                          <TableHead>الكمية</TableHead>
                          <TableHead>سعر الشراء</TableHead>
                          <TableHead>سعر البيع</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {purchaseItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="font-mono">{item.quantity}</TableCell>
                            <TableCell className="font-mono">{item.purchase_price.toLocaleString()}</TableCell>
                            <TableCell className="font-mono">{item.price.toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => setPurchaseItems(prev => prev.filter((_, i) => i !== index))}>
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
              <Button onClick={handleFinalizePurchase} variant="success" className="w-full" disabled={purchaseItems.length === 0}>
                إتمام عملية الاستلام
              </Button>
            </CardFooter>
        </Card>
      </TabsContent>
       <TabsContent value="purchase-history" dir="rtl">
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
                        <TableHead className="w-[150px]">رقم القائمة</TableHead>
                        <TableHead>المنتج / المورد</TableHead>
                        <TableHead className="w-[120px]">الكمية</TableHead>
                        <TableHead className="w-[120px]">سعر الشراء</TableHead>
                        <TableHead className="w-[120px]">الإجمالي</TableHead>
                        <TableHead className="w-[120px]">التاريخ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredPurchaseOrders.length > 0 ? filteredPurchaseOrders.map(po => (
                        <React.Fragment key={po.id}>
                            <TableRow onClick={() => toggleRow(po.id)} className="cursor-pointer bg-muted/30 font-semibold">
                                <TableCell className="font-mono">{po.id}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedRows.has(po.id) && "rotate-180")} />
                                        {po.supplier_name}
                                    </div>
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell className="font-mono">{po.total_amount.toLocaleString()}</TableCell>
                                <TableCell className="font-mono">{new Date(po.date).toLocaleDateString('ar-EG')}</TableCell>
                            </TableRow>
                            {expandedRows.has(po.id) && (po.items || []).map((item, index) => (
                                <TableRow key={`${po.id}-${item.id}-${index}`} className="bg-muted/10">
                                    <TableCell></TableCell>
                                    <TableCell className="pr-10">{item.name}</TableCell>
                                    <TableCell className="font-mono">{item.quantity}</TableCell>
                                    <TableCell className="font-mono">{item.purchase_price.toLocaleString()}</TableCell>
                                    <TableCell className="font-mono">{(item.quantity * item.purchase_price).toLocaleString()}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            ))}
                        </React.Fragment>
                    )) : (
                      <TableRow>
                          <TableCell colSpan={6} className="text-center h-24">
                              لا توجد نتائج مطابقة للبحث.
                          </TableCell>
                      </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
       <TabsContent value="new-return" dir="rtl">
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
                        <Input id="returnSlipId" value={returnSlipId} onChange={e => setReturnSlipId(e.target.value)} placeholder="مثال: RET-2024-001" required disabled={is_returnInfoLocked} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="return-supplier_id">المورد</Label>
                        <Select value={returnSupplierId} onValueChange={setReturnSupplierId} required disabled={is_returnInfoLocked}>
                            <SelectTrigger id="return-supplier_id"><SelectValue placeholder="اختر موردًا" /></SelectTrigger>
                            <SelectContent>
                                {(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                
                <form onSubmit={handleAddItemToReturnCart} className="p-4 border rounded-md space-y-4">
                    <div className="relative space-y-2">
                        <Label htmlFor="return-med-search">ابحث عن دواء (بالاسم، العلمي أو الباركود)</Label>
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
                                                <div>
                                                  <div>{med.name}</div>
                                                  <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>
                                                </div>
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
                          <TableRow key={item.medication_id}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell className="font-mono">{item.quantity}</TableCell>
                            <TableCell>{item.reason}</TableCell>
                            <TableCell className="font-mono">{(item.quantity * item.purchase_price).toLocaleString()}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveFromReturnCart(item.medication_id)}>
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
       <TabsContent value="return-history" dir="rtl">
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
                        <TableHead className="w-[150px]">رقم القائمة</TableHead>
                        <TableHead>المنتج / المورد</TableHead>
                        <TableHead className="w-[120px]">الكمية</TableHead>
                        <TableHead className="w-[120px]">سعر الشراء</TableHead>
                        <TableHead className="w-[120px]">الإجمالي</TableHead>
                        <TableHead className="w-[120px]">التاريخ</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredSupplierReturns.length > 0 ? filteredSupplierReturns.map(ret => (
                        <React.Fragment key={ret.id}>
                            <TableRow onClick={() => toggleRow(ret.id)} className="cursor-pointer bg-muted/30 font-semibold">
                                <TableCell className="font-mono">{ret.id}</TableCell>
                                <TableCell>
                                     <div className="flex items-center gap-2">
                                        <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedRows.has(ret.id) && "rotate-180")} />
                                        {ret.supplier_name}
                                    </div>
                                </TableCell>
                                <TableCell></TableCell>
                                <TableCell></TableCell>
                                <TableCell className="font-mono">{ret.total_amount.toLocaleString()}</TableCell>
                                <TableCell className="font-mono">{new Date(ret.date).toLocaleDateString('ar-EG')}</TableCell>
                            </TableRow>
                             {expandedRows.has(ret.id) && (ret.items || []).map((item, index) => (
                                <TableRow key={`${ret.id}-${item.medication_id}-${index}`} className="bg-muted/10">
                                    <TableCell></TableCell>
                                    <TableCell className="pr-10">{item.name} <span className="text-xs text-muted-foreground">({item.reason})</span></TableCell>
                                    <TableCell className="font-mono">{item.quantity}</TableCell>
                                    <TableCell className="font-mono">{item.purchase_price.toLocaleString()}</TableCell>
                                    <TableCell className="font-mono">{(item.quantity * item.purchase_price).toLocaleString()}</TableCell>
                                    <TableCell></TableCell>
                                </TableRow>
                            ))}
                        </React.Fragment>
                    )) : (
                      <TableRow>
                          <TableCell colSpan={6} className="text-center h-24">
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
