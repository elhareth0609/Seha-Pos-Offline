
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
  const importFileRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentUser, logout } = useAuth();

  const [dataToImport, setDataToImport] = React.useState<object | null>(null);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = React.useState(false);

  const navItems = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') return allNavItems;

    const permissions = currentUser.permissions || {
        sales: true, inventory: true, purchases: false, suppliers: false, reports: false, itemMovement: true, patients: true, expiringSoon: true, guide: true, settings: false, trash: false
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
        if (!permissionKey) return true; // Show items without a specific permission (like guide)
        return permissions[permissionKey];
    });
  }, [currentUser]);


  const handleBackup = async () => {
    toast({ title: "ميزة النسخ الاحتياطي غير متاحة حاليًا." });
  };

  const handleImportClick = () => {
    toast({ title: "ميزة الاستيراد غير متاحة حاليًا." });
  };


  return (
    <>
      <AlertDialog open={isImportConfirmOpen} onOpenChange={setIsImportConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>هل أنت متأكد من استيراد البيانات؟</AlertDialogTitle>
                <AlertDialogDescription>
                    سيؤدي هذا الإجراء إلى <span className="font-bold text-destructive">الكتابة فوق جميع البيانات الحالية</span> في التطبيق واستبدالها بالبيانات من ملف النسخة الاحتياطية. لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setDataToImport(null)}>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={() => {}} className="bg-destructive hover:bg-destructive/90">
                    نعم، قم بالاستيراد
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex min-h-screen flex-col bg-muted/40">
        <input type="file" ref={importFileRef} onChange={() => {}} accept=".json" className="hidden" />
        <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
          <div className="container flex h-16 items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <PackagePlus className="h-6 w-6 text-primary" />
                <span>Midgram</span>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    <Menu className="me-2 h-4 w-4" />
                    القائمة الرئيسية
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
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

              {currentUser?.role === 'Admin' && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span tabIndex={0} className="text-sm text-muted-foreground hidden lg:block cursor-help animate-pulse outline-none">
                                تذكر النسخ الاحتياطي!
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>لحماية بياناتك، قم بعمل نسخة احتياطية بشكل دوري.</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <div className="flex flex-1 items-center justify-end space-x-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="flex items-center gap-2 px-2">
                          <UserCircle />
                          <span className="text-sm font-medium">{currentUser?.name || "المستخدم"}</span>
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
          <div className="container py-8">{children}</div>
        </main>
      </div>
    </>
  );
}
