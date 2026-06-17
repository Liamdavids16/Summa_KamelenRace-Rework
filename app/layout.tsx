import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { loadSettings } from '@/lib/settings';
import { normalizeThemeId } from '@/lib/themes';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kamelenrace | Summa ICT',
  description: 'Real-time multiplayer quiz race',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = normalizeThemeId(loadSettings().theme);

  return (
    <html lang="nl" data-theme={theme} suppressHydrationWarning>
      <body className={GeistSans.className}>
        <ThemeProvider initialTheme={theme}>{children}</ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
