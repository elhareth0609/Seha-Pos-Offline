
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/use-auth';
import AppLayoutClient from './AppLayoutClient';
import { ThemeProvider } from "next-themes";

// Temporarily removing Google Fonts import due to connection issues
// We'll use system fonts as fallback
// import { Tajawal } from 'next/font/google';

// const tajawal = Tajawal({
//   subsets: ['arabic'],
//   weight: ['400', '500', '700'],
//   variable: '--font-tajawal',
// });

export const metadata: Metadata = {
  title: 'ميدجرام',
  description: 'نظام إدارة صيدلية للمبيعات والمخزون والمشتريات.',
  manifest: '/manifest.json'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.png" />
      </head>
      <body className="font-body antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, err => {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={['light', 'dark', 'theme-black', 'theme-rose', 'theme-blue', 'theme-green', 'theme-violet', 'theme-serenity-blue', 'theme-radiant-orchid', 'theme-golden-sunset', 'theme-forest-dreams', 'theme-crimson-elegance', 'theme-pastel-paradise']}
        >
            <AuthProvider>
                <AppLayoutClient>
                  {children}
                </AppLayoutClient>
                <Toaster />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

