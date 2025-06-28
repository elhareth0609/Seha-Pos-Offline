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
import { inventory as allInventory, sales } from "@/lib/data"
import type { Medication, SaleItem } from "@/lib/types"
import { PlusCircle, MinusCircle, X, PackageSearch, ScanLine } from "lucide-react"
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
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


export default function SalesPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<Medication[]>([])
  const [cart, setCart] = React.useState<SaleItem[]>([])
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [discount, setDiscount] = React.useState(0);
  const [discountInput, setDiscountInput] = React.useState("0");
  const { toast } = useToast()

  const addToCart = React.useCallback((medication: Medication) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.medicationId === medication.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.medicationId === medication.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { medicationId: medication.id, name: medication.name, quantity: 1, price: medication.price, expirationDate: medication.expirationDate }]
    })
    setSearchTerm("")
    setSuggestions([])
  }, [])
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length >= 2) {
        const filtered = allInventory.filter((item) =>
            item.name.toLowerCase().includes(value.toLowerCase()) ||
            item.id.toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 5));
    } else {
        setSuggestions([]);
    }
  }


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

        if (suggestions.length > 0) {
            addToCart(suggestions[0]);
            return;
        }

        const medicationById = allInventory.find(med => med.id.toLowerCase() === searchTerm.toLowerCase());
        if (medicationById) {
            addToCart(medicationById);
            return;
        }

        if (searchTerm) {
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
  
  const updatePrice = (medicationId: string, newPrice: number) => {
    if (newPrice < 0) return;
    setCart(cart => cart.map(item => 
      item.medicationId === medicationId 
        ? { ...item, price: isNaN(newPrice) ? 0 : newPrice } 
        : item
    ));
  };


  const removeFromCart = (medicationId: string) => {
    setCart(cart => cart.filter(item => item.medicationId !== medicationId))
  }
  
  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDiscountInput(value);
    const numericValue = parseFloat(value);
    setDiscount(isNaN(numericValue) || numericValue < 0 ? 0 : numericValue);
  }

  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);

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

    const newSaleId = `SALE${(sales.length + 1).toString().padStart(3, '0')}`;
    sales.unshift({
        id: newSaleId,
        date: new Date().toISOString(),
        items: cart,
        total: finalTotal,
        discount: discount,
        userId: "USR001", // Mock user ID
    });

    cart.forEach(item => {
        const medInInventory = allInventory.find(med => med.id === item.medicationId);
        if (medInInventory) {
            if (medInInventory.stock < item.quantity) {
                 toast({ variant: 'destructive', title: `كمية غير كافية من ${medInInventory.name}`, description: `الكمية المطلوبة ${item.quantity}, المتوفر ${medInInventory.stock}` });
                 // This is a simple check. In a real app, this logic would be more robust.
                 return;
            }
            medInInventory.stock -= item.quantity;
        }
    });
    
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
    <div className="h-[calc(100vh-10rem)]">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>الفاتورة</CardTitle>
            <CardDescription>أضف المنتجات باستخدام البحث أو الماسح الضوئي.</CardDescription>
            <div className="flex gap-2 pt-4">
               <div className="relative flex-1">
                 <Input 
                  placeholder="ابحث بالاسم/المعرف أو امسح الباركود..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                 />
                 {suggestions.length > 0 && (
                    <Card className="absolute z-10 w-full mt-1 bg-background shadow-lg border">
                        <CardContent className="p-0">
                            <ul className="divide-y divide-border">
                                {suggestions.map(med => (
                                    <li key={med.id} 
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            addToCart(med)
                                        }}
                                        className="p-3 hover:bg-accent cursor-pointer rounded-md flex justify-between items-center"
                                    >
                                        <span>{med.name}</span>
                                        <span className="text-sm text-muted-foreground">${med.price.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                 )}
               </div>
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
                            <TableHead className="w-[120px] text-center">سعر الوحدة</TableHead>
                            <TableHead className="text-left w-[100px]">الإجمالي</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                  <TableBody>
                    {cart.map((item) => {
                      const medInInventory = allInventory.find(med => med.id === item.medicationId);
                      const stock = medInInventory?.stock ?? 0;
                      const remainingStock = stock - item.quantity;
                      return (
                        <TableRow key={item.medicationId}>
                            <TableCell>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    الرصيد: {stock} | المتبقي: <span className={remainingStock < 0 ? "text-destructive font-bold" : ""}>{remainingStock}</span>
                                </div>
                                {item.expirationDate && (
                                    <div className="text-xs text-muted-foreground">
                                        انتهاء الصلاحية: {new Date(item.expirationDate).toLocaleDateString('ar-EG')}
                                    </div>
                                )}
                            </TableCell>
                            <TableCell>
                            <div className="flex items-center justify-center gap-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                                <span>{item.quantity}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                            </div>
                            </TableCell>
                            <TableCell>
                                <Input 
                                    type="number" 
                                    value={item.price}
                                    onChange={(e) => updatePrice(item.medicationId, parseFloat(e.target.value))}
                                    className="w-24 h-9 text-center"
                                    step="0.01"
                                    min="0"
                                />
                            </TableCell>
                            <TableCell className="text-left font-mono">${(item.price * item.quantity).toFixed(2)}</TableCell>
                            <TableCell className="text-left">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.medicationId)}><X className="h-4 w-4" /></Button>
                            </TableCell>
                        </TableRow>
                      );
                    })}
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
  )
}
