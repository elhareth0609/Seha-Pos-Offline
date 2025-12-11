
import './index.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/hooks/use-auth';
import AppLayoutClient from './AppLayoutClient';

// Font is now loaded via index.css

// Metadata is now set in index.html

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.png" />
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZMLZTYMWQ3"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-ZMLZTYMWQ3');
          `
        }} />
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
