'use client';

import { ExternalLink, TrendingUp } from 'lucide-react';
import { cn, formatMoney, formatAge, truncateHash, sanitizeReasoning } from '@/lib/utils';

const EXPLORER = 'https://testnet.bscscan.com/tx/';

// ── Normalizer: handles both old ({decision: object}) and new ({decision: string}) shapes ──

interface NormalizedCycle {
  key: string;
  timestamp: string;
  cycleNumber: number | null;
  narrativeName: string | null;
  decision: 'BUY' | 'HOLD' | 'FAILED';
  score: number | null;
  scoreBreakdown?: { momentum: number; catalyst: number; regime: number; safety: number };
  reasoning: string;
  marketRegime: string | null;
  fearGreed: number | null;
  llmUsed: string | null;
  txHash: string | null;
  positionSizeUSDC: number | null;
  token: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCycle(raw: any, index: number): NormalizedCycle {
  // Determine decision string
  let decision: 'BUY' | 'HOLD' | 'FAILED' = 'HOLD';
  const rawDecision = raw.decision;

  if (typeof rawDecision === 'string') {
    const upper = rawDecision.toUpperCase();
    if (upper === 'BUY') decision = 'BUY';
    else if (upper === 'FAILED') decision = 'FAILED';
    else decision = 'HOLD';
  } else if (rawDecision && typeof rawDecision === 'object') {
    // Old schema: decision.action
    const action = String(rawDecision.action ?? '').toUpperCase();
    if (action === 'BUY') decision = 'BUY';
    else decision = 'HOLD';
    // EXECUTION_FAILED old status override
    if (raw.status === 'EXECUTION_FAILED') decision = 'FAILED';
  }

  // Also check status field for old format
  if (raw.status === 'EXECUTION_FAILED') decision = 'FAILED';

  // Extract score — can be top-level or inside decision object
  const decObj = typeof rawDecision === 'object' && rawDecision !== null ? rawDecision : null;
  const score: number | null =
    typeof raw.score === 'number' && isFinite(raw.score) ? raw.score
    : typeof decObj?.score === 'number' && isFinite(decObj.score) ? decObj.score
    : null;

  // Extract reasoning
  const rawReasoning: string =
    typeof raw.reasoning === 'string' ? raw.reasoning
    : typeof decObj?.reasoning === 'string' ? decObj.reasoning
    : '';

  // TX hash — top-level or inside trade
  const txHash: string | null =
    raw.trade?.txHash ?? raw.txHash ?? null;

  // Position size
  const positionSizeUSDC: number | null =
    raw.trade?.positionSizeUSDC ?? decObj?.positionSizeUSDC ?? null;

  // Token
  const token: string | null =
    raw.trade?.token ?? decObj?.token ?? null;

  // Narrative name
  const rawName: string =
    typeof raw.narrativeName === 'string' ? raw.narrativeName.trim() : '';
  const narrativeName =
    rawName && rawName.toLowerCase() !== 'unknown' ? rawName : null;

  return {
    key: `${raw.timestamp ?? index}-${index}`,
    timestamp: raw.timestamp ?? '',
    cycleNumber: raw.cycleNumber ?? null,
    narrativeName,
    decision,
    score,
    scoreBreakdown: raw.scoreBreakdown ?? undefined,
    reasoning: sanitizeReasoning(rawReasoning),
    marketRegime: raw.marketRegime ?? null,
    fearGreed: raw.fearGreed != null ? Number(raw.fearGreed) : null,
    llmUsed: raw.llmUsed ?? null,
    txHash,
    positionSizeUSDC,
    token,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DecisionBadge({ decision }: { decision: 'BUY' | 'HOLD' | 'FAILED' }) {
  const styles = {
    BUY:    'bg-buy/15  text-buy  border-buy/25',
    HOLD:   'bg-hold/15 text-hold border-hold/25',
    FAILED: 'bg-fail/15 text-fail border-fail/25',
  };
  return (
    <span className={cn('px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold tracking-widest', styles[decision])}>
      {decision}
    </span>
  );
}

function RegimeBadge({ regime }: { regime: string }) {
  const map: Record<string, string> = { BULL: 'text-buy', BEAR: 'text-fail', SIDEWAYS: 'text-arc-400' };
  return (
    <span className={cn('text-[10px] font-mono uppercase', map[regime] ?? 'text-arc-400')}>{regime}</span>
  );
}

function ScoreDots({ breakdown }: { breakdown?: NormalizedCycle['scoreBreakdown'] }) {
  const parts = [
    { key: 'momentum' as const, max: 3 },
    { key: 'catalyst' as const, max: 3 },
    { key: 'regime'   as const, max: 2 },
    { key: 'safety'   as const, max: 2 },
  ];
  return (
    <div className="flex items-center gap-1">
      {parts.map(({ key, max }) => {
        const val = breakdown?.[key] ?? 0;
        const ratio = val / max;
        const color = ratio >= 0.67 ? 'bg-buy border-buy/40'
          : ratio >= 0.34 ? 'bg-hold border-hold/40'
          : val > 0 ? 'bg-fail border-fail/40'
          : 'bg-arc-700 border-arc-600';
        return <span key={key} className={cn('w-1.5 h-1.5 rounded-full border', color)} />;
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface CyclesFeedProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cycles: any[];
}

export function CyclesFeed({ cycles }: CyclesFeedProps) {
  const normalized = [...cycles]
    .map((c, i) => normalizeCycle(c, i))
    .reverse()
    .slice(0, 12);

  if (normalized.length === 0) {
    return (
      <div className="rounded-xl border border-arc-700 bg-arc-800 p-8 text-center shadow-card">
        <TrendingUp className="w-8 h-8 text-arc-600 mx-auto mb-3" />
        <p className="text-arc-400 text-sm">No cycles recorded yet.</p>
        <p className="text-arc-600 text-xs mt-1 font-mono">Agent will begin scanning shortly…</p>
      </div>
    );
  }

  const borderMap = { BUY: 'border-l-buy', HOLD: 'border-l-hold', FAILED: 'border-l-fail' };

  return (
    <div className="space-y-2">
      {normalized.map((cycle) => (
        <div
          key={cycle.key}
          className={cn(
            'rounded-xl border border-arc-700 bg-arc-800 border-l-4 px-4 py-3.5 shadow-card',
            'hover:bg-arc-750 hover:border-arc-600 transition-all duration-150 animate-fade-in',
            borderMap[cycle.decision] ?? 'border-l-arc-600'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Left */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                {cycle.narrativeName ? (
                  <span className="text-arc-50 text-sm font-medium">{cycle.narrativeName}</span>
                ) : (
                  <span className="text-arc-500 text-sm italic">—</span>
                )}
                <DecisionBadge decision={cycle.decision} />
                {cycle.marketRegime && <RegimeBadge regime={cycle.marketRegime} />}
              </div>

              {cycle.reasoning && (
                <p className="text-arc-400 text-[12px] leading-relaxed line-clamp-2 font-mono">
                  {cycle.reasoning}
                </p>
              )}

              {cycle.txHash && (
                <a
                  href={`${EXPLORER}${cycle.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-accent text-[11px] font-mono hover:underline transition-colors"
                >
                  TX: {truncateHash(cycle.txHash)}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </div>

            {/* Right */}
            <div className="shrink-0 flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-2">
                <ScoreDots breakdown={cycle.scoreBreakdown} />
                <span className={cn(
                  'font-mono text-sm font-semibold',
                  cycle.score === null ? 'text-arc-500'
                  : cycle.score >= 6 ? 'text-buy'
                  : cycle.score >= 4 ? 'text-hold'
                  : 'text-fail'
                )}>
                  {cycle.score !== null ? `${cycle.score}/10` : '—'}
                </span>
              </div>

              <div className="flex items-center gap-2 text-arc-500 text-[11px] font-mono">
                {cycle.fearGreed != null && isFinite(cycle.fearGreed) && (
                  <span>F&G {cycle.fearGreed}</span>
                )}
                <span>{formatAge(cycle.timestamp)}</span>
              </div>

              {cycle.decision === 'BUY' && cycle.token && cycle.positionSizeUSDC && (
                <span className="text-buy text-[11px] font-mono">
                  {formatMoney(cycle.positionSizeUSDC)} → {cycle.token}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
