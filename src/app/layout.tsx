
import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from '@/contexts/AppContext';
// Removed headers import as ThinIconBar is removed

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
  // Removed pathname and showThinIconBar logic

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppProvider>
          {/* Removed the flex div and ThinIconBar */}
          <main className="flex-grow flex flex-col overflow-y-auto h-screen bg-background"> {/* Ensured h-screen and bg-background for consistency */}
            {children}
          </main>
          <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
