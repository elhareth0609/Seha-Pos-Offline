
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
import { useToast } from "@/hooks/use-toast"
import type { TrashItem, Medication, Patient, Supplier, User } from "@/lib/types"
import { Trash2, RotateCcw } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { buttonVariants } from "@/components/ui/button"


export default function TrashPage() {
  const { currentUser, scopedData, restoreItem, permDelete, clearTrash } = useAuth();
  const { trash: [trash, setTrash] } = scopedData;
  
  const { toast } = useToast();

  const item_typeLabels = {
    medication: 'دواء',
    patient: 'مريض',
    supplier: 'مورد',
    user: 'موظف',
  }

  const handleRestore = async (itemToRestore: TrashItem) => {
    await restoreItem(itemToRestore.id);
  };

  const handlePermanentDelete = async (itemToDelete: TrashItem) => {
    await permDelete(itemToDelete.id);
  };

  const handleClearTrash = async () => {
    await clearTrash();
  }

  const sortedTrash = Array.isArray(trash) ? [...trash].sort((a, b) => new Date(b.deleted_at).getTime() - new Date(a.deleted_at).getTime()) : [];


  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
            <CardTitle>سلة المحذوفات</CardTitle>
            <CardDescription>
            العناصر المحذوفة من النظام. يمكنك استعادتها أو حذفها نهائياً.
            </CardDescription>
        </div>
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
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearTrash} className={buttonVariants({ variant: "destructive" })}>
                            نعم، قم بالحذف
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </CardHeader>
      <CardContent>
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
            {sortedTrash.length > 0 ? sortedTrash.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.data.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{item_typeLabels[item.item_type]}</Badge>
                </TableCell>
                <TableCell>{new Date(item.deleted_at).toLocaleString('ar-EG')}</TableCell>
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
                                <AlertDialogFooter>
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
      </CardContent>
    </Card>
  )
}
