"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  Boxes,
  CalendarX2,
  ChevronDown,
  LayoutDashboard,
  PackagePlus,
  ShoppingCart,
  Truck,
  UserCircle,
  Users,
  FileDown,
  Upload,
  Settings,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "لوحة التحكم" },
  { href: "/sales", icon: ShoppingCart, label: "المبيعات" },
  { href: "/inventory", icon: Boxes, label: "المخزون" },
  { href: "/purchases", icon: Truck, label: "المشتريات" },
  { href: "/expiring-soon", icon: CalendarX2, label: "قريب الانتهاء" },
  { href: "/patients", icon: Users, label: "الأصدقاء" },
  { href: "/settings", icon: Settings, label: "الإعدادات" },
];

function MedStockLogo() {
  const { state } = useSidebar();
  return (
    <div className="flex items-center gap-2 p-2">
      <PackagePlus className="w-8 h-8 text-primary" />
      <h1
        className={cn(
          "text-xl font-bold text-primary transition-opacity duration-200",
          state === "collapsed" ? "opacity-0" : "opacity-100"
        )}
      >
        مدستوك
      </h1>
    </div>
  );
}

function MainContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  
  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
                <Menu />
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <UserCircle />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onSelect={() => router.push('/users')}>
                  <Users className="me-2 h-4 w-4" />
                  <span>إدارة المستخدمين</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <span>تسجيل الخروج</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const importFileRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
    const handleBackup = () => {
      if(typeof window === 'undefined') return;

      const dataToBackup: { [key: string]: any } = {};
      const keysToBackup = ['inventory', 'sales', 'purchaseOrders', 'patients', 'users', 'suppliers', 'supplierReturns', 'appSettings', 'quickItems'];

      keysToBackup.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
          try {
            dataToBackup[key] = JSON.parse(data);
          } catch(e) {
            console.error(`Could not parse ${key} from localStorage`, e);
          }
        }
      });
      
      const jsonString = JSON.stringify(dataToBackup, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medstock-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "تم بدء تنزيل النسخة الاحتياطية." });
    };

    const handleImportClick = () => {
        importFileRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
        try {
            const text = e.target?.result as string;
            const data = JSON.parse(text);
            
            let imported = false;
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    localStorage.setItem(key, JSON.stringify(data[key]));
                    imported = true;
                }
            }

            if (imported) {
                alert('تم استيراد البيانات بنجاح! سيتم إعادة تحميل الصفحة لتطبيق التغييرات.');
                window.location.reload();
            } else {
                toast({ variant: 'destructive', title: 'خطأ في الاستيراد', description: 'ملف النسخ الاحتياطي غير صالح أو فارغ.'});
            }

        } catch (error) {
            console.error("Error importing backup:", error);
            toast({ variant: 'destructive', title: 'خطأ في الاستيراد', description: 'حدث خطأ أثناء استيراد الملف. الرجاء التأكد من أن الملف صحيح.'});
        } finally {
            if(importFileRef.current) {
                importFileRef.current.value = "";
            }
        }
        };
        reader.readAsText(file);
    };


  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
          <input type="file" ref={importFileRef} onChange={handleFileChange} accept=".json" className="hidden" />
          <Sidebar side="right">
              <SidebarHeader>
                  <MedStockLogo />
              </SidebarHeader>
              <SidebarContent>
                  <SidebarMenu>
                      {navItems.map((item) => (
                      <SidebarMenuItem key={item.href}>
                          <Link href={item.href}>
                              <SidebarMenuButton 
                                isActive={pathname === item.href}
                                tooltip={{children: item.label, side: "left"}}
                              >
                                  <item.icon />
                                  <span>{item.label}</span>
                              </SidebarMenuButton>
                          </Link>
                      </SidebarMenuItem>
                      ))}
                  </SidebarMenu>
                  <SidebarSeparator />
                   <SidebarMenu>
                     <SidebarMenuItem>
                       <SidebarMenuButton onClick={handleImportClick} tooltip={{children: "استيراد بيانات", side: "left"}}>
                         <Upload />
                         <span>استيراد</span>
                       </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                       <SidebarMenuButton onClick={handleBackup} tooltip={{children: "نسخ احتياطي للبيانات", side: "left"}}>
                         <FileDown />
                         <span>نسخ احتياطي</span>
                       </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
              </SidebarContent>
              <SidebarFooter>
              </SidebarFooter>
          </Sidebar>
          <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
