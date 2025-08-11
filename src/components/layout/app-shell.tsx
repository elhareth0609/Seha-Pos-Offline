
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PackagePlus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


import type { UserPermissions } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


const allNavItems = [
  { href: "/", icon: LayoutDashboard, label: "لوحة التحكم" },
  { href: "/sales", icon: ShoppingCart, label: "المبيعات" },
  { href: "/inventory", icon: Boxes, label: "المخزون" },
  { href: "/purchases", icon: Truck, label: "المشتريات" },
  { href: "/suppliers", icon: Landmark, label: "الموردون والحسابات" },
  { href: "/reports", icon: FileText, label: "التقارير" },
  { href: "/item-movement", icon: Repeat, label: "حركة المادة" },
  { href: "/patients", icon: Users, label: "أصدقاء الصيدلية" },
  { href: "/expiring-soon", icon: CalendarX2, label: "قريب الانتهاء" },
  { href: "/trash", icon: Trash2, label: "سلة المحذوفات" },
  { href: "/guide", icon: HelpCircle, label: "دليل الاستخدام" },
  { href: "/settings", icon: Settings, label: "الإعدادات" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, logout } = useAuth();

  const navItems = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return allNavItems;
    // if (currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin') return allNavItems;

    const permissions = currentUser.permissions || {
        sales: true, inventory: true, purchases: false, suppliers: false, reports: false, itemMovement: true, patients: true, expiringSoon: true, guide: true, settings: false, trash: false, salesPriceModification: false,
    };

    const permissionMap: { [key: string]: keyof UserPermissions } = {
        '/sales': 'sales',
        '/inventory': 'inventory',
        '/purchases': 'purchases',
        '/suppliers': 'suppliers',
        '/reports': 'reports',
        '/item-movement': 'itemMovement',
        '/patients': 'patients',
        '/expiring-soon': 'expiringSoon',
        '/guide': 'guide',
        '/settings': 'settings',
        '/trash': 'trash',
    };

    return allNavItems.filter(item => {
        if (item.href === '/') return true; 
        const permissionKey = permissionMap[item.href];
        if (!permissionKey) return true;
        return permissions[permissionKey];
    });
  }, [currentUser]);
  
  const hasPermission = (href: string) => {
    return navItems.some(item => item.href === href);
  }

  const handleBackup = () => {
    toast({ title: "ملاحظة", description: "سيتم تنفيذ وظيفة النسخ الاحتياطي من الواجهة الخلفية (Laravel)." });
  };

  const handleImportClick = () => {
    toast({ title: "ملاحظة", description: "سيتم تنفيذ وظيفة الاستيراد من الواجهة الخلفية (Laravel)." });
  };


  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-muted/40">
        <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
          <div className="container flex h-16 items-center">
             <div className="flex-1 md:flex-grow-0">
                <Link href="/" className="flex items-center gap-2 font-semibold">
                    <PackagePlus className="h-6 w-6 text-primary" />
                    <span className="hidden sm:inline-block">Midgram</span>
                </Link>
            </div>

            <div className="flex flex-1 items-center justify-center gap-2">
              {currentUser?.role === 'Admin' && (
                <div className="hidden lg:block">
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <span tabIndex={0} className="text-sm text-muted-foreground cursor-help animate-pulse outline-none">
                                  تذكر النسخ الاحتياطي!
                              </span>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>لحماية بياناتك، قم بعمل نسخة احتياطية بشكل دوري.</p>
                          </TooltipContent>
                      </Tooltip>
                </div>
              )}
            </div>

            <div className="flex flex-1 items-center justify-end gap-2 md:flex-grow-0">
                <div className="hidden items-center gap-2 md:flex">
                    {hasPermission('/sales') && (
                      <Button variant="outline" asChild>
                        <Link href="/sales">المبيعات</Link>
                      </Button>
                    )}
                    {hasPermission('/inventory') && (
                      <Button variant="outline" asChild>
                        <Link href="/inventory">المخزون</Link>
                      </Button>
                    )}
                </div>
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                      <Menu className="me-2 h-4 w-4" />
                      <span className="hidden sm:inline">القائمة الرئيسية</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {navItems.map((item) => (
                      <DropdownMenuItem key={item.href} onSelect={() => router.push(item.href)}>
                        <item.icon className="me-2 h-4 w-4" />
                        <span>{item.label}</span>
                      </DropdownMenuItem>
                    ))}
                    {currentUser?.role === 'Admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={handleImportClick}>
                            <Upload className="me-2 h-4 w-4" />
                            <span>استيراد بيانات</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={handleBackup}>
                            <FileDown className="me-2 h-4 w-4" />
                            <span>نسخ احتياطي للبيانات</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 px-2">
                          <UserCircle />
                          <span className="hidden sm:inline-block text-sm font-medium">{currentUser?.name || "المستخدم"}</span>
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
        </header>
        <main className="flex-1">
          <div className="container py-4">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
