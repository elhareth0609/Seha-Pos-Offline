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
import { inventory as allInventory } from "@/lib/data"
import type { Medication, SaleItem } from "@/lib/types"
import { PlusCircle, MinusCircle, X, PackageSearch, ScanLine } from "lucide-react"
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';

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
  const [inventory, setInventory] = React.useState<Medication[]>(allInventory)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [cart, setCart] = React.useState<SaleItem[]>([])
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const { toast } = useToast()

  React.useEffect(() => {
    const filtered = allInventory.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setInventory(filtered)
  }, [searchTerm])

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
      return [...prevCart, { medicationId: medication.id, name: medication.name, quantity: 1, price: medication.price }]
    })
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

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "السلة فارغة", description: "أضف منتجات إلى السلة قبل إتمام عملية البيع.", variant: "destructive" })
      return
    }
    console.log("Checkout complete:", cart)
    toast({
      title: "تم تسجيل البيع",
      description: `تم تسجيل عملية بيع جديدة بقيمة ${cartTotal.toFixed(2)}$`
    })
    setCart([])
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5 h-[calc(100vh-theme(spacing.48))]">
      <div className="lg:col-span-3">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>قائمة الأدوية</CardTitle>
                    <CardDescription>ابحث عن الأدوية لإضافتها إلى البيع.</CardDescription>
                </div>
                <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline"><ScanLine className="me-2"/> مسح الباركود</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>مسح باركود المنتج</DialogTitle>
                        </DialogHeader>
                        <BarcodeScanner onScan={handleScan} onOpenChange={setIsScannerOpen}/>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="pt-4">
              <Input 
                placeholder="ابحث عن الأدوية..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead className="text-left">المخزون</TableHead>
                    <TableHead className="text-left">السعر</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-left">{item.stock}</TableCell>
                      <TableCell className="text-left">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-left">
                        <Button size="sm" onClick={() => addToCart(item)}>أضف إلى السلة</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>البيع الحالي</CardTitle>
            <CardDescription>المنتجات في العملية الحالية.</CardDescription>
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
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.medicationId}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                            <span>{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-left">${(item.price * item.quantity).toFixed(2)}</TableCell>
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
                    <p className="text-sm">أضف منتجات من القائمة للبدء.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-auto border-t pt-6">
            <div className="flex justify-between w-full text-lg font-semibold">
                <span>الإجمالي</span>
                <span>${cartTotal.toFixed(2)}</span>
            </div>
            <Button size="lg" className="w-full" onClick={handleCheckout} disabled={cart.length === 0}>
                تسجيل البيع
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
