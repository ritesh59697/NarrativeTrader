'use client';

import { Bot, ChevronRight, LayoutDashboard, Settings, TrendingUp, Wallet } from 'lucide-react';
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
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-outline-variant/10 bg-surface-container-lowest/80 backdrop-blur-md select-none">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-3 px-6 py-5 border-b border-outline-variant/10 hover:bg-white/2 transition-colors">
          <div className="relative w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(255,45,120,0.25)]">
            <span className="material-symbols-outlined text-[18px] text-on-primary font-bold">query_stats</span>
          </div>
          <div>
            <p className="text-on-surface text-sm font-display font-bold tracking-tight leading-none uppercase">Narrative</p>
            <p className="text-primary text-[9px] mt-1 font-mono tracking-wider uppercase font-bold">Trader</p>
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
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono font-bold tracking-wide uppercase transition-all duration-200 group relative border',
                  active
                    ? 'bg-primary/10 text-primary border-primary/20 shadow-[0_0_12px_rgba(255,45,120,0.05)]'
                    : 'text-on-surface-variant border-transparent hover:bg-white/5 hover:text-on-surface hover:border-outline-variant/20'
                )}
              >
                {active && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-primary" />
                )}
                <item.icon className={cn('w-4 h-4 transition-transform duration-200 group-hover:scale-105', active ? 'text-primary' : 'text-on-surface-variant/50 group-hover:text-on-surface')} />
                <span>{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto text-primary/80" />}
              </a>
            );
          })}
        </nav>

        {/* Diagnostic / Health Footer */}
        <div className="px-4 py-6 border-t border-outline-variant/10 bg-surface-container-lowest/50 space-y-6">
          {/* Internal Health Progress Bar */}
          <div className="space-y-3">
            <span className="text-[9px] text-on-surface-variant/40 font-mono font-bold tracking-widest uppercase block px-2">Internal Health</span>
            <div className="px-2 space-y-3">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono">
                  <span className="text-on-surface-variant">LPU</span>
                  <span className="text-primary font-bold">84%</span>
                </div>
                <div className="h-1 bg-surface-container rounded-full overflow-hidden border border-outline-variant/5">
                  <div className="h-full bg-primary w-[84%]"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-2 border-t border-outline-variant/5 pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                <span className="text-on-surface-variant text-[10px] font-mono tracking-wider uppercase font-semibold">Testnet-Alpha</span>
              </div>
              <span className="text-secondary text-[9px] font-mono font-bold">12ms</span>
            </div>
            <p className="text-on-surface-variant/35 text-[9px] font-mono text-center pt-2">
              v1.0.4 · BNB Hack 2026
            </p>
          </div>
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
                active ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
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
