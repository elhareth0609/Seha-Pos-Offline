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
  FileDown
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
import { inventory, sales, purchaseOrders, patients, users, suppliers, supplierReturns } from "@/lib/data";


const navItems = [
  { href: "/", icon: LayoutDashboard, label: "لوحة التحكم", color: "hover:bg-sky-100 dark:hover:bg-sky-900/50 hover:text-sky-700 dark:hover:text-sky-300", activeColor: "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300" },
  { href: "/sales", icon: ShoppingCart, label: "المبيعات", color: "hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-700 dark:hover:text-green-300", activeColor: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300" },
  { href: "/inventory", icon: Boxes, label: "المخزون", color: "hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:text-orange-700 dark:hover:text-orange-300", activeColor: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300" },
  { href: "/purchases", icon: Truck, label: "المشتريات", color: "hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-700 dark:hover:text-purple-300", activeColor: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300" },
  { href: "/expiring-soon", icon: CalendarX2, label: "قارب على الانتهاء", color: "hover:bg-amber-100 dark:hover:bg-amber-900/50 hover:text-amber-700 dark:hover:text-amber-300", activeColor: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300" },
  { href: "/patients", icon: Users, label: "أصدقاء الصيدلية", color: "hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300", activeColor: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" },
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

  const handleBackup = () => {
      const backupData = {
        inventory,
        sales,
        purchaseOrders,
        patients,
        users,
        suppliers,
        supplierReturns,
      };
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `medstock-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MedStockLogo />
          <div className="flex flex-1 items-center justify-end space-x-2">
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
            <nav className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4">
                {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                    <Card className={cn(
                        "p-3 md:p-4 rounded-lg transition-colors flex flex-col items-center justify-center text-center gap-2",
                        pathname === item.href ? item.activeColor : "bg-card",
                        item.color
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
