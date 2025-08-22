
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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Expense } from "@/lib/types"
import { PlusCircle, MoreHorizontal, Pencil, Trash2, Coins } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { PinDialog } from "@/components/auth/PinDialog"

export default function ExpensesPage() {
  const { getPaginatedExpenses, addExpense, updateExpense, deleteExpense, verifyPin, currentUser } = useAuth();
  const { toast } = useToast();
  
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newAmount, setNewAmount] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  
  const [itemToDelete, setItemToDelete] = React.useState<Expense | null>(null);
  const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false);

  const fetchData = React.useCallback(async (page: number, limit: number, search: string) => {
    setLoading(true);
    try {
      const data = await getPaginatedExpenses(page, limit, search);
      setExpenses(data.data);
      setTotalPages(data.last_page);
      setCurrentPage(data.current_page);
    } catch (error) {
      console.error("Failed to fetch expenses", error);
    } finally {
      setLoading(false);
    }
  }, [getPaginatedExpenses]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
        fetchData(currentPage, perPage, searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [currentPage, perPage, searchTerm, fetchData]);


  const resetAddDialog = () => {
    setNewAmount("");
    setNewDescription("");
    setIsAddDialogOpen(false);
  }
  
  const handleAddExpense = async () => {
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
        toast({ variant: 'destructive', title: "مبلغ غير صالح", description: "الرجاء إدخال مبلغ صحيح." });
        return;
    }
    if (!newDescription.trim()) {
        toast({ variant: 'destructive', title: "الوصف مطلوب", description: "الرجاء إدخال وصف للمصروف." });
        return;
    }
    
    const success = await addExpense(amount, newDescription);
    if (success) {
      fetchData(1, perPage, ""); // Refresh data
      resetAddDialog();
    }
  }
  
  const openEditDialog = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  }
  
  const handleEditExpense = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingExpense) return;
      
      const formData = new FormData(e.currentTarget);
      const amount = parseFloat(formData.get("amount") as string);
      const description = formData.get("description") as string;
      
      if (isNaN(amount) || amount <= 0) {
        toast({ variant: 'destructive', title: "مبلغ غير صالح" });
        return;
      }
      if (!description.trim()) {
        toast({ variant: 'destructive', title: "الوصف مطلوب" });
        return;
      }
      
      const success = await updateExpense(editingExpense.id, amount, description);
      
      if(success) {
        fetchData(currentPage, perPage, searchTerm); // Refresh current page
        setIsEditDialogOpen(false);
        setEditingExpense(null);
      }
  }
  
  const handleDeleteExpense = async () => {
      if (!itemToDelete) return;
      
      if (currentUser?.require_pin_for_delete) {
          setIsPinDialogOpen(true);
      } else {
          const success = await deleteExpense(itemToDelete.id);
          if(success) {
              fetchData(currentPage, perPage, searchTerm);
              setItemToDelete(null);
          }
      }
  }
  
  const handlePinConfirm = async (pin: string) => {
    if (!itemToDelete) return;
    const isValid = await verifyPin(pin);
    if (isValid) {
      setIsPinDialogOpen(false);
      const success = await deleteExpense(itemToDelete.id);
      if(success) {
          fetchData(currentPage, perPage, searchTerm);
          setItemToDelete(null);
      }
    } else {
      toast({ variant: "destructive", title: "رمز PIN غير صحيح." });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2"><Coins /> إدارة الصرفيات</CardTitle>
                <CardDescription>
                سجل وتتبع جميع المصاريف والنفقات الخاصة بالصيدلية.
                </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="success"><PlusCircle className="me-2"/> إضافة مصروف</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>إضافة مصروف جديد</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="expense-amount">المبلغ</Label>
                            <Input 
                                id="expense-amount" 
                                type="number" 
                                value={newAmount} 
                                onChange={(e) => setNewAmount(e.target.value)} 
                                placeholder="مثال: 25000"
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="expense-description">الوصف</Label>
                            <Textarea 
                                id="expense-description" 
                                value={newDescription} 
                                onChange={(e) => setNewDescription(e.target.value)} 
                                placeholder="مثال: فاتورة كهرباء شهر يوليو" 
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" onClick={resetAddDialog}>إلغاء</Button>
                        </DialogClose>
                        <Button type="button" onClick={handleAddExpense} variant="success">إضافة</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
        <div className="pt-4 flex flex-wrap gap-2">
          <Input 
            placeholder="ابحث في الوصف..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
           <div className="flex items-center gap-2">
              <Label htmlFor="per-page" className="shrink-0">لكل صفحة:</Label>
              <Select value={String(perPage)} onValueChange={(val) => setPerPage(Number(val))}>
                <SelectTrigger id="per-page" className="w-20 h-9">
                  <SelectValue placeholder={perPage} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>الوصف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>المسؤول</TableHead>
                    <TableHead><span className="sr-only">الإجراءات</span></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                 {loading ? Array.from({length: perPage}).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                 )) : expenses.length > 0 ? expenses.map((expense) => (
                     <TableRow key={expense.id}>
                        <TableCell className="font-mono text-sm">{new Date(expense.created_at).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="font-medium">{expense.description}</TableCell>
                        <TableCell className="font-mono text-destructive">{expense.amount.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">{expense.user_name}</TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                                    <DropdownMenuItem onSelect={() => openEditDialog(expense)}>
                                        <Pencil className="me-2 h-4 w-4"/>
                                        تعديل
                                    </DropdownMenuItem>
                                    
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <button 
                                                className="text-destructive relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground"
                                                onClick={() => setItemToDelete(expense)}
                                            >
                                                <Trash2 className="me-2 h-4 w-4"/>
                                                حذف
                                            </button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>هل أنت متأكد من حذف هذا المصروف؟</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    سيتم حذف هذا السجل نهائياً. لا يمكن التراجع عن هذا الإجراء.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="sm:space-x-reverse">
                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteExpense} className='bg-destructive hover:bg-destructive/90'>نعم، قم بالحذف</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                     </TableRow>
                 )) : (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            لم يتم تسجيل أي مصاريف.
                        </TableCell>
                    </TableRow>
                 )}
            </TableBody>
        </Table>
        </div>
         <div className="flex items-center justify-between pt-4">
              <span className="text-sm text-muted-foreground">
                  الصفحة {currentPage} من {totalPages}
              </span>
              <div className="flex gap-2">
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1 || loading}
                  >
                      السابق
                  </Button>
                  <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || loading}
                  >
                      التالي
                  </Button>
              </div>
          </div>
      </CardContent>
       <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
                setEditingExpense(null);
            }
        }}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>تعديل المصروف</DialogTitle>
                </DialogHeader>
                {editingExpense && (
                    <form onSubmit={handleEditExpense} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-expense-amount">المبلغ</Label>
                            <Input 
                                id="edit-expense-amount" 
                                name="amount"
                                type="number"
                                defaultValue={editingExpense.amount} 
                                required 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-expense-description">الوصف</Label>
                            <Textarea 
                                id="edit-expense-description" 
                                name="description"
                                defaultValue={editingExpense.description} 
                                required
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="outline" type="button">إلغاء</Button></DialogClose>
                            <Button type="submit" variant="success">حفظ التغييرات</Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
        <PinDialog
            open={isPinDialogOpen}
            onOpenChange={setIsPinDialogOpen}
            onConfirm={handlePinConfirm}
        />
    </Card>
  )
}
