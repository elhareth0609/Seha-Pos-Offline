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
import type { PurchaseOrder, Medication, Supplier, ReturnOrder, PurchaseOrderItem, ReturnOrderItem, PaginatedResponse, OrderRequestItem } from "@/lib/types"
import { PlusCircle, ChevronDown, Trash2, X, Pencil, ShoppingBasket, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"


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
      orderRequestCart,
      removeFromOrderRequestCart,
      clearAllOrderRequestCart,
    } = useAuth();
  
  const {
      inventory: [inventory],
      suppliers: [suppliers],
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


  const [supplier_name, setSupplierName] = React.useState("");
  const [supplierContact, setSupplierContact] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("new-purchase");
  
  const [editableOrderItems, setEditableOrderItems] = React.useState<Record<string, any>>({});
  const [masterPurchaseId, setMasterPurchaseId] = React.useState('');
  const [masterSupplierId, setMasterSupplierId] = React.useState('');

  React.useEffect(() => {
    // Sync local state with global cart from useAuth
    const newEditableItems: Record<string, any> = {};
    orderRequestCart.forEach(item => {
      newEditableItems[item.id] = editableOrderItems[item.id] || {
        quantity: 1,
        purchase_price: item.purchase_price,
        expiration_date: '',
        supplier_id: '',
      };
    });
    setEditableOrderItems(newEditableItems);
  }, [orderRequestCart]);


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
  
  const handleOrderItemChange = (itemId: string, field: string, value: string | number) => {
    setEditableOrderItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };
  
  const handleApplyMasterSettings = () => {
    if (!masterSupplierId && !masterPurchaseId) {
      toast({ variant: 'destructive', title: "لا يوجد إعدادات لتطبيقها", description: "الرجاء اختيار مورد أو إدخال رقم قائمة." });
      return;
    }

    setEditableOrderItems(prev => {
      const newItems = { ...prev };
      orderRequestCart.forEach(item => {
        if (newItems[item.id]) {
          if (masterSupplierId) {
            newItems[item.id].supplier_id = masterSupplierId;
          }
        }
      });
      return newItems;
    });
    toast({ title: "تم تطبيق الإعدادات على جميع الأصناف" });
  };
  
  const handleProcessOrders = async () => {
    // 1. Validation
    for (const item of orderRequestCart) {
        const editableData = editableOrderItems[item.id];
        if (!editableData || !editableData.quantity || editableData.quantity <= 0 || !editableData.expiration_date || !editableData.supplier_id) {
            toast({ variant: 'destructive', title: "بيانات ناقصة", description: `الرجاء تعبئة جميع الحقول للدواء: ${item.name}` });
            return;
        }
    }

    // 2. Group by supplier
    const ordersBySupplier: Record<string, any[]> = {};
    orderRequestCart.forEach(item => {
        const editableData = editableOrderItems[item.id];
        const supplierId = editableData.supplier_id;
        if (!ordersBySupplier[supplierId]) {
            ordersBySupplier[supplierId] = [];
        }
        ordersBySupplier[supplierId].push({
            ...item, // Original medication data
            ...editableData // Overridden/new data
        });
    });

    // 3. Create and submit purchase orders
    const purchasePromises = Object.entries(ordersBySupplier).map(([supplierId, items]) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) return Promise.reject(`Supplier with id ${supplierId} not found`);

        const purchaseData = {
            id: `${masterPurchaseId}-${supplier.name.substring(0,3).toUpperCase()}` || `${Date.now()}-${supplier.id}`,
            supplier_id: supplier.id,
            supplier_name: supplier.name,
            date: new Date().toISOString().split('T')[0],
            items: items.map(item => ({
                barcodes: item.barcodes,
                name: item.name,
                quantity: item.quantity,
                purchase_price: item.purchase_price,
                expiration_date: item.expiration_date,
                scientific_names: item.scientific_names,
                image_url: item.image_url,
                price: item.price,
                dosage: item.dosage,
                dosage_form: item.dosage_form,
                reorder_point: item.reorder_point,
            })),
        };
        return addPurchaseOrder(purchaseData);
    });

    try {
        const results = await Promise.all(purchasePromises);
        if (results.every(res => res === true)) {
            toast({ title: "تمت معالجة الطلبات بنجاح", description: `تم إنشاء ${results.length} قائمة شراء جديدة.` });
            clearAllOrderRequestCart();
            setEditableOrderItems({});
            setMasterPurchaseId('');
            fetchPurchaseHistory(1, purchasePerPage, ''); // Refresh history
        } else {
            toast({ variant: "destructive", title: "خطأ", description: "فشلت معالجة بعض الطلبات. الرجاء المحاولة مرة أخرى." });
        }
    } catch (error) {
        console.error("Error processing orders:", error);
        toast({ variant: "destructive", title: "خطأ فادح", description: "حدث خطأ أثناء معالجة الطلبات." });
    }
  };


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
            <CardTitle>استلام بضاعة جديدة</CardTitle>
            <CardDescription>
              هنا تظهر الأدوية التي طلبتها من المخزون. قم بتعبئة بياناتها ثم اضغط على "إتمام ومعالجة الطلبات" لحفظها.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
                {orderRequestCart.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                        <h3 className="font-semibold">إعدادات الإدخال السريع</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="space-y-2">
                                <Label htmlFor="master-purchase-id">رقم قائمة موحد (اختياري)</Label>
                                <Input id="master-purchase-id" value={masterPurchaseId} onChange={e => setMasterPurchaseId(e.target.value)} placeholder="مثال: PO-JUL24" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="master-supplier-id">تحديد مورد للكل</Label>
                                <Select value={masterSupplierId} onValueChange={setMasterSupplierId}>
                                    <SelectTrigger id="master-supplier-id"><SelectValue placeholder="اختر موردًا..." /></SelectTrigger>
                                    <SelectContent>{(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <Button onClick={handleApplyMasterSettings}>تطبيق على الكل</Button>
                        </div>
                    </div>
                     <div className="space-y-3">
                      <h3 className="text-lg font-semibold flex items-center gap-2"><ShoppingBasket /> قائمة الطلبات ({orderRequestCart.length})</h3>
                      <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[25%]">الدواء</TableHead>
                                <TableHead>المخزون</TableHead>
                                <TableHead>سعر الشراء</TableHead>
                                <TableHead>الكمية المستلمة</TableHead>
                                <TableHead>تاريخ الانتهاء</TableHead>
                                <TableHead className="w-[20%]">المورد</TableHead>
                                <TableHead>حذف</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderRequestCart.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-muted-foreground">{item.scientific_names?.join(', ')}</div>
                                        <div className="text-xs text-muted-foreground">سعر البيع: <span className="font-mono">{item.price.toLocaleString()}</span></div>
                                    </TableCell>
                                    <TableCell className="font-mono">{item.stock}</TableCell>
                                    <TableCell>
                                        <Input 
                                          type="number"
                                          value={editableOrderItems[item.id]?.purchase_price || ''}
                                          onChange={e => handleOrderItemChange(item.id, 'purchase_price', parseFloat(e.target.value))}
                                          className="w-24 h-9"
                                          placeholder="سعر الشراء"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                          type="number"
                                          value={editableOrderItems[item.id]?.quantity || ''}
                                          onChange={e => handleOrderItemChange(item.id, 'quantity', parseInt(e.target.value, 10))}
                                          className="w-20 h-9"
                                          placeholder="الكمية"
                                        />
                                    </TableCell>
                                    <TableCell>
                                         <Input 
                                          type="date"
                                          value={editableOrderItems[item.id]?.expiration_date || ''}
                                          onChange={e => handleOrderItemChange(item.id, 'expiration_date', e.target.value)}
                                          className="h-9"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select 
                                            value={editableOrderItems[item.id]?.supplier_id || ''}
                                            onValueChange={value => handleOrderItemChange(item.id, 'supplier_id', value)}
                                        >
                                            <SelectTrigger className="h-9"><SelectValue placeholder="اختر مورد" /></SelectTrigger>
                                            <SelectContent>{(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeFromOrderRequestCart(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                      </div>
                  </div>
                  <Button onClick={handleProcessOrders} size="lg" className="w-full" variant="success">
                    <Send className="me-2 h-4 w-4" />
                    إتمام ومعالجة الطلبات
                  </Button>
                </div>
                ) : (
                    <div className="text-center py-16 text-muted-foreground">
                        <ShoppingBasket className="h-16 w-16 mx-auto mb-4" />
                        <p>قائمة الطلبات فارغة.</p>
                        <p className="text-sm">اذهب إلى المخزون واضغط على زر "طلب" لإضافة الأدوية هنا.</p>
                    </div>
                )}
          </CardContent>
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
