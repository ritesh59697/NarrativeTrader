import type { Metadata } from 'next';
import { Sora, Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Narrative Trader | AI-Driven Alpha Terminal',
  description: 'Institutional-grade AI crypto trading. Leverage real-time LLM narrative analysis to capture asymmetric market moves before they hit the tape.',
  keywords: ['crypto trading', 'AI agent', 'narrative trading', 'BNB Chain', 'DeFi', 'Groq', 'LLM'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`dark ${sora.variable} ${inter.variable} ${spaceGrotesk.variable}`}
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
        {children}
      </body>
    </html>
  );
}
