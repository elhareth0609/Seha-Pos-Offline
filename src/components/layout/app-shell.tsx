
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { PackagePlus } from 'lucide-react';

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "لوحة التحكم" },
  { href: "/sales", icon: ShoppingCart, label: "المبيعات" },
  { href: "/inventory", icon: Boxes, label: "المخزون" },
  { href: "/purchases", icon: Truck, label: "المشتريات" },
  { href: "/suppliers", icon: Landmark, label: "الموردون والحسابات" },
  { href: "/reports", icon: FileText, label: "التقارير" },
  { href: "/patients", icon: Users, label: "أصدقاء الصيدلية" },
  { href: "/expiring-soon", icon: CalendarX2, label: "قريب الانتهاء" },
  { href: "/settings", icon: Settings, label: "الإعدادات" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const importFileRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { currentUser, logout } = useAuth();

  const handleBackup = () => {
    if(typeof window === 'undefined') return;

    const dataToBackup: { [key: string]: any } = {};
    const keysToBackup = ['inventory', 'sales', 'purchaseOrders', 'users', 'suppliers', 'supplierReturns', 'appSettings', 'timeLogs', 'supplierPayments', 'patients'];

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
    <div className="flex min-h-screen flex-col bg-muted/40">
      <input type="file" ref={importFileRef} onChange={handleFileChange} accept=".json" className="hidden" />
      <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
        <div className="container flex h-16 items-center">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <PackagePlus className="h-6 w-6 text-primary" />
              <span>مدستوك</span>
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
                 <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleImportClick}>
                  <Upload className="me-2 h-4 w-4" />
                  <span>استيراد بيانات</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleBackup}>
                  <FileDown className="me-2 h-4 w-4" />
                  <span>نسخ احتياطي للبيانات</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
  );
}
