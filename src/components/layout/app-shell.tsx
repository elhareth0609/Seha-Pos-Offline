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
import { Card } from "../ui/card";
import { useToast } from "@/hooks/use-toast";


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
  return (
    <div className="flex items-center gap-2">
      <PackagePlus className="w-7 h-7 text-primary" />
      <h1 className="text-xl font-bold text-primary">
        مدستوك
      </h1>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MedStockLogo />
          <div className="flex flex-1 items-center justify-end space-x-2">
            <input type="file" ref={importFileRef} onChange={handleFileChange} accept=".json" className="hidden" />
            <Button variant="outline" onClick={handleImportClick}><Upload className="me-2 h-4 w-4"/> استيراد</Button>
            <Button variant="outline" onClick={handleBackup}><FileDown className="me-2 h-4 w-4"/> نسخ احتياطي</Button>
             <nav className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2 p-2">
                        <UserCircle />
                        <span className="truncate">المدير</span>
                        <ChevronDown className="ms-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" side="bottom" align="end">
                    <DropdownMenuItem onSelect={() => router.push('/users')}>
                      <Users className="me-2" />
                      إدارة المستخدمين
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>تسجيل الخروج</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
             </nav>
          </div>
        </div>
        <div className="container py-2">
            <nav className="grid grid-cols-4 md:grid-cols-7 gap-2 md:gap-4">
                {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                    <Card className={cn(
                        "p-3 md:p-4 rounded-lg transition-colors flex flex-col items-center justify-center text-center gap-2 hover:bg-primary/5 hover:text-primary",
                        pathname === item.href ? "bg-primary/10 text-primary" : "bg-card"
                    )}>
                        <item.icon className="h-6 w-6 md:h-7 md:w-7" />
                        <span className="text-xs md:text-sm font-semibold">{item.label}</span>
                    </Card>
                </Link>
                ))}
            </nav>
        </div>
      </header>
      <main className="flex-1 container py-6">{children}</main>
    </div>
  );
}
