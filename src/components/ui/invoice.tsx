
"use client"
import * as React from 'react';
import type { Sale, AppSettings } from '@/lib/types';
import { cn } from '@/lib/utils';
import Barcode from '@/components/ui/barcode';

interface InvoiceTemplateProps {
  sale: Sale | null;
  settings: AppSettings | null;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ sale, settings }, ref) => {
  if (!sale || !settings) {
    return null;
  }

  const { pharmacyName, pharmacyAddress, pharmacyPhone } = settings;
  const subtotal = sale.total + (sale.discount || 0);

  return (
    <div ref={ref} className="p-8 font-sans text-gray-800 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">{pharmacyName}</h1>
        <p>{pharmacyAddress}</p>
        <p>{pharmacyPhone}</p>
      </div>
      <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-dashed">
        <div>
          <h2 className="text-xl font-bold mb-2">فاتورة ضريبية مبسطة</h2>
          <p><span className="font-semibold">رقم الفاتورة:</span> {sale.id}</p>
          <p><span className="font-semibold">التاريخ والوقت:</span> {new Date(sale.date).toLocaleString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</p>
        </div>
        <div className="text-right">
             <Barcode value={sale.id} options={{ width: 1.5, height: 50, displayValue: false }} />
        </div>
      </div>
      <table className="w-full mb-6">
        <thead className="border-b">
          <tr className="text-right">
            <th className="p-2 font-semibold">المنتج</th>
            <th className="p-2 font-semibold text-center">الكمية</th>
            <th className="p-2 font-semibold text-center">السعر</th>
            <th className="p-2 font-semibold text-left">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item) => (
            <tr key={`${item.medicationId}-${item.isReturn}`} className={cn("border-b border-dashed", item.isReturn && 'text-red-600')}>
              <td className="p-2">
                <div>{item.name} {item.isReturn && "(مرتجع)"}</div>
                {(item.scientificNames || []).length > 0 && (
                    <div className="text-xs text-gray-500">({(item.scientificNames || []).join(', ')})</div>
                )}
              </td>
              <td className="p-2 text-center font-mono">{item.quantity}</td>
              <td className="p-2 text-center font-mono">{item.price.toLocaleString('ar-IQ')} د.ع</td>
              <td className="p-2 text-left font-mono">{(item.price * item.quantity * (item.isReturn ? -1 : 1)).toLocaleString('ar-IQ')} د.ع</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-end">
        <div className="w-full md:w-1/3 font-mono">
          <div className="flex justify-between py-1">
            <span className="font-semibold">المجموع الفرعي:</span>
            <span>{subtotal.toLocaleString('ar-IQ')} د.ع</span>
          </div>
          {sale.discount && sale.discount > 0 && (
             <div className="flex justify-between py-1 text-red-600">
                <span className="font-semibold">الخصم:</span>
                <span>-{sale.discount.toLocaleString('ar-IQ')} د.ع</span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t-2 border-black font-bold text-xl">
            <span>الإجمالي:</span>
            <span>{sale.total.toLocaleString('ar-IQ')} د.ع</span>
          </div>
        </div>
      </div>
      <div className="text-center mt-8 text-sm text-gray-500">
        <p>{settings.invoiceFooterMessage || "شكرًا لزيارتكم!"}</p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
