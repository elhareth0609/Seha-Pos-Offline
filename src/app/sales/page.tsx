
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
import type { Medication, SaleItem, Sale, AppSettings, Patient, DoseCalculationOutput, Notification, BranchInventory } from "@/lib/types"
import { PlusCircle, X, PackageSearch, ArrowLeftRight, Printer, User as UserIcon, AlertTriangle, TrendingUp, FilePlus, UserPlus, Package, Thermometer, BrainCircuit, WifiOff, Wifi, Replace, Percent, Pencil, Trash2, ArrowRight, FileText, Calculator, Search, Plus, Minus, Star } from "lucide-react"
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

function DosingAssistant({ cartItems }: { cartItems: SaleItem[] }) {
    const [patientWeight, setPatientWeight] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(false);
    const [results, setResults] = React.useState<DoseCalculationOutput | null>(null);
    const { toast } = useToast();

    const handleCalculate = async () => {
        const weight = parseFloat(patientWeight);
        if (isNaN(weight) || weight <= 0) {
            toast({ variant: 'destructive', title: 'وزن غير صالح', description: 'الرجاء إدخال وزن صحيح.' });
            return;
        }

        setIsLoading(true);
        setResults(null);

        const medicationsInput: DoseCalculationInput['medications'] = cartItems
            .filter(item => !item.is_return)
            .map(item => ({
                tradeName: item.name,
                scientific_names: item.scientific_names || [],
                dosage: item.dosage || '',
                dosage_form: item.dosage_form || '',
            }));

        try {
            const response = await calculateDose({
                patientWeight: weight,
                medications: medicationsInput,
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
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>مساعد الجرعات الذكي</DialogTitle>
                <DialogDescription>
                    أدخل وزن المريض للحصول على اقتراحات للجرعات.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-2">
                        <Label htmlFor="patient-weight">وزن المريض (بالكيلوجرام)</Label>
                        <Input id="patient-weight" type="number" step="0.1" value={patientWeight} onChange={(e) => setPatientWeight(e.target.value)} placeholder="مثال: 25.5" />
                    </div>
                    <div className="md:col-span-2">
                        <Button onClick={handleCalculate} disabled={isLoading || cartItems.length === 0} className="w-full">
                            {isLoading ? <BrainCircuit className="me-2 h-4 w-4 animate-spin" /> : <Thermometer className="me-2 h-4 w-4" />}
                            حساب وتحليل
                        </Button>
                    </div>
                </div>
                
                {isLoading && (
                    <div className="space-y-2 pt-4">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                )}

                {results && (
                    <div className="space-y-4 pt-4">
                        <Alert variant="default">
                            <AlertDescription>
                                هذه النتائج هي مجرد اقتراحات من الذكاء الاصطناعي ولا تغني عن خبرة الصيدلي وقراره النهائي. يجب التحقق من الجرعات والتفاعلات دائمًا.
                            </AlertDescription>
                        </Alert>
                        
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الدواء</TableHead>
                                    <TableHead>الجرعة المقترحة</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.medicationAnalysis.map((res, index) => (
                                    <TableRow key={index}>
                                        <TableCell className="font-medium">{res.tradeName}</TableCell>
                                        <TableCell dir="ltr">{res.suggestedDose}</TableCell>
                                    </TableRow>    
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
            {/* <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <PackageSearch className="w-16 h-16 text-muted-foreground" />
                <p className="text-xl font-medium text-center">ستتوفر الميزة قريبا</p>
            </div> */}
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">إغلاق</Button>
                </DialogClose>
            </DialogFooter>
        </DialogContent>
    );

}

function BarcodeConflictDialog({ open, onOpenChange, conflictingMeds, onSelect }: { open: boolean, onOpenChange: (open: boolean) => void, conflictingMeds: Medication[], onSelect: (med: Medication) => void }) {
    const sortedMeds = React.useMemo(() => {
        return [...conflictingMeds].sort((a, b) => {
            if (!a.expiration_date) return 1;
            if (!b.expiration_date) return -1;
            return new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime();
        });
    }, [conflictingMeds]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>باركود مشترك</DialogTitle>
                    <DialogDescription>هذا الباركود مسجل لأكثر من دفعة. الرجاء اختيار الدفعة الصحيحة لإضافتها للفاتورة.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
                    {sortedMeds.map(med => (
                        <Card key={med.id} className="cursor-pointer hover:bg-muted" onClick={() => onSelect(med)}>
                            <CardContent className="p-3 flex justify-between items-center">
                                <div>
                                    <div className="font-semibold">{med.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        تاريخ الانتهاء: <span className="font-mono">{new Date(med.expiration_date).toLocaleDateString('en-US')}</span>
                                    </div>
                                </div>
                                <div className="text-sm">
                                    الرصيد: <span className="font-mono">{med.stock}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
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

const referenceSites = [
    { name: "PedDose", url: "https://www.peddose.com/" },
    { name: "DawaSeek", url: "https://www.dawaseek.com/" },
];

function FavoritesPopover({ onSelect }: { onSelect: (med: Medication) => void }) {
    const { scopedData, searchAllInventory, toggleFavoriteMedication } = useAuth();
    const { settings: [settings] } = scopedData;
    const [allMeds, setAllMeds] = React.useState<Medication[]>([]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [searchResults, setSearchResults] = React.useState<Medication[]>([]);

    React.useEffect(() => {
        searchAllInventory('').then(setAllMeds);
    }, [searchAllInventory]);

    React.useEffect(() => {
        if (searchTerm.length > 1) {
            const results = allMeds.filter(med =>
                med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                med.scientific_names?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setSearchResults(results.slice(0, 5));
        } else {
            setSearchResults([]);
        }
    }, [searchTerm, allMeds]);

    const favoriteMeds = React.useMemo(() => {
        const favIds = new Set(settings.favorite_med_ids || []);
        return allMeds.filter(med => favIds.has(med.id));
    }, [settings.favorite_med_ids, allMeds]);

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 text-yellow-400 border-yellow-400 hover:bg-yellow-400 hover:text-white">
                    <Star />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-medium leading-none">الأدوية المفضلة</h4>
                        <p className="text-sm text-muted-foreground">أضف الأدوية الأكثر مبيعاً للوصول السريع.</p>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="ابحث لإضافة دواء للمفضلة..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        {searchTerm.length > 1 ? (
                            // Search results
                            searchResults.length > 0 ? searchResults.map(med => (
                                <div key={med.id} className="p-2 flex items-center justify-between hover:bg-accent rounded-md text-sm">
                                    <span>{med.name}</span>
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { toggleFavoriteMedication(med.id); setSearchTerm(''); }}>
                                        <PlusCircle className="h-4 w-4 text-green-600" />
                                    </Button>
                                </div>
                            )) : <p className="text-xs text-muted-foreground text-center">لم يتم العثور على نتائج.</p>
                        ) : (
                            // Favorites list
                            <ScrollArea className="h-48">
                                <div className="space-y-2">
                                    {favoriteMeds.length > 0 ? favoriteMeds.map(med => (
                                        <div key={med.id} className="group p-2 flex items-center justify-between hover:bg-accent rounded-md cursor-pointer text-sm" onClick={() => onSelect(med)}>
                                            <span>{med.name}</span>
                                            <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); toggleFavoriteMedication(med.id); }}>
                                                <X className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    )) : (
                                        <p className="text-xs text-muted-foreground text-center pt-4">
                                            قائمة المفضلة فارغة. ابحث عن دواء لإضافته.
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

function BranchSearchDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
    const { searchInOtherBranches } = useAuth();
    const [branchSearchTerm, setBranchSearchTerm] = React.useState('');
    const [branchSearchResults, setBranchSearchResults] = React.useState<BranchInventory[]>([]);
    const [branchSearchLoading, setBranchSearchLoading] = React.useState(false);

    const handleBranchSearch = async (term: string) => {
        setBranchSearchTerm(term);
        if (term.length > 0) {
            setBranchSearchLoading(true);
            const results = await searchInOtherBranches(term);
            setBranchSearchResults(results);
            setBranchSearchLoading(false);
        } else {
            setBranchSearchResults([]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>البحث عن دواء في الأفرع</DialogTitle>
                    <DialogDescription>
                        ابحث عن أي دواء لمعرفة الكميات المتوفرة في شبكة صيدلياتك.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Input
                        placeholder="ابحث بالاسم التجاري أو العلمي..."
                        value={branchSearchTerm}
                        onChange={(e) => handleBranchSearch(e.target.value)}
                        autoFocus
                    />
                    <div className="max-h-80 overflow-y-auto">
                        {branchSearchLoading ? (
                            <div className="space-y-2 py-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : branchSearchResults.length > 0 ? (
                            <Table>
                                <TableHeader><TableRow><TableHead>اسم الفرع</TableHead><TableHead>الكمية المتوفرة</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {branchSearchResults.map(result => (
                                        <TableRow key={result.pharmacy_id}>
                                            <TableCell className="font-medium">{result.pharmacy_name}</TableCell>
                                            <TableCell className="font-mono">{result.stock}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            branchSearchTerm.length > 2 && <p className="text-center text-muted-foreground py-8">لم يتم العثور على الدواء في أي فرع آخر.</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

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
        addSale,
        updateSale,
        deleteSale,
        searchAllInventory,
        searchAllSales,
        searchAllPatients,
        verifyPin,
        toggleFavoriteMedication,
        searchInOtherBranches,
    } = useAuth();

    const router = useRouter();

    React.useEffect(() => {
        if (currentUser && currentUser.role === 'Employee' && !currentUser.permissions?.manage_sales) {
            router.replace('/sales');
            console.log(currentUser.permissions?.manage_sales);
        }
    }, [currentUser, router]);

    const [settings = {} as AppSettings] = scopedData.settings || [];
    const [inventory = []] = scopedData.inventory || [];
    const [fullInventory, setFullInventory] = React.useState<Medication[]>(inventory);

    const activeInvoice = activeInvoices[currentInvoiceIndex];
    if (!activeInvoice) {
        return <div>Loading...</div>;
    }
    const { cart, discountType, discountValue, patientId, paymentMethod, saleIdToUpdate } = activeInvoice;

    const [searchTerm, setSearchTerm] = React.useState("")
    const [isSearchLoading, setIsSearchLoading] = React.useState(false);
    const [nameSearchTerm, setNameSearchTerm] = React.useState("")
    const [nameSuggestions, setNameSuggestions] = React.useState<Medication[]>([])
    const [barcodeSearchTerm, setBarcodeSearchTerm] = React.useState("")
    const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false);
    const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
    const [saleToPrint, setSaleToPrint] = React.useState<Sale | null>(null);
    const [alternativeExpiryAlert, setAlternativeExpiryAlert] = React.useState<Notification | null>(null);
    const [barcodeConflictMeds, setBarcodeConflictMeds] = React.useState<Medication[]>([]);
    const [isBarcodeConflictDialogOpen, setIsBarcodeConflictDialogOpen] = React.useState(false);
    const [isBranchSearchOpen, setIsBranchSearchOpen] = React.useState(false);
    const [isProcessingSale, setIsProcessingSale] = React.useState(false);


    const [isDosingAssistantOpen, setIsDosingAssistantOpen] = React.useState(false);

    const [isPatientModalOpen, setIsPatientModalOpen] = React.useState(false);
    const [patientSearchTerm, setPatientSearchTerm] = React.useState("");
    const [patientSuggestions, setPatientSuggestions] = React.useState<Patient[]>([]);
    const [newPatientName, setNewPatientName] = React.useState("");
    const [newPatientPhone, setNewPatientPhone] = React.useState("");
    const [sortedSales, setSortedSales] = React.useState<Sale[]>([]);
    const [hasLoadedPatients, setHasLoadedPatients] = React.useState(false);

    const [mode, setMode] = React.useState<'sale' | 'return'>('sale');

    const isOnline = useOnlineStatus();
    const priceModificationAllowed = currentUser?.role === 'Admin' || currentUser?.permissions?.manage_salesPriceModification;
    const canManagePreviousSales = currentUser?.role === 'Admin' || currentUser?.permissions?.manage_previous_sales;

    const { toast } = useToast()

    const printComponentRef = React.useRef(null);

    const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false);
    const [isControlledDrugPinOpen, setIsControlledDrugPinOpen] = React.useState(false);
    const [controlledDrugPin, setControlledDrugPin] = React.useState('');
    const [controlledDrugsInCart, setControlledDrugsInCart] = React.useState<string[]>([]);
    const [isControlledDrugConfirmed, setIsControlledDrugConfirmed] = React.useState(false);

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

    // Load all patients when component mounts
    React.useEffect(() => {
        async function fetchAllPatients() {
            const allPatients = await searchAllPatients("");
            setPatientSuggestions(allPatients);
            setHasLoadedPatients(true);
        }
        fetchAllPatients();
    }, [searchAllPatients]);

    const checkAlternativeExpiry = React.useCallback((medication: Medication) => {
        if (!medication.scientific_names || medication.scientific_names.length === 0 || mode === 'return') {
            setAlternativeExpiryAlert(null);
            return;
        }

        const alternatives = fullInventory.filter(med =>
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
    }, [fullInventory, mode]);

    const addToCart = React.useCallback((medication: Medication) => {
        // Expiry check
        const today = new Date();
        today.setHours(0, 0, 0, 0);
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
    }, [mode, updateActiveInvoice, toast, checkAlternativeExpiry])

    const removeFromCart = React.useCallback((id: string, isReturn: boolean | undefined) => {
        if (alternativeExpiryAlert?.data?.originalMedication?.id === id) {
            setAlternativeExpiryAlert(null);
        }
        updateActiveInvoice(invoice => ({
            ...invoice,
            cart: invoice.cart.filter(item => !(item.id === id && item.is_return === isReturn))
        }));
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

    const processBarcode = async (barcode: string) => {
        setIsSearchLoading(true);
        try {
            // Ensure full inventory is loaded if not already
            if (fullInventory.length === 0) {
                const results = await searchAllInventory('');
                setFullInventory(results);
            }

            const matchingMeds = fullInventory.filter(med =>
                med.barcodes && Array.isArray(med.barcodes) && med.barcodes.some(bc => bc && bc.toLowerCase() === barcode.toLowerCase())
            );

            if (matchingMeds.length === 1) {
                addToCart(matchingMeds[0]);
            } else if (matchingMeds.length > 1) {
                setBarcodeConflictMeds(matchingMeds);
                setIsBarcodeConflictDialogOpen(true);
            } else {
                toast({ variant: 'destructive', title: 'لم يتم العثور على المنتج', description: 'يرجى التأكد من الباركود أو البحث بالاسم.' });
            }

            setSearchTerm("");
        } finally {
            setIsSearchLoading(false);
        }
    };

    React.useEffect(() => {
        const handler = setTimeout(async () => {
            if (searchTerm.length > 5 && /^\d+$/.test(searchTerm)) {
                await processBarcode(searchTerm);
            }
        });

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);


    React.useEffect(() => {
        async function fetchInventory() {
            const results = await searchAllInventory('');
            setFullInventory(results);
        }
        fetchInventory();
    }, [searchAllInventory]);


    const handleNameSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setNameSearchTerm(value);

        if (value.length > 0) {
            const results = await searchAllInventory(value);
            setNameSuggestions(results);
        } else {
            setNameSuggestions([]);
        }
    }

    const handleBarcodeSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setBarcodeSearchTerm(value);
    }

    const handleBarcodeSearchKeyDown = React.useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (barcodeSearchTerm) {
                await processBarcode(barcodeSearchTerm);
                setBarcodeSearchTerm("");
            }
        }
    }, [barcodeSearchTerm, processBarcode]);

    const handleSearchKeyDown = React.useCallback(async (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (searchTerm) {
                await processBarcode(searchTerm);
            }
        }
    }, [searchTerm, processBarcode]);

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
                const med = fullInventory?.find(m => m.id === itemInCart.id);
                if (!med || Number(med.stock) < Number(itemInCart.quantity)) {
                    toast({ variant: 'destructive', title: `كمية غير كافية من ${itemInCart.name}`, description: `الكمية المطلوبة ${itemInCart.quantity}, المتوفر ${med?.stock ?? 0}` });
                    return;
                }
            }
        }

        const controlledSubstances = settings.controlled_substances || [];
        const drugsInCart = cart.filter(item =>
            !item.is_return && item.scientific_names?.some(scName =>
                controlledSubstances.map(cs => cs.toLowerCase()).includes(scName.toLowerCase())
            )
        );

        if (drugsInCart.length > 0) {
            // تحقق إذا كان الرمز قد تم تأكيده بالفعل
            if (isControlledDrugConfirmed) {
                setIsCheckoutOpen(true);
                setIsControlledDrugConfirmed(false); // إعادة تعيين الحالة للاستخدام المستقبلي
            } else {
                setControlledDrugsInCart(drugsInCart.map(d => d.name));
                setIsControlledDrugPinOpen(true);
                // لا تفتح نافذة الدفع مباشرة، انتظر تأكيد الرمز
                return;
            }
        } else {
            setIsCheckoutOpen(true);
        }
    }

    const handleFinalizeSale = async () => {
        if (!currentUser || isProcessingSale) return;
        setIsProcessingSale(true);

        try {

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
        } catch (error) {
            // Errors are already toasted in apiRequest
        } finally {
            setIsProcessingSale(false);
        }
    }

    const handleControlledDrugPinConfirm = async () => {
        // تم تعديل الدالة لتأكيد مباشر بدون تحقق من كلمة المرور
        setControlledDrugPin('');
        setIsControlledDrugPinOpen(false);
        setIsControlledDrugConfirmed(true);
        setIsCheckoutOpen(true);
        toast({
            variant: "default",
            title: "تنبيه: دواء خاضع للرقابة",
            description: "تأكد من توفر الوصفة الطبية وقم بترحيل المادة في سجل المؤثرات العقلية"
        });
    }

    const handleDeleteCurrentSale = async () => {
        if (!saleIdToUpdate) return;
        if (currentUser?.require_pin_for_delete) {
            setIsPinDialogOpen(true);
        } else {
            const success = await deleteSale(saleIdToUpdate);
            if (success) {
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
            if (success) {
                setSortedSales(prev => prev.filter(s => s.id !== saleIdToUpdate));
                closeInvoice(currentInvoiceIndex);
                toast({ title: "تم حذف الفاتورة" });
            }
        } else {
            toast({ variant: 'destructive', title: "كلمة المرور غير صحيحة" });
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
        if (activeInvoices[0].cart.length > 0) {
            const firstInvoiceToSave = { ...activeInvoices[0], reviewIndex: 0 };
            const otherInvoices = activeInvoices.slice(1);
            const invoicesToSave = [firstInvoiceToSave, ...otherInvoices];
            localStorage.setItem('savedInvoices', JSON.stringify(invoicesToSave));
        } else if (activeInvoices.length > 1) {
            const invoicesToSave = activeInvoices.slice(1).map((inv, idx) => ({ ...inv, reviewIndex: idx + 1 }));
            localStorage.setItem('savedInvoices', JSON.stringify(invoicesToSave));
        }

        router.push('/reports');
    }

    const handlePatientSearch = async (term: string) => {
        setPatientSearchTerm(term);
        if (term) {
            const results = await searchAllPatients(term);
            setPatientSuggestions(results);
        } else {
            // If search term is empty and we haven't loaded patients yet, load all patients
            if (!hasLoadedPatients) {
                const allPatients = await searchAllPatients("");
                setPatientSuggestions(allPatients);
                setHasLoadedPatients(true);
            } else {
                setPatientSuggestions([]);
            }
        }
    }

    const findAlternatives = (currentItem: SaleItem): Medication[] => {
        if (!fullInventory || !currentItem.scientific_names || currentItem.scientific_names.length === 0) {
            return [];
        }
        const currentScientificNames = currentItem.scientific_names
            .filter(s => s != null) // 过滤掉null/undefined值
            .map(s => s.toLowerCase());

        return fullInventory.filter(med =>
            med.id !== currentItem.id &&
            med.scientific_names?.some(scName =>
                scName != null && currentScientificNames.includes(scName.toLowerCase())
            )
        );
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            updateActiveInvoice(prev => ({ ...prev, discountValue: value }));
        }
    };

    const handlePaymentMethodChange = (value: 'cash' | 'card' | 'credit') => {
        updateActiveInvoice(prev => ({ ...prev, paymentMethod: value }));
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
                <BranchSearchDialog open={isBranchSearchOpen} onOpenChange={setIsBranchSearchOpen} />
                <BarcodeConflictDialog
                    open={isBarcodeConflictDialogOpen}
                    onOpenChange={setIsBarcodeConflictDialogOpen}
                    conflictingMeds={barcodeConflictMeds}
                    onSelect={(med) => {
                        addToCart(med);
                        setIsBarcodeConflictDialogOpen(false);
                    }}
                />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:h-[calc(100vh-6rem)]">
                    <div className="lg:col-span-2 flex flex-col gap-4">
                        <div className="flex gap-2 flex-col md:flex-row">
                            <div className="relative flex-[2]">
                                <Input
                                    placeholder="ابحث بالاسم التجاري أو العلمي..."
                                    value={nameSearchTerm}
                                    onChange={handleNameSearchChange}
                                    onKeyDown={handleSearchKeyDown}
                                    disabled={isSearchLoading}
                                    autoFocus
                                />
                                {nameSearchTerm.length > 0 && nameSuggestions.length > 0 && (
                                    <Card className="absolute z-50 w-full mt-1 bg-background shadow-lg border">
                                        <CardContent className="p-0">
                                            <ul className="divide-y divide-border max-h-[30rem] overflow-y-auto">
                                                {nameSuggestions.map(med => (
                                                    <li
                                                        key={med.id}
                                                        className="group p-3 hover:bg-accent rounded-md flex justify-between items-center cursor-pointer"
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            addToCart(med);
                                                            setNameSearchTerm("");
                                                            setNameSuggestions([]);
                                                        }}
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
                            <div className="relative flex-1">
                                <Input
                                    placeholder="امسح الباركود..."
                                    value={barcodeSearchTerm}
                                    onChange={handleBarcodeSearchChange}
                                    onKeyDown={handleBarcodeSearchKeyDown}
                                    disabled={isSearchLoading}
                                    ref={(input) => {
                                        if (input && document.activeElement === document.body) {
                                            input.focus();
                                        }
                                    }}
                                />
                            </div>
                            <Button variant="outline" size="icon" className="shrink-0" onClick={() => setIsBranchSearchOpen(true)}>
                                <ArrowLeftRight />
                            </Button>
                            <FavoritesPopover onSelect={addToCart} />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="shrink-0"><BrainCircuit /></Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <div className="flex flex-col gap-1">
                                        {referenceSites.map((site) => (
                                            <Dialog key={site.name}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" className="justify-start">{site.name}</Button>
                                                </DialogTrigger>
                                                <DialogContent className="p-0 border-0 sm:max-w-[400px] h-[70vh] flex flex-col gap-0">
                                                    <DialogHeader className="sr-only">
                                                        <DialogTitle>{site.name}</DialogTitle>
                                                    </DialogHeader>
                                                    <iframe src={site.url} title={site.name} className="w-full h-full" />
                                                </DialogContent>
                                            </Dialog>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            <Button variant="secondary" onClick={handleReviewClick}>
                                <FileText className="me-2" />
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
                                            <PlusCircle className="h-4 w-4" />
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
                                                    const medInInventory = fullInventory?.find(med => med.id === item.id);
                                                    const stock = medInInventory?.stock ?? 0;
                                                    const remainingStock = stock - (item.quantity || 0);
                                                    const isBelowCost = (Number(item.price) || 0) < (Number(item.purchase_price) || 0);
                                                    const alternatives = findAlternatives(item);
                                                    return (
                                                        <div key={`${item.id}-${item.is_return}`} className={cn("flex flex-col gap-3 p-3", item.is_return && "bg-red-50 dark:bg-red-900/20")} onClick={() => {
                                                            const medication = fullInventory.find(med => med.id === item.id);
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
                                                                                <PopoverContent className="w-80 max-h-80 overflow-y-auto">
                                                                                    <DialogHeader>
                                                                                        <DialogTitle>بدائل متاحة</DialogTitle>
                                                                                    </DialogHeader>
                                                                                    <div className="space-y-2">

                                                                                        <div className="space-y-1">
                                                                                            {alternatives.map(alt => (
                                                                                                <div key={alt.id} className="text-sm p-2 hover:bg-accent rounded-md flex justify-between items-center group cursor-pointer" onClick={() => addToCart(alt)}>
                                                                                                    <div>
                                                                                                        <div>{alt.name}</div>
                                                                                                        <div className="text-xs text-muted-foreground">المتوفر: {alt.stock}</div>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <span className="font-mono">{alt.price}</span>
                                                                                                        <PlusCircle className="h-4 w-4 text-green-600 group-hover:text-white" />
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
                                                                    <div className="flex items-center">
                                                                        <Button type="button" size="icon" variant="outline" className="h-9 w-9 rounded-e-none" onClick={() => updateQuantity(item.id, item.is_return, String((item.quantity || 0) + 1))}>
                                                                            <Plus className="h-4 w-4" />
                                                                        </Button>
                                                                        <Input id={`quantity-sm-${item.id}`} type="number" value={item.quantity || 1} min={0} onChange={(e) => updateQuantity(item.id, item.is_return, e.target.value)} className="h-9 w-14 text-center font-mono rounded-none border-x-0" />
                                                                        <Button type="button" size="icon" variant="outline" className="h-9 w-9 rounded-s-none" onClick={() => updateQuantity(item.id, item.is_return, String(Math.max(0, (item.quantity || 0) - 1)))}>
                                                                            <Minus className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label htmlFor={`price-sm-${item.id}`} className="text-xs">السعر الإجمالي</Label>
                                                                    <div className="relative">
                                                                        <Input id={`price-sm-${item.id}`} type="text" pattern="[0-9]*" value={((item.price || 0) * (item.quantity || 0))} onChange={(e) => updateTotalPrice(item.id, item.is_return, e.target.value)} className={cn("h-9 text-center font-mono", isBelowCost && !item.is_return && "border-destructive ring-2 ring-destructive/50 focus-visible:ring-destructive")} disabled={!priceModificationAllowed} />
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
                                                        <TableHead className="w-[150px] text-center">الكمية</TableHead>
                                                        <TableHead className="w-[120px] text-center">السعر</TableHead>
                                                        <TableHead className="w-12"></TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {cart.map((item) => {
                                                        const medInInventory = fullInventory.find(med => med.id === item.id);
                                                        const stock = medInInventory?.stock ?? 0;
                                                        const remainingStock = stock - (item.quantity || 0);
                                                        const isBelowCost = (Number(item.price) || 0) < (Number(item.purchase_price) || 0);
                                                        const alternatives = findAlternatives(item);

                                                        return (
                                                            <TableRow key={`${item.id}-${item.is_return}`} className={cn(item.is_return && "bg-red-50 dark:bg-red-900/20", "cursor-pointer")} onClick={() => {
                                                                const medication = fullInventory.find(med => med.id === item.id);
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
                                                                                <PopoverContent className="w-80 max-h-80 overflow-y-auto">
                                                                                    <DialogHeader>
                                                                                        <DialogTitle>بدائل متاحة</DialogTitle>
                                                                                    </DialogHeader>
                                                                                    <div className="space-y-2">
                                                                                        <div className="space-y-1">
                                                                                            {alternatives.map(alt => (
                                                                                                <div key={alt.id} className="text-sm p-2 hover:bg-accent rounded-md flex justify-between items-center group cursor-pointer" onClick={() => addToCart(alt)}>
                                                                                                    <div>
                                                                                                        <div>{alt.name}</div>
                                                                                                        <div className="text-xs text-muted-foreground">المتوفر: {alt.stock}</div>
                                                                                                    </div>
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <span className="font-mono">{alt.price}</span>
                                                                                                        <PlusCircle className="h-4 w-4 text-green-600 group-hover:text-white" />
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
                                                                    <div className="flex items-center justify-center">
                                                                        <Button type="button" size="icon" variant="outline" className="h-9 w-9 rounded-e-none" onClick={() => updateQuantity(item.id, item.is_return, String((item.quantity || 0) + 1))}>
                                                                            <Plus className="h-4 w-4" />
                                                                        </Button>
                                                                        <Input id={`quantity-${item.id}`} type="number" value={item.quantity || 1} onChange={(e) => updateQuantity(item.id, item.is_return, e.target.value)} min={0} className="w-16 h-9 text-center font-mono rounded-none border-x-0" />
                                                                        <Button type="button" size="icon" variant="outline" className="h-9 w-9 rounded-s-none" onClick={() => updateQuantity(item.id, item.is_return, String(Math.max(0, (item.quantity || 0) - 1)))}>
                                                                            <Minus className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="text"
                                                                            pattern="[0-9]*"
                                                                            value={((item.price || 0) * (item.quantity || 0))}
                                                                            onChange={(e) => updateTotalPrice(item.id, item.is_return, e.target.value)}
                                                                            className={cn("w-24 h-9 text-center font-mono", isBelowCost && !item.is_return && "border-destructive ring-2 ring-destructive/50 focus-visible:ring-destructive")}
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
                                    <AdCarousel page="sales" />
                                </div>
                                <div className="relative">
                                    <Dialog open={isPatientModalOpen} onOpenChange={setIsPatientModalOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full justify-between text-left font-normal">
                                                <span className="flex items-center gap-2">
                                                    <UserIcon className="text-muted-foreground" />
                                                    {selectedPatient ? selectedPatient.name : "تحديد صديق الصيدلية"}
                                                </span>
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
                                                        <div key={p.id} onClick={() => { updateActiveInvoice(prev => ({ ...prev, patientId: p.id })); setIsPatientModalOpen(false); }}
                                                            className="p-2 hover:bg-accent cursor-pointer">
                                                            {p.name}
                                                        </div>
                                                    ))}
                                                </ScrollArea>
                                                <Separator />
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    {selectedPatient && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-1/2 left-1 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-destructive"
                                            onClick={() => updateActiveInvoice(prev => ({ ...prev, patientId: null }))}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
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
                                    <RadioGroup defaultValue="fixed" value={discountType} onValueChange={(value: any) => updateActiveInvoice(prev => ({ ...prev, discountType: value }))} className="flex">
                                        <Button type="button" size="sm" variant={discountType === 'fixed' ? 'secondary' : 'ghost'} onClick={() => updateActiveInvoice(prev => ({ ...prev, discountType: 'fixed' }))}>IQD</Button>
                                        <Button type="button" size="icon" variant={discountType === 'percentage' ? 'secondary' : 'ghost'} onClick={() => updateActiveInvoice(prev => ({ ...prev, discountType: 'percentage' }))} className="h-9 w-9"><Percent className="h-4 w-4" /></Button>
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
                                            <DialogHeader>
                                                <DialogTitle className="sr-only">Calculator</DialogTitle>
                                            </DialogHeader>
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
                                            <Button size="lg" className="flex-1" onClick={handleCheckout} disabled={cart.length === 0 || isProcessingSale} variant={saleIdToUpdate ? 'default' : 'success'}>
                                                {isProcessingSale ? "جاري الحفظ..." : (saleIdToUpdate ? 'تحديث الفاتورة' : (mode === 'return' ? 'إتمام الاسترجاع' : 'إتمام العملية'))}
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
                                                <Separator />
                                                <div className="space-y-2 text-sm font-mono">
                                                    {selectedPatient &&
                                                        <div className="flex justify-between">
                                                            <span>المريض:</span>
                                                            <span>{selectedPatient.name}</span>
                                                        </div>
                                                    }
                                                    <div className="flex justify-between">
                                                        <span>المجموع:</span>
                                                        <span>{subtotal.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>الخصم:</span>
                                                        <span>-{discountAmount.toLocaleString()}</span>
                                                    </div>
                                                    <div className={cn("flex justify-between", finalProfit >= 0 ? "text-green-600" : "text-destructive")}>
                                                        <span>الربح الصافي:</span>
                                                        <span>{finalProfit.toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold text-lg">
                                                        <span>الإجمالي النهائي:</span>
                                                        <span>{finalTotal.toLocaleString()}</span>
                                                    </div>
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
                                                <DialogClose asChild>
                                                    <Button variant="outline" disabled={isProcessingSale}>إلغاء</Button>
                                                </DialogClose>
                                                <Button onClick={handleFinalizeSale} disabled={isProcessingSale} variant={saleIdToUpdate ? 'default' : 'success'}>
                                                    {isProcessingSale ? 'جاري الحفظ...' : (saleIdToUpdate ? 'تأكيد التعديل' : (mode === 'return' ? 'تأكيد الاسترجاع' : 'تأكيد البيع'))}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                                {activeInvoices.length === 1 && activeInvoice.cart.length > 0 && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline" className="w-full" disabled={cart.length === 0}>
                                                <X className="me-2" />
                                                {saleIdToUpdate ? 'إلغاء التعديل' : 'إلغاء الفاتورة'}
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    {saleIdToUpdate ? 'سيتم تجاهل جميع التغييرات التي قمت بها.' : 'سيتم حذف جميع الأصناف من السلة الحالية.'}
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
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
                                                <Trash2 className="me-2" />
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
                        description="هذه العملية تتطلب تأكيدًا. الرجاء إدخال كلمة مرور للمتابعة."
                    />
                    <Dialog open={isControlledDrugPinOpen} onOpenChange={(open) => {
                        if (!open) {
                            // تم إغلاق النافذة بدون تأكيد
                            setControlledDrugPin('');
                            setIsControlledDrugConfirmed(false);
                        }
                        setIsControlledDrugPinOpen(open);
                    }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>دواء خاضع للرقابة</DialogTitle>
                                {controlledDrugsInCart.length > 0 && (
                                    <div className="text-sm font-semibold text-center text-destructive py-2">
                                        المادة: {controlledDrugsInCart.join(', ')}
                                    </div>
                                )}
                                <DialogDescription>
                                    هذه الفاتورة تحتوي على مادة خاضعة للرقابة. صرف هذه المادة بدون وصفة طبية يعرضك للمساءلة القانونية التي قد تصل إلى السجن حسب أحكام القانون العراقي. لا تنسى ترحيل المادة في سجل المؤثرات العقلية.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Alert className="bg-amber-50 border-amber-200">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <AlertTitle className="text-amber-800">تنبيه هام</AlertTitle>
                                    <AlertDescription className="text-amber-700">
                                        تأكد من توفر الوصفة الطبية اللازمة قبل صرف هذه المادة.
                                    </AlertDescription>
                                </Alert>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                <Button variant="destructive" onClick={() => handleControlledDrugPinConfirm()}>تأكيد ومتابعة</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </TooltipProvider>
        </>
    )
}
