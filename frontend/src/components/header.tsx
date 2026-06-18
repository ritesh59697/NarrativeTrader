'use client';

import { Bot } from 'lucide-react';
import { cn, formatAge, formatCountdown, CycleLog, PortfolioData } from '@/lib/utils';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface HeaderProps {
  cycles: CycleLog[];
  portfolio: PortfolioData | null;
  isLoading: boolean;
  lastUpdatedAt: number;
  onRefresh: () => void;
}

export function Header({ cycles, portfolio, isLoading, lastUpdatedAt, onRefresh }: HeaderProps) {
  const [countdown, setCountdown] = useState(1800);
  const [age, setAge] = useState('—');

  useEffect(() => {
    const tick = setInterval(() => {
      setCountdown((c) => (c <= 0 ? 1800 : c - 1));
      setAge(lastUpdatedAt ? formatAge(new Date(lastUpdatedAt).toISOString()) : '—');
    }, 1000);
    return () => clearInterval(tick);
  }, [lastUpdatedAt]);

  // Reset countdown when new data arrives
  useEffect(() => {
    setCountdown(1800);
  }, [cycles.length]);

  const lastCycle = cycles[cycles.length - 1];
  const isPaused = portfolio?.isPaused ?? false;
  
  // Custom decision resolution
  let decision: 'BUY' | 'HOLD' | 'FAILED' = 'HOLD';
  if (lastCycle) {
    const d = lastCycle.decision as any;
    if (typeof d === 'string') {
      const u = d.toUpperCase();
      if (u === 'BUY') decision = 'BUY';
      else if (u === 'FAILED') decision = 'FAILED';
    } else if (d && typeof d === 'object') {
      const a = String(d.action ?? '').toUpperCase();
      if (a === 'BUY') decision = 'BUY';
      if ((lastCycle as any).status === 'EXECUTION_FAILED') decision = 'FAILED';
    }
    if ((lastCycle as any).status === 'EXECUTION_FAILED') decision = 'FAILED';
  }

  const statusColor = isPaused || decision === 'FAILED'
    ? 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.4)]'
    : decision === 'BUY' ? 'bg-primary-fixed shadow-[0_0_8px_rgba(114,255,112,0.4)]' : 'bg-secondary shadow-[0_0_8px_rgba(255,180,170,0.4)]';

  const statusLabel = isPaused ? 'PAUSED' : decision === 'BUY' ? 'ACTIVE' : decision === 'FAILED' ? 'FAILED' : 'RUNNING';

  return (
    <header className="sticky top-0 z-20 border-b border-outline-variant/10 bg-background/60 backdrop-blur-[40px]">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile Logo & Title */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <Link href="/" className="w-7 h-7 rounded-lg bg-gradient-to-tr from-primary-fixed to-primary-fixed-dim flex items-center justify-center shadow-[0_0_8px_rgba(114,255,112,0.2)]">
            <Bot className="w-4.5 h-4.5 text-on-primary-fixed" />
          </Link>
          <div>
            <span className="text-on-surface text-xs font-geist font-bold tracking-tight uppercase leading-none block">ArcMarkets</span>
            <span className="text-primary-fixed text-[8px] font-mono block leading-none font-bold uppercase mt-0.5">NarrativeTrader</span>
          </div>
        </div>

        {/* Center / Left status details */}
        <div className="hidden sm:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/20">
            <span className={cn('w-2 h-2 rounded-full animate-pulse-glow', statusColor)} />
            <span className="text-on-surface-variant text-[10px] font-mono font-bold tracking-wider uppercase leading-none">{statusLabel}</span>
          </div>
          {lastCycle && (
            <span className="text-on-surface-variant/80 text-xs font-mono">
              Cycle <strong className="text-on-surface font-bold">#{lastCycle.cycleNumber ?? cycles.length}</strong>
            </span>
          )}
          <span className="text-on-surface-variant/50 text-xs font-mono hidden md:block">
            Next scan in <strong className="text-on-surface-variant/80 font-medium">{formatCountdown(countdown)}</strong>
          </span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          <span className="hidden md:block text-on-surface-variant/50 text-[10px] font-mono uppercase tracking-wider">
            Updated {age}
          </span>
          
          <a
            href="https://testnet.bscscan.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-on-surface-variant/80 text-[10px] font-mono hover:bg-surface-container/50 hover:text-on-surface transition-colors uppercase tracking-wider font-bold"
          >
            BSC TESTNET
          </a>
        </div>
      </div>
    </header>
  );
}
