import type { Metadata } from 'next';
import { Inter, IBM_Plex_Mono, Geist } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NarrativeTrader — ArcMarkets',
  description: 'Autonomous AI crypto trading agent powered by narrative intelligence. Built on BNB Chain.',
  keywords: ['crypto', 'trading', 'AI agent', 'BNB Chain', 'prediction market', 'DeFi'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${ibmPlexMono.variable} ${geist.variable}`} suppressHydrationWarning>
      <body className="bg-arc-900 text-arc-100 antialiased" style={{ fontFamily: 'var(--font-geist), var(--font-inter), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
