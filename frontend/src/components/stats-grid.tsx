'use client';

import { cn, CycleLog, PortfolioData } from '@/lib/utils';

interface StatsGridProps {
  cycles: CycleLog[];
  portfolio: PortfolioData | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDecisionStr(cycle: any): 'BUY' | 'HOLD' | 'FAILED' {
  if (!cycle) return 'HOLD';
  const d = cycle.decision;
  if (typeof d === 'string') {
    const u = d.toUpperCase();
    if (u === 'BUY') return 'BUY';
    if (u === 'FAILED') return 'FAILED';
    return 'HOLD';
  }
  if (d && typeof d === 'object') {
    const a = String(d.action ?? '').toUpperCase();
    if (cycle.status === 'EXECUTION_FAILED') return 'FAILED';
    if (a === 'BUY') return 'BUY';
    return 'HOLD';
  }
  if (cycle.status === 'EXECUTION_FAILED') return 'FAILED';
  return 'HOLD';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getScore(cycle: any): number | null {
  if (typeof cycle.score === 'number' && isFinite(cycle.score)) return cycle.score;
  const d = cycle.decision;
  if (d && typeof d === 'object' && typeof d.score === 'number' && isFinite(d.score)) return d.score;
  return null;
}

export function StatsGrid({ cycles, portfolio }: StatsGridProps) {
  const lastCycle = cycles[cycles.length - 1];
  const buyCycles   = cycles.filter(c => getDecisionStr(c) === 'BUY').length;
  const failCycles  = cycles.filter(c => getDecisionStr(c) === 'FAILED').length;
  const holdCycles  = cycles.filter(c => getDecisionStr(c) === 'HOLD').length;
  const trades      = portfolio?.tradesHistory?.length ?? 0;
  const llm         = lastCycle?.llmUsed ?? '—';
  const openPos     = portfolio?.openPositions?.length ?? 0;

  const scores = cycles.map(c => getScore(c)).filter((s): s is number => s !== null);
  const avgScore = scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—';

  const stats = [
    {
      label: 'Cycles Run',
      value: String(cycles.length || '—'),
      sub: `${buyCycles} BUY · ${holdCycles} HOLD · ${failCycles} FAIL`,
    },
    {
      label: 'Trades Executed',
      value: String(trades || '—'),
      sub: `${openPos} position${openPos !== 1 ? 's' : ''} open`,
    },
    {
      label: 'Avg Score',
      value: avgScore !== '—' ? `${avgScore}/10` : '—',
      sub: scores.length ? `from ${scores.length} scored cycles` : 'no data yet',
    },
    {
      label: 'LLM Engine',
      value: llm === 'groq' ? 'Groq' : llm === 'gemini' ? 'Gemini' : llm === 'failed' ? 'Offline' : '—',
      sub: 'llama-3.3-70b · flash fallback',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="obsidian-card rounded-xl p-5"
        >
          <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-wider font-semibold mb-2">{stat.label}</p>
          <p className="text-on-surface font-geist text-2xl font-bold tracking-tight mb-2">{stat.value}</p>
          <p className="text-on-surface-variant/60 font-mono text-[10px] leading-none truncate">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}
