
import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/contexts/AppContext';
import { ThinIconBar } from '@/components/layout/ThinIconBar';
import { headers } from 'next/headers'; // Import headers to get current path

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Opano',
  description: 'Real-time messaging and collaboration app.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const heads = headers();
  const pathname = heads.get('next-url') || ''; // Get current pathname
  
  // Determine if ThinIconBar should be shown
  const noBarPaths = ['/auth/join', '/auth/signin', '/auth/signup'];
  const showThinIconBar = !noBarPaths.some(p => pathname === p) && !pathname.startsWith('/join/');


  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProvider>
          <div className="flex h-screen bg-background">
            {showThinIconBar && <ThinIconBar />}
            <main className="flex-grow flex flex-col overflow-y-auto"> {/* Changed overflow-hidden to overflow-y-auto */}
              {children}
            </main>
          </div>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
