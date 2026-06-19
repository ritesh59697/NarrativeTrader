'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
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

  const pnl        = currentValue - START_VALUE;
  const pnlPct     = (pnl / START_VALUE) * 100;
  const drawdown   = peakValue > 0 ? Math.max(0, (peakValue - currentValue) / peakValue * 100) : 0;
  const drawdownW  = Math.min(100, (drawdown / MAX_DRAWDOWN) * 100);

  const scores = cycles.map(c => getScore(c)).filter((s): s is number => s !== null);
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  const pnlPositive = pnl >= 0;
  const drawdownColor = drawdown >= 10 
    ? 'bg-error shadow-[0_0_8px_rgba(255,68,68,0.4)]' 
    : drawdown >= 5 
      ? 'bg-tertiary shadow-[0_0_8px_rgba(255,224,74,0.4)]' 
      : 'bg-secondary shadow-[0_0_8px_rgba(0,255,204,0.4)]';

  return (
    <div className="obsidian-card rounded-xl overflow-hidden">
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-wider font-semibold mb-1">Portfolio Valuation</p>
            <p className="text-on-surface font-display text-3xl font-extrabold tracking-tight">
              {formatMoney(currentValue)}
            </p>
          </div>
          <div className={cn(
            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold font-mono border',
            pnlPositive 
              ? 'bg-secondary/10 text-secondary border-secondary/20 shadow-[0_2px_8px_rgba(0,255,204,0.08)]' 
              : 'bg-error/10 text-error border-error/20 shadow-[0_2px_8px_rgba(255,68,68,0.08)]'
          )}>
            {pnlPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {pnlPositive ? '+' : ''}{formatMoney(pnl)} ({pnlPositive ? '+' : ''}{pnlPct.toFixed(2)}%)
          </div>
        </div>

        {/* Drawdown Gauge */}
        <div className="mb-6 bg-surface-container-low/40 p-4 rounded-xl border border-outline-variant/15">
          <div className="flex items-center justify-between mb-2">
            <span className="text-on-surface-variant font-mono text-[10px] uppercase tracking-wider font-semibold">Max Drawdown Status</span>
            <span className={cn('text-xs font-mono font-bold', drawdown > 0 ? 'text-secondary' : 'text-on-surface-variant/70')}>
              {formatPercent(drawdown)} <span className="text-on-surface-variant/40 font-medium">/ 15% limit</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-surface-container-lowest overflow-hidden border border-outline-variant/10">
            <div
              className={cn('h-full rounded-full transition-all duration-500', drawdownColor)}
              style={{ width: `${drawdownW}%` }}
            />
          </div>
        </div>

        {/* Dense Grid Stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-outline-variant/10">
          <div>
            <p className="text-on-surface-variant/50 font-mono text-[9px] uppercase tracking-wider font-semibold mb-1">Cash Reserve</p>
            <p className="text-on-surface text-sm font-mono font-bold">{formatMoney(cashUSDC)}</p>
            <span className="text-[9px] text-on-surface-variant/40 font-mono">USDC (Testnet)</span>
          </div>
          <div>
            <p className="text-on-surface-variant/50 font-mono text-[9px] uppercase tracking-wider font-semibold mb-1">All-Time Peak</p>
            <p className="text-on-surface text-sm font-mono font-bold">{formatMoney(peakValue)}</p>
            <span className="text-[9px] text-on-surface-variant/40 font-mono">Max equity curve</span>
          </div>
          <div>
            <p className="text-on-surface-variant/50 font-mono text-[9px] uppercase tracking-wider font-semibold mb-1">Avg Score</p>
            <p className="text-on-surface text-sm font-mono font-bold">
              {avgScore > 0 ? `${avgScore.toFixed(1)}/10` : '—'}
            </p>
            <span className="text-[9px] text-on-surface-variant/40 font-mono">Historical runs</span>
          </div>
        </div>
      </div>
    </div>
  );
}
