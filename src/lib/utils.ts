import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatStock(
  totalItems: number,
  purchaseUnit: string,
  saleUnit: string,
  itemsPerPurchaseUnit: number
): string {
  if (!purchaseUnit || !saleUnit || !itemsPerPurchaseUnit || itemsPerPurchaseUnit <= 0) {
    return `${totalItems} ${saleUnit || 'وحدة'}`;
  }

  const purchaseUnits = Math.floor(totalItems / itemsPerPurchaseUnit);
  const saleUnits = totalItems % itemsPerPurchaseUnit;

  let result = '';
  if (purchaseUnits > 0) {
    result += `${purchaseUnits} ${purchaseUnit}`;
  }
  if (saleUnits > 0) {
    if (result) {
      result += ' و ';
    }
    result += `${saleUnits} ${saleUnit}`;
  }

  return result || `0 ${saleUnit}`;
}
