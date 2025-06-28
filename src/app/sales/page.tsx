"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { inventory as allInventory } from "@/lib/data"
import type { Medication, SaleItem } from "@/lib/types"
import { PlusCircle, MinusCircle, X, PackageSearch } from "lucide-react"

export default function SalesPage() {
  const [inventory, setInventory] = React.useState<Medication[]>(allInventory)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [cart, setCart] = React.useState<SaleItem[]>([])
  const { toast } = useToast()

  React.useEffect(() => {
    const filtered = allInventory.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setInventory(filtered)
  }, [searchTerm])

  const addToCart = (medication: Medication) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find(item => item.medicationId === medication.id)
      if (existingItem) {
        return prevCart.map(item =>
          item.medicationId === medication.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prevCart, { medicationId: medication.id, name: medication.name, quantity: 1, price: medication.price }]
    })
  }

  const updateQuantity = (medicationId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicationId)
    } else {
      setCart(cart => cart.map(item => item.medicationId === medicationId ? { ...item, quantity } : item))
    }
  }

  const removeFromCart = (medicationId: string) => {
    setCart(cart => cart.filter(item => item.medicationId !== medicationId))
  }

  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", description: "Add items to the cart before checking out.", variant: "destructive" })
      return
    }
    // In a real app, this would trigger an API call and inventory update.
    console.log("Checkout complete:", cart)
    toast({
      title: "Sale Recorded",
      description: `A new sale of $${cartTotal.toFixed(2)} has been recorded.`
    })
    setCart([])
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5 h-[calc(100vh-theme(spacing.24))]">
      <div className="lg:col-span-3">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Medication List</CardTitle>
            <CardDescription>Search for medications to add to the sale.</CardDescription>
            <div className="pt-4">
              <Input 
                placeholder="Search medications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="text-right">{item.stock}</TableCell>
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" onClick={() => addToCart(item)}>Add to Cart</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Current Sale</CardTitle>
            <CardDescription>Items in the current transaction.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {cart.length > 0 ? (
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="w-[120px] text-center">Quantity</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.medicationId}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                            <span>{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.medicationId, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(item.medicationId)}><X className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <PackageSearch className="h-16 w-16 mb-4" />
                    <p>Your cart is empty.</p>
                    <p className="text-sm">Add items from the list to get started.</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-auto border-t pt-6">
            <div className="flex justify-between w-full text-lg font-semibold">
                <span>Total</span>
                <span>${cartTotal.toFixed(2)}</span>
            </div>
            <Button size="lg" className="w-full" onClick={handleCheckout} disabled={cart.length === 0}>
                Record Sale
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
