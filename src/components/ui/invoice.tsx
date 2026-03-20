"use client"
import * as React from 'react';
import type { Sale, AppSettings, User } from '@/lib/types';

interface InvoiceTemplateProps {
  sale: Sale | null;
  settings: AppSettings | null;
  user: User | null;
}

// ── Inline styles ────────────────────────────────────────────────────────────
// All styles are inlined so the invoice renders correctly in BOTH environments:
//   • Next.js (online)  — stylesheet is available
//   • Electron (offline) — new BrowserWindow has no Tailwind, so className fails
// ─────────────────────────────────────────────────────────────────────────────

const s = {
  wrapper: {
    padding: '16px',
    fontFamily: 'Arial, sans-serif',
    color: '#000',
    background: '#fff',
    maxWidth: '80mm',
    margin: '0 auto',
    fontSize: '12px',
    lineHeight: '1.4',
    direction: 'rtl' as const,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '8px',
  },
  headerH1: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: '0 0 4px 0',
  },
  headerP: {
    fontWeight: 'bold',
    margin: '0 0 2px 0',
  },
  infoBox: {
    border: '2px solid #000',
    marginBottom: '8px',
    padding: '4px',
  },
  infoRow: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: '4px',
    borderBottom: '1px solid rgba(0,0,0,0.2)',
    paddingBottom: '4px',
  },
  infoRowLast: {
    textAlign: 'right' as const,
  },
  bold: {
    fontWeight: 'bold' as const,
  },
  mono: {
    fontFamily: 'monospace' as const,
    fontWeight: 'bold' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    border: '2px solid #000',
    marginBottom: '0',
    direction: 'ltr' as const,
  },
  th: {
    border: '1px solid #000',
    padding: '4px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    background: '#f3f4f6',
    fontSize: '12px',
  },
  tdCenter: {
    border: '1px solid #000',
    padding: '4px',
    textAlign: 'center' as const,
    fontFamily: 'monospace' as const,
    fontWeight: 'bold' as const,
    fontSize: '13px',
    verticalAlign: 'middle' as const,
  },
  tdRight: {
    border: '1px solid #000',
    padding: '4px',
    textAlign: 'right' as const,
    fontWeight: 'bold' as const,
    verticalAlign: 'middle' as const,
  },
  tdTotalAmount: {
    border: '1px solid #000',
    padding: '4px',
    textAlign: 'center' as const,
    fontFamily: 'monospace' as const,
    fontWeight: 'bold' as const,
    fontSize: '20px',
    background: '#f9fafb',
  },
  tdTotalLabel: {
    border: '1px solid #000',
    padding: '4px',
    textAlign: 'center' as const,
    fontWeight: 'bold' as const,
    fontSize: '20px',
    background: '#f9fafb',
  },
  returnRow: {
    color: '#dc2626',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '8px',
    fontWeight: 'bold' as const,
  },
  footerP: {
    margin: '0 0 4px 0',
  },
  timestamp: {
    display: 'flex' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    fontSize: '10px',
    direction: 'ltr' as const,
    marginTop: '16px',
    borderTop: '1px solid #000',
    paddingTop: '4px',
  },
  brand: {
    textAlign: 'center' as const,
    fontSize: '10px',
    marginTop: '4px',
  },
} as const;

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, InvoiceTemplateProps>(
  ({ sale, settings, user }, ref) => {
    if (!sale || !settings) return null;

    const { pharmacyName, pharmacyAddress, pharmacyPhone } = settings;

    const formatDate = (dateString: string) => {
      const d = new Date(dateString);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${d.getFullYear()}`;
    };

    const now = new Date();
    const printDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')}/${now.getFullYear()}`;
    const printTime = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    return (
      <div ref={ref} style={s.wrapper}>
        {/* Header */}
        <div style={s.header}>
          <h1 style={s.headerH1}>{pharmacyName}</h1>
          <p style={s.headerP}>{pharmacyAddress}</p>
          <p style={{ ...s.mono, ...s.headerP }}>{pharmacyPhone}</p>
        </div>

        {/* Info Box */}
        <div style={s.infoBox}>
          <div style={s.infoRow}>
            <div style={{ flex: 1, textAlign: 'right' }}>
              <span style={s.bold}>رقم الوصل: </span>
              <span style={s.mono}>{sale.id}</span>
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <span style={s.mono}>{formatDate(sale.date)}</span>
              <span style={s.bold}> التاريخ</span>
            </div>
          </div>
          <div style={s.infoRowLast}>
            <span style={s.mono}>اسم الصيدلي: </span>
            <span style={s.mono}>{user?.name || 'مسؤول المبيعات'}</span>
          </div>
        </div>

        {/* Table */}
        <table style={s.table}>
          <thead>
            <tr>
              <th style={{ ...s.th, width: '25%' }}>المبلغ</th>
              <th style={{ ...s.th, width: '20%' }}>الكمية</th>
              <th style={{ ...s.th, width: '55%' }}>العنصر</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((item, idx) => {
              const itemTotal = (item.price || 0) * (item.quantity || 0);
              return (
                <tr key={idx} style={item.is_return ? s.returnRow : {}}>
                  <td style={s.tdCenter}>{itemTotal.toLocaleString()}</td>
                  <td style={s.tdCenter}>{item.quantity}</td>
                  <td style={s.tdRight}>{item.name}</td>
                </tr>
              );
            })}
            {/* Total Row */}
            <tr>
              <td style={s.tdTotalAmount}>{sale.total.toLocaleString()}</td>
              <td colSpan={2} style={s.tdTotalLabel}>المجموع</td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={s.footer}>
          <p style={s.footerP}>مواد الثلاجة لاتسترجع</p>
          <p style={{ ...s.footerP, marginBottom: '8px' }}>استرجاع العلاج الا بوجود الفاتورة</p>
          <div style={s.timestamp}>
            <span style={s.mono}>{printTime} {printDate}</span>
          </div>
          <div style={s.brand}>ميدجرام</div>
        </div>
      </div>
    );
  }
);

InvoiceTemplate.displayName = 'InvoiceTemplate';