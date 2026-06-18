import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NarrativeTrader — ArcMarkets',
  description: 'Autonomous AI crypto trading agent powered by narrative intelligence. Built on BNB Chain.',
  keywords: ['crypto', 'trading', 'AI agent', 'BNB Chain', 'prediction market', 'DeFi'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-arc-900 text-arc-100 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
