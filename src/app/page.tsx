"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { inventory as fallbackInventory, sales as fallbackSales } from "@/lib/data";
import type { Medication, Sale } from "@/lib/types";
import { DollarSign, Package, AlertTriangle } from "lucide-react";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

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

export default function Dashboard() {
  const [inventory, setInventory] = React.useState<Medication[]>(() => loadInitialData('inventory', fallbackInventory));
  const [sales, setSales] = React.useState<Sale[]>(() => loadInitialData('sales', fallbackSales));

  const totalRevenue = sales.reduce((acc, sale) => acc + (sale.total || 0), 0);
  const lowStockItems = inventory.filter(
    (item) => item.stock < item.reorderPoint
  ).length;

  const salesDataForChart = sales.map(sale => ({
    date: new Date(sale.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' }),
    total: sale.total,
  })).slice(0, 7).reverse();

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الإيرادات</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              بناءً على إجمالي المبيعات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{sales.length}</div>
            <p className="text-xs text-muted-foreground">
              عدد المعاملات
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">أصناف منخفضة المخزون</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              أصناف تحتاج لإعادة طلب
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>نظرة عامة على المبيعات</CardTitle>
            <CardDescription>نظرة على آخر 7 معاملات بيع.</CardDescription>
          </CardHeader>
          <CardContent className="ps-2">
             <ChartContainer
                config={{
                    total: {
                        label: 'الإجمالي',
                        color: 'hsl(var(--primary))',
                    },
                }}
                className="h-[300px] w-full"
            >
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={salesDataForChart} layout="horizontal">
                        <XAxis
                            dataKey="date"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            reversed={true}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                            orientation="right"
                        />
                         <Tooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>المبيعات الأخيرة</CardTitle>
            <CardDescription>
              أحدث معاملات البيع الخاصة بك.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>معرف البيع</TableHead>
                  <TableHead>التاريخ</TableHead>
                  <TableHead className="text-left">المبلغ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.slice(0, 5).map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.id}</TableCell>
                    <TableCell>{new Date(sale.date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell className="text-left">
                      ${sale.total.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
