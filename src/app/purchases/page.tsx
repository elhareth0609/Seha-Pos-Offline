
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
import type { PurchaseOrder, Medication, Supplier, ReturnOrder, PurchaseOrderItem, ReturnOrderItem, PaginatedResponse } from "@/lib/types"
import { PlusCircle, ChevronDown, Trash2, X, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton"

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
  const { 
      scopedData, 
      addSupplier, 
      addPurchaseOrder, 
      addReturnOrder,
      getPaginatedPurchaseOrders,
      getPaginatedReturnOrders,
    } = useAuth();
  
  const {
      inventory: [inventory, setInventory],
      suppliers: [suppliers, setSuppliers],
  } = scopedData;


  const [isAddSupplierOpen, setIsAddSupplierOpen] = React.useState(false);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  // Purchase Form State
  const [purchase_id, setPurchaseId] = React.useState('');
  const [purchaseSupplierId, setPurchaseSupplierId] = React.useState('');
  const [purchaseItems, setPurchaseItems] = React.useState<any[]>([]);
  const [purchaseItemSearchTerm, setPurchaseItemSearchTerm] = React.useState('');
  const [purchaseItemSuggestions, setPurchaseItemSuggestions] = React.useState<Medication[]>([]);
  const [isPurchaseInfoLocked, setIsPurchaseInfoLocked] = React.useState(false);

  // State for adding a new item to purchase
  const [selectedMed, setSelectedMed] = React.useState<Medication | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = React.useState('');
  const [purchasePrice, setPurchasePrice] = React.useState('');
  const [expirationDate, setExpirationDate] = React.useState('');
  
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

  // Pagination and search for Purchase History
  const [purchaseHistory, setPurchaseHistory] = React.useState<PurchaseOrder[]>([]);
  const [purchaseTotalPages, setPurchaseTotalPages] = React.useState(1);
  const [purchaseCurrentPage, setPurchaseCurrentPage] = React.useState(1);
  const [purchasePerPage, setPurchasePerPage] = React.useState(10);
  const [purchaseLoading, setPurchaseLoading] = React.useState(true);
  const [purchaseSearchTerm, setPurchaseSearchTerm] = React.useState('');
  
  // Pagination and search for Return History
  const [returnHistory, setReturnHistory] = React.useState<ReturnOrder[]>([]);
  const [returnTotalPages, setReturnTotalPages] = React.useState(1);
  const [returnCurrentPage, setReturnCurrentPage] = React.useState(1);
  const [returnPerPage, setReturnPerPage] = React.useState(10);
  const [returnLoading, setReturnLoading] = React.useState(true);
  const [returnSearchTerm, setReturnSearchTerm] = React.useState('');


  // State for modal to add a completely new medication
  const [isAddNewMedModalOpen, setIsAddNewMedModalOpen] = React.useState(false);
  const [newMedData, setNewMedData] = React.useState<Partial<Medication>>({});
  const [newMedImageFile, setNewMedImageFile] = React.useState<File | null>(null);
  const [newMedImagePreview, setNewMedImagePreview] = React.useState<string | null>(null);


  const [supplier_name, setSupplierName] = React.useState("");
  const [supplierContact, setSupplierContact] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("new-purchase");


  const fetchPurchaseHistory = React.useCallback(async (page: number, limit: number, search: string) => {
    setPurchaseLoading(true);
    try {
        const data = await getPaginatedPurchaseOrders(page, limit, search);
        setPurchaseHistory(data.data);
        setPurchaseTotalPages(data.last_page);
        setPurchaseCurrentPage(data.current_page);
    } catch(e) {} finally {
        setPurchaseLoading(false);
    }
  }, [getPaginatedPurchaseOrders]);

  const fetchReturnHistory = React.useCallback(async (page: number, limit: number, search: string) => {
    setReturnLoading(true);
    try {
        const data = await getPaginatedReturnOrders(page, limit, search);
        setReturnHistory(data.data);
        setReturnTotalPages(data.last_page);
        setReturnCurrentPage(data.current_page);
    } catch(e) {} finally {
        setReturnLoading(false);
    }
  }, [getPaginatedReturnOrders]);

  React.useEffect(() => {
    if (activeTab === 'purchase-history') {
        const handler = setTimeout(() => {
            fetchPurchaseHistory(purchaseCurrentPage, purchasePerPage, purchaseSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }
  }, [activeTab, purchaseCurrentPage, purchasePerPage, purchaseSearchTerm, fetchPurchaseHistory]);
  
  React.useEffect(() => {
    if (activeTab === 'return-history') {
        const handler = setTimeout(() => {
            fetchReturnHistory(returnCurrentPage, returnPerPage, returnSearchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }
  }, [activeTab, returnCurrentPage, returnPerPage, returnSearchTerm, fetchReturnHistory]);


  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };
  
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

  const handlePurchaseSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPurchaseItemSearchTerm(value);

    if (value.length > 0) {
        const lowercasedFilter = value.toLowerCase();
        const filtered = (inventory || []).filter(med => 
            med.name.toLowerCase().includes(lowercasedFilter) || 
            String(med.id).includes(lowercasedFilter) ||
            (med.barcodes || []).some(barcode => barcode.toLowerCase().includes(lowercasedFilter)) ||
            (med.scientific_names && med.scientific_names.some(name => name.toLowerCase().includes(lowercasedFilter)))
        );
        setPurchaseItemSuggestions(filtered.slice(0, 5));
    } else {
        setPurchaseItemSuggestions([]);
    }
  };

  const handleSelectMed = (med: Medication) => {
    setSelectedMed(med);
    setPurchaseItemSearchTerm(med.name);
    setPurchasePrice(String(med.purchase_price));
    setPurchaseItemSuggestions([]);
  };

  const handleAddItemToPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!purchase_id || !purchaseSupplierId) {
        toast({ variant: "destructive", title: "حقول ناقصة", description: "الرجاء إدخال رقم قائمة الشراء واختيار المورد." });
        return;
    }
    
    if (!selectedMed) {
      toast({ variant: "destructive", title: "لم يتم اختيار دواء", description: "الرجاء البحث واختيار دواء لإضافته." });
      return;
    }

    if (!purchaseQuantity || !purchasePrice || !expirationDate) {
      toast({ variant: "destructive", title: "حقول ناقصة", description: "الرجاء ملء الكمية وسعر الشراء وتاريخ الانتهاء." });
      return;
    }

    const newItem = {
      ...selectedMed,
      quantity: parseInt(purchaseQuantity),
      purchase_price: parseFloat(purchasePrice),
      expiration_date: expirationDate,
    };
    
    setPurchaseItems(prev => [...prev, newItem]);
    setIsPurchaseInfoLocked(true);
    
    setSelectedMed(null);
    setPurchaseItemSearchTerm("");
    setPurchaseQuantity("");
    setPurchasePrice("");
    setExpirationDate("");
    document.getElementById("purchase-item-search")?.focus();
  };

  const handleRemoveFromPurchase = (medId: string) => {
    setPurchaseItems(prev => prev.filter(item => item.id !== medId));
  }
  
  const handleFinalizePurchase = async () => {
    if (purchaseItems.length === 0) {
        toast({ variant: "destructive", title: "القائمة فارغة", description: "الرجاء إضافة أصناف إلى قائمة الشراء أولاً." });
        return;
    }

    const supplier = suppliers.find(s => s.id === purchaseSupplierId);
    if (!supplier) return;

    const purchaseData = {
        id: purchase_id,
        supplier_id: supplier.id,
        supplier_name: supplier.name,
        date: new Date().toISOString().split('T')[0],
        items: purchaseItems.map(item => ({
            ...item,
            medication_id: item.id
        })),
        status: "Received",
        total_amount: purchaseItems.reduce((sum, item) => sum + (item.quantity * item.purchase_price), 0),
    }

    const success = await addPurchaseOrder(purchaseData);

    if (success) {
        setPurchaseId('');
        setPurchaseSupplierId('');
        setPurchaseItems([]);
        setIsPurchaseInfoLocked(false);
        fetchPurchaseHistory(1, purchasePerPage, ''); // Refresh history
    }
  }


  const handleReturnSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setReturnMedSearchTerm(value);
    if (value.length > 0) {
        const lowercasedFilter = value.toLowerCase();
        const filtered = (inventory || []).filter(med => 
            (med.name.toLowerCase().startsWith(lowercasedFilter) || 
              String(med.id).includes(lowercasedFilter) ||
              (med.barcodes || []).some(barcode => barcode.toLowerCase().includes(lowercasedFilter)) ||
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
      fetchReturnHistory(1, returnPerPage, ''); // Refresh history
    }
  }


  return (
     <Tabs defaultValue="new-purchase" onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto md:h-10">
        <TabsTrigger value="new-purchase">استلام بضاعة</TabsTrigger>
        <TabsTrigger value="purchase-history">سجل المشتريات</TabsTrigger>
        <TabsTrigger value="new-return">إرجاع للمورد</TabsTrigger>
        <TabsTrigger value="return-history">سجل الاسترجاع</TabsTrigger>
      </TabsList>
      <TabsContent value="new-purchase" dir="rtl">
        <Card>
          <CardHeader>
            <CardTitle>إنشاء قائمة شراء جديدة</CardTitle>
            <CardDescription>
              أضف الأدوية المستلمة من المورد لتحديث المخزون.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="purchase_id">رقم قائمة الشراء</Label>
                        <Input id="purchase_id" value={purchase_id} onChange={e => setPurchaseId(e.target.value)} placeholder="مثال: PO-2024-001" required disabled={isPurchaseInfoLocked}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="supplier_id">المورد</Label>
                        <div className="flex gap-2">
                            <Select value={purchaseSupplierId} onValueChange={setPurchaseSupplierId} required disabled={isPurchaseInfoLocked}>
                                <SelectTrigger id="supplier_id"><SelectValue placeholder="اختر موردًا" /></SelectTrigger>
                                <SelectContent>
                                    {(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                                <DialogTrigger asChild>
                                    <Button type="button" size="icon" variant="outline"><PlusCircle /></Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>إضافة مورد جديد</DialogTitle></DialogHeader>
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
                    </div>
                </div>

                <form onSubmit={handleAddItemToPurchase} className="p-4 border rounded-md space-y-4">
                    <div className="relative space-y-2">
                        <Label htmlFor="purchase-item-search">ابحث عن دواء (بالاسم، العلمي أو الباركود)</Label>
                        <Input 
                          id="purchase-item-search"
                          value={purchaseItemSearchTerm} 
                          onChange={handlePurchaseSearch}
                          placeholder="ابحث عن دواء موجود أو أضف جديدًا"
                          autoComplete="off"
                        />
                        {purchaseItemSuggestions.length > 0 && (
                             <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg border">
                                <CardContent className="p-0">
                                    <ul className="divide-y divide-border">
                                        {purchaseItemSuggestions.map(med => (
                                            <li key={med.id} 
                                                onMouseDown={() => handleSelectMed(med)}
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
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="purchase-quantity">الكمية</Label>
                            <Input id="purchase-quantity" type="number" value={purchaseQuantity} onChange={e => setPurchaseQuantity(e.target.value)} required min="1" disabled={!selectedMed}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="purchase-price">سعر الشراء</Label>
                            <Input id="purchase-price" type="number" step="0.01" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} required disabled={!selectedMed}/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expiration-date">تاريخ الانتهاء</Label>
                            <Input id="expiration-date" type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} required disabled={!selectedMed}/>
                        </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={!selectedMed}>إضافة إلى القائمة</Button>
                </form>

                {purchaseItems.length > 0 && (
                    <div>
                        <h3 className="mb-2 text-lg font-semibold">الأصناف في القائمة الحالية:</h3>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>المنتج</TableHead>
                                    <TableHead>الكمية</TableHead>
                                    <TableHead>سعر الشراء</TableHead>
                                    <TableHead>تاريخ الانتهاء</TableHead>
                                    <TableHead>الإجمالي</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {purchaseItems.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell className="font-mono">{item.quantity}</TableCell>
                                        <TableCell className="font-mono">{item.purchase_price.toLocaleString()}</TableCell>
                                        <TableCell className="font-mono">{new Date(item.expiration_date).toLocaleDateString('ar-EG')}</TableCell>
                                        <TableCell className="font-mono">{(item.quantity * item.purchase_price).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveFromPurchase(item.id)}>
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
                إتمام استلام البضاعة
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
                value={purchaseSearchTerm}
                onChange={(e) => setPurchaseSearchTerm(e.target.value)}
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
                    {purchaseLoading ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`skel-purchase-${i}`}>
                            <TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell>
                        </TableRow>
                    )) : purchaseHistory.length > 0 ? purchaseHistory.map(po => (
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
            <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-muted-foreground">
                    صفحة {purchaseCurrentPage} من {purchaseTotalPages}
                </span>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPurchaseCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={purchaseCurrentPage === 1 || purchaseLoading}
                    >
                        السابق
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPurchaseCurrentPage(p => Math.min(p + 1, purchaseTotalPages))}
                        disabled={purchaseCurrentPage === purchaseTotalPages || purchaseLoading}
                    >
                        التالي
                    </Button>
                </div>
            </div>
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
                value={returnSearchTerm}
                onChange={(e) => setReturnSearchTerm(e.target.value)}
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
                    {returnLoading ? Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={`skel-return-${i}`}>
                            <TableCell colSpan={6}><Skeleton className="h-5 w-full" /></TableCell>
                        </TableRow>
                    )) : returnHistory.length > 0 ? returnHistory.map(ret => (
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
            <div className="flex items-center justify-between pt-4">
                <span className="text-sm text-muted-foreground">
                    صفحة {returnCurrentPage} من {returnTotalPages}
                </span>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReturnCurrentPage(p => Math.max(p - 1, 1))}
                        disabled={returnCurrentPage === 1 || returnLoading}
                    >
                        السابق
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReturnCurrentPage(p => Math.min(p + 1, returnTotalPages))}
                        disabled={returnCurrentPage === returnTotalPages || returnLoading}
                    >
                        التالي
                    </Button>
                </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

    