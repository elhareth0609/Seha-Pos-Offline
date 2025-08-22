
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Task, User } from "@/lib/types"
import { PlusCircle, Trash2, ListChecks, CheckCircle2 } from "lucide-react"
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
import { useAuth } from "@/hooks/use-auth"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"

export default function TasksPage() {
  const { currentUser, users, getPaginatedTasks, addTask, updateTask, updateStatusTask, deleteTask } = useAuth();
  
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  
  const [employeeFilter, setEmployeeFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  const [newTaskDescription, setNewTaskDescription] = React.useState("");
  const [assignedUserId, setAssignedUserId] = React.useState("");

  const fetchData = React.useCallback(async (page: number, limit: number, filters: { user_id?: string, completed?: boolean }) => {
    setLoading(true);
    try {
      const data = await getPaginatedTasks(page, limit, filters);
      setTasks(data.data);
      setTotalPages(data.last_page);
      setCurrentPage(data.current_page);
    } catch (error) {
      console.error("Failed to fetch tasks", error);
    } finally {
      setLoading(false);
    }
  }, [getPaginatedTasks]);

  React.useEffect(() => {
    const filters: { user_id?: string, completed?: boolean } = {};
    if (employeeFilter !== 'all') filters.user_id = employeeFilter;
    if (statusFilter !== 'all') filters.completed = statusFilter === 'completed';
    fetchData(currentPage, perPage, filters);
  }, [currentPage, perPage, employeeFilter, statusFilter, fetchData]);

  const handleTaskStatusChange = async (taskId: string, completed: boolean) => {
    await updateStatusTask(taskId, { completed });
    const filters: { user_id?: string, completed?: boolean } = {};
    if (employeeFilter !== 'all') filters.user_id = employeeFilter;
    if (statusFilter !== 'all') filters.completed = statusFilter === 'completed';
    fetchData(currentPage, perPage, filters);
  };
  
  const handleDeleteTask = async (taskId: string) => {
    await deleteTask(taskId);
    const filters: { user_id?: string, completed?: boolean } = {};
    if (employeeFilter !== 'all') filters.user_id = employeeFilter;
    if (statusFilter !== 'all') filters.completed = statusFilter === 'completed';
    fetchData(currentPage, perPage, filters);
  }

  const handleAddTask = async () => {
    if (!newTaskDescription || !assignedUserId) return;
    await addTask(newTaskDescription, assignedUserId);
    setNewTaskDescription("");
    setAssignedUserId("");
    setIsAddDialogOpen(false);
    const filters: { user_id?: string, completed?: boolean } = {};
    if (employeeFilter !== 'all') filters.user_id = employeeFilter;
    if (statusFilter !== 'all') filters.completed = statusFilter === 'completed';
    fetchData(1, perPage, filters);
  }
  
  const pharmacyUsers = users.filter(u => u.pharmacy_id === currentUser?.pharmacy_id && u.role !== 'SuperAdmin');
  const visibleTasks = currentUser?.role === 'Admin' ? tasks : tasks.filter(t => t.user_id === currentUser?.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="flex items-center gap-2"><ListChecks /> إدارة المهام</CardTitle>
                <CardDescription>
                إضافة وتتبع المهام اليومية للموظفين.
                </CardDescription>
            </div>
            {currentUser?.role === 'Admin' && (
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="success"><PlusCircle className="me-2"/> إضافة مهمة</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>إضافة مهمة جديدة</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="task-description">وصف المهمة</Label>
                                <Textarea 
                                    id="task-description" 
                                    value={newTaskDescription} 
                                    onChange={(e) => setNewTaskDescription(e.target.value)} 
                                    placeholder="مثال: ترتيب رف الأدوية المسكنة" 
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="assign-user">إسناد إلى الموظف</Label>
                                <Select value={assignedUserId} onValueChange={setAssignedUserId}>
                                    <SelectTrigger id="assign-user"><SelectValue placeholder="اختر موظفًا"/></SelectTrigger>
                                    <SelectContent>
                                        {pharmacyUsers.map(user => (
                                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">إلغاء</Button>
                            </DialogClose>
                            <Button type="button" onClick={handleAddTask} variant="success">إضافة</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </div>
        <div className="pt-4 flex flex-wrap gap-2">
          {currentUser?.role === 'Admin' && (
            <div className="flex items-center gap-2">
              <Label htmlFor="employee-filter" className="shrink-0">الموظف:</Label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger id="employee-filter" className="w-40 h-9">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                   {pharmacyUsers.map(user => (
                        <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
           <div className="flex items-center gap-2">
              <Label htmlFor="status-filter" className="shrink-0">الحالة:</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-32 h-9">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="pending">غير منجزة</SelectItem>
                  <SelectItem value="completed">منجزة</SelectItem>
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
                    <TableHead className="w-12">الحالة</TableHead>
                    <TableHead>المهمة</TableHead>
                    {currentUser?.role === 'Admin' && <TableHead>الموظف المسؤول</TableHead>}
                    <TableHead>تاريخ الإنشاء</TableHead>
                    {currentUser?.role === 'Admin' && <TableHead><span className="sr-only">الإجراءات</span></TableHead>}
                </TableRow>
            </TableHeader>
            <TableBody>
                 {loading ? Array.from({length: perPage}).map((_, i) => (
                    <TableRow key={`skel-${i}`}>
                        <TableCell><Skeleton className="h-5 w-5" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-64" /></TableCell>
                        {currentUser?.role === 'Admin' && <TableCell><Skeleton className="h-5 w-24" /></TableCell>}
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        {currentUser?.role === 'Admin' && <TableCell><Skeleton className="h-8 w-8" /></TableCell>}
                    </TableRow>
                 )) : visibleTasks.length > 0 ? visibleTasks.map((task) => (
                     <TableRow key={task.id}>
                        <TableCell className="[&:has([role=checkbox])]:pr-4">
                            <Checkbox 
                                checked={task.completed} 
                                onCheckedChange={(checked) => handleTaskStatusChange(task.id, !!checked)}
                                disabled={task.completed && currentUser?.role !== 'Admin'}
                            />
                        </TableCell>
                        <TableCell className={task.completed ? "text-muted-foreground line-through" : ""}>{task.description}</TableCell>
                        {currentUser?.role === 'Admin' && <TableCell>{task.user_name}</TableCell>}
                        <TableCell className="font-mono text-sm">{new Date(task.created_at).toLocaleDateString('ar-EG')}</TableCell>
                        {currentUser?.role === 'Admin' && (
                            <TableCell>
                                {task.completed && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8">
                                                <Trash2 className="h-4 w-4"/>
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>هل أنت متأكد من حذف هذه المهمة؟</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    سيتم حذف هذه المهمة المنجزة نهائياً.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="sm:space-x-reverse">
                                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteTask(task.id)} className='bg-destructive hover:bg-destructive/90'>نعم، قم بالحذف</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </TableCell>
                        )}
                     </TableRow>
                 )) : (
                    <TableRow>
                        <TableCell colSpan={currentUser?.role === 'Admin' ? 5 : 4} className="text-center text-muted-foreground py-8">
                            لا توجد مهام لعرضها.
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

    