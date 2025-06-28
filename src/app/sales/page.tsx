"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { inventory as allInventory, sales, returns } from "@/lib/data"
import type { Medication, SaleItem, Return } from "@/lib/types"
import { PlusCircle, MinusCircle, X, PackageSearch, ScanLine, Star, ArrowRightLeft } from "lucide-react"
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

function BarcodeScanner({ onScan, onOpenChange }: { onScan: (result: string) => void; onOpenChange: (isOpen: boolean) => void }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = React.useState<boolean | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let selectedDeviceId: string;

    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const videoInputDevices = await codeReader.listVideoInputDevices();
        if (videoInputDevices.length > 0) {
          selectedDeviceId = videoInputDevices[0].deviceId;
          codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
            if (result) {
              onScan(result.getText());
              onOpenChange(false);
            }
            if (err && !(err instanceof NotFoundException)) {
              console.error(err);
              toast({ variant: 'destructive', title: 'خطأ في المسح', description: 'حدث خطأ أثناء محاولة مسح الباركود.' });
            }
          });
        } else {
            setHasCameraPermission(false);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
      codeReader.reset();
    };
  }, [onScan, onOpenChange, toast]);

  return (
    <div>
        <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
        {hasCameraPermission === false && (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>الكاميرا مطلوبة</AlertTitle>
              <AlertDescription>
                الرجاء السماح بالوصول إلى الكاميرا لاستخدام هذه الميزة.
              </AlertDescription>
            </Alert>
        )}
    </div>
  );
}

function QuickAccessManager({ currentIds, onSave }: { currentIds: string[], onSave: (ids: string[]) => void }) {
    const [selectedIds, setSelectedIds] = React.useState<string[]>(currentIds);
    const [searchTerm, setSearchTerm] = React.useState("");

    const handleToggle = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };
    
    const filteredInventory = allInventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-4">
            <Input 
                placeholder="ابحث عن دواء..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-[400px] border rounded-md">
                <div className="p-4 space-y-4">
                    {filteredInventory.map(med => (
                        <div key={med.id} className="flex items-center justify-between">
                            <Label htmlFor={`qa-${med.id}`} className="flex-1 cursor-pointer">{med.name}</Label>
                            <Checkbox 
                                id={`qa-${med.id}`}
                                checked={selectedIds.includes(med.id)} 
                                onCheckedChange={() => handleToggle(med.id)}
                            />
                        </div>
                    ))}
                </div>
            </ScrollArea>
            <DialogFooter>
                <Button onClick={() => onSave(selectedIds)}>حفظ التغييرات</Button>
            </DialogFooter>
        </div>
    );
}

export default function SalesPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [cart, setCart] = React.useState<SaleItem[]>([])
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isManageQuickAccessOpen, setIsManageQuickAccessOpen] = React.useState(false);
  const [quickAccessIds, setQuickAccessIds] = React.useState<string[]>([]);
  const [quickAccessItems, setQuickAccessItems] = React.useState<Medication[]>([]);
  const [discount, setDiscount] = React.useState(0);
  const [discountInput, setDiscountInput] = React.useState("0");
  const { toast } = useToast()

  React.useEffect(() => {
    try {
        const savedIds = localStorage.getItem("quickAccessIds");
        if (savedIds) {
            setQuickAccessIds(JSON.parse(savedIds));
        }
    } catch (error) {
        console.error("Failed to parse quick access items from localStorage", error);
        setQuickAccessIds([]);
    }
  }, []);

  React.useEffect(() => {
    const items = allInventory.filter(med => quickAccessIds.includes(med.id));
    setQuickAccessItems(items);
  }, [quickAccessIds]);

  const handleSaveQuickAccess = (selectedIds: string[]) => {
    setQuickAccessIds(selectedIds);
    localStorage.setItem("quickAccessIds", JSON.stringify(selectedIds));
    setIsManageQuickAccessOpen(false);
    toast({ title: 'تم الحفظ', description: 'تم تحديث قائمة الوصول السريع بنجاح.' });
  }

  const addToCart = React.useCallback((medication: Medication) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.medicationId === medication.id && !item.isReturn)
      if (existingItem) {
        return prevCart.map(item =>
          item.medicationId === medication.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { medicationId: medication.id, name: medication.name, quantity: 1, price: medication.price, isReturn: false }]
    })
    setSearchTerm("")
  }, [])

  const handleScan = React.useCallback((result: string) => {
    const scannedMedication = allInventory.find(med => med.id === result);
    if (scannedMedication) {
      addToCart(scannedMedication);
      toast({ title: 'تمت الإضافة إلى السلة', description: `تمت إضافة ${scannedMedication.name} بنجاح.` });
    } else {
      toast({ variant: 'destructive', title: 'لم يتم العثور على المنتج', description: 'الباركود الممسوح ضوئيًا لا يتطابق مع أي منتج.' });
    }
    setIsScannerOpen(false);
  }, [addToCart, toast]);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        const medicationById = allInventory.find(med => med.id.toLowerCase() === searchTerm.toLowerCase());
        if (medicationById) {
            addToCart(medicationById);
            return;
        }

        const medicationByName = allInventory.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        if(medicationByName.length === 1) {
            addToCart(medicationByName[0]);
        } else {
            toast({ variant: 'destructive', title: 'لم يتم العثور على المنتج', description: 'يرجى التأكد من المعرف أو البحث بالاسم.' });
        }
    }
  };

  const updateQuantity = (medicationId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicationId)
    } else {
      setCart(cart => cart.map(item => item.medicationId === medicationId ? { ...item, quantity } : item))
    }
  }

  const removeFromCart = (medicationId: string) => {
    setCart(cart => cart.filter(item => item.medicationId !== medicationId))
  }

  const handleToggleReturn = (medicationId: string) => {
    setCart(cart.map(item =>
        item.medicationId === medicationId
            ? { ...item, isReturn: !item.isReturn }
            : item
    ));
  };
  
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDiscountInput(value);
    const numericValue = parseFloat(value);
    setDiscount(isNaN(numericValue) || numericValue < 0 ? 0 : numericValue);
  }

  const subtotal = cart.reduce((total, item) => {
    const itemTotal = item.price * item.quantity;
    return item.isReturn ? total - itemTotal : total + itemTotal;
  }, 0);

  const finalTotal = subtotal - discount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "السلة فارغة", description: "أضف منتجات إلى السلة قبل إتمام العملية.", variant: "destructive" })
      return
    }

    if (discount > subtotal) {
      toast({ title: "خطأ في الخصم", description: "لا يمكن أن يكون الخصم أكبر من المجموع الفرعي.", variant: "destructive" })
      return
    }

    const saleItems = cart.filter(item => !item.isReturn);
    const returnItems = cart.filter(item => item.isReturn);
    
    if (saleItems.length > 0) {
        const newSaleId = `SALE${(sales.length + 1).toString().padStart(3, '0')}`;
        sales.unshift({
            id: newSaleId,
            date: new Date().toISOString(),
            items: saleItems,
            total: finalTotal,
            discount: discount,
        });
        saleItems.forEach(item => {
            const medInInventory = allInventory.find(med => med.id === item.medicationId);
            if (medInInventory) {
                medInInventory.stock -= item.quantity;
            }
        });
    }

    if (returnItems.length > 0) {
        returnItems.forEach(item => {
            const newReturnId = `RET${(returns.length + 1).toString().padStart(3, '0')}`;
            returns.unshift({
                id: newReturnId,
                date: new Date().toISOString(),
                medicationId: item.medicationId,
                medicationName: item.name,
                quantity: item.quantity,
                reason: "Return processed via POS"
            });
            const medInInventory = allInventory.find(med => med.id === item.medicationId);
            if (medInInventory) {
                medInInventory.stock += item.quantity;
            }
        });
    }
    
    toast({
      title: "تمت العملية بنجاح",
      description: `تم تسجيل عملية جديدة بقيمة إجمالية ${finalTotal.toFixed(2)}$`
    })
    setCart([])
    setDiscount(0);
    setDiscountInput("0");
    setSearchTerm("");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2 h-[calc(100vh-theme(spacing.48))]">
      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col">
           <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>الوصول السريع</CardTitle>
                    <Dialog open={isManageQuickAccessOpen} onOpenChange={setIsManageQuickAccessOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><Star className="me-2 h-4 w-4"/> إدارة</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl">
                            <DialogHeader>
                                <DialogTitle>إدارة الوصول السريع</DialogTitle>
                                <DialogDescription>اختر الأدوية التي تظهر في قائمة الوصول السريع في صفحة المبيعات.</DialogDescription>
                            </DialogHeader>
                            <QuickAccessManager currentIds={quickAccessIds} onSave={handleSaveQuickAccess}/>
                        </DialogContent>
                    </Dialog>
                </div>
           </CardHeader>
           <CardContent>
               {quickAccessItems.length > 0 ? (
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                       {quickAccessItems.map(item => (
                           <Button key={item.id} variant="outline" className="h-auto p-3 flex flex-col gap-1.5 justify-between" onClick={() => addToCart(item)}>
                               <span className="text-center text-sm leading-tight">{item.name}</span>
                               <span className="text-xs text-muted-foreground">${item.price.toFixed(2)}</span>
                           </Button>
                       ))}
                   </div>
               ) : (
                   <div className="text-center text-muted-foreground py-8">
                       <p>لم يتم إضافة أي أدوية للوصول السريع.</p>
                       <p className="text-sm">انقر على "إدارة" للبدء.</p>
                   </div>
               )}
           </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>الفاتورة</CardTitle>
            <CardDescription>أضف المنتجات باستخدام البحث أو الماسح الضوئي.</CardDescription>
            <div className="flex gap-2 pt-4">
              <Input 
                placeholder="ابحث بالاسم/المعرف أو امسح الباركود..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                  <DialogTrigger asChild>
                      <Button variant="outline" className="shrink-0"><ScanLine className="me-2"/> مسح</Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                      <DialogTitle>مسح باركود المنتج</DialogTitle>
                      </DialogHeader>
                      <BarcodeScanner onScan={handleScan} onOpenChange={setIsScannerOpen}/>
                  </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {cart.length > 0 ? (
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                            <TableHead>المنتج</TableHead>
                            <TableHead className="w-[120px] text-center">الكمية</TableHead>
                            <TableHead className="text-left">الإجمالي</TableHead>
                            <TableHead className="w-12 p-0 text-center"><ArrowRightLeft className="h-4 w-4 mx-auto" title="إرجاع؟" /></TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.medicationId} className={item.isReturn ? "bg-red-50 dark:bg-red-900/20" : ""}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                            <span>{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-left">${(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                            <Checkbox checked={item.isReturn} onCheckedChange={() => handleToggleReturn(item.medicationId)} />
                        </TableCell>
                        <TableCell className="text-left">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.medicationId)}><X className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <PackageSearch className="h-16 w-16 mb-4" />
                    <p>سلتك فارغة.</p>
                    <p className="text-sm">أضف منتجات للبدء.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-auto border-t pt-6 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex justify-between w-full text-md">
                <span>المجموع الفرعي</span>
                <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between w-full">
                <Label htmlFor="discount" className="text-md">خصم</Label>
                <Input 
                    id="discount"
                    type="text"
                    value={discountInput}
                    onChange={handleDiscountChange}
                    className="h-9 w-32 bg-background ltr:text-left rtl:text-right"
                    placeholder="0.00"
                />
            </div>
            <Separator />
            <div className="flex justify-between w-full text-lg font-semibold">
                <span>الإجمالي</span>
                <span className={finalTotal < 0 ? 'text-destructive' : ''}>${finalTotal.toFixed(2)}</span>
            </div>
            <Button size="lg" className="w-full" onClick={handleCheckout} disabled={cart.length === 0}>
                إتمام العملية
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
