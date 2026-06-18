'use client';

import { ExternalLink, TrendingUp } from 'lucide-react';
import { cn, formatMoney, formatAge, truncateHash, sanitizeReasoning, CycleLog } from '@/lib/utils';

const EXPLORER = 'https://testnet.bscscan.com/tx/';

interface CyclesFeedProps {
  cycles: CycleLog[];
}

function DecisionBadge({ decision }: { decision: 'BUY' | 'HOLD' | 'FAILED' }) {
  const styles = {
    BUY:    'bg-buy/15   text-buy   border-buy/25',
    HOLD:   'bg-hold/15  text-hold  border-hold/25',
    FAILED: 'bg-fail/15  text-fail  border-fail/25',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold tracking-widest', styles[decision])}>
      {decision}
    </span>
  );
}

function RegimeBadge({ regime }: { regime: string }) {
  const colors = { BULL: 'text-buy', BEAR: 'text-fail', SIDEWAYS: 'text-arc-400' };
  return (
    <span className={cn('text-[10px] font-mono uppercase', colors[regime as keyof typeof colors] ?? 'text-arc-400')}>
      {regime}
    </span>
  );
}

function ScoreDots({ breakdown, score }: { breakdown?: CycleLog['scoreBreakdown']; score: number }) {
  const parts = [
    { key: 'momentum', max: 3 },
    { key: 'catalyst', max: 3 },
    { key: 'regime',   max: 2 },
    { key: 'safety',   max: 2 },
  ] as const;

  return (
    <div className="flex items-center gap-1">
      {parts.map(({ key, max }) => {
        const val = breakdown?.[key] ?? 0;
        const ratio = val / max;
        const color = ratio >= 0.67 ? 'bg-buy border-buy/40' : ratio >= 0.34 ? 'bg-hold border-hold/40' : val > 0 ? 'bg-fail border-fail/40' : 'bg-arc-700 border-arc-600';
        return (
          <span key={key} className={cn('w-1.5 h-1.5 rounded-full border', color)} />
        );
      })}
    </div>
  );
}

export function CyclesFeed({ cycles }: CyclesFeedProps) {
  const recent = [...cycles].reverse().slice(0, 12);

  if (recent.length === 0) {
    return (
      <div className="rounded-xl border border-arc-700 bg-arc-800 p-8 text-center shadow-card">
        <TrendingUp className="w-8 h-8 text-arc-600 mx-auto mb-3" />
        <p className="text-arc-400 text-sm">No cycles recorded yet.</p>
        <p className="text-arc-600 text-xs mt-1 font-mono">Agent will begin scanning shortly…</p>
      </div>
    );
  }

  const borderColor = { BUY: 'border-l-buy', HOLD: 'border-l-hold', FAILED: 'border-l-fail' };

  return (
    <div className="space-y-2">
      {recent.map((cycle, i) => {
        const decision  = cycle.decision ?? 'HOLD';
        const reasoning = sanitizeReasoning(cycle.reasoning);
        const name      = cycle.narrativeName?.trim() && cycle.narrativeName !== 'Unknown' ? cycle.narrativeName : null;
        const txHash    = cycle.trade?.txHash;
        const score     = typeof cycle.score === 'number' && isFinite(cycle.score) ? cycle.score : null;

        return (
          <div
            key={`${cycle.timestamp}-${i}`}
            className={cn(
              'rounded-xl border border-arc-700 bg-arc-800 border-l-2 px-4 py-3.5 shadow-card',
              'hover:bg-arc-750 hover:border-arc-600 transition-all duration-150 group animate-fade-in',
              borderColor[decision] ?? 'border-l-arc-600'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              {/* Left: name + decision */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {name ? (
                    <span className="text-arc-50 text-sm font-medium truncate">{name}</span>
                  ) : (
                    <span className="text-arc-500 text-sm italic">—</span>
                  )}
                  <DecisionBadge decision={decision} />
                  {cycle.marketRegime && <RegimeBadge regime={cycle.marketRegime} />}
                </div>

                {reasoning && (
                  <p className="text-arc-400 text-[12px] leading-relaxed line-clamp-1 font-mono">
                    {reasoning}
                  </p>
                )}

                {txHash && (
                  <a
                    href={`${EXPLORER}${txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-accent text-[11px] font-mono hover:text-accent-hover transition-colors"
                  >
                    TX: {truncateHash(txHash)}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>

              {/* Right: score + meta */}
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <ScoreDots breakdown={cycle.scoreBreakdown} score={score ?? 0} />
                  <span className={cn(
                    'font-mono text-sm font-semibold',
                    score === null ? 'text-arc-500' :
                    score >= 6 ? 'text-buy' : score >= 4 ? 'text-hold' : 'text-fail'
                  )}>
                    {score !== null ? `${score}/10` : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-arc-500 text-[11px] font-mono">
                  {cycle.fearGreed != null && <span>F&G {cycle.fearGreed}</span>}
                  <span>{formatAge(cycle.timestamp)}</span>
                </div>
                {cycle.trade && (
                  <span className="text-buy text-[11px] font-mono">
                    {formatMoney(cycle.trade.positionSizeUSDC)} → {cycle.trade.token}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
