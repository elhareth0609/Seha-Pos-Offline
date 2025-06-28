"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
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
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { users as fallbackUsers, timeLogs as fallbackTimeLogs, sales as fallbackSales } from "@/lib/data"
import type { User, TimeLog, Sale } from "@/lib/types"
import { UserPlus, Clock, DollarSign, LineChart } from "lucide-react"
import { differenceInHours } from 'date-fns'

function loadInitialData<T>(key: string, fallbackData: T): T {
    if (typeof window === "undefined") {
      return fallbackData;
    }
    try {
      const savedData = window.localStorage.getItem(key);
      return savedData ? JSON.parse(savedData) : fallbackData;
    } catch (error) {
      console.error(`Failed to load data for key "${key}" from localStorage.`, error);
      return fallbackData;
    }
}

export default function UsersPage() {
  const [users, setUsers] = React.useState<User[]>(() => loadInitialData('users', fallbackUsers));
  const [timeLogs, setTimeLogs] = React.useState<TimeLog[]>(() => loadInitialData('timeLogs', fallbackTimeLogs));
  const [sales, setSales] = React.useState<Sale[]>(() => loadInitialData('sales', fallbackSales));

  const { toast } = useToast()

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;
      const role = formData.get("role") as User['role'];
      const hourlyRate = parseFloat(formData.get("hourlyRate") as string);
      const pin = formData.get("pin") as string;

      if(!name || !role || isNaN(hourlyRate) || !pin || pin.length !== 4) {
          toast({ variant: "destructive", title: "بيانات غير صحيحة", description: "الرجاء التأكد من ملء جميع الحقول وأن الرقم السري مكون من 4 أرقام."});
          return;
      }
      
      const newUser: User = {
          id: `USR${(users.length + 1).toString().padStart(3, '0')}`,
          name,
          role,
          hourlyRate,
          pin
      };
      
      const newUsers = [newUser, ...users];
      setUsers(newUsers);
      localStorage.setItem('users', JSON.stringify(newUsers));

      toast({ title: "تمت إضافة الموظف بنجاح" });
      (e.target as HTMLFormElement).reset();
      document.getElementById('close-add-user-dialog')?.click();
  }

  const calculateSalary = (userId: string, hourlyRate: number) => {
      const userTimeLogs = timeLogs.filter(log => log.userId === userId && log.clockOut);
      const totalHours = userTimeLogs.reduce((acc, log) => {
          return acc + differenceInHours(new Date(log.clockOut!), new Date(log.clockIn));
      }, 0);
      return { totalHours, salary: totalHours * hourlyRate };
  }

  const getUserSales = (userId: string) => {
      const userSales = sales.filter(sale => sale.userId === userId);
      const totalRevenue = userSales.reduce((acc, sale) => acc + sale.total, 0);
      return { salesCount: userSales.length, totalRevenue };
  }


  return (
    <Tabs defaultValue="employees">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="employees">الموظفين</TabsTrigger>
        <TabsTrigger value="sales">ملخص المبيعات</TabsTrigger>
        <TabsTrigger value="payroll">الرواتب</TabsTrigger>
      </TabsList>

      <TabsContent value="employees">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle>قائمة الموظفين</CardTitle>
                    <CardDescription>
                    إدارة حسابات الموظفين وصلاحياتهم.
                    </CardDescription>
                </div>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="me-2"/> إضافة موظف</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>إضافة موظف جديد</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddUser} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">اسم الموظف</Label>
                                <Input id="name" name="name" required />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="role">الدور</Label>
                                <select name="role" id="role" required className="w-full h-10 px-3 py-2 border rounded-md border-input">
                                    <option value="Employee">موظف</option>
                                    <option value="Admin">مدير</option>
                                </select>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="hourlyRate">الأجر بالساعة ($)</Label>
                                <Input id="hourlyRate" name="hourlyRate" type="number" step="0.5" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pin">الرقم السري (4 أرقام للدخول)</Label>
                                <Input id="pin" name="pin" type="text" maxLength={4} minLength={4} required />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild id="close-add-user-dialog"><Button variant="outline">إلغاء</Button></DialogClose>
                                <Button type="submit">إضافة</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <p className="text-sm text-amber-600 mt-4 p-3 bg-amber-50 rounded-md border border-amber-200">
                <b>ملاحظة:</b> إدارة المستخدمين وتسجيل الدخول هي ميزة تجريبية. في تطبيق حقيقي، يتطلب هذا نظام مصادقة آمن وقاعدة بيانات.
            </p>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>المعرف</TableHead>
                        <TableHead>الاسم</TableHead>
                        <TableHead>الدور</TableHead>
                        <TableHead>الأجر بالساعة</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.name}</TableCell>
                            <TableCell>{user.role === "Admin" ? "مدير" : "موظف"}</TableCell>
                            <TableCell>${user.hourlyRate.toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="sales">
        <Card>
          <CardHeader>
            <CardTitle>ملخص مبيعات الموظفين</CardTitle>
            <CardDescription>نظرة عامة على أداء المبيعات لكل موظف بناءً على البيانات المسجلة.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {users.map(user => {
                  const { salesCount, totalRevenue } = getUserSales(user.id);
                  return (
                      <Card key={user.id}>
                          <CardHeader>
                              <CardTitle>{user.name}</CardTitle>
                              <CardDescription>{user.role === 'Admin' ? 'مدير' : 'موظف'}</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                              <div className="flex items-center">
                                  <LineChart className="me-4 text-primary h-6 w-6"/>
                                  <div>
                                      <p className="font-bold text-lg">{salesCount}</p>
                                      <p className="text-sm text-muted-foreground">إجمالي عمليات البيع</p>
                                  </div>
                              </div>
                               <div className="flex items-center">
                                  <DollarSign className="me-4 text-green-500 h-6 w-6"/>
                                  <div>
                                      <p className="font-bold text-lg">${totalRevenue.toFixed(2)}</p>
                                      <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                                  </div>
                              </div>
                          </CardContent>
                      </Card>
                  )
              })}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="payroll">
        <Card>
          <CardHeader>
            <CardTitle>كشف رواتب الموظفين</CardTitle>
            <CardDescription>ملخص ساعات العمل والرواتب المستحقة بناء على سجل الدوام المسجل.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>الموظف</TableHead>
                        <TableHead>مجموع الساعات</TableHead>
                        <TableHead>الأجر بالساعة</TableHead>
                        <TableHead>الراتب المستحق</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => {
                        const { totalHours, salary } = calculateSalary(user.id, user.hourlyRate);
                        return (
                            <TableRow key={user.id}>
                                <TableCell>{user.name}</TableCell>
                                <TableCell>{totalHours.toFixed(1)} ساعة</TableCell>
                                <TableCell>${user.hourlyRate.toFixed(2)}</TableCell>
                                <TableCell className="font-bold">${salary.toFixed(2)}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

    </Tabs>
  )
}
