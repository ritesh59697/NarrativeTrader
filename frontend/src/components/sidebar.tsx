'use client';

import { Activity, Bot, ChevronRight, LayoutDashboard, Settings, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard',     icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Positions',     icon: Wallet,          href: '#' },
  { label: 'Trade History', icon: TrendingUp,       href: '#' },
  { label: 'Agent Config',  icon: Settings,         href: '#' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-outline-variant/15 bg-surface-container-lowest/80 backdrop-blur-md select-none">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/15 hover:bg-white/2 transition-colors">
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-fixed to-primary-fixed-dim flex items-center justify-center shadow-[0_0_12px_rgba(114,255,112,0.2)]">
            <Bot className="w-4.5 h-4.5 text-on-primary-fixed" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-buy border-2 border-background" />
          </div>
          <div>
            <p className="text-on-surface text-sm font-geist font-bold tracking-tight leading-none uppercase">ArcMarkets</p>
            <p className="text-primary-fixed text-[9px] mt-1 font-mono tracking-wider uppercase font-bold">NarrativeTrader</p>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[11px] font-mono font-bold tracking-wide uppercase transition-all duration-200 group relative border',
                  active
                    ? 'bg-primary-fixed/5 text-primary-fixed border-primary-fixed/20 shadow-[0_0_12px_rgba(114,255,112,0.05)]'
                    : 'text-on-surface-variant/75 border-transparent hover:bg-surface-container/50 hover:text-on-surface hover:border-outline-variant/20'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-primary-fixed" />
                )}
                <item.icon className={cn('w-4 h-4 transition-transform duration-200 group-hover:scale-105', active ? 'text-primary-fixed' : 'text-on-surface-variant/50 group-hover:text-on-surface')} />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary-fixed/80" />}
              </a>
            );
          })}
        </nav>

        {/* Diagnostic Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/15 bg-surface-container-lowest/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-buy animate-pulse" />
              <span className="text-on-surface-variant text-[10px] font-mono tracking-wider uppercase font-semibold">BSC Testnet</span>
            </div>
            <span className="text-primary-fixed text-[9px] font-mono font-bold">OK</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-on-surface-variant/70 font-mono">
            <span>Latency</span>
            <span className="text-buy font-bold">24ms</span>
          </div>
          <p className="text-on-surface-variant/45 text-[9px] font-mono mt-3 text-center border-t border-outline-variant/10 pt-2">
            v1.0.0 · BNB Hack 2026
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-container-low/90 backdrop-blur-md border-t border-outline-variant/10 flex justify-around items-center px-4 z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <a
              key={item.label}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1.5 py-1 px-3 rounded-lg transition-colors duration-150',
                active ? 'text-primary-fixed' : 'text-on-surface-variant hover:text-on-surface'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{item.label.split(' ')[0]}</span>
            </a>
          );
        })}
      </nav>
    </>
  );
}
