"use client"
import * as React from 'react';
import type { Sale, AppSettings, User } from '@/lib/types';
import { cn } from '@/lib/utils';
// import Barcode from '@/components/ui/barcode';

interface InvoiceTemplateProps {
  sale: Sale | null;
  settings: AppSettings | null;
  user: User | null;
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(({ sale, settings, user }, ref) => {
  if (!sale || !settings) {
    return null;
  }

  const { pharmacyName, pharmacyAddress, pharmacyPhone } = settings;
  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  // Format time as HH:MM:SS
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';

    // Convert to 12-hour format if needed, though standard usually is 24 or 12 without suffix in some receipts. 
    // The image shows "05:08:18" which looks like 24h or 12h padding. Let's use 24h for simplicity or standard.
    // Actually image shows 05:08:18, likely 12h or 24h. 
    return `${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
  };

  const currentDate = new Date();
  const printDate = `${currentDate.getDate().toString().padStart(2, '0')}/${(currentDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
  const printTime = `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}:${currentDate.getSeconds().toString().padStart(2, '0')}`;

  return (
    <div ref={ref} className="p-4 font-sans text-black bg-white max-w-[80mm] mx-auto text-xs leading-tight">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-xl font-bold mb-1">{pharmacyName}</h1>
        {/* Helper for English name if available or hardcoded for layout demo */}
        {/* <h2 className="text-lg font-serif font-bold mb-1 tracking-wider uppercase">PHARMACY</h2> */}
        <p className="font-bold mb-0.5">{pharmacyAddress}</p>
        <p className="font-mono font-bold">{pharmacyPhone}</p>
      </div>

      {/* Info Box */}
      <div className="border-2 border-black mb-2 p-1">
        <div className="flex justify-between items-center mb-1 border-b border-black/20 pb-1">
          <div className="flex-1 text-right">
            <span className="font-bold mx-1">رقم الوصل:</span>
            <span className="font-mono font-bold">{sale.id}</span>
          </div>
          <div className="flex-1 text-left">
            <span className="font-mono font-bold">{formatDate(sale.date)}</span>
            <span className="font-mono font-bold mx-1">التاريخ</span>
          </div>
        </div>
        <div className="text-right">
          <span className="font-mono font-bold mx-1">اسم الكاشير:</span>
          <span className="font-mono font-bold">{user?.name || 'مسؤول المبيعات'}</span>
        </div>
      </div>

      {/* Table */}
      <table className="w-full mb-0 border-collapse border-2 border-black" dir="ltr">
        <thead>
          <tr className="bg-gray-100 text-center">
            <th className="border border-black p-1 w-[20%] font-bold">المبلغ</th>
            <th className="border border-black p-1 w-[20%] font-bold">سعر المفرد</th>
            <th className="border border-black p-1 w-[15%] font-bold">الكمية</th>
            <th className="border border-black p-1 w-[45%] font-bold">التفاصيل</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, idx) => {
            const itemTotal = (item.price || 0) * (item.quantity || 0);
            return (
              <tr key={idx} className={cn("text-center font-bold", item.is_return ? 'text-red-600' : '')}>
                <td className="border border-black p-1 font-mono text-sm align-middle">{itemTotal.toLocaleString()}</td>
                <td className="border border-black p-1 font-mono align-middle">{item.price.toLocaleString()}</td>
                <td className="border border-black p-1 font-mono align-middle">{item.quantity}</td>
                <td className="border border-black p-1 text-right align-middle">
                  <div>{item.name}</div>
                  {/* <div className="text-[10px] font-normal uppercase">EUTHYROX 100 MERCK</div> English name placeholder */}
                </td>
              </tr>
            )
          })}
          {/* Total Row */}
          <tr>
            <td className="border border-black p-1 font-mono text-xl font-bold text-center bg-gray-50">{sale.total.toLocaleString()}</td>
            <td colSpan={3} className="border border-black p-1 text-center font-bold text-xl bg-gray-50">المجموع</td>
          </tr>
        </tbody>
      </table>

      {/* Footer */}
      <div className="text-center mt-2 font-bold">
        <p className="mb-1">مواد الثلاجة لاتسترجع</p>
        <p className="mb-2">استرجاع العلاج الا بوجود الفاتورة</p>

        <div className="flex justify-center items-center text-[10px] dir-ltr mt-4 border-t border-black pt-1">
          <div className="font-mono">{printTime} {printDate}</div>
        </div>
        <div className="text-center text-[10px] mt-1">
          ميدجرام
        </div>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = 'InvoiceTemplate';
