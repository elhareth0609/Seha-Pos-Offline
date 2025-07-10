import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/use-auth';
import AppLayoutClient from './AppLayoutClient';
import { Tajawal } from 'next/font/google';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'Midgram',
  description: 'نظام إدارة صيدلية للمبيعات والمخزون والمشتريات.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head />
      <body className={`${tajawal.variable} font-body antialiased`}>
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
