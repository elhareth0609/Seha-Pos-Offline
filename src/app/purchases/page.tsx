"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { purchaseOrders as allPurchaseOrders, inventory } from "@/lib/data"
import type { PurchaseOrder, PurchaseOrderItem } from "@/lib/types"

export default function PurchasesPage() {
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>(allPurchaseOrders);
  const { toast } = useToast()

  const handleCreateOrder = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newOrder: PurchaseOrder = {
      id: `PO${(purchaseOrders.length + 1).toString().padStart(3, '0')}`,
      supplier: formData.get("supplier") as string,
      date: new Date().toISOString().split("T")[0],
      items: [{
        medicationId: formData.get("medicationId") as string,
        name: inventory.find(m => m.id === formData.get("medicationId"))?.name || 'Unknown',
        quantity: parseInt(formData.get("quantity") as string, 10),
      }],
      status: "Pending",
    };
    setPurchaseOrders([newOrder, ...purchaseOrders]);
    toast({
      title: "Purchase Order Created",
      description: `Order ${newOrder.id} has been successfully created.`,
    });
    event.currentTarget.reset();
  };
  
  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case "Pending":
        return <Badge variant="secondary" className="bg-yellow-400 text-yellow-900">{status}</Badge>;
      case "Received":
        return <Badge variant="secondary" className="bg-green-300 text-green-900">{status}</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">{status}</Badge>;
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Purchase Orders</CardTitle>
            <CardDescription>
              View and manage all purchase orders.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.supplier}</TableCell>
                    <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                    <TableCell>{order.items.reduce((acc, item) => acc + item.quantity, 0)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Create New Order</CardTitle>
            <CardDescription>
              Fill out the form to create a new purchase order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCreateOrder}>
              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Select name="supplier" required>
                  <SelectTrigger id="supplier">
                    <SelectValue placeholder="Select a supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pharma Inc.">Pharma Inc.</SelectItem>
                    <SelectItem value="HealthCare Supplies">HealthCare Supplies</SelectItem>
                    <SelectItem value="Allergy Relief Co.">Allergy Relief Co.</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medicationId">Medication</Label>
                 <Select name="medicationId" required>
                  <SelectTrigger id="medicationId">
                    <SelectValue placeholder="Select a medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory.map(med => (
                      <SelectItem key={med.id} value={med.id}>{med.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input id="quantity" name="quantity" type="number" placeholder="Enter quantity" required min="1" />
              </div>

              <Button type="submit" className="w-full">Create Order</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
