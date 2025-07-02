
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
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { inventory as fallbackInventory, sales as fallbackSales, patients as fallbackPatients, users as fallbackUsers, appSettings as fallbackSettings } from "@/lib/data"
import type { Medication, SaleItem, Sale, Patient, User, AppSettings } from "@/lib/types"
import { PlusCircle, MinusCircle, X, PackageSearch, ScanLine, ArrowLeftRight, UserSearch, Printer, User as UserIcon } from "lucide-react"
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useReactToPrint } from "react-to-print"
import { InvoiceTemplate } from "@/components/ui/invoice"


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
  const [allInventory, setAllInventory] = useLocalStorage<Medication[]>('inventory', fallbackInventory);
  const [sales, setSales] = useLocalStorage<Sale[]>('sales', fallbackSales);
  const [patients, setPatients] = useLocalStorage<Patient[]>('patients', fallbackPatients);
  const [users, setUsers] = useLocalStorage<User[]>('users', fallbackUsers);
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', fallbackSettings);
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<Medication[]>([])
  const [cart, setCart] = React.useState<SaleItem[]>([])
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
  const [saleToPrint, setSaleToPrint] = React.useState<Sale | null>(null);
  const [discount, setDiscount] = React.useState(0);
  const [discountInput, setDiscountInput] = React.useState("0");
  const { toast } = useToast()
  
  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [selectedEmployee, setSelectedEmployee] = React.useState<User>(users[0]);

  const printComponentRef = React.useRef(null);
  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    documentTitle: `invoice-${saleToPrint?.id || ''}`,
  });

  const addToCart = React.useCallback((medication: Medication) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.medicationId === medication.id && !item.isReturn)
      if (existingItem) {
        return prevCart.map(item =>
          item.medicationId === medication.id && !item.isReturn
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { medicationId: medication.id, name: medication.name, quantity: 1, price: medication.price, expirationDate: medication.expirationDate, isReturn: false }]
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
  }, [addToCart, toast, allInventory]);

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

  const toggleReturn = (medicationId: string) => {
    setCart(cart => cart.map(item => 
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
      return;
    }

    if (finalTotal < 0) {
      toast({ title: "خطأ في الإجمالي", description: "لا يمكن أن يكون المبلغ الإجمالي سالبًا.", variant: "destructive" })
      return;
    }

    for (const itemInCart of cart) {
        if (!itemInCart.isReturn) {
            const med = allInventory.find(m => m.id === itemInCart.medicationId);
            if (!med || med.stock < itemInCart.quantity) {
                toast({ variant: 'destructive', title: `كمية غير كافية من ${itemInCart.name}`, description: `الكمية المطلوبة ${itemInCart.quantity}, المتوفر ${med?.stock ?? 0}` });
                return;
            }
        }
    }
    
    setIsCheckoutOpen(true);
  }

  const resetSale = () => {
    setCart([]);
    setDiscount(0);
    setDiscountInput("0");
    setSearchTerm("");
    setSelectedPatient(null);
    setSaleToPrint(null);
  }
  
  const handleFinalizeSale = () => {
    const updatedInventory = allInventory.map(med => {
        const itemInCart = cart.find(cartItem => cartItem.medicationId === med.id);
        if (itemInCart) {
            const newStock = itemInCart.isReturn 
                ? med.stock + itemInCart.quantity
                : med.stock - itemInCart.quantity;
            return { ...med, stock: newStock };
        }
        return med;
    });
    
    setAllInventory(updatedInventory);
    
    const newSaleId = `SALE${(sales.length + 1).toString().padStart(3, '0')}`;
    const newSale: Sale = {
        id: newSaleId,
        date: new Date().toISOString(),
        items: cart,
        total: finalTotal,
        discount: discount,
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        patientId: selectedPatient?.id,
        patientName: selectedPatient?.name
    };
    
    setSales(prev => [newSale, ...prev]);
    
    toast({
      title: "تمت العملية بنجاح",
      description: `تم تسجيل عملية جديدة بقيمة إجمالية ${finalTotal.toFixed(2)}$`
    })

    setSaleToPrint(newSale);
    setIsCheckoutOpen(false);
    setIsReceiptOpen(true);
  }
  
  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient || null);
  }
  
  const handleEmployeeSelect = (employeeId: string) => {
    const employee = users.find(u => u.id === employeeId);
    if(employee) setSelectedEmployee(employee);
  }

  return (
    <>
    <div className="hidden">
        <InvoiceTemplate ref={printComponentRef} sale={saleToPrint} settings={settings} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        {/* Main Content */}
        <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Product Selection */}
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle>اختيار المنتج</CardTitle>
                    <div className="flex gap-2 pt-2">
                        <div className="relative flex-1">
                            <Input 
                            placeholder="امسح الباركود أو ابحث بالاسم..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchKeyDown}
                            autoFocus
                            />
                            {suggestions.length > 0 && (
                                <Card className="absolute z-50 w-full mt-1 bg-background shadow-lg border">
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
            </Card>

            {/* Invoice Table */}
            <Card className="flex-1 flex flex-col">
                 <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                        <CardTitle>الفاتورة الحالية</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1">
                    <ScrollArea className="h-full">
                    {cart.length > 0 ? (
                        <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                                <TableRow>
                                    <TableHead className="w-12 text-center"><ArrowLeftRight className="h-4 w-4 mx-auto"/></TableHead>
                                    <TableHead>المنتج</TableHead>
                                    <TableHead className="w-[120px] text-center">الكمية</TableHead>
                                    <TableHead className="w-[120px] text-center">السعر</TableHead>
                                    <TableHead className="text-left w-[100px]">الإجمالي</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cart.map((item) => {
                                const medInInventory = allInventory.find(med => med.id === item.medicationId);
                                const stock = medInInventory?.stock ?? 0;
                                const remainingStock = stock - item.quantity;
                                const itemTotal = (item.isReturn ? -1 : 1) * item.price * item.quantity;
                                return (
                                    <TableRow key={`${item.medicationId}-${item.isReturn}`} className={cn(item.isReturn && "bg-red-50 dark:bg-red-900/20")}>
                                        <TableCell className="text-center">
                                            <Checkbox checked={!!item.isReturn} onCheckedChange={() => toggleReturn(item.medicationId)} aria-label="Mark as return" />
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                الرصيد: {stock} 
                                                {!item.isReturn && ` | المتبقي: `}
                                                {!item.isReturn && <span className={remainingStock < 0 ? "text-destructive font-bold" : ""}>{remainingStock}</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                                            <span>{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                                        </div>
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={item.price.toFixed(2)} onChange={(e) => updatePrice(item.medicationId, parseFloat(e.target.value))} className="w-24 h-9 text-center" step="0.01" min="0" />
                                        </TableCell>
                                        <TableCell className="text-left font-mono">${itemTotal.toFixed(2)}</TableCell>
                                        <TableCell className="text-left">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.medicationId)}><X className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                            <PackageSearch className="h-16 w-16 mb-4" />
                            <p>الفاتورة فارغة.</p>
                            <p className="text-sm">أضف منتجات لبدء عملية البيع.</p>
                        </div>
                    )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

        {/* Checkout Summary */}
        <div className="lg:col-span-1">
             <Card className="sticky top-6">
                <CardHeader>
                    <CardTitle>ملخص الفاتورة</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                     <div className="space-y-2">
                        <Label>الموظف البائع</Label>
                         <Select onValueChange={handleEmployeeSelect} defaultValue={selectedEmployee.id}>
                            <SelectTrigger>
                                <UserIcon className="me-2 h-4 w-4" />
                                <SelectValue placeholder="اختيار موظف..." />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     </div>
                      <div className="space-y-2">
                        <Label>العميل (اختياري)</Label>
                        <Select onValueChange={handlePatientSelect} value={selectedPatient?.id || ""}>
                            <SelectTrigger>
                                <UserSearch className="me-2 h-4 w-4" />
                                <SelectValue placeholder="اختيار مريض..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">بدون مريض</SelectItem>
                                {patients.map(p => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <div className="flex justify-between w-full text-md">
                        <span>المجموع الفرعي</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between w-full">
                        <Label htmlFor="discount" className="text-md shrink-0 me-2">خصم</Label>
                        <Input id="discount" type="text" value={discountInput} onChange={handleDiscountChange} className="h-9 w-full bg-background ltr:text-left rtl:text-right" placeholder="0.00" />
                    </div>
                    <Separator />
                    <div className="flex justify-between w-full text-lg font-semibold">
                        <span>الإجمالي</span>
                        <span className={finalTotal < 0 ? 'text-destructive' : ''}>${finalTotal.toFixed(2)}</span>
                    </div>
                </CardContent>
                <CardFooter>
                     <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                        <DialogTrigger asChild>
                            <Button size="lg" className="w-full text-lg" onClick={handleCheckout} disabled={cart.length === 0}>
                                إتمام العملية
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>تأكيد الفاتورة</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="max-h-64 overflow-y-auto p-1">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>المنتج</TableHead>
                                                <TableHead className="text-center">الكمية</TableHead>
                                                <TableHead className="text-left">السعر</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.map(item => (
                                                <TableRow key={item.medicationId} className={cn(item.isReturn && "text-destructive")}>
                                                    <TableCell>{item.name} {item.isReturn && "(مرتجع)"}</TableCell>
                                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                                    <TableCell className="text-left">${((item.isReturn ? -1 : 1) * item.price * item.quantity).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <Separator/>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span>الموظف:</span><span>{selectedEmployee.name}</span></div>
                                    {selectedPatient && <div className="flex justify-between"><span>المريض:</span><span>{selectedPatient.name}</span></div>}
                                    <div className="flex justify-between"><span>المجموع الفرعي:</span><span>${subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>الخصم:</span><span>-${discount.toFixed(2)}</span></div>
                                    <div className="flex justify-between font-bold text-lg"><span>الإجمالي النهائي:</span><span>${finalTotal.toFixed(2)}</span></div>
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                <Button onClick={handleFinalizeSale}>تأكيد البيع</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
            </Card>
        </div>

        <Dialog open={isReceiptOpen} onOpenChange={(open) => {
            if (!open) {
                resetSale();
            }
            setIsReceiptOpen(open);
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تمت العملية بنجاح</DialogTitle>
                    <DialogDescription>
                        تم تسجيل الفاتورة رقم {saleToPrint?.id}. هل تريد طباعة نسخة؟
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-between gap-2">
                    <Button onClick={() => setIsReceiptOpen(false)} className="w-full sm:w-auto">
                        فاتورة جديدة
                    </Button>
                    <div className="flex gap-2">
                        <DialogClose asChild>
                            <Button variant="outline">إغلاق</Button>
                        </DialogClose>
                        <Button onClick={handlePrint} className="w-full sm:w-auto">
                            <Printer className="me-2 h-4 w-4" />
                            طباعة الفاتورة
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
    </>
  )
}
