import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Narrative Trader | AI-Driven Alpha Terminal',
  description: 'Institutional-grade AI crypto trading. Leverage real-time LLM narrative analysis to capture asymmetric market moves before they hit the tape.',
  keywords: ['crypto trading', 'AI agent', 'narrative trading', 'BNB Chain', 'DeFi', 'Groq', 'LLM'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body
        style={{
          background:  '#0a0a12',
          color:       '#e8e0f0',
          overflowX:   'hidden',
          fontFamily:  'Inter, system-ui, sans-serif',
          margin:      0,
          padding:     0,
        }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
