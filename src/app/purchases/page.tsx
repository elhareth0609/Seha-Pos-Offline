
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { useLocalStorage } from "@/hooks/use-local-storage"
import { 
    purchaseOrders as fallbackPurchaseOrders, 
    inventory as fallbackInventory, 
    suppliers as fallbackSuppliers, 
    supplierReturns as fallbackSupplierReturns 
} from "@/lib/data"
import type { PurchaseOrder, Medication, Supplier, ReturnOrder, PurchaseOrderItem, ReturnOrderItem } from "@/lib/types"
import { PlusCircle, ChevronDown } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export default function PurchasesPage() {
  const { toast } = useToast()

  const [inventory, setInventory] = useLocalStorage<Medication[]>('inventory', fallbackInventory);
  const [suppliers, setSuppliers] = useLocalStorage<Supplier[]>('suppliers', fallbackSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', fallbackPurchaseOrders);
  const [supplierReturns, setSupplierReturns] = useLocalStorage<ReturnOrder[]>('supplierReturns', fallbackSupplierReturns);

  const [isAddSupplierOpen, setIsAddSupplierOpen] = React.useState(false);
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

  // State for purchase form
  const [purchaseId, setPurchaseId] = React.useState('');
  const [purchaseSupplierId, setPurchaseSupplierId] = React.useState('');
  const [purchaseMedicationId, setPurchaseMedicationId] = React.useState('');
  const [purchaseMedicationName, setPurchaseMedicationName] = React.useState('');
  const [purchaseSaleUnit, setPurchaseSaleUnit] = React.useState('علبة');
  const [purchaseQuantity, setPurchaseQuantity] = React.useState('');
  const [purchaseExpirationDate, setPurchaseExpirationDate] = React.useState('');
  const [purchasePurchasePrice, setPurchasePurchasePrice] = React.useState('');
  const [purchaseSellingPrice, setPurchaseSellingPrice] = React.useState('');

  // State for return form
  const [returnSlipId, setReturnSlipId] = React.useState('');
  const [returnSupplierId, setReturnSupplierId] = React.useState('');
  const [returnMedicationId, setReturnMedicationId] = React.useState('');
  const [returnQuantity, setReturnQuantity] = React.useState('');
  const [returnReason, setReturnReason] = React.useState('');
  const [returnPurchaseId, setReturnPurchaseId] = React.useState('');

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
      const filtered = purchaseOrders.filter(po => 
        po.id.toLowerCase().includes(term) ||
        po.supplierName.toLowerCase().includes(term) ||
        po.date.includes(term) ||
        po.items.some(item => item.name.toLowerCase().includes(term))
      );
      setFilteredPurchaseOrders(filtered);
    }
  }, [purchaseHistorySearchTerm, purchaseOrders]);

  React.useEffect(() => {
    const term = returnHistorySearchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredSupplierReturns(supplierReturns);
    } else {
      const filtered = supplierReturns.filter(ret => 
        ret.id.toLowerCase().includes(term) ||
        ret.supplierName.toLowerCase().includes(term) ||
        ret.date.includes(term) ||
        ret.items.some(item => item.name.toLowerCase().includes(term))
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


  const handleAddPurchase = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    
    const supplierId = purchaseSupplierId;
    let medicationId = purchaseMedicationId.trim();
    const medicationName = purchaseMedicationName.trim();
    const saleUnit = purchaseSaleUnit;
    const quantity = parseInt(purchaseQuantity, 10);
    const expirationDate = purchaseExpirationDate;
    const purchasePrice = parseFloat(purchasePurchasePrice);
    const sellingPrice = parseFloat(purchaseSellingPrice);
    
    const supplier = suppliers.find(s => s.id === supplierId);
    const itemTotal = purchasePrice * quantity;

    if (!purchaseId || !supplier || !medicationName || !quantity || !expirationDate || isNaN(purchasePrice) || isNaN(sellingPrice)) {
        toast({
            variant: "destructive",
            title: "حقول ناقصة",
            description: "الرجاء ملء جميع الحقول بشكل صحيح.",
        });
        return;
    }
    
    const isNewGenerated = !medicationId;
    if (isNewGenerated) {
        medicationId = Date.now().toString(); // Generate a unique ID
    }
    
    let newInventory = [...inventory];
    let medicationIndex = newInventory.findIndex(m => m.id === medicationId);

    if (medicationIndex !== -1) {
      // Medication exists, update it
      const existingMed = newInventory[medicationIndex];
      existingMed.stock += quantity;
      existingMed.price = sellingPrice;
      existingMed.purchasePrice = purchasePrice;
      existingMed.expirationDate = expirationDate;
      existingMed.supplierId = supplier.id;
      existingMed.supplierName = supplier.name;
      existingMed.name = medicationName;
      existingMed.saleUnit = saleUnit;
      newInventory[medicationIndex] = existingMed;
      toast({
          title: "تم تحديث الرصيد",
          description: `تمت إضافة ${quantity} إلى رصيد ${medicationName}. الرصيد الجديد: ${existingMed.stock}`,
        });

    } else {
      // New medication, add it
      const newMedication: Medication = {
          id: medicationId,
          name: medicationName,
          stock: quantity,
          reorderPoint: 20, // default
          category: "Uncategorized", // default
          supplierId: supplier.id,
          supplierName: supplier.name,
          price: sellingPrice,
          purchasePrice: purchasePrice,
          expirationDate: expirationDate,
          saleUnit: saleUnit,
      };
      newInventory.unshift(newMedication);
      toast({
          title: "تم استلام البضاعة",
          description: `تمت إضافة ${quantity} من ${medicationName} إلى المخزون.`,
        });
    }

    setInventory(newInventory);
    
    let newPurchaseOrders = [...purchaseOrders];
    let purchaseOrderIndex = newPurchaseOrders.findIndex(po => po.id === purchaseId);
    
    const newPurchaseItem: PurchaseOrderItem = {
        medicationId: medicationId,
        name: medicationName,
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
    
    // Reset only item-specific fields
    setPurchaseMedicationId('');
    setPurchaseMedicationName('');
    setPurchaseSaleUnit('علبة');
    setPurchaseQuantity('');
    setPurchaseExpirationDate('');
    setPurchasePurchasePrice('');
    setPurchaseSellingPrice('');
    
    // Focus the barcode input for next entry
    const barcodeInput = form.querySelector<HTMLInputElement>('#medicationId');
    barcodeInput?.focus();
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
        id: `SUP${(suppliers.length + 1).toString().padStart(3, '0')}`,
        name,
        contactPerson: contact,
    };
    const newSuppliers = [newSupplier, ...suppliers];
    setSuppliers(newSuppliers);

    setIsAddSupplierOpen(false);
    toast({ title: "تمت إضافة المورد بنجاح" });
    (event.target as HTMLFormElement).reset();
  };

  const handleReturnToSupplier = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      
      const supplierId = returnSupplierId;
      const medicationId = returnMedicationId;
      const quantity = parseInt(returnQuantity, 10);
      const reason = returnReason;

      const medicationIndex = inventory.findIndex(m => m.id === medicationId);
      const supplier = suppliers.find(s => s.id === supplierId);

      if (!returnSlipId || !supplier || !medicationId || !quantity || !reason) {
          toast({ variant: "destructive", title: "حقول ناقصة", description: "الرجاء ملء جميع الحقول المطلوبة." });
          return;
      }
      
      const medication = inventory[medicationIndex];

      if(medication.stock < quantity) {
          toast({ variant: "destructive", title: "كمية غير كافية", description: `الرصيد المتوفر من ${medication.name} هو ${medication.stock} فقط.`});
          return;
      }
      
      const returnTotalAmount = quantity * medication.purchasePrice;
      
      const newInventory = [...inventory];
      newInventory[medicationIndex] = { ...medication, stock: medication.stock - quantity };
      setInventory(newInventory);

      let newReturnOrders = [...supplierReturns];
      let returnOrderIndex = newReturnOrders.findIndex(ro => ro.id === returnSlipId);

      const newReturnItem: ReturnOrderItem = {
          medicationId: medicationId,
          name: medication.name,
          quantity: quantity,
          purchasePrice: medication.purchasePrice,
          reason: reason
      };
      
      if (returnOrderIndex > -1) {
          newReturnOrders[returnOrderIndex].items.push(newReturnItem);
          newReturnOrders[returnOrderIndex].totalAmount += returnTotalAmount;
      } else {
          const newReturnOrder: ReturnOrder = {
              id: returnSlipId,
              supplierId: supplier.id,
              supplierName: supplier.name,
              date: new Date().toISOString().split("T")[0],
              items: [newReturnItem],
              totalAmount: returnTotalAmount,
              purchaseId: returnPurchaseId || undefined
          };
          newReturnOrders.unshift(newReturnOrder);
      }
      setSupplierReturns(newReturnOrders);

      toast({ title: "تم تسجيل الاسترجاع", description: `تم إرجاع ${quantity} من ${medication.name} للمورد.`});
      
      // Reset only item-specific fields
      setReturnMedicationId('');
      setReturnQuantity('');
      setReturnReason('');

      // Focus the medication select for next entry
      const medSelect = form.querySelector<HTMLButtonElement>('#return-medicationId');
      medSelect?.focus();
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
            <form className="space-y-4" onSubmit={handleAddPurchase}>
                <div className="space-y-2">
                    <Label htmlFor="purchaseId">رقم قائمة الشراء</Label>
                    <Input id="purchaseId" name="purchaseId" type="text" placeholder="مثال: INV-2024-001" required value={purchaseId} onChange={e => setPurchaseId(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="supplierId">المورد</Label>
                        <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                            <DialogTrigger asChild>
                                <Button variant="link" size="sm" className="p-0 h-auto"><PlusCircle className="me-1 h-3 w-3"/> إضافة مورد</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>إضافة مورد جديد</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddSupplier} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="supplierName">اسم المورد</Label>
                                        <Input id="supplierName" name="supplierName" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="supplierContact">الشخص المسؤول (اختياري)</Label>
                                        <Input id="supplierContact" name="supplierContact" />
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                        <Button type="submit">إضافة</Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Select name="supplierId" required value={purchaseSupplierId} onValueChange={setPurchaseSupplierId}>
                        <SelectTrigger id="supplierId"><SelectValue placeholder="اختر موردًا" /></SelectTrigger>
                        <SelectContent>
                            {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="medicationId">الباركود (المعرف) - يترك فارغاً للتوليد التلقائي</Label>
                    <Input id="medicationId" name="medicationId" type="text" placeholder="امسح الباركود أو أدخله يدويًا" value={purchaseMedicationId} onChange={(e) => setPurchaseMedicationId(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="medicationName">اسم الدواء</Label>
                        <Input id="medicationName" name="medicationName" type="text" placeholder="مثال: Paracetamol 500mg" required value={purchaseMedicationName} onChange={(e) => setPurchaseMedicationName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="saleUnit">وحدة البيع</Label>
                        <Select name="saleUnit" required value={purchaseSaleUnit} onValueChange={setPurchaseSaleUnit}>
                            <SelectTrigger id="saleUnit"><SelectValue placeholder="اختر وحدة" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="علبة">علبة</SelectItem>
                                <SelectItem value="شريط">شريط</SelectItem>
                                <SelectItem value="قطعة">قطعة</SelectItem>
                                <SelectItem value="قنينة">قنينة</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">الكمية</Label>
                        <Input id="quantity" name="quantity" type="number" placeholder="0" required min="1" value={purchaseQuantity} onChange={(e) => setPurchaseQuantity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="expirationDate">تاريخ الانتهاء</Label>
                        <Input id="expirationDate" name="expirationDate" type="date" required value={purchaseExpirationDate} onChange={(e) => setPurchaseExpirationDate(e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="purchasePrice">سعر الشراء</Label>
                        <Input id="purchasePrice" name="purchasePrice" type="number" placeholder="0" required step="1" value={purchasePurchasePrice} onChange={(e) => setPurchasePurchasePrice(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="sellingPrice">سعر البيع</Label>
                        <Input id="sellingPrice" name="sellingPrice" type="number" placeholder="0" required step="1" value={purchaseSellingPrice} onChange={(e) => setPurchaseSellingPrice(e.target.value)} />
                    </div>
                </div>
              <Button type="submit" className="w-full">إضافة للمخزون</Button>
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
                        <TableHead>الحالة</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredPurchaseOrders.length > 0 ? filteredPurchaseOrders.map(po => (
                        <React.Fragment key={po.id}>
                            <TableRow onClick={() => toggleRow(po.id)} className="cursor-pointer">
                                <TableCell>{po.id}</TableCell>
                                <TableCell>{po.supplierName}</TableCell>
                                <TableCell>{new Date(po.date).toLocaleDateString('ar-EG')}</TableCell>
                                <TableCell className="font-mono">{po.totalAmount.toLocaleString('ar-IQ')} د.ع</TableCell>
                                <TableCell>{po.status}</TableCell>
                                <TableCell>
                                    <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", expandedRows.has(po.id) && "rotate-180")} />
                                </TableCell>
                            </TableRow>
                            {expandedRows.has(po.id) && (
                                <TableRow>
                                    <TableCell colSpan={6} className="p-0">
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
                                                    {po.items.map((item, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{item.name}</TableCell>
                                                            <TableCell>{item.quantity}</TableCell>
                                                            <TableCell className="font-mono">{item.purchasePrice.toLocaleString('ar-IQ')} د.ع</TableCell>
                                                            <TableCell className="font-mono text-left">{(item.quantity * item.purchasePrice).toLocaleString('ar-IQ')} د.ع</TableCell>
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
       <TabsContent value="new-return">
         <Card>
            <CardHeader>
                <CardTitle>إرجاع بضاعة للمورد</CardTitle>
                <CardDescription>
                استخدم هذا النموذج لإرجاع الأدوية (مثلاً التالفة أو قريبة الانتهاء) إلى المورد.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleReturnToSupplier}>
                    <div className="space-y-2">
                        <Label htmlFor="returnSlipId">رقم قائمة الاسترجاع</Label>
                        <Input id="returnSlipId" name="returnSlipId" type="text" placeholder="مثال: RET-2024-001" required value={returnSlipId} onChange={e => setReturnSlipId(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="return-supplierId">المورد</Label>
                        <Select name="supplierId" required value={returnSupplierId} onValueChange={setReturnSupplierId}>
                            <SelectTrigger id="return-supplierId"><SelectValue placeholder="اختر موردًا" /></SelectTrigger>
                            <SelectContent>
                                {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="return-medicationId">الدواء المُراد إرجاعه</Label>
                        <Select name="medicationId" required value={returnMedicationId} onValueChange={setReturnMedicationId}>
                            <SelectTrigger id="return-medicationId"><SelectValue placeholder="اختر دواء" /></SelectTrigger>
                            <SelectContent>
                                {inventory.map(m => <SelectItem key={m.id} value={m.id}>{m.name} (سعر الشراء: {m.purchasePrice.toLocaleString('ar-IQ')} د.ع)</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="return-purchaseId">رقم قائمة الشراء الأصلية (اختياري)</Label>
                        <Input id="return-purchaseId" name="purchaseId" type="text" placeholder="مثال: INV-2024-001" value={returnPurchaseId} onChange={e => setReturnPurchaseId(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="return-quantity">الكمية المرتجعة</Label>
                        <Input id="return-quantity" name="quantity" type="number" placeholder="0" required min="1" value={returnQuantity} onChange={e => setReturnQuantity(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="reason">سبب الإرجاع</Label>
                        <Textarea id="reason" name="reason" placeholder="مثال: تالف، قريب الانتهاء" required value={returnReason} onChange={e => setReturnReason(e.target.value)} />
                    </div>
                    <Button type="submit" variant="destructive" className="w-full">تسجيل الاسترجاع وخصم من المخزون</Button>
                </form>
            </CardContent>
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
                                <TableCell>{ret.id}</TableCell>
                                <TableCell>{ret.supplierName}</TableCell>
                                <TableCell>{new Date(ret.date).toLocaleDateString('ar-EG')}</TableCell>
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
                                                    {ret.items.map((item, index) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{item.name}</TableCell>
                                                            <TableCell>{item.quantity}</TableCell>
                                                            <TableCell className="font-mono">{item.purchasePrice.toLocaleString('ar-IQ')} د.ع</TableCell>
                                                            <TableCell>{item.reason}</TableCell>
                                                            <TableCell className="font-mono text-left">{(item.quantity * item.purchasePrice).toLocaleString('ar-IQ')} د.ع</TableCell>
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
