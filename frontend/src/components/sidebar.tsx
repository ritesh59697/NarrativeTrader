'use client';

import { Activity, Bot, ChevronRight, LayoutDashboard, Settings, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard',     icon: LayoutDashboard, href: '/', active: true },
  { label: 'Positions',     icon: Wallet,          href: '#', active: false },
  { label: 'Trade History', icon: TrendingUp,       href: '#', active: false },
  { label: 'Agent Config',  icon: Settings,         href: '#', active: false },
];

export function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-arc-700 bg-arc-800">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-arc-700">
        <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center shadow-glow-accent">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="text-arc-50 text-sm font-semibold tracking-tight leading-none">ArcMarkets</p>
          <p className="text-arc-300 text-[10px] mt-0.5 font-mono">NarrativeTrader</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 group',
              item.active
                ? 'bg-accent/15 text-accent border border-accent/20'
                : 'text-arc-300 hover:bg-arc-700 hover:text-arc-100'
            )}
          >
            <item.icon className={cn('w-4 h-4', item.active ? 'text-accent' : 'text-arc-400 group-hover:text-arc-200')} />
            <span>{item.label}</span>
            {item.active && <ChevronRight className="w-3 h-3 ml-auto text-accent/60" />}
          </a>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-arc-700 space-y-1">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-arc-400" />
          <span className="text-arc-400 text-[11px] font-mono">BSC Testnet</span>
        </div>
        <p className="text-arc-500 text-[10px]">v1.0.0 · BNB Hack 2026</p>
      </div>
    </aside>
  );
}
