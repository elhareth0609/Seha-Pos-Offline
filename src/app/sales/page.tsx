
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
import type { Medication, SaleItem, Sale, AppSettings, Patient, DoseCalculationOutput, Notification } from "@/lib/types"
import { PlusCircle, X, PackageSearch, ScanLine, ArrowLeftRight, Printer, User as UserIcon, AlertTriangle, TrendingUp, FilePlus, UserPlus, Package, Thermometer, BrainCircuit, WifiOff, Wifi, Replace, Percent, Pencil, Trash2, ArrowRight, FileText, Calculator } from "lucide-react"
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { InvoiceTemplate } from "@/components/ui/invoice"
import { useAuth } from "@/hooks/use-auth"
import { buttonVariants } from "@/components/ui/button"
import { calculateDose, type DoseCalculationInput } from "@/ai/flows/dose-calculator-flow"
import { Skeleton } from "@/components/ui/skeleton"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import AdCarousel from "@/components/ui/ad-carousel"
import { differenceInDays, parseISO, startOfToday } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { PinDialog } from "@/components/auth/PinDialog"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { CalculatorComponent } from "@/components/ui/calculator"
import { Textarea } from "@/components/ui/textarea"

const printElement = (element: HTMLElement, title: string = 'Print') => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  
  const stylesheets = Array.from(document.styleSheets)
    .map(stylesheet => {
      try {
        return Array.from(stylesheet.cssRules)
          .map(rule => rule.cssText)
          .join('\n');
      } catch (e) {
        if (stylesheet.href) {
          return `@import url("${stylesheet.href}");`;
        }
        return '';
      }
    })
    .join('\n');

  const inlineStyles = Array.from(document.querySelectorAll('style'))
    .map(style => style.innerHTML)
    .join('\n');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          ${stylesheets}
          ${inlineStyles}
          @media print {
            body { margin: 0; }
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          }
        </style>
      </head>
      <body dir="rtl">
        ${element.outerHTML}
      </body>
    </html>
  `);
  
  printWindow.document.close();
  
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
};

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
    const [patientNotes, setPatientNotes] = React.useState('');
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
            .filter(item => !item.is_return)
            .map(item => ({
                tradeName: item.name,
                scientific_names: item.scientific_names || [],
                dosage: item.dosage || 'N/A',
                dosage_form: item.dosage_form || 'N/A'
            }));
            
        try {
            const response = await calculateDose({ 
                patientAge: age, 
                medications: medicationsInput,
                patientNotes: patientNotes || undefined,
            });
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
                   أدخل عمر المريض وأي ملاحظات إضافية للحصول على اقتراحات للجرعات وكشف التفاعلات الدوائية.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="patient-age">عمر المريض (بالسنوات)</Label>
                        <Input id="patient-age" type="number" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="مثال: 5" />
                    </div>
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="patient-notes">ملاحظات إضافية عن المريض (اختياري)</Label>
                        <Input id="patient-notes" value={patientNotes} onChange={(e) => setPatientNotes(e.target.value)} placeholder="مثال: حامل، مريض سكر، يعاني من الضغط" />
                    </div>
                </div>
                 <Button onClick={handleCalculate} disabled={isLoading || cartItems.length === 0} className="w-full">
                    {isLoading ? <BrainCircuit className="me-2 h-4 w-4 animate-spin" /> : <Thermometer className="me-2 h-4 w-4" />}
                    حساب وتحليل
                </Button>
                
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
                                                        <DialogHeader>
                                                            <DialogTitle>تعليمات الاستخدام</DialogTitle>
                                                        </DialogHeader>
                                                        <div className="grid gap-4">
                                                            <div className="space-y-2">
                                                                
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

const getExpirationBadge = (expiration_date: string | undefined, threshold: number) => {
    if (!expiration_date) return null;
    const today = startOfToday();
    const expDate = parseISO(expiration_date);
    
    if (expDate < today) {
        return <Badge variant="destructive">منتهي</Badge>
    }

    const daysLeft = differenceInDays(expDate, today);
    if (daysLeft <= threshold) {
      return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">قريب الانتهاء</Badge>
    }
    return null;
};

export default function SalesPage() {
  const { 
    currentUser, 
    scopedData, 
    activeInvoices, 
    currentInvoiceIndex,
    updateActiveInvoice,
    switchToInvoice,
    createNewInvoice,
    closeInvoice,
    addPatient, 
    addSale, 
    updateSale, 
    deleteSale,
    searchAllInventory,
    searchAllSales,
    searchAllPatients,
    verifyPin
  } = useAuth();

  const router = useRouter();

  const [settings] = scopedData.settings;
  const [allInventory, setAllInventory] = React.useState<Medication[]>([]);

  const activeInvoice = activeInvoices[currentInvoiceIndex];
  if (!activeInvoice) {
      return <div>Loading...</div>;
  }
  const { cart, discountType, discountValue, patientId, paymentMethod, saleIdToUpdate } = activeInvoice;
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<Medication[]>([])
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
  const [saleToPrint, setSaleToPrint] = React.useState<Sale | null>(null);
  const [alternativeExpiryAlert, setAlternativeExpiryAlert] = React.useState<Notification | null>(null);
  
  const [isDosingAssistantOpen, setIsDosingAssistantOpen] = React.useState(false);

  const [isPatientModalOpen, setIsPatientModalOpen] = React.useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = React.useState("");
  const [patientSuggestions, setPatientSuggestions] = React.useState<Patient[]>([]);
  const [newPatientName, setNewPatientName] = React.useState("");
  const [newPatientPhone, setNewPatientPhone] = React.useState("");
  const [sortedSales, setSortedSales] = React.useState<Sale[]>([]);

  const [mode, setMode] = React.useState<'sale' | 'return'>('sale');
  
  const isOnline = useOnlineStatus();
  const priceModificationAllowed = currentUser?.role === 'Admin' || currentUser?.permissions?.manage_salesPriceModification;
  const canManagePreviousSales = currentUser?.role === 'Admin' || currentUser?.permissions?.manage_previous_sales;

  const { toast } = useToast()
  
  const printComponentRef = React.useRef(null);

  const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false);
  const [isControlledDrugPinOpen, setIsControlledDrugPinOpen] = React.useState(false);


    const handlePrint = () => {
        if (printComponentRef.current && saleToPrint) {
            printElement(printComponentRef.current, `invoice-${saleToPrint?.id}`);
        }
    };
    
    React.useEffect(() => {
        async function fetchInitialSales() {
            const initialSales = await searchAllSales();
            setSortedSales(initialSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        fetchInitialSales();
    }, [searchAllSales]);

    const checkAlternativeExpiry = React.useCallback((medication: Medication) => {
        if (!medication.scientific_names || medication.scientific_names.length === 0 || mode === 'return') {
            setAlternativeExpiryAlert(null);
            return;
        }
    
        const alternatives = allInventory.filter(med => 
            med.id !== medication.id &&
            med.scientific_names?.some(scName => medication.scientific_names!.includes(scName))
        );
    
        let closerExpiryAlternative: Medication | null = null;
        for (const alt of alternatives) {
             if (alt.expiration_date && medication.expiration_date && parseISO(alt.expiration_date) < parseISO(medication.expiration_date)) {
                if (!closerExpiryAlternative || (closerExpiryAlternative.expiration_date && parseISO(alt.expiration_date) < parseISO(closerExpiryAlternative.expiration_date))) {
                    closerExpiryAlternative = alt;
                }
            }
        }
        
        if (closerExpiryAlternative) {
             setAlternativeExpiryAlert({
                id: `alt_expiry_${medication.id}`,
                type: 'alternative_expiry',
                message: `تنبيه: يوجد بديل (${closerExpiryAlternative.name}) بتاريخ انتهاء أقرب. يُنصح ببيعه أولاً.`,
                data: { originalMedication: medication, alternativeMedication: closerExpiryAlternative },
                read: false,
                created_at: new Date().toISOString()
            });
        } else {
            setAlternativeExpiryAlert(null);
        }
    }, [allInventory, mode]);

    const addToCart = React.useCallback((medication: Medication) => {
        // Expiry check
        const today = new Date();
        today.setHours(0,0,0,0);
        if (medication.expiration_date && parseISO(medication.expiration_date) < today && mode !== 'return') {
            toast({ variant: 'destructive', title: 'منتج منتهي الصلاحية', description: `لا يمكن بيع ${medication.name} لأنه منتهي الصلاحية.` });
            return;
        }

        // Stock check
        if (medication.stock <= 0 && mode !== 'return') {
            toast({ variant: 'destructive', title: 'نفد من المخزون', description: `لا يمكن بيع ${medication.name} لأن الكمية 0.` });
            return;
        }

        updateActiveInvoice(invoice => {
            const existingItem = invoice.cart.find(item => item.id === medication.id && item.is_return === (mode === 'return'))

            if (existingItem) {
                if (Number(existingItem.quantity) >= Number(medication.stock) && mode !== 'return') {
                    toast({ variant: 'destructive', title: 'كمية غير كافية', description: `لا يمكن إضافة المزيد من ${medication.name}. الرصيد المتوفر: ${medication.stock}` });
                    return invoice;
                }
                return {
                    ...invoice,
                    cart: invoice.cart.map(item =>
                        item.id === medication.id && item.is_return === (mode === 'return')
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                    )
                }
            }
             return {
                ...invoice,
                cart: [...invoice.cart, { 
                    id: medication.id, 
                    medication_id: medication.id, 
                    name: medication.name, 
                    scientific_names: medication.scientific_names, 
                    quantity: 1, 
                    price: medication.price || 0,
                    purchase_price: medication.purchase_price || 0, 
                    expiration_date: medication.expiration_date, 
                    is_return: mode === 'return', 
                    dosage: medication.dosage,
                    dosage_form: medication.dosage_form,
                }]
             }
        });
        
        checkAlternativeExpiry(medication);
        setSearchTerm("")
        setSuggestions([])
    }, [mode, updateActiveInvoice, toast, checkAlternativeExpiry])
    
    const removeFromCart = React.useCallback((id: string, isReturn: boolean | undefined) => {
        updateActiveInvoice(invoice => ({
            ...invoice,
            cart: invoice.cart.filter(item => !(item.id === id && item.is_return === isReturn))
        }));
        if(alternativeExpiryAlert?.data?.originalMedication?.id === id) {
            setAlternativeExpiryAlert(null);
        }
    }, [updateActiveInvoice, alternativeExpiryAlert]);

    const handleSwapAndAddToCart = () => {
        if (!alternativeExpiryAlert || !alternativeExpiryAlert.data) return;
        const { originalMedication, alternativeMedication } = alternativeExpiryAlert.data;

        if (originalMedication && alternativeMedication) {
            removeFromCart(originalMedication.id, false);
            addToCart(alternativeMedication as Medication);
            setAlternativeExpiryAlert(null);
        }
    };
  
  const handleScan = React.useCallback(async (result: string) => {
    const results = await searchAllInventory(result);
    setAllInventory(results); // Make sure full inventory is available for checks
    const scannedMedication = results.find(med => (med.barcodes || []).includes(result));
    
    if (scannedMedication) {
      addToCart(scannedMedication);
      toast({ title: 'تمت الإضافة إلى السلة', description: `تمت إضافة ${scannedMedication.name} بنجاح.` });
    } else {
      toast({ variant: 'destructive', title: 'لم يتم العثور على المنتج', description: 'الباركود الممسوح ضوئيًا لا يتطابق مع أي منتج.' });
    }
    setIsScannerOpen(false);
  }, [addToCart, searchAllInventory, toast]);


  React.useEffect(() => {
    const handler = setTimeout(async () => {
        if (searchTerm.length > 5 && suggestions.length === 0) {
            const results = await searchAllInventory(searchTerm);
            setAllInventory(results); // Make sure full inventory is available for checks
            const medicationByBarcode = results.find(med => med.barcodes && med.barcodes.some(bc => bc.toLowerCase() === searchTerm.toLowerCase()));
            if (medicationByBarcode) {
                addToCart(medicationByBarcode);
            }
        }
    }, 100);

    return () => {
        clearTimeout(handler);
    };
  }, [searchTerm, suggestions, addToCart, searchAllInventory]);


  React.useEffect(() => {
    async function fetchInventory() {
        const results = await searchAllInventory('');
        setAllInventory(results);
    }
    fetchInventory();
  }, [searchAllInventory]);


  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 0) {
        const results = await searchAllInventory(value);
        setAllInventory(results); // Store all results for alternative check
        setSuggestions(results.slice(0, 5));
    } else {
        setSuggestions([]);
        setAllInventory([]);
    }
  }

  const handleSearchKeyDown = React.useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
        event.preventDefault();

        if (suggestions.length > 0) {
            addToCart(suggestions[0]);
            return;
        }
        
        const results = await searchAllInventory(searchTerm);
        setAllInventory(results); // Make sure full inventory is available for checks
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        
        const medicationByBarcode = results.find(med => med.barcodes && med.barcodes.some(bc => bc.toLowerCase() === lowercasedSearchTerm));
        if (medicationByBarcode) {
            addToCart(medicationByBarcode);
            return;
        }
        
        const medicationByName = results.find(med => med.name && med.name.toLowerCase() === lowercasedSearchTerm);
        if (medicationByName) {
            addToCart(medicationByName);
            return;
        }

        if (searchTerm) {
            toast({ variant: 'destructive', title: 'لم يتم العثور على المنتج', description: 'يرجى التأكد من المعرف أو البحث بالاسم.' });
        }
    }
  }, [suggestions, searchTerm, addToCart, toast, searchAllInventory]);

  const updateQuantity = (id: string, isReturn: boolean | undefined, newQuantityStr: string) => {
    const newQuantity = parseFloat(newQuantityStr);
    if (isNaN(newQuantity) || newQuantity < 0) return;
    
    updateActiveInvoice(invoice => ({
        ...invoice,
        cart: invoice.cart.map(item => (item.id === id && item.is_return === isReturn ? { ...item, quantity: newQuantity } : item))
    }));
  };

  const updateTotalPrice = (id: string, isReturn: boolean | undefined, newTotalPriceStr: string) => {
    if (!/^\d*\.?\d*$/.test(newTotalPriceStr)) return;
    
    const newTotalPrice = parseFloat(newTotalPriceStr);
    if (isNaN(newTotalPrice) || newTotalPrice < 0) return;

    updateActiveInvoice(invoice => ({
        ...invoice,
        cart: invoice.cart.map(item => {
            if (item.id === id && item.is_return === isReturn) {
                const newUnitPrice = item.quantity > 0 ? newTotalPrice / item.quantity : 0;
                return { ...item, price: newUnitPrice };
            }
            return item;
        })
    }));
  };

  const subtotal = cart.reduce((total, item) => {
      const itemTotal = (item.price || 0) * (item.quantity || 0);
      return item.is_return ? total - itemTotal : total + itemTotal;
  }, 0);

  const totalProfit = cart.reduce((acc, item) => {
      const itemProfit = ((item.price || 0) - (item.purchase_price || 0)) * (item.quantity || 0);
      return item.is_return ? acc - itemProfit : acc + itemProfit;
  }, 0);
  
  const discountAmount = React.useMemo(() => {
    const value = parseFloat(String(discountValue));
    if (isNaN(value) || value < 0) return 0;
    if (discountType === 'percentage') {
        return (subtotal * value) / 100;
    }
    return value;
  }, [discountValue, discountType, subtotal]);

  const finalTotal = subtotal - discountAmount;
  const finalProfit = totalProfit - discountAmount;

  const [selectedPatient, setSelectedPatient] = React.useState<Patient | null>(null);
  React.useEffect(() => {
      async function getPatient() {
          if (patientId) {
              const results = await searchAllPatients(patientId);
              const patient = results.find(p => p.id == patientId);
              setSelectedPatient(patient || null);
          } else {
              setSelectedPatient(null);
          }
      }
      getPatient();
  }, [patientId, searchAllPatients]);


  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: "السلة فارغة", description: "أضف منتجات إلى السلة قبل إتمام العملية.", variant: "destructive" })
      return;
    }

    if (paymentMethod === 'credit' && !patientId) {
        toast({ title: "مريض غير محدد", description: "يجب تحديد مريض (صديق صيدلية) للفواتير الآجلة.", variant: "destructive" })
        return;
    }
    
    for (const itemInCart of cart) {
        if (!itemInCart.is_return) {
            const med = allInventory?.find(m => m.id === itemInCart.id);
            if (!med || Number(med.stock) < Number(itemInCart.quantity)) {
                toast({ variant: 'destructive', title: `كمية غير كافية من ${itemInCart.name}`, description: `الكمية المطلوبة ${itemInCart.quantity}, المتوفر ${med?.stock ?? 0}` });
                return;
            }
        }
    }
    
    const controlledSubstances = settings.controlled_substances || [];
    const hasControlledDrug = cart.some(item => 
        !item.is_return && item.scientific_names?.some(scName => 
            controlledSubstances.map(cs => cs.toLowerCase()).includes(scName.toLowerCase())
        )
    );

    if (hasControlledDrug) {
        setIsControlledDrugPinOpen(true);
    } else {
        setIsCheckoutOpen(true);
    }
  }
  
  const handleFinalizeSale = async () => {
    if (!currentUser) return;
    
    const saleData = {
        id: saleIdToUpdate, // Pass ID if updating
        items: cart,
        total: finalTotal,
        profit: totalProfit,
        discount: discountAmount,
        patient_id: selectedPatient?.id || null,
        patient_name: selectedPatient?.name,
        employee_id: currentUser.id,
        employee_name: currentUser.name,
        payment_method: paymentMethod,
    };
    
    const resultSale = saleIdToUpdate ? await updateSale(saleData) : await addSale(saleData);

    if (resultSale) {
        toast({ title: saleIdToUpdate ? "تم تحديث الفاتورة بنجاح" : "تمت العملية بنجاح", description: `تم تسجيل الفاتورة رقم ${resultSale.id}` });
        
        setSaleToPrint(resultSale);
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true);
        const latestSales = await searchAllSales();
        setSortedSales(latestSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setAlternativeExpiryAlert(null);
    }
  }

  const handleControlledDrugPinConfirm = async (pin: string) => {
    const isValid = await verifyPin(pin);
    if(isValid) {
        setIsControlledDrugPinOpen(false);
        setIsCheckoutOpen(true);
    } else {
        toast({ variant: 'destructive', title: "رمز PIN غير صحيح" });
    }
  }

  const handleDeleteCurrentSale = async () => {
    if (!saleIdToUpdate) return;
    if (currentUser?.require_pin_for_delete) {
        setIsPinDialogOpen(true);
    } else {
        const success = await deleteSale(saleIdToUpdate);
        if(success) {
            setSortedSales(prev => prev.filter(s => s.id !== saleIdToUpdate));
            closeInvoice(currentInvoiceIndex);
            toast({ title: "تم حذف الفاتورة" });
        }
    }
  }
  
  const handlePinConfirmDelete = async (pin: string) => {
    if (!saleIdToUpdate) return;
    const isValid = await verifyPin(pin);
    if (isValid) {
        setIsPinDialogOpen(false);
        const success = await deleteSale(saleIdToUpdate);
        if(success) {
            setSortedSales(prev => prev.filter(s => s.id !== saleIdToUpdate));
            closeInvoice(currentInvoiceIndex);
            toast({ title: "تم حذف الفاتورة" });
        }
    } else {
        toast({ variant: 'destructive', title: "رمز PIN غير صحيح" });
    }
  };


  const handleNewInvoiceClick = () => {
    createNewInvoice();
    setSearchTerm('');
    setSaleToPrint(null);
    setAlternativeExpiryAlert(null);
    setMode('sale');
  };
  
  const handleCloseInvoice = (index: number) => {
    closeInvoice(index);
    setSearchTerm('');
    setSaleToPrint(null);
    setAlternativeExpiryAlert(null);
    setMode('sale');
  };
  
  const handleReviewClick = () => {
    router.push('/reports');
  }

  const handleAddNewPatient = async () => {
      const newPatient = await addPatient(newPatientName, newPatientPhone);
      if (newPatient) {
          updateActiveInvoice(prev => ({...prev, patientId: newPatient.id}));
          toast({ title: "تم إضافة المريض", description: `تم تحديد ${newPatient.name} لهذه الفاتورة.` });
          setNewPatientName("");
          setNewPatientPhone("");
          setPatientSearchTerm("");
          setIsPatientModalOpen(false);
      }
  }

  const handlePatientSearch = async (term: string) => {
    setPatientSearchTerm(term);
    if(term) {
        const results = await searchAllPatients(term);
        setPatientSuggestions(results);
    } else {
        setPatientSuggestions([]);
    }
  }

  const findAlternatives = (currentItem: SaleItem): Medication[] => {
    if (!allInventory || !currentItem.scientific_names || currentItem.scientific_names.length === 0) {
        return [];
    }
    const currentScientificNames = currentItem.scientific_names.map(s => s.toLowerCase());

    return allInventory.filter(med => 
        med.id !== currentItem.id &&
        med.scientific_names?.some(scName => currentScientificNames.includes(scName.toLowerCase()))
    );
};

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            updateActiveInvoice(prev => ({...prev, discountValue: value}));
        }
    };
    
    const handlePaymentMethodChange = (value: 'cash' | 'card' | 'credit') => {
        updateActiveInvoice(prev => ({...prev, paymentMethod: value}));
    };
    
  const handleModeChange = (newMode: 'sale' | 'return') => {
    if (!newMode) return;
    setMode(newMode);
    updateActiveInvoice(invoice => {
        return {
            ...invoice,
            cart: invoice.cart.map(item => ({ ...item, is_return: newMode === 'return' }))
        }
    });
  };

  return (
    <>
    <TooltipProvider>
        <div className="hidden">
            <InvoiceTemplate ref={printComponentRef} sale={saleToPrint} settings={settings || null} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:h-[calc(100vh-6rem)]">
            <div className="lg:col-span-2 flex flex-col gap-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input 
                            placeholder="امسح الباركود أو ابحث بالاسم التجاري أو العلمي..."
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
                                            <li
                                                key={med.id}
                                                className="group p-3 hover:bg-accent rounded-md flex justify-between items-center cursor-pointer"
                                                onMouseDown={(e) => { e.preventDefault(); addToCart(med); }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {typeof med.image_url === 'string' && med.image_url !== "" ? (
                                                        <Image
                                                            src={med.image_url}
                                                            alt={med.name || ''}
                                                            width={32}
                                                            height={32}
                                                            className="rounded-sm object-cover h-8 w-8"
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 flex items-center justify-center rounded-sm bg-muted text-muted-foreground group-hover:text-white">
                                                            <Package className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium group-hover:text-white">{med.name}</div>
                                                        <div className="text-xs text-muted-foreground group-hover:text-white">
                                                            {med.scientific_names?.join(', ')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-white">
                                                    <span>{med.stock}</span>
                                                    {getExpirationBadge(med.expiration_date, settings.expirationThresholdDays)}
                                                    <span className="font-mono">{(med.price || 0).toLocaleString()}</span>
                                                </div>
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
                     <Button variant="secondary" onClick={handleReviewClick}>
                        <FileText className="me-2"/>
                        مراجعة الفواتير
                    </Button>
                </div>

                <Card className="flex-1 flex flex-col">
                    <CardHeader className="py-4 border-b">
                        <div className="flex items-center justify-between gap-2">
                             <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                 {activeInvoices.map((inv, index) => (
                                    <Button 
                                        key={index} 
                                        variant={index === currentInvoiceIndex ? "secondary" : "ghost"}
                                        onClick={() => switchToInvoice(index)}
                                        className="h-9 px-3 gap-2"
                                    >
                                        <span>فاتورة {index + 1}</span>
                                        {activeInvoices.length > 1 && (
                                            <span 
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={(e) => { e.stopPropagation(); handleCloseInvoice(index); }}>
                                                <X className="h-3 w-3 " />
                                            </span>
                                        )}
                                    </Button>
                                 ))}
                                 <Button size="icon" variant="ghost" onClick={handleNewInvoiceClick}>
                                    <PlusCircle className="h-4 w-4"/>
                                 </Button>
                            </div>
                            <ToggleGroup type="single" value={mode} onValueChange={(value: 'sale' | 'return') => handleModeChange(value)} size="sm">
                                <ToggleGroupItem value="sale" aria-label="Toggle sale">
                                    بيع
                                </ToggleGroupItem>
                                <ToggleGroupItem value="return" aria-label="Toggle return">
                                    إرجاع
                                </ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                     {alternativeExpiryAlert && (
                        <Alert variant="default" className="m-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <AlertTitle className="text-yellow-800 dark:text-yellow-300">تنبيه بديل</AlertTitle>
                            <AlertDescription className="text-yellow-700 dark:text-yellow-400 flex items-center justify-between">
                                <span>{alternativeExpiryAlert.message}</span>
                                <div>
                                    <Button variant="ghost" size="sm" className="text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200" onClick={handleSwapAndAddToCart}>استبدال وإضافة</Button>
                                    <Button variant="link" className="p-0 h-auto ms-2 text-yellow-700 dark:text-yellow-400" onClick={() => setAlternativeExpiryAlert(null)}>إخفاء</Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                    <ScrollArea className="h-full">
                    {cart.length > 0 ? (
                        <>
                            <div className="md:hidden divide-y divide-border">
                                {cart.map((item) => {
                                    const medInInventory = allInventory?.find(med => med.id === item.id);
                                    const stock = medInInventory?.stock ?? 0;
                                    const remainingStock = stock - (item.quantity || 0);
                                    const isBelowCost = (Number(item.price) || 0) < (Number(item.purchase_price) || 0);
                                    const alternatives = findAlternatives(item);
                                    return (
                                        <div key={`${item.id}-${item.is_return}`} className={cn("flex flex-col gap-3 p-3", item.is_return && "bg-red-50 dark:bg-red-900/20")} onClick={() => {
                                            const medication = allInventory.find(med => med.id === item.id);
                                            if (medication) checkAlternativeExpiry(medication);
                                        }}>
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-1 font-medium">
                                                        {item.name} {item.dosage} {item.dosage_form}
                                                        {alternatives.length > 0 && (
                                                            <Popover>
                                                                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-primary/70 hover:text-primary">
                                                                    <Replace className="h-4 w-4" /></Button>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-80">
                                                                    <DialogHeader>
                                                                        <DialogTitle>بدائل متاحة</DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="space-y-2">
                                                                        
                                                                        <div className="space-y-1">
                                                                            {alternatives.map(alt => (
                                                                                <div key={alt.id} className="text-sm p-2 hover:bg-accent rounded-md flex justify-between items-center">
                                                                                    <div>
                                                                                        <div>{alt.name}</div>
                                                                                        <div className="text-xs text-muted-foreground">المتوفر: {alt.stock}</div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="font-mono">{alt.price}</span>
                                                                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => addToCart(alt)}>
                                                                                            <PlusCircle className="h-4 w-4 text-green-600" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">({(item.scientific_names || []).join(', ')})</div>
                                                </div>
                                                <Button variant="ghost" size="icon" 
                                                className="h-8 w-8 shrink-0 hover:text-white" 
                                                onClick={() => removeFromCart(item.id, item.is_return)}>
                                                    <X className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 items-end">
                                                <div className="space-y-1">
                                                    <Label htmlFor={`quantity-sm-${item.id}`} className="text-xs">الكمية</Label>
                                                    <Input id={`quantity-sm-${item.id}`} type="number" value={item.quantity || 1} min={0} onChange={(e) => updateQuantity(item.id, item.is_return, e.target.value)} className="h-9 text-center font-mono" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor={`price-sm-${item.id}`} className="text-xs">السعر الإجمالي</Label>
                                                    <div className="relative">
                                                        <Input id={`price-sm-${item.id}`} type="text" pattern="[0-9]*" value={((item.price || 0) * (item.quantity || 0))} onChange={(e) => updateTotalPrice(item.id, item.is_return, e.target.value)} className={cn("h-9 text-center font-mono", isBelowCost && !item.is_return && "border-destructive ring-2 ring-destructive/50 focus-visible:ring-destructive" )} disabled={!priceModificationAllowed} />
                                                        {isBelowCost && !item.is_return && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="absolute -top-2 -left-2 text-destructive">
                                                                        <AlertTriangle className="h-4 w-4" />
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>السعر أقل من الكلفة!</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        )}
                                                     </div>
                                                </div>
                                            </div>
                                             <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                                                <span>الرصيد: {stock}</span>
                                                {!item.is_return && <span>| المتبقي: <span className={remainingStock < 0 ? "text-destructive font-bold" : ""}>{remainingStock}</span></span>}
                                                <span>| الشراء: <span className="font-mono">{item.purchase_price || 0}</span></span>
                                             </div>
                                        </div>
                                    )
                                })}
                            </div>

                          <Table className="hidden md:table">
                              <TableHeader className="sticky top-0 bg-background z-10">
                                  <TableRow>
                                      <TableHead>المنتج</TableHead>
                                      <TableHead className="w-[120px] text-center">الكمية</TableHead>
                                      <TableHead className="w-[120px] text-center">السعر</TableHead>
                                      <TableHead className="w-12"></TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {cart.map((item) => {
                                    const medInInventory = allInventory?.find(med => med.id === item.id);
                                    const stock = medInInventory?.stock ?? 0;
                                    const remainingStock = stock - (item.quantity || 0);
                                    const isBelowCost = (Number(item.price) || 0) < (Number(item.purchase_price) || 0);
                                    const alternatives = findAlternatives(item);

                                    return (
                                        <TableRow key={`${item.id}-${item.is_return}`} className={cn(item.is_return && "bg-red-50 dark:bg-red-900/20", "cursor-pointer")} onClick={() => {
                                            const medication = allInventory.find(med => med.id === item.id);
                                            if (medication) checkAlternativeExpiry(medication);
                                        }}>

                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">{item.name} {item.dosage} {item.dosage_form}</span>
                                                    {alternatives.length > 0 && (
                                                        <Popover>
                                                            <PopoverTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-primary/70 hover:text-primary">
                                                                    <Replace className="h-4 w-4" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80">
                                                                <DialogHeader>
                                                                    <DialogTitle>بدائل متاحة</DialogTitle>
                                                                </DialogHeader>
                                                                <div className="space-y-2">
                                                                    <div className="space-y-1">
                                                                        {alternatives.map(alt => (
                                                                            <div key={alt.id} className="text-sm p-2 hover:bg-accent rounded-md flex justify-between items-center">
                                                                                <div>
                                                                                    <div>{alt.name}</div>
                                                                                    <div className="text-xs text-muted-foreground">المتوفر: {alt.stock}</div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="font-mono">{alt.price}</span>
                                                                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => addToCart(alt)}>
                                                                                        <PlusCircle className="h-4 w-4 text-green-600" />
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </PopoverContent>
                                                        </Popover>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">({(item.scientific_names || []).join(', ')})</div>
                                                <div className="text-xs text-muted-foreground flex gap-2">
                                                    <span>الرصيد: {stock}</span> 
                                                    {!item.is_return && <span>| المتبقي: <span className={remainingStock < 0 ? "text-destructive font-bold" : ""}>{remainingStock}</span></span>}
                                                    <span>| الشراء: <span className="font-mono">{item.purchase_price || 0}</span></span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                             <Input
                                                id={`quantity-${item.id}`}
                                                type="number"
                                                value={item.quantity || 1}
                                                onChange={(e) => updateQuantity(item.id, item.is_return, e.target.value)}
                                                min={0}
                                                className="w-20 h-9 text-center font-mono"
                                             />
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative">
                                                    <Input 
                                                      type="text"
                                                      pattern="[0-9]*"
                                                      value={((item.price || 0) * (item.quantity || 0))}
                                                      onChange={(e) => updateTotalPrice(item.id, item.is_return, e.target.value)} 
                                                      className={cn("w-24 h-9 text-center font-mono", isBelowCost && !item.is_return && "border-destructive ring-2 ring-destructive/50 focus-visible:ring-destructive" )}
                                                      step="1"
                                                      min="0" 
                                                      disabled={!priceModificationAllowed} />
                                                    {isBelowCost && !item.is_return && (
                                                      <Tooltip>
                                                        <TooltipTrigger asChild>
                                                          <div className="absolute -top-2 -left-2 text-destructive" title="السعر أقل من الكلفة!">
                                                            <AlertTriangle className="h-4 w-4" />
                                                          </div>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>السعر أقل من الكلفة!</p>
                                                        </TooltipContent>
                                                      </Tooltip>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-left">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id, item.is_return)}><X className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                  })}
                              </TableBody>
                          </Table>
                          </>
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
                              <PackageSearch className="h-16 w-16 mb-4" />
                              <p className="text-lg">{saleIdToUpdate ? 'لا توجد أصناف في هذه الفاتورة' : 'الفاتورة فارغة'}</p>
                              <p className="text-sm">أضف منتجات لبدء عملية البيع.</p>
                          </div>
                      )}
                      </ScrollArea>
                  </CardContent>
              </Card>
          </div>

          <div className="lg:col-span-1">
               <Card className="sticky top-6">
                  <CardContent className="flex flex-col gap-4 pt-6">
                      <div className="mb-2">
                        <AdCarousel page="sales"/>
                      </div>
                       <div className="space-y-2">
                          <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
                              <DialogTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                                      <UserIcon className="me-2 text-muted-foreground" />
                                      {selectedPatient ? selectedPatient.name : "تحديد صديق الصيدلية (الزبون)"}
                                  </Button>
                              </DialogTrigger>
                              <DialogContent>
                                  <DialogHeader>
                                      <DialogTitle>تحديد أو إضافة صديق للصيدلية</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                      <Input placeholder="ابحث بالاسم..." value={patientSearchTerm} onChange={(e) => handlePatientSearch(e.target.value)} />
                                      <ScrollArea className="h-48 border rounded-md">
                                          {patientSuggestions.map(p => (
                                              <div key={p.id} onClick={() => { updateActiveInvoice(prev => ({...prev, patientId: p.id})); setIsPatientModalOpen(false); }}
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
                          <span>المجموع</span>
                          <span className="font-mono">{subtotal.toLocaleString()}</span>
                      </div>
                       <div className={cn(
                           "flex justify-between w-full text-md",
                           finalProfit >= 0 ? "text-green-600" : "text-destructive"
                        )}>
                          <span className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> الربح الصافي</span>
                          <span className="font-semibold font-mono">{finalProfit.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="discount" className="text-md shrink-0">خصم</Label>
                        <Input 
                        id="discount" 
                        type="number" 
                        value={discountValue || ''} 
                        onChange={handleDiscountChange}
                        className="h-9 w-full bg-background ltr:text-left rtl:text-right font-mono" 
                        placeholder="0" 
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        />
                        <RadioGroup defaultValue="fixed" value={discountType} onValueChange={(value: any) => updateActiveInvoice(prev => ({...prev, discountType: value}))} className="flex">
                            <Button type="button" size="sm" variant={discountType === 'fixed' ? 'secondary' : 'ghost'} onClick={() => updateActiveInvoice(prev => ({...prev, discountType: 'fixed'}))}>IQD</Button>
                            <Button type="button" size="icon" variant={discountType === 'percentage' ? 'secondary' : 'ghost'} onClick={() => updateActiveInvoice(prev => ({...prev, discountType: 'percentage'}))} className="h-9 w-9"><Percent className="h-4 w-4" /></Button>
                        </RadioGroup>
                      </div>
                      <Separator />
                      <div className="flex justify-between w-full text-lg font-semibold">
                          <span>الإجمالي</span>
                           <span className={cn("font-mono", finalTotal < 0 ? 'text-destructive' : '')}>{finalTotal.toLocaleString()}</span>
                      </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-2">
                       <div className="flex items-center gap-2">
                           <Dialog>
                               <DialogTrigger asChild>
                                   <Button variant="outline" size="icon">
                                       <Calculator />
                                   </Button>
                               </DialogTrigger>
                               <DialogContent className="w-auto p-0 border-0 bg-transparent shadow-none">
                                    <CalculatorComponent />
                               </DialogContent>
                           </Dialog>
                          <Dialog open={isDosingAssistantOpen} onOpenChange={setIsDosingAssistantOpen}>
                              <DialogTrigger asChild>
                                  <Button size="icon" variant="outline" className="relative" disabled={!isOnline || cart.length === 0} aria-label="مساعد الجرعات">
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
                                  <Button size="lg" className="flex-1" onClick={handleCheckout} disabled={cart.length === 0} variant={saleIdToUpdate ? 'default' : 'success'}>
                                      {saleIdToUpdate ? 'تحديث الفاتورة' : (mode === 'return' ? 'إتمام الاسترجاع' : 'إتمام العملية')}
                                  </Button>
                              </DialogTrigger>
                              <DialogContent>
                                  <DialogHeader>
                                      <DialogTitle>{saleIdToUpdate ? 'تأكيد التعديل' : 'تأكيد الفاتورة'}</DialogTitle>
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
                                                      <TableRow key={`${item.id}-${item.is_return}`} className={cn(item.is_return && "text-destructive")}>
                                                          <TableCell>{item.name} {item.is_return && "(مرتجع)"}</TableCell>
                                                          <TableCell className="text-center font-mono">{item.quantity}</TableCell>
                                                          <TableCell className="text-left font-mono">{((item.is_return ? -1 : 1) * (item.price || 0) * (item.quantity || 0)).toLocaleString()}</TableCell>
                                                      </TableRow>
                                                  ))}
                                              </TableBody>
                                          </Table>
                                      </div>
                                      <Separator/>
                                      <div className="space-y-2 text-sm font-mono">
                                          {selectedPatient && <div className="flex justify-between"><span>المريض:</span><span>{selectedPatient.name}</span></div>}
                                          <div className="flex justify-between"><span>المجموع:</span><span>{subtotal.toLocaleString()}</span></div>
                                          <div className="flex justify-between"><span>الخصم:</span><span>-{discountAmount.toLocaleString()}</span></div>
                                           <div className={cn("flex justify-between", finalProfit >= 0 ? "text-green-600" : "text-destructive")}>
                                               <span>الربح الصافي:</span>
                                               <span>{finalProfit.toLocaleString()}</span>
                                           </div>
                                          <div className="flex justify-between font-bold text-lg"><span>الإجمالي النهائي:</span><span>{finalTotal.toLocaleString()}</span></div>
                                      </div>
                                      <Separator />
                                       <RadioGroup defaultValue="cash" value={paymentMethod} onValueChange={handlePaymentMethodChange} className="grid grid-cols-3 gap-4 pt-2">
                                            <Label htmlFor="payment-cash" className="flex items-center justify-center gap-2 cursor-pointer rounded-md border p-3 has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground">
                                                <RadioGroupItem value="cash" id="payment-cash" />
                                                نقداً
                                            </Label>
                                            <Label htmlFor="payment-card" className="flex items-center justify-center gap-2 cursor-pointer rounded-md border p-3 has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground">
                                                <RadioGroupItem value="card" id="payment-card" />
                                                بطاقة
                                             </Label>
                                             <Label htmlFor="payment-credit" className="flex items-center justify-center gap-2 cursor-pointer rounded-md border p-3 has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground">
                                                <RadioGroupItem value="credit" id="payment-credit" />
                                                آجل (دين)
                                             </Label>
                                        </RadioGroup>
                                  </div>
                                  <DialogFooter className='sm:space-x-reverse'>
                                      <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                      <Button onClick={handleFinalizeSale} variant={saleIdToUpdate ? 'default' : 'success'}>
                                        {saleIdToUpdate ? 'تأكيد التعديل' : (mode === 'return' ? 'تأكيد الاسترجاع' : 'تأكيد البيع')}
                                      </Button>
                                  </DialogFooter>
                              </DialogContent>
                          </Dialog>
                      </div>
                      {activeInvoices.length === 1 && activeInvoice.cart.length > 0 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className="w-full" disabled={cart.length === 0}>
                                    <X className="me-2"/>
                                    {saleIdToUpdate ? 'إلغاء التعديل' : 'إلغاء الفاتورة'}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <DialogHeader>
                                    <DialogTitle>هل أنت متأكد؟</DialogTitle>
                                    <DialogDescription>
                                        {saleIdToUpdate ? 'سيتم تجاهل جميع التغييرات التي قمت بها.' : 'سيتم حذف جميع الأصناف من السلة الحالية.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>تراجع</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => {
                                        closeInvoice(currentInvoiceIndex);
                                        setAlternativeExpiryAlert(null);
                                    }} className={buttonVariants({ variant: "destructive" })}>نعم</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                      )}
                      {saleIdToUpdate && canManagePreviousSales && (
                         <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" className="w-full">
                                      <Trash2 className="me-2"/>
                                      حذف الفاتورة نهائياً
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <DialogHeader>
                                      <DialogTitle>هل أنت متأكد من حذف الفاتورة؟</DialogTitle>
                                      <AlertDialogDescription>
                                          لا يمكن التراجع عن هذا الإجراء. سيتم إعادة كميات الأصناف المباعة إلى المخزون.
                                      </AlertDialogDescription>
                                  </DialogHeader>
                                  <AlertDialogFooter className='sm:space-x-reverse'>
                                      <AlertDialogCancel>تراجع</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleDeleteCurrentSale} className={buttonVariants({ variant: "destructive" })}>نعم، قم بالحذف</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      )}
                  </CardFooter>
              </Card>
          </div>
        <Dialog open={isReceiptOpen} onOpenChange={(open) => {
            if (!open) closeInvoice(currentInvoiceIndex, true);
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
                        closeInvoice(currentInvoiceIndex, true);
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
        <PinDialog
            open={isPinDialogOpen}
            onOpenChange={setIsPinDialogOpen}
            onConfirm={handlePinConfirmDelete}
            title="تأكيد الحذف"
            description="هذه العملية تتطلب تأكيدًا. الرجاء إدخال رمز PIN الخاص بك للمتابعة."
        />
        <PinDialog
            open={isControlledDrugPinOpen}
            onOpenChange={setIsControlledDrugPinOpen}
            onConfirm={handleControlledDrugPinConfirm}
            title="دواء خاضع للرقابة"
            description="هذه الفاتورة تحتوي على مادة خاضعة للرقابة. يتطلب صرفها إدخال رمز PIN. صرف هذه المادة بدون وصفة طبية يعرضك للمساءلة القانونية التي قد تصل إلى السجن حسب أحكام القانون العراقي."
        />
    </div>
    </TooltipProvider>
    </>
  )
}
