import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/use-auth';
import AppLayoutClient from './AppLayoutClient';

export const metadata: Metadata = {
  title: 'مدير المخزون الطبي',
  description: 'نظام إدارة صيدلية للمبيعات والمخزون والمشتريات.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#11a179" />
      </head>
      <body className="font-body antialiased">
        <AuthProvider>
            <AppLayoutClient>
              {children}
            </AppLayoutClient>
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
