
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
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { inventory as fallbackInventory } from "@/lib/data"
import type { Medication } from "@/lib/types"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { MoreHorizontal, ListFilter, Trash2, Pencil, X } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"


export default function InventoryPage() {
  const [allInventory, setAllInventory] = useLocalStorage<Medication[]>('inventory', fallbackInventory);
  const [filteredInventory, setFilteredInventory] = React.useState<Medication[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("all");
  
  const [editingMed, setEditingMed] = React.useState<Medication | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false)

  const { toast } = useToast();

  React.useEffect(() => {
    setIsClient(true)
  }, [])


  const categories = React.useMemo(() => ["all", ...Array.from(new Set(allInventory.map(item => item.category)))], [allInventory]);

  React.useEffect(() => {
    if (isClient) {
        let tempInventory = allInventory;

        if (searchTerm) {
        tempInventory = tempInventory.filter((item) =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
        }
        
        if (categoryFilter !== "all") {
            tempInventory = tempInventory.filter(item => item.category === categoryFilter);
        }

        setFilteredInventory(tempInventory);
    }
  }, [searchTerm, allInventory, categoryFilter, isClient]);

  const getStockStatus = (stock: number, reorderPoint: number) => {
    if (stock <= 0) return <Badge variant="destructive">نفد من المخزون</Badge>
    if (stock < reorderPoint) return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">مخزون منخفض</Badge>
    return <Badge variant="secondary" className="bg-green-300 text-green-900">متوفر</Badge>
  }

  const handleDelete = (medId: string) => {
      setAllInventory(prev => prev.filter(m => m.id !== medId));
      toast({ title: "تم حذف الدواء", description: "تمت إزالة الدواء من المخزون بنجاح." });
  }

  const openEditModal = (med: Medication) => {
      setEditingMed(med);
      setIsEditModalOpen(true);
  }

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingMed) return;

      const formData = new FormData(e.currentTarget);
      const updatedMed: Medication = {
          ...editingMed,
          name: formData.get('name') as string,
          reorderPoint: parseInt(formData.get('reorderPoint') as string, 10),
          price: parseFloat(formData.get('price') as string),
          category: formData.get('category') as string,
      }
      
      setAllInventory(prev => prev.map(m => m.id === updatedMed.id ? updatedMed : m));
      toast({ title: "تم تحديث الدواء", description: `تم تحديث بيانات ${updatedMed.name} بنجاح.` });
      setIsEditModalOpen(false);
      setEditingMed(null);
  }

  if (!isClient) {
    return (
        <Card>
            <CardHeader>
                <CardTitle><Skeleton className="h-8 w-48" /></CardTitle>
                <CardDescription>
                    <Skeleton className="h-5 w-72" />
                </CardDescription>
                <div className="pt-4 flex gap-2">
                    <Skeleton className="h-10 max-w-sm flex-1" />
                    <Skeleton className="h-10 w-28" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>المعرف</TableHead>
                                <TableHead>الاسم</TableHead>
                                <TableHead>الفئة</TableHead>
                                <TableHead>المورد</TableHead>
                                <TableHead className="text-center">المخزون</TableHead>
                                <TableHead className="text-center">نقطة إعادة الطلب</TableHead>
                                <TableHead>تاريخ الانتهاء</TableHead>
                                <TableHead className="text-center">سعر البيع</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-10 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-16 mx-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة المخزون</CardTitle>
        <CardDescription>
          إدارة وتتبع مخزون الأدوية الخاص بك.
        </CardDescription>
        <div className="pt-4 flex gap-2">
          <Input 
            placeholder="ابحث بالاسم أو المعرف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
           <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-1">
                        <ListFilter className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            تصفية
                        </span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    <DropdownMenuLabel>تصفية حسب الفئة</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioGroup value={categoryFilter} onValueChange={setCategoryFilter}>
                        {categories.map(cat => (
                             <DropdownMenuRadioItem key={cat} value={cat}>{cat === 'all' ? 'الكل' : cat}</DropdownMenuRadioItem>
                        ))}
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المعرف</TableHead>
              <TableHead>الاسم</TableHead>
              <TableHead>الفئة</TableHead>
              <TableHead>المورد</TableHead>
              <TableHead className="text-center">المخزون</TableHead>
              <TableHead className="text-center">نقطة إعادة الطلب</TableHead>
              <TableHead>تاريخ الانتهاء</TableHead>
              <TableHead className="text-center">سعر البيع</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead><span className="sr-only">الإجراءات</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.supplierName}</TableCell>
                <TableCell className="text-center">{item.stock}</TableCell>
                <TableCell className="text-center">{item.reorderPoint}</TableCell>
                <TableCell>{new Date(item.expirationDate).toLocaleDateString('ar-EG')}</TableCell>
                <TableCell className="text-center">${item.price.toFixed(2)}</TableCell>
                <TableCell>{getStockStatus(item.stock, item.reorderPoint)}</TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => openEditModal(item)}>
                                <Pencil className="me-2 h-4 w-4" />
                                تعديل
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                             <Dialog>
                                <DialogTrigger asChild>
                                    <button className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 w-full text-destructive">
                                      <Trash2 className="me-2 h-4 w-4" />
                                      حذف
                                    </button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>هل أنت متأكد تمامًا؟</DialogTitle>
                                        <DialogDescription>
                                            هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف الدواء بشكل دائم من مخزونك.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild><Button variant="outline">إلغاء</Button></DialogClose>
                                        <Button variant="destructive" onClick={() => handleDelete(item.id)}>نعم، قم بالحذف</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </CardContent>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>تعديل بيانات الدواء</DialogTitle>
                    <DialogDescription>
                       قم بتحديث تفاصيل الدواء. ملاحظة: لا يمكن تعديل المخزون من هنا.
                    </DialogDescription>
                </DialogHeader>
                 {editingMed && (
                    <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">اسم الدواء</Label>
                            <Input id="edit-name" name="name" defaultValue={editingMed.name} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="edit-reorderPoint">نقطة إعادة الطلب</Label>
                                <Input id="edit-reorderPoint" name="reorderPoint" type="number" defaultValue={editingMed.reorderPoint} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-price">سعر البيع ($)</Label>
                                <Input id="edit-price" name="price" type="number" step="0.01" defaultValue={editingMed.price} required />
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="edit-category">الفئة</Label>
                            <Input id="edit-category" name="category" defaultValue={editingMed.category} required />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline">إلغاء</Button></DialogClose>
                            <Button type="submit">حفظ التغييرات</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    </Card>
  )
}

    