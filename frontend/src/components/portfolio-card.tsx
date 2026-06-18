'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn, formatMoney, formatPercent, PortfolioData, CycleLog } from '@/lib/utils';

const START_VALUE = 100;
const MAX_DRAWDOWN = 15;

interface PortfolioCardProps {
  portfolio: PortfolioData | null;
  cycles: CycleLog[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getScore(cycle: any): number | null {
  if (typeof cycle.score === 'number' && isFinite(cycle.score)) return cycle.score;
  const d = cycle.decision;
  if (d && typeof d === 'object' && typeof d.score === 'number' && isFinite(d.score)) return d.score;
  return null;
}

export function PortfolioCard({ portfolio, cycles }: PortfolioCardProps) {
  const currentValue  = portfolio?.currentValue  ?? START_VALUE;
  const peakValue     = portfolio?.peakValue     ?? START_VALUE;
  const cashUSDC      = portfolio?.cashUSDC      ?? START_VALUE;
  const openPositions = portfolio?.openPositions  ?? [];

  const pnl        = currentValue - START_VALUE;
  const pnlPct     = (pnl / START_VALUE) * 100;
  const drawdown   = peakValue > 0 ? Math.max(0, (peakValue - currentValue) / peakValue * 100) : 0;
  const drawdownW  = Math.min(100, (drawdown / MAX_DRAWDOWN) * 100);

  const scores = cycles.map(c => getScore(c)).filter((s): s is number => s !== null);
  const avgScore   = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const trades     = portfolio?.tradesHistory?.length ?? 0;

  const pnlPositive = pnl >= 0;
  const drawdownColor = drawdown >= 10 ? 'bg-fail' : drawdown >= 5 ? 'bg-hold' : 'bg-buy';

  return (
    <div className="rounded-xl border border-arc-700 bg-arc-800 overflow-hidden shadow-card">
      {/* Top gradient bar */}
      <div className="h-0.5 w-full bg-gradient-to-r from-accent via-purple-500 to-pink-500" />

      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-arc-400 text-[11px] uppercase tracking-widest font-medium mb-1">Portfolio Value</p>
            <p className="text-arc-50 font-mono text-3xl font-semibold tracking-tight">
              {formatMoney(currentValue)}
            </p>
          </div>
          <div className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-mono',
            pnlPositive ? 'bg-buy/15 text-buy border border-buy/20' : 'bg-fail/15 text-fail border border-fail/20'
          )}>
            {pnlPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {pnlPositive ? '+' : ''}{formatMoney(pnl)}
          </div>
        </div>

        {/* Drawdown bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-arc-400 text-[11px]">Drawdown from peak</span>
            <span className={cn('text-[11px] font-mono', drawdown > 0 ? 'text-hold' : 'text-arc-400')}>
              {formatPercent(drawdown)} / 15% max
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-arc-700 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', drawdownColor)}
              style={{ width: `${drawdownW}%` }}
            />
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-arc-700">
          <div>
            <p className="text-arc-500 text-[10px] uppercase tracking-wide mb-0.5">Cash</p>
            <p className="text-arc-100 text-sm font-mono font-medium">{formatMoney(cashUSDC)}</p>
          </div>
          <div>
            <p className="text-arc-500 text-[10px] uppercase tracking-wide mb-0.5">Peak</p>
            <p className="text-arc-100 text-sm font-mono font-medium">{formatMoney(peakValue)}</p>
          </div>
          <div>
            <p className="text-arc-500 text-[10px] uppercase tracking-wide mb-0.5">Avg Score</p>
            <p className="text-arc-100 text-sm font-mono font-medium">
              {avgScore > 0 ? `${avgScore.toFixed(1)}/10` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
