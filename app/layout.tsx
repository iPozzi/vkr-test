import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { NavBar } from '@/components/navbar/NavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Game Matcher',
  description: 'Подбор видеоигр под твой ПК',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="dark">
      <body className={cn('min-h-screen bg-background text-foreground', inter.className)}>
        <header className="border-b border-zinc-800">
            <div className="mx-auto max-w-6xl p-4">
              <NavBar />
            </div>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
      </body>
    </html>
  );
}