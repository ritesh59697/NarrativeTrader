'use client';

import { Activity, Cpu, Zap, BarChart2 } from 'lucide-react';
import { cn, CycleLog, PortfolioData } from '@/lib/utils';

interface StatsGridProps {
  cycles: CycleLog[];
  portfolio: PortfolioData | null;
}

export function StatsGrid({ cycles, portfolio }: StatsGridProps) {
  const lastCycle = cycles[cycles.length - 1];
  const buyCycles   = cycles.filter(c => c.decision === 'BUY').length;
  const failCycles  = cycles.filter(c => c.decision === 'FAILED').length;
  const holdCycles  = cycles.filter(c => c.decision === 'HOLD').length;
  const trades      = portfolio?.tradesHistory?.length ?? 0;
  const llm         = lastCycle?.llmUsed ?? '—';
  const openPos     = portfolio?.openPositions?.length ?? 0;

  const scores = cycles.map(c => c.score).filter(s => typeof s === 'number' && isFinite(s));
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';

  const stats = [
    {
      label: 'Cycles Run',
      value: String(cycles.length || '—'),
      sub: `${buyCycles} BUY · ${holdCycles} HOLD · ${failCycles} FAIL`,
      icon: Activity,
      color: 'text-accent',
      bg: 'bg-accent/10 border-accent/20',
    },
    {
      label: 'Trades Executed',
      value: String(trades || '—'),
      sub: `${openPos} position${openPos !== 1 ? 's' : ''} open`,
      icon: Zap,
      color: 'text-buy',
      bg: 'bg-buy/10 border-buy/20',
    },
    {
      label: 'Avg Score',
      value: avgScore !== '—' ? `${avgScore}/10` : '—',
      sub: scores.length ? `from ${scores.length} scored cycles` : 'no data yet',
      icon: BarChart2,
      color: 'text-hold',
      bg: 'bg-hold/10 border-hold/20',
    },
    {
      label: 'LLM Engine',
      value: llm === 'groq' ? 'Groq' : llm === 'gemini' ? 'Gemini' : llm === 'failed' ? 'Offline' : '—',
      sub: 'llama-3.3-70b · flash fallback',
      icon: Cpu,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-arc-700 bg-arc-800 p-4 shadow-card hover:border-arc-600 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-arc-400 text-[11px] uppercase tracking-widest font-medium">{stat.label}</p>
            <div className={cn('w-7 h-7 rounded-lg border flex items-center justify-center', stat.bg)}>
              <stat.icon className={cn('w-3.5 h-3.5', stat.color)} />
            </div>
          </div>
          <p className="text-arc-50 font-mono text-xl font-semibold mb-1">{stat.value}</p>
          <p className="text-arc-500 text-[11px] truncate">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}
