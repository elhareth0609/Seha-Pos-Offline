
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
import type { Medication, SaleItem, Sale, AppSettings, Patient, DoseCalculationOutput } from "@/lib/types"
import { PlusCircle, X, PackageSearch, ScanLine, ArrowLeftRight, Printer, User as UserIcon, AlertTriangle, TrendingUp, ArrowLeft, ArrowRight, FilePlus, UserPlus, Package, Thermometer, BrainCircuit, WifiOff, Wifi, Replace, Percent, Pencil, Trash2 } from "lucide-react"
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { InvoiceTemplate } from "@/components/ui/invoice"
import { useAuth } from "@/hooks/use-auth"
import { buttonVariants } from "@/components/ui/button"
import { calculateDose, type DoseCalculationInput } from "@/ai/flows/dose-calculator-flow"
import { Skeleton } from "@/components/ui/skeleton"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import AdCarousel from "@/components/ui/ad-carousel"
import { differenceInDays, parseISO, startOfToday } from "date-fns"
import { Badge } from "@/components/ui/badge"

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
  const { currentUser, scopedData, activeInvoice, setActiveInvoice, resetActiveInvoice, addPatient, addSale, updateSale, deleteSale } = useAuth();
  const [allInventory] = scopedData.inventory;
  const [sales, setSales] = scopedData.sales;
  const [patients] = scopedData.patients;
  const [settings] = scopedData.settings;
  const { cart, discountType, discountValue, patientId, paymentMethod, saleIdToUpdate, reviewIndex } = activeInvoice;
  const setCart = (updater: (prev: SaleItem[]) => SaleItem[]) => {
      setActiveInvoice(prev => ({ ...prev, cart: updater(prev.cart) }));
  };
  
  const [searchTerm, setSearchTerm] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<Medication[]>([])
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
  const [saleToPrint, setSaleToPrint] = React.useState<Sale | null>(null);
  
  const [isDosingAssistantOpen, setIsDosingAssistantOpen] = React.useState(false);

  const [isPatientModalOpen, setIsPatientModalOpen] = React.useState(false);
  const [patientSearchTerm, setPatientSearchTerm] = React.useState("");
  const [newPatientName, setNewPatientName] = React.useState("");
  const [newPatientPhone, setNewPatientPhone] = React.useState("");


  const mode = saleIdToUpdate ? 'review' : 'new';
  
  const isOnline = useOnlineStatus();
  const priceModificationAllowed = currentUser?.role === 'Admin' || currentUser?.permissions?.manage_salesPriceModification;
  const canManagePreviousSales = currentUser?.role === 'Admin' || currentUser?.permissions?.manage_previous_sales;

  const { toast } = useToast()
  
  const printComponentRef = React.useRef(null);

    const handlePrint = () => {
        if (printComponentRef.current && saleToPrint) {
            printElement(printComponentRef.current, `invoice-${saleToPrint?.id}`);
        }
    };
    const sortedSales = React.useMemo(() => (sales || []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [sales]);

    const addToCart = React.useCallback((medication: Medication) => {
        if (mode !== 'new') return;
        
        const today = new Date();
        today.setHours(0,0,0,0);
        if (medication.expiration_date && parseISO(medication.expiration_date) < today) {
            toast({ variant: 'destructive', title: 'منتج منتهي الصلاحية', description: `لا يمكن بيع ${medication.name} لأنه منتهي الصلاحية.` });
            return;
        }

        if (medication.stock <= 0) {
            toast({ variant: 'destructive', title: 'نفد من المخزون', description: `لا يمكن بيع ${medication.name} لأن الكمية 0.` });
            return;
        }

        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.id === medication.id && !item.is_return)

            if (existingItem) {
                 if (existingItem.quantity >= medication.stock) {
                    toast({ variant: 'destructive', title: 'كمية غير كافية', description: `لا يمكن إضافة المزيد من ${medication.name}. الرصيد المتوفر: ${medication.stock}` });
                    return prevCart;
                }
                return prevCart.map(item =>
                    item.id === medication.id && !item.is_return
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
                )
            }
            return [...prevCart, { 
                id: medication.id, 
                medication_id: medication.id, 
                name: medication.name, 
                scientific_names: medication.scientific_names, 
                quantity: 1, 
                price: medication.price || 0,
                purchase_price: medication.purchase_price || 0, 
                expiration_date: medication.expiration_date, 
                is_return: false, 
                dosage: medication.dosage,
                dosage_form: medication.dosage_form,
            }]
        })
        setSearchTerm("")
        setSuggestions([])
    }, [mode, setCart, toast, allInventory])
  
  const handleScan = React.useCallback((result: string) => {
    if (mode !== 'new') return;
    const scannedMedication = allInventory.find(med => (med.barcodes || []).includes(result));
    if (scannedMedication) {
      addToCart(scannedMedication);
      toast({ title: 'تمت الإضافة إلى السلة', description: `تمت إضافة ${scannedMedication.name} بنجاح.` });
    } else {
      toast({ variant: 'destructive', title: 'لم يتم العثور على المنتج', description: 'الباركود الممسوح ضوئيًا لا يتطابق مع أي منتج.' });
    }
    setIsScannerOpen(false);
  }, [addToCart, allInventory, mode, toast]);


  React.useEffect(() => {
    if (mode !== 'new') return;

    const handler = setTimeout(() => {
        if (searchTerm.length > 5 && suggestions.length === 0) {
            const lowercasedSearchTerm = searchTerm.toLowerCase();
            const medicationByBarcode = allInventory.find(med => med.barcodes && med.barcodes.some(bc => bc.toLowerCase() === lowercasedSearchTerm));
            if (medicationByBarcode) {
                addToCart(medicationByBarcode);
            }
        }
    }, 100);

    return () => {
        clearTimeout(handler);
    };
  }, [searchTerm, suggestions, allInventory, addToCart, mode]);


  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 0) {
        const lowercasedFilter = value.toLowerCase().trim();
        const filtered = (allInventory || []).filter((item) =>
            (item.name && item.name.toLowerCase().startsWith(lowercasedFilter)) ||
            (item.barcodes && item.barcodes.some(barcode => barcode.toLowerCase().startsWith(lowercasedFilter))) ||
            (item.scientific_names && item.scientific_names.some(name => name.toLowerCase().startsWith(lowercasedFilter)))
        );
        setSuggestions(filtered.slice(0, 5));
    } else {
        setSuggestions([]);
    }
  }

  const handleSearchKeyDown = React.useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (mode !== 'new') return;
    if (event.key === 'Enter') {
        event.preventDefault();

        if (suggestions.length > 0) {
            addToCart(suggestions[0]);
            return;
        }
        
        const lowercasedSearchTerm = searchTerm.toLowerCase();
        
        const medicationByBarcode = allInventory.find(med => med.barcodes && med.barcodes.some(bc => bc.toLowerCase() === lowercasedSearchTerm));
        if (medicationByBarcode) {
            addToCart(medicationByBarcode);
            return;
        }
        
        const medicationByName = allInventory.find(med => med.name && med.name.toLowerCase() === lowercasedSearchTerm);
        if (medicationByName) {
            addToCart(medicationByName);
            return;
        }

        if (searchTerm) {
            toast({ variant: 'destructive', title: 'لم يتم العثور على المنتج', description: 'يرجى التأكد من المعرف أو البحث بالاسم.' });
        }
    }
  }, [suggestions, allInventory, searchTerm, addToCart, mode, toast]);

  const updateQuantity = (id: string, newQuantityStr: string) => {
    const quantity = parseInt(newQuantityStr, 10);
    if (isNaN(quantity) || quantity < 0) return;
    if (quantity === 0) return;
    
    setCart(cart => cart.map(item => (item.id === id ? { ...item, quantity } : item)));
  };

  const updateTotalPrice = (id: string, newTotalPriceStr: string) => {
    if (newTotalPriceStr.trim() === '') {
        setCart(cart => cart.map(item => (item.id === id ? { ...item, price: 0 } : item)));
        return;
    }

    const newTotalPrice = parseFloat(newTotalPriceStr);
    if (isNaN(newTotalPrice) || newTotalPrice < 0) return;

    setCart(cart => cart.map(item => {
      if (item.id === id) {
        const newUnitPrice = item.quantity > 0 ? newTotalPrice / item.quantity : 0;
        return { ...item, price: newUnitPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(cart => cart.filter(item => item.id !== id))
  }

  const toggleReturn = (id: string) => {
    setCart(cart => cart.map(item => 
      item.id === id 
        ? { ...item, is_return: !item.is_return } 
        : item
    ));
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

  const selectedPatient = React.useMemo(() => (patients || []).find(p => p.id === patientId), [patients, patientId]);


  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "السلة فارغة", description: "أضف منتجات إلى السلة قبل إتمام العملية.", variant: "destructive" })
      return;
    }
    
    for (const itemInCart of cart) {
        if (!itemInCart.is_return) {
            const med = allInventory.find(m => m.id === itemInCart.id);
            if (!med || med.stock < itemInCart.quantity) {
                toast({ variant: 'destructive', title: `كمية غير كافية من ${itemInCart.name}`, description: `الكمية المطلوبة ${itemInCart.quantity}, المتوفر ${med?.stock ?? 0}` });
                return;
            }
        }
    }

    setIsCheckoutOpen(true);
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
    };
    
    const resultSale = saleIdToUpdate ? await updateSale(saleData) : await addSale(saleData);

    if (resultSale) {
        toast({ title: saleIdToUpdate ? "تم تحديث الفاتورة بنجاح" : "تمت العملية بنجاح", description: `تم تسجيل الفاتورة رقم ${resultSale.id}` });
        
        setSaleToPrint(resultSale);
        setIsCheckoutOpen(false);
        setIsReceiptOpen(true);
    }
  }

  const handleDeleteCurrentSale = async () => {
    if (!saleIdToUpdate) return;
    const success = await deleteSale(saleIdToUpdate);
    if(success) {
        setSales(prev => prev.filter(s => s.id !== saleIdToUpdate));
        handleNewInvoiceClick();
        toast({ title: "تم حذف الفاتورة" });
    }
  }

  const loadSaleForReview = (index: number) => {
    if (index >= 0 && index < sortedSales.length) {
        const saleToReview = sortedSales[index];
        setActiveInvoice({
          cart: saleToReview.items.map((i: SaleItem) => ({...i, id: i.medication_id})),
          discountValue: (saleToReview.discount || 0).toString(),
          discountType: 'fixed', // TODO: Save discount type on sale
          patientId: saleToReview.patient_id || null,
          paymentMethod: 'cash', // TODO: Save payment method on sale
          saleIdToUpdate: saleToReview.id,
          reviewIndex: index,
        });
        setSearchTerm('');
        setSuggestions([]);
    }
  };

  const handleNextInvoice = () => {
    if (reviewIndex > 0) {
        loadSaleForReview(reviewIndex - 1);
    }
  };

  const handlePreviousInvoice = () => {
    if (mode === 'new' && sortedSales.length > 0) {
        loadSaleForReview(0);
    } else if (mode === 'review' && reviewIndex < sortedSales.length - 1) {
        loadSaleForReview(reviewIndex + 1);
    }
  };

  const handleNewInvoiceClick = () => {
    resetActiveInvoice();
    setSearchTerm('');
    setSaleToPrint(null);
  };

  const handleAddNewPatient = async () => {
      const newPatient = await addPatient(newPatientName, newPatientPhone);
      if (newPatient) {
          setActiveInvoice(prev => ({...prev, patientId: newPatient.id}));
          toast({ title: "تم إضافة المريض", description: `تم تحديد ${newPatient.name} لهذه الفاتورة.` });
          setNewPatientName("");
          setNewPatientPhone("");
          setPatientSearchTerm("");
          setIsPatientModalOpen(false);
      }
  }

  const filteredPatients = (patients || []).filter(p => p.name.toLowerCase().includes(patientSearchTerm.toLowerCase()));

  const findAlternatives = (currentItem: SaleItem): Medication[] => {
    if (!currentItem.scientific_names || currentItem.scientific_names.length === 0) {
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
            setActiveInvoice(prev => ({...prev, discountValue: value}));
        }
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
                            disabled={mode !== 'new'}
                        />
                        {suggestions.length > 0 && mode === 'new' && (
                            <Card className="absolute z-50 w-full mt-1 bg-background shadow-lg border">
                                <CardContent className="p-0">
                                    <ul className="divide-y divide-border">
                                        {suggestions.map(med => (
                                            <li key={med.id} className="p-3 hover:bg-accent rounded-md flex justify-between items-center"
                                                onMouseDown={(e) => { e.preventDefault(); addToCart(med); }}>
                                                <div className="flex items-center gap-3">
                                                    {typeof med.image_url === 'string' && med.image_url !== "" ? (
                                                        <Image src={med.image_url} alt={med.name || ''} width={32} height={32} className="rounded-sm object-cover h-8 w-8" />
                                                    ) : (
                                                        <div className="h-8 w-8 flex items-center justify-center rounded-sm bg-muted text-muted-foreground">
                                                            <Package className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium">{med.name}</div>
                                                        <div className="text-xs text-muted-foreground">{med.scientific_names?.join(', ')}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

                <Card className="flex-1 flex flex-col">
                    <CardHeader className="py-4">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
                            <CardTitle className="text-xl">
                                {mode === 'new' ? 'الفاتورة الحالية' : `تعديل الفاتورة #${sortedSales[reviewIndex]?.id}`}
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                {(mode === 'review' || (mode === 'new' && sortedSales.length > 0)) && (
                                    <>
                                        <Button onClick={handlePreviousInvoice} variant="outline" size="icon" disabled={mode === 'review' && reviewIndex >= sortedSales.length - 1}>
                                            <span className="sr-only">السابق</span> <ArrowRight/>
                                        </Button>
                                        <Button onClick={handleNextInvoice} variant="outline" size="icon" disabled={mode === 'review' && reviewIndex <= 0}>
                                            <span className="sr-only">التالي</span> <ArrowLeft/>
                                        </Button>
                                    </>
                                )}
                                {mode === 'review' ? (
                                    <Button onClick={handleNewInvoiceClick} variant="secondary">
                                        <FilePlus className="me-2"/> فاتورة جديدة
                                    </Button>
                                ) : (
                                    <Button onClick={handlePreviousInvoice} variant="outline" disabled={sortedSales.length === 0}>
                                        <ArrowRight className="me-2"/> مراجعة
                                    </Button>
                                )}
                            </div>
                        </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                    
                    <ScrollArea className="h-full">
                    {cart.length > 0 ? (
                        <>
                            <div className="md:hidden divide-y divide-border">
                                {cart.map((item) => {
                                    const medInInventory = allInventory.find(med => med.id === item.id);
                                    const stock = medInInventory?.stock ?? 0;
                                    const remainingStock = stock - (item.quantity || 0);
                                    const isBelowCost = (item.price || 0) < (item.purchase_price || 0);
                                    const alternatives = findAlternatives(item);
                                    return (
                                        <div key={item.id} className={cn("flex flex-col gap-3 p-3", item.is_return && "bg-red-50 dark:bg-red-900/20")}>
                                            <div className="flex justify-between items-start gap-2">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-1 font-medium">
                                                        <Checkbox checked={!!item.is_return} onCheckedChange={() => toggleReturn(item.id)} aria-label="Mark as return" disabled={mode !== 'new'} className="me-2"/>
                                                        {item.name} {item.dosage} {item.dosage_form}
                                                        {alternatives.length > 0 && (
                                                            <Popover>
                                                                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-primary/70 hover:text-primary"><Replace className="h-4 w-4" /></Button></PopoverTrigger>
                                                                <PopoverContent className="w-80">
                                                                    <div className="space-y-2">
                                                                        <h4 className="font-medium leading-none">بدائل متاحة</h4>
                                                                        <div className="space-y-1">
                                                                            {alternatives.map(alt => (
                                                                                <div key={alt.id} className="text-sm p-2 hover:bg-accent rounded-md flex justify-between items-center">
                                                                                    <div><div>{alt.name}</div><div className="text-xs text-muted-foreground">المتوفر: {alt.stock}</div></div>
                                                                                    <div className="flex items-center gap-2"><span className="font-mono">{alt.price}</span><Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => addToCart(alt)}><PlusCircle className="h-4 w-4 text-green-600" /></Button></div>
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeFromCart(item.id)}><X className="h-4 w-4 text-destructive" /></Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 items-end">
                                                <div className="space-y-1">
                                                    <Label htmlFor={`quantity-sm-${item.id}`} className="text-xs">الكمية</Label>
                                                    <Input id={`quantity-sm-${item.id}`} type="number" value={item.quantity || 1} min={1} onChange={(e) => updateQuantity(item.id, e.target.value)} className="h-9 text-center font-mono" />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label htmlFor={`price-sm-${item.id}`} className="text-xs">السعر الإجمالي</Label>
                                                    <div className="relative">
                                                        <Input id={`price-sm-${item.id}`} type="number" value={((item.price || 0) * (item.quantity || 0))} onChange={(e) => updateTotalPrice(item.id, e.target.value)} className={cn("h-9 text-center font-mono", isBelowCost && !item.is_return && "border-destructive ring-2 ring-destructive/50 focus-visible:ring-destructive" )} disabled={!priceModificationAllowed} />
                                                        {isBelowCost && !item.is_return && (
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="absolute -top-2 -left-2 text-destructive"><AlertTriangle className="h-4 w-4" /></div>
                                                                </TooltipTrigger>
                                                                <TooltipContent><p>السعر أقل من الكلفة!</p></TooltipContent>
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
                                      <TableHead className="w-12 text-center"><ArrowLeftRight className="h-4 w-4 mx-auto"/></TableHead>
                                      <TableHead>المنتج</TableHead>
                                      <TableHead className="w-[120px] text-center">الكمية</TableHead>
                                      <TableHead className="w-[120px] text-center">السعر</TableHead>
                                      <TableHead className="w-12"></TableHead>
                                  </TableRow>
                              </TableHeader>
                              <TableBody>
                                  {cart.map((item) => {
                                    const medInInventory = allInventory.find(med => med.id === item.id);
                                    const stock = medInInventory?.stock ?? 0;
                                    const remainingStock = stock - (item.quantity || 0);
                                    const isBelowCost = (item.price || 0) < (item.purchase_price || 0);
                                    const alternatives = findAlternatives(item);

                                    return (
                                        <TableRow key={item.id} className={cn(item.is_return && "bg-red-50 dark:bg-red-900/20")}>
                                            <TableCell className="text-center">
                                                <Checkbox checked={!!item.is_return} onCheckedChange={() => toggleReturn(item.id)} aria-label="Mark as return"/>
                                            </TableCell>
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
                                                                <div className="space-y-2">
                                                                    <h4 className="font-medium leading-none">بدائل متاحة</h4>
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
                                                onChange={(e) => updateQuantity(item.id, e.target.value)}
                                                min={1}
                                                className="w-20 h-9 text-center font-mono"
                                             />
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative">
                                                    <Input 
                                                      type="number"
                                                      value={((item.price || 0) * (item.quantity || 0))}
                                                      onChange={(e) => updateTotalPrice(item.id, e.target.value)} 
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
                                                        <TooltipContent><p>السعر أقل من الكلفة!</p></TooltipContent>
                                                      </Tooltip>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-left">
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.id)}><X className="h-4 w-4" /></Button>
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
                              <p className="text-lg">{mode === 'new' ? 'الفاتورة فارغة' : 'لا توجد أصناف في هذه الفاتورة'}</p>
                              {mode === 'new' && <p className="text-sm">أضف منتجات لبدء عملية البيع.</p>}
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
                                      <Input placeholder="ابحث بالاسم..." value={patientSearchTerm} onChange={(e) => setPatientSearchTerm(e.target.value)} />
                                      <ScrollArea className="h-48 border rounded-md">
                                          {(filteredPatients || []).map(p => (
                                              <div key={p.id} onClick={() => { setActiveInvoice(prev => ({...prev, patientId: p.id})); setIsPatientModalOpen(false); }}
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
                        <RadioGroup defaultValue="fixed" value={discountType} onValueChange={(value: any) => setActiveInvoice(prev => ({...prev, discountType: value}))} className="flex">
                            <Button type="button" size="sm" variant={discountType === 'fixed' ? 'secondary' : 'ghost'} onClick={() => setActiveInvoice(prev => ({...prev, discountType: 'fixed'}))}>IQD</Button>
                            <Button type="button" size="icon" variant={discountType === 'percentage' ? 'secondary' : 'ghost'} onClick={() => setActiveInvoice(prev => ({...prev, discountType: 'percentage'}))} className="h-9 w-9"><Percent className="h-4 w-4" /></Button>
                        </RadioGroup>
                      </div>
                      <Separator />
                      <div className="flex justify-between w-full text-lg font-semibold">
                          <span>الإجمالي</span>
                          <span className={cn("font-mono", finalTotal < 0 ? 'text-destructive' : '')}>{finalTotal.toLocaleString()}</span>
                      </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-stretch gap-2">
                      <div className="flex gap-2">
                          {mode === 'new' && (
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
                          )}
                          <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                              <DialogTrigger asChild>
                                  <Button size="lg" className="flex-1" onClick={handleCheckout} disabled={cart.length === 0} variant={mode === 'review' ? 'default' : 'success'}>
                                      {mode === 'review' ? 'تحديث الفاتورة' : 'إتمام العملية'}
                                  </Button>
                              </DialogTrigger>
                              <DialogContent>
                                  <DialogHeader>
                                      <DialogTitle>{mode === 'review' ? 'تأكيد التعديل' : 'تأكيد الفاتورة'}</DialogTitle>
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
                                                      <TableRow key={item.id} className={cn(item.is_return && "text-destructive")}>
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
                                       <RadioGroup defaultValue="cash" value={paymentMethod} onValueChange={(value: any) => setActiveInvoice(prev => ({ ...prev, paymentMethod: value }))} className="flex gap-4 pt-2">
                                            <Label htmlFor="payment-cash" className="flex items-center gap-2 cursor-pointer rounded-md border p-3 flex-1 has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground">
                                                <RadioGroupItem value="cash" id="payment-cash" />
                                                الدفع نقداً
                                            </Label>
                                            <Label htmlFor="payment-card" className="flex items-center gap-2 cursor-pointer rounded-md border p-3 flex-1 has-[input:checked]:bg-primary has-[input:checked]:text-primary-foreground">
                                                <RadioGroupItem value="card" id="payment-card" />
                                                بطاقة إلكترونية
                                            </Label>
                                        </RadioGroup>
                                  </div>
                                  <DialogFooter>
                                      <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                      <Button onClick={handleFinalizeSale} variant={mode === 'review' ? 'default' : 'success'}>
                                        {mode === 'review' ? 'تأكيد التعديل' : 'تأكيد البيع'}
                                      </Button>
                                  </DialogFooter>
                              </DialogContent>
                          </Dialog>
                      </div>
                       <AlertDialog>
                          <AlertDialogTrigger asChild>
                              <Button variant="outline" className="w-full" disabled={cart.length === 0}>
                                  <X className="me-2"/>
                                  {mode === 'new' ? 'إلغاء الفاتورة' : 'إلغاء التعديل'}
                              </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      {mode === 'new' ? 'سيتم حذف جميع الأصناف من السلة الحالية.' : 'سيتم تجاهل جميع التغييرات التي قمت بها.'}
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>تراجع</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleNewInvoiceClick()} className={buttonVariants({ variant: "destructive" })}>نعم</AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                      {mode === 'review' && canManagePreviousSales && (
                         <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" className="w-full">
                                      <Trash2 className="me-2"/>
                                      حذف الفاتورة نهائياً
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>هل أنت متأكد من حذف الفاتورة؟</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          لا يمكن التراجع عن هذا الإجراء. سيتم إعادة كميات الأصناف المباعة إلى المخزون.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
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
            if (!open) handleNewInvoiceClick();
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
    </div>
    </TooltipProvider>
    </>
  )
}
