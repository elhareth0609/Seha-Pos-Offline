
"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useLocalStorage } from "@/hooks/use-local-storage"
import {
  suppliers as fallbackSuppliers,
  purchaseOrders as fallbackPurchaseOrders,
  supplierReturns as fallbackSupplierReturns
} from "@/lib/data"
import type { Supplier, PurchaseOrder, Return } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"

export default function SuppliersPage() {
  const [suppliers] = useLocalStorage<Supplier[]>('suppliers', fallbackSuppliers);
  const [purchaseOrders] = useLocalStorage<PurchaseOrder[]>('purchaseOrders', fallbackPurchaseOrders);
  const [supplierReturns] = useLocalStorage<Return[]>('supplierReturns', fallbackSupplierReturns);
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const supplierAccounts = React.useMemo(() => {
    return suppliers.map(supplier => {
      const purchases = purchaseOrders.filter(po => po.supplierId === supplier.id && po.status === "Received");
      const returns = supplierReturns.filter(ret => ret.supplierId === supplier.id);

      const totalPurchases = purchases.reduce((acc, po) => acc + po.totalAmount, 0);
      const totalReturns = returns.reduce((acc, ret) => acc + ret.totalAmount, 0);
      const netDebt = totalPurchases - totalReturns;

      return {
        ...supplier,
        totalPurchases,
        totalReturns,
        netDebt,
      };
    });
  }, [suppliers, purchaseOrders, supplierReturns]);
  
  if (!isClient) {
      return (
          <div className="space-y-6">
              <div className="space-y-2">
                  <Skeleton className="h-8 w-64" />
                  <Skeleton className="h-5 w-96" />
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i}>
                          <CardHeader>
                              <Skeleton className="h-6 w-40" />
                              <Skeleton className="h-4 w-48 mt-1" />
                          </CardHeader>
                          <CardContent className="space-y-4">
                              <Skeleton className="h-5 w-full" />
                              <Skeleton className="h-5 w-full" />
                              <Skeleton className="h-6 w-full mt-2" />
                          </CardContent>
                      </Card>
                  ))}
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">الموردون والحسابات</h1>
            <p className="text-muted-foreground">
                إدارة حسابات الموردين وتتبع الديون المستحقة.
            </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {supplierAccounts.map(account => (
                <Card key={account.id}>
                    <CardHeader>
                        <CardTitle>{account.name}</CardTitle>
                        <CardDescription>{account.contactPerson || 'لا يوجد جهة اتصال'}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">إجمالي المشتريات:</span>
                            <span className="font-mono font-medium">${account.totalPurchases.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">إجمالي المرتجعات:</span>
                            <span className="font-mono font-medium text-green-600">-${account.totalReturns.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between pt-2 border-t font-bold text-base">
                            <span>صافي الدين المستحق:</span>
                            <span className="font-mono text-destructive">${account.netDebt.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
  )
}
