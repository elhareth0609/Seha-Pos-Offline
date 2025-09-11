

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { OrderRequestItem, Supplier, PurchaseOrderItem, Medication } from "@/lib/types"
import { Trash2, Send, ShoppingBasket, ArrowLeft, Copy, Percent, BrainCircuit, Download } from "lucide-react"
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { subDays, differenceInDays } from "date-fns"

type EditableOrderItem = OrderRequestItem & { profit_margin?: number };

export default function OrderRequestsPage() {
  const { 
    scopedData, 
    getOrderRequestCart,
    removeFromOrderRequestCart,
    updateOrderRequestItem,
    addPurchaseOrder,
    duplicateOrderRequestItem,
  } = useAuth();
  
  const { suppliers: [suppliers], inventory: [inventory], sales: [sales], settings: [settings] } = scopedData;
  const { toast } = useToast();
  const router = useRouter();

  const [editableOrderItems, setEditableOrderItems] = React.useState<Record<string, Partial<EditableOrderItem>>>({});
  const [masterPurchaseId, setMasterPurchaseId] = React.useState('');
  const [masterSupplierId, setMasterSupplierId] = React.useState('');
  const [masterDate, setMasterDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [orderRequestCart, setOrderRequestCart] = React.useState<OrderRequestItem[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = React.useState<Set<string>>(new Set());

    const calculateProfitMargin = (purchasePrice: number, sellPrice: number) => {
        if (!purchasePrice || purchasePrice <= 0) return 0;
        return ((sellPrice - purchasePrice) / purchasePrice) * 100;
    };

    const calculateSellPrice = (purchasePrice: number, margin: number) => {
        if (!purchasePrice || purchasePrice <= 0) return 0;
        return purchasePrice * (1 + margin / 100);
    };

  React.useEffect(() => {
    const fetchCart = async () => {
      const cart = await getOrderRequestCart();
      if (Array.isArray(cart)) {
        setOrderRequestCart(cart);
      } else {
        console.error('Invalid cart data format');
        setOrderRequestCart([]);
      }

      setEditableOrderItems(prevEditable => {
          const newEditableItems: Record<string, any> = {};

          cart.forEach(item => {
              const key = item.id; 
              newEditableItems[key] = prevEditable[key] || {
                  quantity: item.quantity || 1,
                  purchase_price: item.purchase_price,
                  price: item.price,
                  profit_margin: calculateProfitMargin(item.purchase_price, item.price),
                  expiration_date: item.expiration_date ? new Date(item.expiration_date).toISOString().split('T')[0] : '',
                  supplier_id: item.supplier_id || '',
                  invoice_id: item.invoice_id || '',
                  date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
              };
          });
          return newEditableItems;
      });
    };

    fetchCart();
  }, [getOrderRequestCart]);


  const handleOrderItemChange = (orderItemId: string, field: keyof EditableOrderItem, value: any) => {
        setEditableOrderItems(prev => {
            if (!prev[orderItemId]) return prev;

            const updatedItem = { ...prev[orderItemId] };
            let { purchase_price = 0, price = 0, profit_margin = 0 } = updatedItem;

            if (field === 'price') {
                price = Number(value);
                profit_margin = calculateProfitMargin(purchase_price, price);
            } else if (field === 'profit_margin') {
                profit_margin = Number(value);
                price = calculateSellPrice(purchase_price, profit_margin);
            } else if (field === 'purchase_price') {
                purchase_price = Number(value);
                if (price > 0) {
                    profit_margin = calculateProfitMargin(purchase_price, price);
                } else if (profit_margin > 0) {
                    price = calculateSellPrice(purchase_price, profit_margin);
                }
            } else {
                 (updatedItem as any)[field] = value;
            }

            updatedItem.price = price;
            updatedItem.purchase_price = purchase_price;
            updatedItem.profit_margin = profit_margin;

            return { ...prev, [orderItemId]: updatedItem };
        });
    };


  const handleBlur = (orderItemId: string, field: string) => {
    const itemData = editableOrderItems[orderItemId];
    if(itemData && Object.keys(itemData).includes(field)){
      updateOrderRequestItem(orderItemId, { [field]: (itemData as any)[field] });
      if (field === 'purchase_price' || field === 'profit_margin') {
          updateOrderRequestItem(orderItemId, { price: itemData.price });
      }
    }
  };

  const handleDelete = async (id: string) => {
    await removeFromOrderRequestCart(id, false);
    const cart = await getOrderRequestCart();
    if (Array.isArray(cart)) {
      setOrderRequestCart(cart);
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
                id: invoice_id!,
                supplier_id: supplier_id!,
                supplier_name: supplier?.name || 'مورد غير معروف',
                date: date!,
                items: [],
            };
        }
        
        drafts[key].items.push({
            id: item.medication_id,
            medication_id: item.medication_id,
            name: item.name,
            quantity: editableData.quantity!,
            purchase_price: editableData.purchase_price!,
            price: editableData.price!,
            expiration_date: editableData.expiration_date!,
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

const systemSuggestions = React.useMemo(() => {
    const suggestionsMap = new Map<string, { med: Medication; reason: string; quantity: number }>();
    const analysisPeriodDays = 90;
    const cutoffDate = subDays(new Date(), analysisPeriodDays);

    // 1. Low stock based on reorder point
    inventory.forEach(i => {
        if (i.stock > 0 && i.stock <= i.reorder_point) {
            suggestionsMap.set(i.id, { med: i, reason: 'مخزون منخفض', quantity: i.reorder_point * 2 }); // Suggest ordering double the reorder point
        }
    });

    // 2. Demand Forecasting based on sales
    const salesInPeriod = sales.filter(s => new Date(s.date) >= cutoffDate);
    const salesStats: { [medId: string]: number } = {};
    salesInPeriod.forEach(sale => {
      sale.items.forEach(item => {
        if (!item.is_return) {
          salesStats[item.medication_id] = (salesStats[item.medication_id] || 0) + item.quantity;
        }
      });
    });
    
    Object.entries(salesStats).forEach(([medId, totalQuantity]) => {
        const med = inventory.find(i => i.id === medId);
        if (!med) return;

        const daysInPeriod = differenceInDays(new Date(), cutoffDate);
        const avgDailySales = totalQuantity / daysInPeriod;
        const forecastedMonthlyDemand = Math.ceil(avgDailySales * 30);

        if (forecastedMonthlyDemand > med.stock) {
            const suggestedQuantity = forecastedMonthlyDemand - med.stock;
            if (!suggestionsMap.has(med.id) || (suggestionsMap.get(med.id)?.quantity || 0) < suggestedQuantity) {
                 suggestionsMap.set(med.id, { 
                    med: med, 
                    reason: `توقع بيع ${forecastedMonthlyDemand} قطعة هذا الشهر`, 
                    quantity: suggestedQuantity 
                });
            }
        }
    });
    
    const preferenceScores = settings.suggestion_preference_score || {};
    const sortWithPreference = (a: {med: Medication}, b: {med: Medication}) => (preferenceScores[b.med.id] || 100) - (preferenceScores[a.med.id] || 100);
      
    return Array.from(suggestionsMap.values()).sort(sortWithPreference);

}, [inventory, sales, settings.suggestion_preference_score]);


 const handleAddSuggestionsToCart = () => {
    const suggestionsToAdd = systemSuggestions
        .filter(s => selectedSuggestions.has(s.med.id));
    

    const itemsToAddPromises = suggestionsToAdd
      .filter(s => !orderRequestCart.find(item => item.medication_id === s.med.id))
      .map(s => {
          const newItemData = { medication_id: s.med.id, quantity: s.quantity || 1, is_new: true };
          return apiRequest('/order-requests', 'POST', newItemData);
      });

    Promise.all(itemsToAddPromises).then(newItems => {
        setOrderRequestCart(prev => [...prev, ...newItems.filter(item => item !== null)]);
        toast({ title: `تم إضافة ${newItems.length} صنف إلى قائمة الطلبات` });
        setSelectedSuggestions(new Set());
    });
};

const handleSuggestionSelection = (medId: string, checked: boolean) => {
    setSelectedSuggestions(prev => {
        const newSet = new Set(prev);
        if (checked) {
            newSet.add(medId);
        } else {
            newSet.delete(medId);
        }
        return newSet;
    });
};

const apiRequest = async (endpoint: string, method: 'POST' | 'DELETE', body: any) => {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        throw new Error('API request failed');
    }
    const result = await response.json();
    return result.data ?? result;
}

const handleDownloadOrder = () => {
    if (orderRequestCart.length === 0) {
        toast({ variant: 'destructive', title: "القائمة فارغة", description: "لا توجد طلبات لتنزيلها." });
        return;
    }

    const dataToExport = orderRequestCart.map(item => ({
        'اسم الدواء': item.name,
        'الكمية': editableOrderItems[item.id]?.quantity || item.quantity || 1,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Order Request");

    // Set column widths
    worksheet['!cols'] = [ { wch: 40 }, { wch: 10 } ];

    XLSX.writeFile(workbook, "order_request.xlsx");
};


return (
    <Tabs defaultValue="requests" dir="rtl">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests">قائمة الطلبات اليدوية</TabsTrigger>
            <TabsTrigger value="suggestions">اقتراحات النظام</TabsTrigger>
        </TabsList>
        <TabsContent value="requests">
            <Card>
                <CardHeader>
                    <CardTitle>طلبات الأدوية</CardTitle>
                    <CardDescription>
                    هنا تظهر الأدوية التي طلبتها من المخزون. قم بتعبئة بياناتها ثم اضغط على "إتمام وإنشاء قوائم الشراء" لنقلها إلى صفحة المشتريات للمراجعة النهائية.
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
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><ShoppingBasket /> قائمة الطلبات ({orderRequestCart.length})</h3>
                            <Button variant="outline" onClick={handleDownloadOrder}>
                                <Download className="me-2 h-4 w-4"/>
                                تنزيل كملف Excel
                            </Button>
                        </div>
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
                                    <TableHead>الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orderRequestCart.map(item => {
                                    const editableData = editableOrderItems[item.id] || {};
                                    return (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">{item.scientific_names?.join(', ')}</div>
                                            <div className="text-xs text-muted-foreground">الرصيد الحالي: <span className="font-mono">{item.stock}</span></div>
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                            type="number"
                                            value={editableData.quantity || ''}
                                            onChange={e => handleOrderItemChange(item.id, 'quantity', parseInt(e.target.value, 10) || 0)}
                                            onBlur={() => handleBlur(item.id, 'quantity')}
                                            className="w-20 h-9"
                                            placeholder="الكمية"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                            type="number"
                                            value={editableData.purchase_price || ''}
                                            onChange={e => handleOrderItemChange(item.id, 'purchase_price', e.target.value)}
                                            onBlur={() => handleBlur(item.id, 'purchase_price')}
                                            className="w-24 h-9"
                                            placeholder="سعر الشراء"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Input 
                                                    type="number"
                                                    value={editableData.price || ''}
                                                    onChange={e => handleOrderItemChange(item.id, 'price', e.target.value)}
                                                    onBlur={() => handleBlur(item.id, 'price')}
                                                    className="w-24 h-9"
                                                    placeholder="سعر البيع"
                                                />
                                                <div className="relative w-20">
                                                    <Input
                                                        type="number"
                                                        value={editableData.profit_margin?.toFixed(0) || ''}
                                                        onChange={e => handleOrderItemChange(item.id, 'profit_margin', e.target.value)}
                                                        onBlur={() => handleBlur(item.id, 'profit_margin')}
                                                        className="h-9 pe-6"
                                                    />
                                                    <Percent className="absolute top-1/2 -translate-y-1/2 start-1.5 h-3 w-3 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                            type="date"
                                            value={editableData.expiration_date || ''}
                                            onChange={e => handleOrderItemChange(item.id, 'expiration_date', e.target.value)}
                                            onBlur={() => handleBlur(item.id, 'expiration_date')}
                                            className="h-9"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Select 
                                                value={editableData.supplier_id || ''}
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
                                            value={editableData.invoice_id || ''}
                                            onChange={e => handleOrderItemChange(item.id, 'invoice_id', e.target.value)}
                                            onBlur={() => handleBlur(item.id, 'invoice_id')}
                                            className="w-32 h-9"
                                            placeholder="رقم القائمة"
                                            />
                                        </TableCell>
                                        <TableCell className="flex items-center">
                                            <Button size="icon" variant="ghost" className="text-blue-600" onClick={async () => {
                                                await duplicateOrderRequestItem(item.id);
                                                // Refresh the cart data after duplication
                                                const cart = await getOrderRequestCart();
                                                if (Array.isArray(cart)) {
                                                setOrderRequestCart(cart);
                                                }
                                            }}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(item.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )})}
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
                            <p className="text-sm">اذهب إلى المخزون واضغط على زر "طلب" لإضافة الأدوية هنا، أو استخدم اقتراحات النظام.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="suggestions">
            <Card>
                 <CardHeader>
                    <CardTitle>اقتراحات النظام الذكية</CardTitle>
                    <CardDescription>
                        يقترح النظام عليك الأصناف التي قد تحتاج لطلبها بناءً على حالة المخزون والمبيعات التاريخية. حدد ما تريد إضافته ثم اضغط على زر الإضافة.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>الدواء</TableHead>
                                    <TableHead>الرصيد الحالي</TableHead>
                                    <TableHead>الكمية المقترحة</TableHead>
                                    <TableHead>سبب الاقتراح</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {systemSuggestions.map(({ med, reason, quantity }) => (
                                    <TableRow key={med.id}>
                                        <TableCell><Checkbox checked={selectedSuggestions.has(med.id)} onCheckedChange={(checked) => handleSuggestionSelection(med.id, !!checked)}/></TableCell>
                                        <TableCell>{med.name}</TableCell>
                                        <TableCell>{med.stock}</TableCell>
                                        <TableCell className="font-mono font-semibold">{quantity}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{reason}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <Button 
                        size="lg" 
                        className="w-full" 
                        onClick={handleAddSuggestionsToCart}
                        disabled={selectedSuggestions.size === 0}
                    >
                        إضافة ({selectedSuggestions.size}) أصناف محددة إلى قائمة الطلبات
                    </Button>
                </CardContent>
            </Card>
        </TabsContent>
    </Tabs>
  )
}

    

    
