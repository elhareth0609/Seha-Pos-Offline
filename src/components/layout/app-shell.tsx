"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Boxes,
  ChevronDown,
  LayoutDashboard,
  PackagePlus,
  Settings,
  ShoppingCart,
  Truck,
  Undo2,
  UserCircle,
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

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "لوحة التحكم", color: "hover:bg-sky-100 dark:hover:bg-sky-900/50 hover:text-sky-700 dark:hover:text-sky-300", activeColor: "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300" },
  { href: "/sales", icon: ShoppingCart, label: "المبيعات", color: "hover:bg-green-100 dark:hover:bg-green-900/50 hover:text-green-700 dark:hover:text-green-300", activeColor: "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300" },
  { href: "/inventory", icon: Boxes, label: "المخزون", color: "hover:bg-orange-100 dark:hover:bg-orange-900/50 hover:text-orange-700 dark:hover:text-orange-300", activeColor: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300" },
  { href: "/purchases", icon: Truck, label: "المشتريات", color: "hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-700 dark:hover:text-purple-300", activeColor: "bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300" },
  { href: "/returns", icon: Undo2, label: "المرتجعات", color: "hover:bg-red-100 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300", activeColor: "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300" },
  { href: "/smart-restock", icon: Bot, label: "إعادة التخزين الذكية", color: "hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300", activeColor: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300" },
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

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <MedStockLogo />
          <div className="flex flex-1 items-center justify-end space-x-4">
             <nav className="flex items-center space-x-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start gap-2 p-2">
                        <UserCircle />
                        <span className="truncate">مستخدم صيدلي</span>
                        <ChevronDown className="ms-auto" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" side="bottom" align="end">
                    <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
                    <DropdownMenuItem>الفواتير</DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="me-2" />
                      الإعدادات
                      </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>تسجيل الخروج</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button>حفظ الجلسة</Button>
             </nav>
          </div>
        </div>
        <div className="container py-2">
            <nav className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
                {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                    <Card className={cn(
                        "p-3 md:p-4 rounded-lg transition-colors flex flex-col items-center justify-center text-center gap-2",
                        pathname === item.href ? item.activeColor : "bg-card",
                        item.color
                    )}>
                        <item.icon className="h-6 w-6 md:h-8 md:w-8" />
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
