
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Boxes,
  CalendarX2,
  LayoutDashboard,
  Truck,
  ShoppingCart,
  UserCircle,
  FileDown,
  Upload,
  Settings,
  Menu,
  FileText,
  Landmark,
  LogOut,
  Users,
  HelpCircle,
  Repeat,
  Trash2,
  Coins,
  ListChecks,
  CheckCircle,
  FileArchive,
  ShoppingBasket,
  BadgePercent,
  Contact,
  Bell,
  Package,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  Receipt,
  UserCog,
  LifeBuoy,
  HeartPulse,
  Stethoscope,
  ArrowLeftRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
  SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PackagePlus } from 'lucide-react';
import type { UserPermissions, Task, Notification } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "../ui/scroll-area";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "../ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { ThemeToggle } from "../ui/theme-toggle";

const allNavItems = [
  { href: "/sales", icon: ShoppingCart, label: "المبيعات", group: 'main' },
  { href: "/inventory", icon: Boxes, label: "المخزون", group: 'main' },
  { href: "/reports", icon: FileText, label: "الفواتير", group: 'analysis' },
  { href: "/patients", icon: Users, label: "أصدقاء الصيدلية", group: 'tools' },
];

const navGroups = [
  { key: 'main', title: 'العمليات اليومية' },
  { key: 'analysis', title: 'التحليلات والفواتير' },
  { key: 'tools', title: 'الأدوات والميزات' },
  { key: 'external', title: 'خدمات ميدجرام' },
  { key: 'admin', title: 'الإدارة والنظام' }
]

function TasksSheet() {
  const { currentUser, updateTask, updateStatusTask, getMineTasks } = useAuth();
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        if (currentUser?.role === 'Employee') {
          const tasks = await getMineTasks(currentUser?.id);
          setTasks(tasks);
        }
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [currentUser, getMineTasks]);

  const handleTaskStatusChange = async (taskId: string, completed: boolean) => {
    const success = await updateStatusTask(taskId, { completed });
    if (success) {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
    }
  };

  return (
    <SheetContent>
      <SheetHeader>
        <SheetTitle>مهامي</SheetTitle>
      </SheetHeader>
      <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : tasks.length > 0 ? tasks.map(task => (
            <div key={task.id} className="flex items-center space-x-2 p-2 border rounded-md">
              <Checkbox
                id={`task-sheet-${task.id}`}
                checked={task.completed}
                onCheckedChange={(checked) => handleTaskStatusChange(task.id, !!checked)}
              />
              <Label
                htmlFor={`task-sheet-${task.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
              >
                {task.description}
              </Label>
            </div>
          )) : (
            <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p>لا توجد مهام حالية. عمل رائع!</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </SheetContent>
  )
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'out_of_stock':
    case 'low_stock':
      return <Package className="h-4 w-4 text-yellow-500" />;
    case 'expired':
    case 'expiring_soon':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'task_assigned':
      return <ListChecks className="h-4 w-4 text-blue-500" />;
    case 'sale_below_cost':
    case 'large_discount':
      return <DollarSign className="h-4 w-4 text-orange-500" />;
    case 'supplier_debt_limit':
      return <Landmark className="h-4 w-4 text-red-700" />;
    case 'month_end_reminder':
      return <FileArchive className="h-4 w-4 text-indigo-500" />;
    case 'new_purchase_order':
      return <Receipt className="h-4 w-4 text-green-500" />;
    default:
      return <Bell className="h-4 w-4 text-muted-foreground" />;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, logout, getNotifications } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);


  React.useEffect(() => {
    const fetchNotifications = async () => {
      const notifs = await getNotifications();
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    };

    if (currentUser) {
      fetchNotifications();
      // Optionally, set up an interval to fetch notifications periodically
      const intervalId = setInterval(fetchNotifications, 5 * 60 * 1000); // every 5 minutes
      return () => clearInterval(intervalId);
    }
  }, [currentUser, getNotifications]);

  const navItems = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return allNavItems;

    const permissions: UserPermissions = currentUser.permissions || {
      manage_sales: true,
      manage_inventory: true,
      manage_purchases: false,
      manage_suppliers: false,
      manage_reports: false,
      manage_itemMovement: true,
      manage_patients: true,
      manage_expiringSoon: true,
      // manage_guide: true, 
      manage_settings: false,
      manage_trash: false,
      manage_salesPriceModification: false,
      manage_users: false,
      manage_previous_sales: false,
      manage_expenses: false,
      manage_tasks: false,
      // manage_close_month: false,
      manage_archives: false,
      manage_order_requests: false,
      manage_offers: true,
      manage_hr: false,
      manage_support: true,
      // manage_representatives: true,
      manage_exchange: true,
      manage_doctors: false,
    };

    const permissionMap: { [key: string]: keyof UserPermissions } = {
      '/sales': 'manage_sales',
      '/inventory': 'manage_inventory',
      '/purchases': 'manage_purchases',
      '/suppliers': 'manage_suppliers',
      '/reports': 'manage_reports',
      '/item-movement': 'manage_itemMovement',
      '/patients': 'manage_patients',
      '/expiring-soon': 'manage_expiringSoon',
      // '/guide': 'manage_guide',
      '/settings': 'manage_settings',
      '/trash': 'manage_trash',
      '/expenses': 'manage_expenses',
      '/tasks': 'manage_tasks',
      // '/close-month': 'manage_close_month',
      '/order-requests': 'manage_order_requests',
      '/offers': 'manage_offers',
      '/hr': 'manage_hr',
      '/support': 'manage_support',
      // '/clinical-training': 'manage_guide', // Assuming guide permission covers this
      '/exchange': 'manage_exchange',
      '/doctors': 'manage_doctors',
      // '/representatives': 'manage_representatives', // Assuming representatives permission covers this for now
    };

    return allNavItems.filter(item => {
      if (item.href === '/dashboard' || item.href === '/representatives') return true;
      const permissionKey = permissionMap[item.href];
      if (!permissionKey) return true;
      return permissions[permissionKey];
    });
  }, [currentUser]);

  const hasPermission = (href: string) => {
    return navItems.some(item => item.href === href);
  }


  return (
    <TooltipProvider>
      <Sheet>
        <div className="flex min-h-screen flex-col bg-muted/40">
          <main className="flex-1">
            <div className="container py-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 pb-4 border-b">
                <div className="flex flex-1 items-center justify-start gap-2">
                  <Link href="/sales" className="flex items-center gap-2 font-semibold">
                    <img src="/favicon.png" alt="Site Icon" className="h-6 w-6" />
                  </Link>
                  <div className="flex items-center gap-2">
                    <ThemeToggle />
                  </div>
                </div>
                <div className="flex flex-1 items-center justify-end gap-2 md:flex-grow-0">
                  <div className="items-center gap-2 flex">
                    {hasPermission('/sales') && (
                      <Button variant="outline" asChild>
                        <Link href="/sales">
                          <ShoppingCart className="me-2 h-4 w-4" />
                          <span className="hidden md:inline-block">المبيعات</span>
                        </Link>
                      </Button>
                    )}
                  </div>
                  <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                        <Menu className="sm:me-2 h-4 w-4" />
                        <span className="hidden md:inline">القائمة الرئيسية</span>
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[90vh] flex flex-col">
                      <SheetHeader>
                        <SheetTitle>القائمة الرئيسية</SheetTitle>
                        <SheetDescription>اختر وجهتك التالية في النظام.</SheetDescription>
                      </SheetHeader>
                      <div className="flex-1 overflow-auto">
                        <ScrollArea className="h-full">
                          <div className="py-4 space-y-6">
                            {navGroups.map(group => {
                              const groupItems = navItems.filter(item => item.group === group.key);
                              if (groupItems.length === 0) return null;
                              return (
                                <div key={group.key}>
                                  <h3 className="mb-4 text-lg font-semibold tracking-tight">{group.title}</h3>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {groupItems.map(item => (
                                      <SheetClose asChild key={item.href}>
                                        <Link href={item.href}>
                                          <Card className="h-full hover:bg-primary hover:text-primary-foreground transition-colors group">
                                            <CardContent className="p-3 flex flex-col items-center justify-center text-center gap-2 aspect-square">
                                              <item.icon className="h-7 w-7 text-primary group-hover:text-primary-foreground" />
                                              <span className="text-xs font-medium">{item.label}</span>
                                            </CardContent>
                                          </Card>
                                        </Link>
                                      </SheetClose>
                                    ))}
                                  </div>
                                  <Separator className="mt-6" />
                                </div>
                              )
                            })}
                          </div>
                        </ScrollArea>
                      </div>
                    </SheetContent>
                  </Sheet>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 px-2">
                        <UserCircle />
                        <span className="hidden 2md:inline-block text-sm font-medium">{currentUser?.name || "المستخدم"}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={logout}>
                        <LogOut className="me-2 h-4 w-4" />
                        <span>تسجيل الخروج</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              {children}
            </div>
          </main>
        </div>
        <TasksSheet />
      </Sheet>
    </TooltipProvider>
  );
}
