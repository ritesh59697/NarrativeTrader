import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'NarrativeTrader — ArcMarkets',
  description: 'Autonomous AI crypto trading agent powered by narrative intelligence. Built on BNB Chain.',
  keywords: ['crypto', 'trading', 'AI agent', 'BNB Chain', 'prediction market', 'DeFi'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-arc-900 text-arc-100 antialiased" style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
