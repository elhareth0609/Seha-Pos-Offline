"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { inventory, sales } from "@/lib/data";
import { suggestRestock, type SuggestRestockOutput } from "@/ai/flows/smart-restock";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, Lightbulb, Package, BarChart } from "lucide-react";

// Prepare mock data for the AI prompt
const mockSalesData = sales.map(s => ({
    saleId: s.id,
    date: s.date,
    items: s.items.map(i => ({ medId: i.medicationId, qty: i.quantity }))
}));

const mockInventoryData = inventory.map(i => ({
    medId: i.id,
    name: i.name,
    stock: i.stock
}));

const mockExpirationData = inventory.map(i => ({
    medId: i.id,
    // Add a random expiration date between 3 and 24 months from now
    expires: new Date(Date.now() + Math.random() * (24 - 3) * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
}));


export default function SmartRestockPage() {
  const [salesData, setSalesData] = useState(JSON.stringify(mockSalesData, null, 2));
  const [currentInventory, setCurrentInventory] = useState(JSON.stringify(mockInventoryData, null, 2));
  const [expirationDates, setExpirationDates] = useState(JSON.stringify(mockExpirationData, null, 2));
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SuggestRestockOutput | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const res = await suggestRestock({
        salesData,
        currentInventory,
        expirationDates,
      });
      setResult(res);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to get restock suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedOrders = result ? JSON.parse(result.suggestedOrders) : [];

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Smart Restock Assistant</CardTitle>
            <CardDescription>
              Use AI to analyze your data and get smart restock suggestions. The fields below are pre-filled with your pharmacy's current data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salesData">Historical Sales Data (JSON)</Label>
              <Textarea
                id="salesData"
                value={salesData}
                onChange={(e) => setSalesData(e.target.value)}
                rows={6}
                className="font-code text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentInventory">Current Inventory (JSON)</Label>
              <Textarea
                id="currentInventory"
                value={currentInventory}
                onChange={(e) => setCurrentInventory(e.target.value)}
                rows={6}
                className="font-code text-xs"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expirationDates">Expiration Dates (JSON)</Label>
              <Textarea
                id="expirationDates"
                value={expirationDates}
                onChange={(e) => setExpirationDates(e.target.value)}
                rows={6}
                className="font-code text-xs"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              <Bot className="mr-2" />
              {isLoading ? "Analyzing Data..." : "Generate Suggestions"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="text-primary"/> Suggested Purchase Order</CardTitle>
            <CardDescription>
              The AI suggests ordering the following quantities to optimize stock levels.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
              </div>
            )}
            {result && suggestedOrders.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Suggested Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestedOrders.map((order: any) => (
                    <TableRow key={order.medId}>
                      <TableCell>{order.medId}</TableCell>
                      <TableCell>{inventory.find(i => i.id === order.medId)?.name}</TableCell>
                      <TableCell className="text-right font-bold">{order.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!isLoading && !result && (
                <div className="text-center text-muted-foreground p-8">
                    <p>Your suggestions will appear here.</p>
                </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Lightbulb className="text-primary"/> AI Analysis</CardTitle>
                <CardDescription>
                    The reasoning behind the suggested order quantities.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <Skeleton className="h-24 w-full" />}
                {result && <p className="text-sm leading-relaxed">{result.analysis}</p>}
                {!isLoading && !result && (
                <div className="text-center text-muted-foreground p-8">
                    <p>The AI's analysis will appear here.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
