
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
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
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
import type { TrashItem, User } from "@/lib/types"
import { Trash2, RotateCcw, ShieldCheck } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { buttonVariants } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"


export default function TrashPage() {
  const { currentUser, users, restoreItem, permDelete, clearTrash, getPaginatedTrash, updateUserPinRequirement } = useAuth();
  
  const [trash, setTrash] = React.useState<TrashItem[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = React.useState(false);

  const item_typeLabels = {
    medication: 'دواء',
    patient: 'مريض',
    supplier: 'مورد',
    user: 'موظف',
    sale: 'فاتورة بيع',
    task: 'مهمة',
  }
  
  const fetchData = React.useCallback(async (page: number, limit: number) => {
    setLoading(true);
    try {
      const data = await getPaginatedTrash(page, limit);
      setTrash(data.data);
      setTotalPages(data.last_page);
      setCurrentPage(data.current_page);
    } catch (error) {
      console.error("Failed to fetch trash", error);
    } finally {
      setLoading(false);
    }
  }, [getPaginatedTrash]);

  React.useEffect(() => {
    fetchData(currentPage, perPage);
  }, [currentPage, perPage, fetchData]);

  const handleRestore = async (itemToRestore: TrashItem) => {
    const success = await restoreItem(itemToRestore.id);
    if(success) fetchData(currentPage, perPage);
  };

  const handlePermanentDelete = async (itemToDelete: TrashItem) => {
    const success = await permDelete(itemToDelete.id);
    if(success) fetchData(currentPage, perPage);
  };

  const handleClearTrash = async () => {
    const success = await clearTrash();
    if(success) fetchData(1, perPage);
  }

  const handlePinRequirementChange = (userId: string, requirePin: boolean) => {
    updateUserPinRequirement(userId, requirePin);
  };

  const pharmacyUsers = users.filter(u => u.pharmacy_id === currentUser?.pharmacy_id && u.role !== 'SuperAdmin');


  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
            <CardTitle>سلة المحذوفات</CardTitle>
            <CardDescription>
            العناصر المحذوفة من النظام. يمكنك استعادتها أو حذفها نهائياً.
            </CardDescription>
        </div>
        <div className="flex gap-2">
            {/* {currentUser?.role === 'Admin' && (
              <Dialog open={isSecurityDialogOpen} onOpenChange={setIsSecurityDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline"><ShieldCheck className="me-2 h-4 w-4" /> إعدادات الحذف الآمن</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>إعدادات الحذف الآمن</DialogTitle>
                        <DialogDescription>
                            قم بتفعيل خيار طلب رمز PIN قبل تنفيذ أي عملية حذف لحماية بياناتك من الحذف العرضي أو غير المصرح به.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        {pharmacyUsers.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-2 border rounded-md">
                                <Label htmlFor={`pin-switch-${user.id}`} className="cursor-pointer">
                                    <div className="font-medium">{user.name}</div>
                                    <div className="text-xs text-muted-foreground">{user.role === 'Admin' ? 'مدير' : 'موظف'}</div>
                                </Label>
                                <Switch
                                    dir='ltr'
                                    id={`pin-switch-${user.id}`}
                                    checked={user.require_pin_for_delete}
                                    onCheckedChange={(checked) => handlePinRequirementChange(user.id, checked)}
                                />
                            </div>
                        ))}
                    </div>
                </DialogContent>
              </Dialog>
            )} */}
            {currentUser?.role === 'Admin' && trash.length > 0 && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive"><Trash2 className="me-2 h-4 w-4"/> تفريغ السلة</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>هل أنت متأكد من تفريغ السلة؟</AlertDialogTitle>
                            <AlertDialogDescription>
                                هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع العناصر في السلة بشكل دائم.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="md:space-x-reverse">
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearTrash} className={buttonVariants({ variant: "destructive" })}>
                                نعم، قم بالحذف
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </div>
      </CardHeader>
      <CardContent>
         <div className="pb-4 flex items-center gap-2">
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
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>الاسم</TableHead>
              <TableHead>النوع</TableHead>
              <TableHead>تاريخ الحذف</TableHead>
              <TableHead className="text-left">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? Array.from({length: perPage}).map((_,i) => (
                <TableRow key={`skel-${i}`}>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><div className="flex gap-2 justify-end"><Skeleton className="h-9 w-24" /><Skeleton className="h-9 w-24" /></div></TableCell>
                </TableRow>
            )) : trash.length > 0 ? trash.map((item) => (
              <TableRow key={`${item.id}-${item.deleted_at}`}>
                <TableCell className="font-medium">{item.data.name || `فاتورة #${item.data.id}`}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{item_typeLabels[item.item_type as keyof typeof item_typeLabels]}</Badge>
                </TableCell>
                <TableCell>{new Date(item.deleted_at).toLocaleString('en-US')}</TableCell>
                <TableCell className="text-left space-x-2 space-x-reverse">
                    <Button variant="outline" size="sm" onClick={() => handleRestore(item)}>
                        <RotateCcw className="me-2 h-4 w-4"/>
                        استعادة
                    </Button>
                    {currentUser?.role === 'Admin' && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                    <Trash2 className="me-2 h-4 w-4"/>
                                    حذف نهائي
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>هل أنت متأكد من الحذف النهائي؟</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        لا يمكن التراجع عن هذا الإجراء.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="md:space-x-reverse">
                                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handlePermanentDelete(item)} className={buttonVariants({ variant: "destructive" })}>
                                        حذف
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-16">
                        <Trash2 className="mx-auto h-12 w-12 mb-4 text-gray-300" />
                        سلة المحذوفات فارغة.
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
    </Card>
  )
}
