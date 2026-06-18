'use client';

import { Bot, ExternalLink, RefreshCw } from 'lucide-react';
import { cn, formatAge, formatCountdown, CycleLog, PortfolioData } from '@/lib/utils';
import { useEffect, useState } from 'react';

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
  const decision = lastCycle?.decision;

  const statusColor = isPaused || decision === 'FAILED'
    ? 'bg-fail'
    : decision === 'BUY' ? 'bg-buy' : 'bg-accent';

  const statusLabel = isPaused ? 'PAUSED' : decision === 'BUY' ? 'ACTIVE' : decision === 'FAILED' ? 'FAILED' : 'RUNNING';

  return (
    <header className="sticky top-0 z-20 border-b border-arc-700 bg-arc-800/80 backdrop-blur-md">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Mobile logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-arc-50 text-sm font-semibold">ArcMarkets</span>
        </div>

        {/* Center status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={cn('w-2 h-2 rounded-full animate-pulse-glow', statusColor)} />
            <span className="text-arc-200 text-xs font-mono font-medium">{statusLabel}</span>
          </div>
          {lastCycle && (
            <span className="text-arc-500 text-xs font-mono">
              #{lastCycle.cycleNumber ?? cycles.length}
            </span>
          )}
          <span className="hidden sm:block text-arc-500 text-xs font-mono">
            next in {formatCountdown(countdown)}
          </span>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-arc-500 text-[11px] font-mono">{age}</span>
          <a
            href="https://testnet.bscscan.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-arc-700 border border-arc-600 text-arc-300 text-[11px] font-mono hover:bg-arc-600 hover:text-arc-100 transition-colors"
          >
            BSC TESTNET
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onRefresh}
            className="p-1.5 rounded-md hover:bg-arc-700 text-arc-400 hover:text-arc-100 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>
    </header>
  );
}
