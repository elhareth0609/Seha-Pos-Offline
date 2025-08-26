
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
import type { OrderRequestItem, Supplier, PurchaseOrderItem } from "@/lib/types"
import { Trash2, Send, ShoppingBasket, ArrowLeft } from "lucide-react"
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation"

export default function OrderRequestsPage() {
  const { 
    scopedData, 
    orderRequestCart,
    removeFromOrderRequestCart,
    updateOrderRequestItem,
    addPurchaseOrder,
  } = useAuth();
  
  const { suppliers: [suppliers] } = scopedData;
  const { toast } = useToast();
  const router = useRouter();

  const [editableOrderItems, setEditableOrderItems] = React.useState<Record<string, any>>({});
  const [masterPurchaseId, setMasterPurchaseId] = React.useState('');
  const [masterSupplierId, setMasterSupplierId] = React.useState('');
  const [masterDate, setMasterDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = React.useState(false);


  React.useEffect(() => {
    setEditableOrderItems(prevEditable => {
        const newEditableItems: Record<string, any> = {};
        orderRequestCart.forEach(item => {
            const key = item.id; 
            newEditableItems[key] = prevEditable[key] || {
                quantity: item.quantity || 1,
                purchase_price: item.purchase_price,
                price: item.price,
                expiration_date: item.expiration_date ? new Date(item.expiration_date).toISOString().split('T')[0] : '',
                supplier_id: item.supplier_id || '',
                invoice_id: item.invoice_id || '',
                date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            };
        });
        return newEditableItems;
    });
  }, [orderRequestCart]);


  const handleOrderItemChange = (orderItemId: string, field: string, value: string | number) => {
    setEditableOrderItems(prev => {
        const updatedItem = { ...prev[orderItemId], [field]: value };
        return { ...prev, [orderItemId]: updatedItem };
    });
  };

  const handleBlur = (orderItemId: string, field: string) => {
    const itemData = editableOrderItems[orderItemId];
    if(itemData){
      updateOrderRequestItem(orderItemId, { [field]: itemData[field] });
    }
  };
  
  const handleApplyMasterSettings = () => {
    if (!masterSupplierId && !masterPurchaseId && !masterDate) {
      toast({ variant: 'destructive', title: "لا يوجد إعدادات لتطبيقها", description: "الرجاء اختيار مورد أو إدخال رقم قائمة أو تحديد تاريخ." });
      return;
    }

    const updatedItems: Promise<any>[] = [];
    const newEditableItems = { ...editableOrderItems };

    orderRequestCart.forEach(item => {
      const key = item.id;
      if (newEditableItems[key]) {
        const payload: Partial<OrderRequestItem> = {};
        if (masterSupplierId) {
            newEditableItems[key].supplier_id = masterSupplierId;
            payload.supplier_id = masterSupplierId;
        }
        if (masterPurchaseId) {
            newEditableItems[key].invoice_id = masterPurchaseId;
            payload.invoice_id = masterPurchaseId;
        }
        if (masterDate) {
            newEditableItems[key].date = masterDate;
            payload.date = masterDate;
        }
        if(Object.keys(payload).length > 0) {
            updatedItems.push(updateOrderRequestItem(item.id, payload));
        }
      }
    });

    setEditableOrderItems(newEditableItems);
    Promise.all(updatedItems).then(() => {
        toast({ title: "تم تطبيق الإعدادات على جميع الأصناف" });
    });
  };
  
 const handlePreparePurchaseOrder = async () => {
    setIsProcessing(true);
    
    for (const item of orderRequestCart) {
        const editableData = editableOrderItems[item.id];
        if (!editableData || !editableData.quantity || editableData.quantity <= 0 || !editableData.expiration_date || !editableData.supplier_id || !editableData.invoice_id) {
            toast({ variant: 'destructive', title: "بيانات ناقصة", description: `الرجاء تعبئة جميع الحقول المطلوبة للدواء: ${item.name}` });
            setIsProcessing(false);
            return;
        }
    }

    const drafts: Record<string, { supplier_id: string; supplier_name: string; id: string; date: string, items: PurchaseOrderItem[] }> = {};

    orderRequestCart.forEach(item => {
        const editableData = editableOrderItems[item.id];
        const { supplier_id, invoice_id, date } = editableData;
        const key = `${supplier_id}-${invoice_id}`;

        if (!drafts[key]) {
            const supplier = suppliers.find(s => s.id === supplier_id);
            drafts[key] = {
                id: invoice_id,
                supplier_id: supplier_id,
                supplier_name: supplier?.name || 'مورد غير معروف',
                date: date,
                items: [],
            };
        }
        
        drafts[key].items.push({
            id: item.medication_id,
            medication_id: item.medication_id,
            name: item.name,
            quantity: editableData.quantity,
            purchase_price: editableData.purchase_price,
            price: editableData.price,
            expiration_date: editableData.expiration_date,
            scientific_names: item.scientific_names,
            dosage: item.dosage,
            dosage_form: item.dosage_form,
            barcodes: item.barcodes,
            reorder_point: item.reorder_point,
            image_url: item.image_url,
        });
    });

    const purchasePromises = Object.values(drafts).map(draft => {
        const total_amount = draft.items.reduce((sum, item) => sum + (item.quantity * item.purchase_price), 0);
        return addPurchaseOrder({ ...draft, total_amount, status: 'Received' });
    });

    try {
        const results = await Promise.all(purchasePromises);
        if (results.every(res => res)) {
            const deletePromises = orderRequestCart.map(item => removeFromOrderRequestCart(item.id, true));
            await Promise.all(deletePromises);
            
            toast({ title: "تم إنشاء قوائم الشراء بنجاح!", description: "تم نقل الطلبات إلى سجل المشتريات."});
            router.push('/purchases?tab=purchase-history');
        } else {
             toast({ variant: 'destructive', title: "خطأ", description: "فشل إنشاء بعض قوائم الشراء. الرجاء المحاولة مرة أخرى." });
        }
    } catch(e) {
        toast({ variant: 'destructive', title: "خطأ فادح", description: "حدث خطأ غير متوقع أثناء إنشاء قوائم الشراء." });
    } finally {
        setIsProcessing(false);
    }
};

  return (
    <Card>
      <CardHeader>
        <CardTitle>طلبات الأدوية</CardTitle>
        <CardDescription>
          هنا تظهر الأدوية التي طلبتها من المخزون. قم بتعبئة بياناتها ثم اضغط على "إعداد قائمة الشراء" لنقلها إلى صفحة المشتريات للمراجعة النهائية.
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
                                  onBlur={() => handleBlur(item.id, 'quantity')}
                                  className="w-20 h-9"
                                  placeholder="الكمية"
                                />
                            </TableCell>
                            <TableCell>
                                <Input 
                                  type="number"
                                  value={editableOrderItems[item.id]?.purchase_price || ''}
                                  onChange={e => handleOrderItemChange(item.id, 'purchase_price', parseFloat(e.target.value) || 0)}
                                  onBlur={() => handleBlur(item.id, 'purchase_price')}
                                  className="w-24 h-9"
                                  placeholder="سعر الشراء"
                                />
                            </TableCell>
                             <TableCell>
                                <Input 
                                  type="number"
                                  value={editableOrderItems[item.id]?.price || ''}
                                  onChange={e => handleOrderItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                                  onBlur={() => handleBlur(item.id, 'price')}
                                  className="w-24 h-9"
                                  placeholder="سعر البيع"
                                />
                            </TableCell>
                            <TableCell>
                                 <Input 
                                  type="date"
                                  value={editableOrderItems[item.id]?.expiration_date || ''}
                                  onChange={e => handleOrderItemChange(item.id, 'expiration_date', e.target.value)}
                                  onBlur={() => handleBlur(item.id, 'expiration_date')}
                                  className="h-9"
                                />
                            </TableCell>
                            <TableCell>
                                <Select 
                                    value={editableOrderItems[item.id]?.supplier_id || ''}
                                    onValueChange={value => {
                                        handleOrderItemChange(item.id, 'supplier_id', value)
                                        updateOrderRequestItem(item.id, { supplier_id: value });
                                    }}
                                >
                                    <SelectTrigger className="h-9"><SelectValue placeholder="اختر مورد" /></SelectTrigger>
                                    <SelectContent>{(suppliers || []).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </TableCell>
                             <TableCell>
                                <Input 
                                  value={editableOrderItems[item.id]?.invoice_id || ''}
                                  onChange={e => handleOrderItemChange(item.id, 'invoice_id', e.target.value)}
                                  onBlur={() => handleBlur(item.id, 'invoice_id')}
                                  className="w-32 h-9"
                                  placeholder="رقم القائمة"
                                />
                            </TableCell>
                            <TableCell>
                                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeFromOrderRequestCart(item.id, false)}><Trash2 className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
              </Table>
              </div>
          </div>
          <Button onClick={handlePreparePurchaseOrder} size="lg" className="w-full" variant="success" disabled={isProcessing}>
            <ArrowLeft className="me-2 h-4 w-4" />
            {isProcessing ? "جاري التجهيز..." : "إتمام وإنشاء قوائم الشراء"}
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
