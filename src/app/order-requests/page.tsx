
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { OrderRequestItem, Supplier } from "@/lib/types"
import { Trash2, Send, ShoppingBasket } from "lucide-react"
import { useAuth } from "@/hooks/use-auth";

export default function OrderRequestsPage() {
  const { 
    scopedData, 
    addPurchaseOrder,
    orderRequestCart,
    removeFromOrderRequestCart,
    clearAllOrderRequestCart,
  } = useAuth();
  
  const { suppliers: [suppliers] } = scopedData;
  const { toast } = useToast();

  const [editableOrderItems, setEditableOrderItems] = React.useState<Record<string, any>>({});
  const [masterPurchaseId, setMasterPurchaseId] = React.useState('');
  const [masterSupplierId, setMasterSupplierId] = React.useState('');
  const [masterDate, setMasterDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = React.useState(false);


  React.useEffect(() => {
    // Sync local state with global cart from useAuth
    const newEditableItems: Record<string, any> = {};
    orderRequestCart.forEach(item => {
      newEditableItems[item.id] = editableOrderItems[item.id] || {
        quantity: 1,
        purchase_price: item.purchase_price,
        price: item.price,
        expiration_date: item.expiration_date,
        supplier_id: '',
        invoice_id: '',
        date: new Date().toISOString().split('T')[0],
      };
    });
    setEditableOrderItems(newEditableItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderRequestCart]);


  const handleOrderItemChange = (itemId: string, field: string, value: string | number) => {
    setEditableOrderItems(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId], [field]: value }
    }));
  };
  
  const handleApplyMasterSettings = () => {
    if (!masterSupplierId && !masterPurchaseId && !masterDate) {
      toast({ variant: 'destructive', title: "لا يوجد إعدادات لتطبيقها", description: "الرجاء اختيار مورد أو إدخال رقم قائمة أو تحديد تاريخ." });
      return;
    }

    setEditableOrderItems(prev => {
      const newItems = { ...prev };
      orderRequestCart.forEach(item => {
        if (newItems[item.id]) {
          if (masterSupplierId) newItems[item.id].supplier_id = masterSupplierId;
          if (masterPurchaseId) newItems[item.id].invoice_id = masterPurchaseId;
          if (masterDate) newItems[item.id].date = masterDate;
        }
      });
      return newItems;
    });
    toast({ title: "تم تطبيق الإعدادات على جميع الأصناف" });
  };
  
 const handleProcessOrders = async () => {
    setIsProcessing(true);
    // 1. Validation
    for (const item of orderRequestCart) {
        const editableData = editableOrderItems[item.id];
        if (!editableData || !editableData.quantity || editableData.quantity <= 0 || !editableData.expiration_date || !editableData.supplier_id || !editableData.invoice_id || !editableData.date) {
            toast({ variant: 'destructive', title: "بيانات ناقصة", description: `الرجاء تعبئة جميع الحقول للدواء: ${item.name}` });
            setIsProcessing(false);
            return;
        }
    }

    // 2. Group by supplier and then by invoice_id
    const ordersBySupplierAndInvoice: Record<string, Record<string, any[]>> = {};
    orderRequestCart.forEach(item => {
        const editableData = editableOrderItems[item.id];
        const { supplier_id, invoice_id } = editableData;

        if (!ordersBySupplierAndInvoice[supplier_id]) {
            ordersBySupplierAndInvoice[supplier_id] = {};
        }
        if (!ordersBySupplierAndInvoice[supplier_id][invoice_id]) {
            ordersBySupplierAndInvoice[supplier_id][invoice_id] = [];
        }
        ordersBySupplierAndInvoice[supplier_id][invoice_id].push({
            ...item, // Original medication data
            ...editableData, // Overridden/new data
            medication_id: item.id
        });
    });

    const purchasePromises: Promise<boolean>[] = [];

    for (const supplierId in ordersBySupplierAndInvoice) {
        const supplier = suppliers.find(s => s.id === supplierId);
        if (!supplier) {
            toast({variant: 'destructive', title: "خطأ", description: `لم يتم العثور على المورد صاحب المعرف ${supplierId}`});
            continue;
        }

        for (const invoiceId in ordersBySupplierAndInvoice[supplierId]) {
            const items = ordersBySupplierAndInvoice[supplierId][invoiceId];
            const firstItemDate = items[0]?.date || new Date().toISOString().split('T')[0];
            
            const purchaseData = {
                id: invoiceId,
                supplier_id: supplier.id,
                supplier_name: supplier.name,
                date: firstItemDate,
                items: items, // Pass the whole item object
                status: "Received",
                total_amount: items.reduce((sum, item) => sum + (item.quantity * item.purchase_price), 0),
            };
            purchasePromises.push(addPurchaseOrder(purchaseData));
        }
    }

    try {
        const results = await Promise.all(purchasePromises);
        if (results.every(res => res === true)) {
            toast({ title: "تم ترحيل الطلبات بنجاح", description: `تم إنشاء ${results.length} قائمة شراء جديدة.` });
            clearAllOrderRequestCart();
            setEditableOrderItems({});
            setMasterPurchaseId('');
        } else {
            toast({ variant: "destructive", title: "خطأ", description: "فشلت معالجة بعض الطلبات. الرجاء المحاولة مرة أخرى." });
        }
    } catch (error) {
        console.error("Error processing orders:", error);
        toast({ variant: "destructive", title: "خطأ فادح", description: "حدث خطأ أثناء معالجة الطلبات." });
    } finally {
        setIsProcessing(false);
    }
};

  return (
    <Card>
      <CardHeader>
        <CardTitle>طلبات الأدوية</CardTitle>
        <CardDescription>
          هنا تظهر الأدوية التي طلبتها من المخزون. قم بتعبئة بياناتها ثم اضغط على "ترحيل إلى المشتريات" لحفظها.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {orderRequestCart.length > 0 ? (
          <div className="space-y-4">
            <div className="p-4 border rounded-md bg-muted/50 space-y-4">
                <h3 className="font-semibold">إعدادات الإدخال السريع</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="master-purchase-id">رقم قائمة موحد</Label>
                        <Input id="master-purchase-id" value={masterPurchaseId} onChange={e => setMasterPurchaseId(e.target.value)} placeholder="مثال: PO-JUL24" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="master-supplier-id">تحديد مورد للكل</Label>
                        <Select value={masterSupplierId} onValueChange={setMasterSupplierId}>
                            <SelectTrigger id="master-supplier-id"><SelectValue placeholder="اختر موردًا..." /></SelectTrigger>
                            <SelectContent>{(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="master-date">تاريخ قائمة موحد</Label>
                        <Input id="master-date" type="date" value={masterDate} onChange={e => setMasterDate(e.target.value)} />
                    </div>
                    <Button onClick={handleApplyMasterSettings}>تطبيق على الكل</Button>
                </div>
            </div>
             <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2"><ShoppingBasket /> قائمة الطلبات ({orderRequestCart.length})</h3>
              <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="min-w-[250px]">الدواء</TableHead>
                        <TableHead>الكمية المستلمة</TableHead>
                        <TableHead>سعر الشراء</TableHead>
                        <TableHead>سعر البيع</TableHead>
                        <TableHead>تاريخ الانتهاء</TableHead>
                        <TableHead className="min-w-[180px]">المورد</TableHead>
                        <TableHead className="min-w-[150px]">رقم القائمة</TableHead>
                        <TableHead className="min-w-[150px]">تاريخ القائمة</TableHead>
                        <TableHead>حذف</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {orderRequestCart.map(item => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-muted-foreground">{item.scientific_names?.join(', ')}</div>
                                <div className="text-xs text-muted-foreground">الرصيد الحالي: <span className="font-mono">{item.stock}</span></div>
                            </TableCell>
                            <TableCell>
                                <Input 
                                  type="number"
                                  value={editableOrderItems[item.id]?.quantity || ''}
                                  onChange={e => handleOrderItemChange(item.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                                  className="w-20 h-9"
                                  placeholder="الكمية"
                                />
                            </TableCell>
                            <TableCell>
                                <Input 
                                  type="number"
                                  value={editableOrderItems[item.id]?.purchase_price || ''}
                                  onChange={e => handleOrderItemChange(item.id, 'purchase_price', parseFloat(e.target.value) || 0)}
                                  className="w-24 h-9"
                                  placeholder="سعر الشراء"
                                />
                            </TableCell>
                             <TableCell>
                                <Input 
                                  type="number"
                                  value={editableOrderItems[item.id]?.price || ''}
                                  onChange={e => handleOrderItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-24 h-9"
                                  placeholder="سعر البيع"
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
                                <Input 
                                  value={editableOrderItems[item.id]?.invoice_id || ''}
                                  onChange={e => handleOrderItemChange(item.id, 'invoice_id', e.target.value)}
                                  className="w-32 h-9"
                                  placeholder="رقم القائمة"
                                />
                            </TableCell>
                             <TableCell>
                                <Input 
                                  type="date"
                                  value={editableOrderItems[item.id]?.date || ''}
                                  onChange={e => handleOrderItemChange(item.id, 'date', e.target.value)}
                                  className="h-9"
                                />
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
          <Button onClick={handleProcessOrders} size="lg" className="w-full" variant="success" disabled={isProcessing}>
            <Send className="me-2 h-4 w-4" />
            {isProcessing ? "جاري المعالجة..." : "ترحيل الطلبات إلى المشتريات"}
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
  )
}
