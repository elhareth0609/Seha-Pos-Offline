
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);


  const navItems = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return allNavItems;

    const permissions: UserPermissions = currentUser.permissions || {
      manage_sales: true,
      manage_inventory: true,
      manage_reports: false,
      manage_patients: true,
      manage_salesPriceModification: false,
      manage_previous_sales: false,
    };

    const permissionMap: { [key: string]: keyof UserPermissions } = {
      '/sales': 'manage_sales',
      '/reports': 'manage_reports',
      '/patients': 'manage_patients',
    };

    return allNavItems.filter(item => {
      if (item.href === '/dashboard') return true;
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
      </Sheet>
    </TooltipProvider>
  );
}
