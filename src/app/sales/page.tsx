
"use client"

import * as React from "react"
import Image from "next/image"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { inventory as fallbackInventory, sales as fallbackSales, appSettings as fallbackSettings, patients as fallbackPatients } from "@/lib/data"
import type { Medication, SaleItem, Sale, AppSettings, Patient, DoseCalculationOutput } from "@/lib/types"
import { PlusCircle, MinusCircle, X, PackageSearch, ScanLine, ArrowLeftRight, Printer, User as UserIcon, AlertTriangle, TrendingUp, ArrowLeft, ArrowRight, FilePlus, UserPlus, Package, Thermometer, BrainCircuit, WifiOff, Wifi } from "lucide-react"
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useReactToPrint } from "react-to-print"
import { InvoiceTemplate } from "@/components/ui/invoice"
import { useAuth } from "@/hooks/use-auth"
import { buttonVariants } from "@/components/ui/button"
import { calculateDose, type DoseCalculationInput } from "@/ai/flows/dose-calculator-flow"
import { Skeleton } from "@/components/ui/skeleton"
import { useOnlineStatus } from "@/hooks/use-online-status"


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

function DosingAssistant({ cartItems }: { cartItems: SaleItem[] }) {
    const [patientAge, setPatientAge] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [results, setResults] = React.useState<DoseCalculationOutput | null>(null);
    const { toast } = useToast();

    const handleCalculate = async () => {
        const age = parseInt(patientAge, 10);
        if (isNaN(age) || age <= 0) {
            toast({ variant: 'destructive', title: 'عمر غير صالح', description: 'الرجاء إدخال عمر صحيح.' });
            return;
        }
        
        setIsLoading(true);
        setResults(null);

        const medicationsInput: DoseCalculationInput['medications'] = cartItems
            .filter(item => !item.isReturn)
            .map(item => ({
                tradeName: item.name,
                scientificNames: item.scientificNames || [],
                dosage: item.saleUnit || 'N/A', // This is not ideal, but we lack dosage field in SaleItem
                dosageForm: 'N/A' // Placeholder as we don't have this field yet
            }));
            
        try {
            const response = await calculateDose({ patientAge: age, medications: medicationsInput });
            setResults(response);
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'حدث خطأ', description: 'لم نتمكن من حساب الجرعة. الرجاء المحاولة مرة أخرى.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
                <DialogTitle>مساعد الجرعات الذكي</DialogTitle>
                <DialogDescription>
                   أدخل عمر المريض للحصول على اقتراحات للجرعات، تعليمات الاستخدام، وكشف التفاعلات الدوائية.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-2">
                        <Label htmlFor="patient-age">عمر المريض (بالسنوات)</Label>
                        <Input id="patient-age" type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="مثال: 5" />
                    </div>
                    <Button onClick={handleCalculate} disabled={isLoading || cartItems.length === 0}>
                        {isLoading ? <BrainCircuit className="me-2 h-4 w-4 animate-spin" /> : <Thermometer className="me-2 h-4 w-4" />}
                        حساب وتحليل
                    </Button>
                </div>
                
                {isLoading && (
                    <div className="space-y-2 pt-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                )}
                
                {results && (
                     <div className="space-y-4 pt-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>تنبيه هام</AlertTitle>
                            <AlertDescription>
                                هذه النتائج هي مجرد اقتراحات من الذكاء الاصطناعي ولا تغني عن خبرة الصيدلي وقراره النهائي. يجب التحقق من الجرعات والتفاعلات دائمًا.
                            </AlertDescription>
                        </Alert>
                        
                        {results.interactions && results.interactions.length > 0 && (
                            <div className="mt-4">
                                <h3 className="font-semibold text-lg text-destructive mb-2">تفاعلات دوائية محتملة:</h3>
                                <ul className="list-disc list-inside space-y-1 rounded-md border border-destructive/50 bg-destructive/5 p-4 text-destructive">
                                    {results.interactions.map((interaction, index) => (
                                        <li key={index}>{interaction}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الدواء</TableHead>
                                    <TableHead>الجرعة المقترحة</TableHead>
                                    <TableHead>تحذيرات / تعليمات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.medicationAnalysis.map((res, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{res.tradeName}</TableCell>
                                        <TableCell>{res.suggestedDose}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-destructive font-medium">{res.warning}</span>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                            <AlertTriangle className="text-yellow-500" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80">
                                                        <div className="grid gap-4">
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium leading-none">تعليمات الاستخدام</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {res.usageInstructions}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     </div>
                )}
            </div>
             <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">إغلاق</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );
}

export default function SalesPage() {
  const [allInventory, setAllInventory] = useLocalStorage<Medication[]>('inventory', fallbackInventory);
  const [sales, setSales] = useLocalStorage<Sale[]>('sales', fallbackSales);
  const [patients, setPatients] = useLocalStorage<Patient[]>('patients', fallbackPatients);
  const [settings, setSettings] = useLocalStorage<AppSettings>('appSettings', fallbackSettings);
  const { currentUser } = useAuth();
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<Medication[]>([])
  const [cart, setCart] = React.useState<SaleItem[]>([])
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
  const [saleToPrint, setSaleToPrint] = React.useState<Sale | null>(null);
  const [discount, setDiscount] = React.useState(0);
  const [discountInput, setDiscountInput] = React.useState("0");
  const [isDosingAssistantOpen, setIsDosingAssistantOpen] = React.useState(false);

  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = React.useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = React.useState("");
  const [newPatientName, setNewPatientName] = React.useState("");
  const [newPatientPhone, setNewPatientPhone] = React.useState("");


  const [mode, setMode] = React.useState<'new' | 'review'>('new');
  const [reviewIndex, setReviewIndex] = React.useState(0);
  const [isPrintReviewOpen, setIsPrintReviewOpen] = React.useState(false);
  const isOnline = useOnlineStatus();

  const { toast } = useToast()
  
  const printComponentRef = React.useRef(null);
  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    documentTitle: `invoice-${saleToPrint?.id || ''}`,
  });
  
  const sortedSales = React.useMemo(() => (sales || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [sales]);

  const addToCart = React.useCallback((medication: Medication) => {
    if (mode !== 'new') return;
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.medicationId === medication.id && !item.isReturn)
      if (existingItem) {
        return prevCart.map(item =>
          item.medicationId === medication.id && !item.isReturn
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { medicationId: medication.id, name: medication.tradeName, scientificNames: medication.scientificNames, quantity: 1, price: medication.price, purchasePrice: medication.purchasePrice, expirationDate: medication.expirationDate, isReturn: false, saleUnit: medication.saleUnit }]
    })
    setSearchTerm("")
    setSuggestions([])
  }, [mode])
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 0) {
        const lowercasedFilter = value.toLowerCase();
        const filtered = (allInventory || []).filter((item) =>
            (item.tradeName && item.tradeName.toLowerCase().startsWith(lowercasedFilter)) ||
            (item.id && item.id.toLowerCase().includes(lowercasedFilter))
        );
        setSuggestions(filtered.slice(0, 5));
    } else {
        setSuggestions([]);
    }
  }

  const handleScan = React.useCallback((result: string) => {
    if (mode !== 'new') return;
    const scannedMedication = (allInventory || []).find(med => med.id === result);
    if (scannedMedication) {
      addToCart(scannedMedication);
      toast({ title: 'تمت الإضافة إلى السلة', description: `تمت إضافة ${scannedMedication.tradeName} بنجاح.` });
    } else {
      toast({ variant: 'destructive', title: 'لم يتم العثور على المنتج', description: 'الباركود الممسوح ضوئيًا لا يتطابق مع أي منتج.' });
    }
    setIsScannerOpen(false);
  }, [addToCart, toast, allInventory, mode]);

  const handleSearchKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (mode !== 'new') return;
    if (event.key === 'Enter') {
        event.preventDefault();

        if (suggestions.length > 0) {
            addToCart(suggestions[0]);
            return;
        }

        const lowercasedSearchTerm = searchTerm.toLowerCase();
        const medicationById = (allInventory || []).find(med => med.id && med.id.toLowerCase() === lowercasedSearchTerm);
        if (medicationById) {
            addToCart(medicationById);
            return;
        }
        
        const medicationByName = (allInventory || []).find(med => med.tradeName && med.tradeName.toLowerCase() === lowercasedSearchTerm);
        if (medicationByName) {
            addToCart(medicationByName);
            return;
        }

        if (searchTerm) {
            toast({ variant: 'destructive', title: 'لم يتم العثور على المنتج', description: 'يرجى التأكد من المعرف أو البحث بالاسم.' });
        }
    }
  }, [suggestions, allInventory, searchTerm, addToCart, toast, mode]);

  const updateQuantity = (medicationId: string, quantity: number) => {
    if (mode !== 'new') return;
    if (quantity <= 0) {
      removeFromCart(medicationId)
    } else {
      setCart(cart => cart.map(item => item.medicationId === medicationId ? { ...item, quantity } : item))
    }
  }
  
  const updatePrice = (medicationId: string, newPrice: number) => {
    if (mode !== 'new') return;
    if (newPrice < 0) return;
    setCart(cart => cart.map(item => 
      item.medicationId === medicationId 
        ? { ...item, price: isNaN(newPrice) ? 0 : newPrice } 
        : item
    ));
  };

  const removeFromCart = (medicationId: string) => {
    if (mode !== 'new') return;
    setCart(cart => cart.filter(item => item.medicationId !== medicationId))
  }

  const toggleReturn = (medicationId: string) => {
    if (mode !== 'new') return;
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

  const totalProfit = cart.reduce((acc, item) => {
      const itemProfit = (item.price - item.purchasePrice) * item.quantity;
      return item.isReturn ? acc - itemProfit : acc + itemProfit;
  }, 0);

  const finalTotal = subtotal - discount;

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "السلة فارغة", description: "أضف منتجات إلى السلة قبل إتمام العملية.", variant: "destructive" })
      return;
    }
    
    for (const itemInCart of cart) {
        if (!itemInCart.isReturn) {
            const med = (allInventory || []).find(m => m.id === itemInCart.medicationId);
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
    setSaleToPrint(null);
    setSelectedPatient(null);
  }
  
  const handleFinalizeSale = async () => {
    const saleId = `SALE${Date.now()}`;
    if (!currentUser) {
        toast({ variant: 'destructive', title: "خطأ", description: "لم يتم العثور على بيانات المستخدم الحالي." });
        return;
    }
    const newSale: Sale = {
        id: saleId,
        date: new Date().toISOString(),
        items: cart,
        total: finalTotal,
        profit: totalProfit,
        discount: discount,
        patientId: selectedPatient?.id,
        patientName: selectedPatient?.name,
        employeeId: currentUser.id,
        employeeName: currentUser.name,
    };
    
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
    setSales(prev => [newSale, ...prev]);

    toast({ title: "تمت العملية بنجاح", description: `تم تسجيل الفاتورة رقم ${newSale.id}` });
    
    setSaleToPrint(newSale);
    setIsCheckoutOpen(false);
    setIsReceiptOpen(true);
  }

  const loadSaleForReview = (index: number) => {
    if (index >= 0 && index < sortedSales.length) {
        const saleToReview = sortedSales[index];
        const patient = (patients || []).find(p => p.id === saleToReview.patientId);
        setCart(saleToReview.items);
        setDiscount(saleToReview.discount || 0);
        setDiscountInput((saleToReview.discount || 0).toString());
        setSelectedPatient(patient || null);
        setReviewIndex(index);
        setMode('review');
        setSearchTerm('');
        setSuggestions([]);
    }
  };

  const handleNextInvoice = () => { // Newer invoice
    if (reviewIndex > 0) {
        loadSaleForReview(reviewIndex - 1);
    }
  };

  const handlePreviousInvoice = () => { // Older invoice
    if (mode === 'new' && sortedSales.length > 0) {
        loadSaleForReview(0);
    } else if (mode === 'review' && reviewIndex < sortedSales.length - 1) {
        loadSaleForReview(reviewIndex + 1);
    }
  };

  const handleNewInvoiceClick = () => {
    setMode('new');
    resetSale();
  };

  const handleAddNewPatient = async () => {
      if (!newPatientName.trim()) {
          toast({ variant: "destructive", title: "الاسم مطلوب" });
          return;
      }
      const newPatient: Patient = {
          id: `PAT${Date.now()}`,
          name: newPatientName,
          phone: newPatientPhone,
      };
      setPatients(prev => [newPatient, ...prev]);
      setSelectedPatient(newPatient);
      toast({ title: "تم إضافة المريض", description: `تم تحديد ${newPatient.name} لهذه الفاتورة.` });
      setNewPatientName("");
      setNewPatientPhone("");
      setPatientSearchTerm("");
      setIsPatientModalOpen(false);
  }

  const filteredPatients = (patients || []).filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()));

  return (
    <>
    <div className="hidden">
        <InvoiceTemplate ref={printComponentRef} sale={saleToPrint} settings={settings || null} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-5rem)]">
        <div className="lg:col-span-2 flex flex-col gap-4">
            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-xl">اختيار المنتج</CardTitle>
                    <div className="flex gap-2 pt-2">
                        <div className="relative flex-1">
                            <Input 
                            placeholder="امسح الباركود أو ابحث بالاسم..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchKeyDown}
                            autoFocus
                            disabled={mode !== 'new'}
                            />
                            {suggestions.length > 0 && mode === 'new' && (
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
                                                    <div className="flex items-center gap-3">
                                                        {med.imageUrl ? (
                                                            <Image src={med.imageUrl} alt={med.tradeName || ''} width={32} height={32} className="rounded-sm object-cover h-8 w-8" />
                                                        ) : (
                                                            <div className="h-8 w-8 flex items-center justify-center rounded-sm bg-muted text-muted-foreground">
                                                                <Package className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                        <span>{med.tradeName} {med.saleUnit && `(${med.saleUnit})`}</span>
                                                    </div>
                                                    <span className="text-sm text-muted-foreground">{med.price.toLocaleString('ar-IQ')} د.ع</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                        <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="shrink-0" disabled={mode !== 'new'}><ScanLine className="me-2"/> مسح</Button>
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

            <Card className="flex-1 flex flex-col">
                 <CardHeader className="py-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl">
                          {mode === 'new' ? 'الفاتورة الحالية' : `عرض الفاتورة #${sortedSales[reviewIndex]?.id}`}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            {mode === 'review' ? (
                                <>
                                    <Button onClick={handleNewInvoiceClick} variant="secondary">
                                        <FilePlus className="me-2"/> فاتورة جديدة
                                    </Button>
                                    <Button onClick={handlePreviousInvoice} variant="outline" size="icon" disabled={reviewIndex >= sortedSales.length - 1}>
                                       <span className="sr-only">السابق</span> <ArrowRight/>
                                    </Button>
                                    <Button onClick={handleNextInvoice} variant="outline" size="icon" disabled={reviewIndex <= 0}>
                                        <span className="sr-only">التالي</span> <ArrowLeft/>
                                    </Button>
                                </>
                            ) : (
                                <Button onClick={handlePreviousInvoice} variant="outline" disabled={sortedSales.length === 0}>
                                    <ArrowRight className="me-2"/> مراجعة
                                </Button>
                            )}
                        </div>
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
                                const medInInventory = (allInventory || []).find(med => med.id === item.medicationId);
                                const itemTotal = (item.isReturn ? -1 : 1) * item.price * item.quantity;
                                const isBelowCost = item.price < item.purchasePrice;
                                const itemProfit = (item.price - item.purchasePrice) * item.quantity;

                                return (
                                    <TableRow key={`${item.medicationId}-${item.isReturn}`} className={cn(item.isReturn && "bg-red-50 dark:bg-red-900/20")}>
                                        <TableCell className="text-center">
                                            <Checkbox checked={!!item.isReturn} onCheckedChange={() => toggleReturn(item.medicationId)} aria-label="Mark as return" disabled={mode !== 'new'}/>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-start gap-3">
                                                {medInInventory?.imageUrl ? (
                                                    <Image src={medInInventory.imageUrl} alt={item.name} width={48} height={48} className="rounded-md object-cover h-12 w-12" />
                                                ) : (
                                                    <div className="h-12 w-12 flex items-center justify-center rounded-md bg-muted text-muted-foreground">
                                                        <Package className="h-6 w-6" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className="font-medium">{item.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {(item.scientificNames || []).join(', ')} {medInInventory?.dosage && `(${medInInventory.dosage})`}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{medInInventory?.company}</div>
                                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-x-2">
                                                        <span>الكلفة: {item.purchasePrice.toLocaleString('ar-IQ')} د.ع</span>
                                                        <span className={cn("font-medium", itemProfit >= 0 ? "text-green-600" : "text-destructive")}>
                                                          | الربح: {itemProfit.toLocaleString('ar-IQ')} د.ع
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                        <div className="flex items-center justify-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity - 1)} disabled={mode !== 'new'}><MinusCircle className="h-4 w-4" /></Button>
                                            <span>{item.quantity}</span>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity + 1)} disabled={mode !== 'new'}><PlusCircle className="h-4 w-4" /></Button>
                                        </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="relative">
                                                <Input type="number" value={item.price} onChange={(e) => updatePrice(item.medicationId, parseFloat(e.target.value))} className={cn("w-24 h-9 text-center", isBelowCost && !item.isReturn && "border-destructive ring-2 ring-destructive/50 focus-visible:ring-destructive" )} step="1" min="0" disabled={mode !== 'new'} />
                                                {isBelowCost && !item.isReturn && (
                                                  <div className="absolute -top-2 -right-2 text-destructive" title="السعر أقل من الكلفة!">
                                                    <AlertTriangle className="h-4 w-4" />
                                                  </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-left font-mono">{itemTotal.toLocaleString('ar-IQ')} د.ع</TableCell>
                                        <TableCell className="text-left">
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.medicationId)} disabled={mode !== 'new'}><X className="h-4 w-4" /></Button>
                                        </TableCell>
                                    </TableRow>
                                );
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                            <PackageSearch className="h-16 w-16 mb-4" />
                            <p className="text-lg">الفاتورة فارغة</p>
                            <p className="text-sm">أضف منتجات لبدء عملية البيع.</p>
                        </div>
                    )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
             <Card className="sticky top-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>ملخص الفاتورة</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                     <div className="space-y-2">
                        <Label>صديق الصيدلية (الزبون)</Label>
                        <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={mode !== 'new'}>
                                    {selectedPatient ? selectedPatient.name : "تحديد صديق الصيدلية"}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>تحديد أو إضافة صديق للصيدلية</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <Input placeholder="ابحث بالاسم..." value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} />
                                    <ScrollArea className="h-48 border rounded-md">
                                        {(filteredPatients || []).map(p => (
                                            <div key={p.id} onClick={() => { setSelectedPatient(p); setIsPatientModalOpen(false); }}
                                                className="p-2 hover:bg-accent cursor-pointer">
                                                {p.name}
                                            </div>
                                        ))}
                                    </ScrollArea>
                                    <Separator />
                                    <div className="space-y-2">
                                        <h4 className="font-medium">أو إضافة جديد</h4>
                                        <Input placeholder="اسم المريض الجديد" value={newPatientName} onChange={e => setNewPatientName(e.target.value)} />
                                        <Input placeholder="رقم الهاتف (اختياري)" value={newPatientPhone} onChange={e => setNewPatientPhone(e.target.value)} />
                                        <Button onClick={handleAddNewPatient} className="w-full" variant="success">
                                            <UserPlus className="me-2" /> إضافة وتحديد
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                     </div>
                    <Separator />

                    <div className="flex justify-between w-full text-md">
                        <span>المجموع الفرعي</span>
                        <span>{subtotal.toLocaleString('ar-IQ')} د.ع</span>
                    </div>
                     <div className="flex justify-between w-full text-md text-green-600">
                        <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> الربح المتوقع</span>
                        <span className="font-semibold">{totalProfit.toLocaleString('ar-IQ')} د.ع</span>
                    </div>
                    <div className="flex items-center justify-between w-full">
                        <Label htmlFor="discount" className="text-md shrink-0 me-2">خصم</Label>
                        <Input id="discount" type="text" value={discountInput} onChange={handleDiscountChange} className="h-9 w-full bg-background ltr:text-left rtl:text-right" placeholder="0" disabled={mode !== 'new'}/>
                    </div>
                    <Separator />
                    <div className="flex justify-between w-full text-lg font-semibold">
                        <span>الإجمالي</span>
                        <span className={finalTotal < 0 ? 'text-destructive' : ''}>{finalTotal.toLocaleString('ar-IQ')} د.ع</span>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-stretch gap-2">
                    {mode === 'new' ? (
                      <>
                        <div className="flex gap-2">
                            <Dialog open={isDosingAssistantOpen} onOpenChange={setIsDosingAssistantOpen}>
                                <DialogTrigger asChild>
                                    <Button size="lg" variant="outline" className="w-1/4 relative" disabled={!isOnline || cart.length === 0} aria-label="مساعد الجرعات">
                                        <Thermometer />
                                        {isOnline ? (
                                            <Wifi className="absolute top-1 right-1 h-3 w-3 text-green-500" />
                                        ) : (
                                            <WifiOff className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />
                                        )}
                                    </Button>
                                </DialogTrigger>
                                <DosingAssistant cartItems={cart} />
                            </Dialog>
                            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                                <DialogTrigger asChild>
                                    <Button size="lg" className="flex-1" onClick={handleCheckout} disabled={cart.length === 0} variant="success">
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
                                                            <TableCell>{item.name} {item.saleUnit && `(${item.saleUnit})`} {item.isReturn && "(مرتجع)"}</TableCell>
                                                            <TableCell className="text-center">{item.quantity}</TableCell>
                                                            <TableCell className="text-left">{((item.isReturn ? -1 : 1) * item.price * item.quantity).toLocaleString('ar-IQ')} د.ع</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                        <Separator/>
                                        <div className="space-y-2 text-sm">
                                            {selectedPatient && <div className="flex justify-between"><span>المريض:</span><span>{selectedPatient.name}</span></div>}
                                            <div className="flex justify-between"><span>المجموع الفرعي:</span><span>{subtotal.toLocaleString('ar-IQ')} د.ع</span></div>
                                            <div className="flex justify-between"><span>الخصم:</span><span>-{discount.toLocaleString('ar-IQ')} د.ع</span></div>
                                             <div className="flex justify-between text-green-600"><span>الربح الصافي:</span><span>{(totalProfit - discount).toLocaleString('ar-IQ')} د.ع</span></div>
                                            <div className="flex justify-between font-bold text-lg"><span>الإجمالي النهائي:</span><span>{finalTotal.toLocaleString('ar-IQ')} د.ع</span></div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                        <Button onClick={handleFinalizeSale} variant="success">تأكيد البيع</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full" disabled={cart.length === 0}>
                                    <X className="me-2"/>
                                    إلغاء الفاتورة
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد من إلغاء الفاتورة؟</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        سيتم حذف جميع الأصناف من السلة الحالية.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>تراجع</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => {
                                        resetSale();
                                        toast({ title: "تم إلغاء الفاتورة" });
                                    }} className={buttonVariants({ variant: "destructive" })}>نعم، قم بالإلغاء</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </>
                    ) : (
                        <Button onClick={() => {
                            setSaleToPrint(sortedSales[reviewIndex]);
                            setIsPrintReviewOpen(true);
                        }} className="w-full">
                            <Printer className="me-2 h-4 w-4" />
                            طباعة الفاتورة
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>

        <Dialog open={isReceiptOpen} onOpenChange={(open) => {
            if (!open) {
                if (mode === 'new') {
                    resetSale();
                }
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
                    <Button onClick={() => {
                        setIsReceiptOpen(false);
                        handleNewInvoiceClick();
                    }} className="w-full sm:w-auto">
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

        <Dialog open={isPrintReviewOpen} onOpenChange={setIsPrintReviewOpen}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>طباعة الفاتورة #{saleToPrint?.id}</DialogTitle>
                    <DialogDescription>معاينة سريعة قبل الطباعة.</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto border rounded-md bg-gray-50">
                    <InvoiceTemplate sale={saleToPrint} settings={settings || null} ref={null} />
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">إغلاق</Button>
                    </DialogClose>
                    <Button onClick={handlePrint}>
                        <Printer className="me-2 h-4 w-4" />
                        طباعة
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
    </>
  )
}
