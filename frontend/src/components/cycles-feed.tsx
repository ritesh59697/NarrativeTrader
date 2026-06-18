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
  let decision: 'BUY' | 'HOLD' | 'FAILED' = 'HOLD';
  const rawDecision = raw.decision;

  if (typeof rawDecision === 'string') {
    const upper = rawDecision.toUpperCase();
    if (upper === 'BUY') decision = 'BUY';
    else if (upper === 'FAILED') decision = 'FAILED';
    else decision = 'HOLD';
  } else if (rawDecision && typeof rawDecision === 'object') {
    const action = String(rawDecision.action ?? '').toUpperCase();
    if (action === 'BUY') decision = 'BUY';
    else decision = 'HOLD';
    if (raw.status === 'EXECUTION_FAILED') decision = 'FAILED';
  }

  if (raw.status === 'EXECUTION_FAILED') decision = 'FAILED';

  const decObj = typeof rawDecision === 'object' && rawDecision !== null ? rawDecision : null;
  const score: number | null =
    typeof raw.score === 'number' && isFinite(raw.score) ? raw.score
    : typeof decObj?.score === 'number' && isFinite(decObj.score) ? decObj.score
    : null;

  const rawReasoning: string =
    typeof raw.reasoning === 'string' ? raw.reasoning
    : typeof decObj?.reasoning === 'string' ? decObj.reasoning
    : '';

  const txHash: string | null =
    raw.trade?.txHash ?? raw.txHash ?? null;

  const positionSizeUSDC: number | null =
    raw.trade?.positionSizeUSDC ?? decObj?.positionSizeUSDC ?? null;

  const token: string | null =
    raw.trade?.token ?? decObj?.token ?? null;

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
    BUY:    'bg-primary-fixed/10  text-primary-fixed  border-primary-fixed/20',
    HOLD:   'bg-secondary/10 text-secondary border-secondary/20',
    FAILED: 'bg-error/10 text-error border-error/20',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full border text-[9px] font-mono font-bold tracking-wider uppercase', styles[decision])}>
      {decision}
    </span>
  );
}

function RegimeBadge({ regime }: { regime: string }) {
  const map: Record<string, string> = { 
    BULL: 'text-primary-fixed bg-primary-fixed/5 border-primary-fixed/15', 
    BEAR: 'text-error bg-error/5 border-error/15', 
    SIDEWAYS: 'text-on-surface-variant bg-surface-container-low/40 border-outline-variant/20' 
  };
  return (
    <span className={cn('text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider', map[regime] ?? 'text-on-surface-variant bg-surface-container-low/40 border-outline-variant/20')}>
      {regime}
    </span>
  );
}

function ScoreDots({ breakdown }: { breakdown?: NormalizedCycle['scoreBreakdown'] }) {
  const parts = [
    { label: 'Momentum', key: 'momentum' as const, max: 3 },
    { label: 'Catalyst', key: 'catalyst' as const, max: 3 },
    { label: 'Regime',   key: 'regime'   as const, max: 2 },
    { label: 'Safety',   key: 'safety'   as const, max: 2 },
  ];
  return (
    <div className="flex items-center gap-1.5 bg-surface-container-lowest/50 px-2 py-1 rounded border border-outline-variant/10">
      {parts.map(({ label, key, max }) => {
        const val = breakdown?.[key] ?? 0;
        const ratio = val / max;
        const color = ratio >= 0.67 ? 'bg-primary-fixed'
          : ratio >= 0.34 ? 'bg-secondary'
          : val > 0 ? 'bg-error'
          : 'bg-surface-container-high';
        return (
          <span 
            key={key} 
            title={`${label}: ${val}/${max}`}
            className={cn('w-1.5 h-1.5 rounded-full transition-colors', color)} 
          />
        );
      })}
    </div>
  );
}

// ── Single Cycle Row Component ──────────────────────────────────────────────────

function CycleRow({ cycle }: { cycle: NormalizedCycle }) {
  const borderMap = { 
    BUY: 'border-l-primary-fixed', 
    HOLD: 'border-l-secondary', 
    FAILED: 'border-l-error' 
  };
  
  return (
    <div
      className={cn(
        'obsidian-card rounded-xl border-l-4 px-5 py-4 shadow-card',
        borderMap[cycle.decision] ?? 'border-l-outline-variant'
      )}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left section: narrative + badge + reasoning summary */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {cycle.narrativeName ? (
              <span className="text-on-surface text-sm font-geist font-bold tracking-tight">{cycle.narrativeName}</span>
            ) : (
              <span className="text-on-surface-variant/40 text-sm italic">—</span>
            )}
            <DecisionBadge decision={cycle.decision} />
            {cycle.marketRegime && <RegimeBadge regime={cycle.marketRegime} />}
          </div>

          <p className="text-on-surface-variant/80 text-[12px] font-mono truncate overflow-hidden whitespace-nowrap w-full block">
            {cycle.reasoning || "No reasoning logged."}
          </p>

          {cycle.txHash && (
            <a
              href={`${EXPLORER}${cycle.txHash}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-2.5 text-primary-fixed text-[10px] font-mono hover:underline transition-colors uppercase tracking-wider font-bold"
            >
              Tx: {truncateHash(cycle.txHash)}
              <ExternalLink className="w-3 h-3 text-primary-fixed/80" />
            </a>
          )}
        </div>

        {/* Right section: scores + transaction size metrics */}
        <div className="shrink-0 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 border-t md:border-t-0 border-outline-variant/10 pt-2.5 md:pt-0">
          <div className="flex items-center gap-2">
            <ScoreDots breakdown={cycle.scoreBreakdown} />
            <span className={cn(
              'font-mono text-sm font-bold px-2 py-0.5 rounded border leading-none',
              cycle.score === null ? 'text-on-surface-variant/40 border-outline-variant/20 bg-surface-container-lowest/50'
              : cycle.score >= 6 ? 'text-primary-fixed border-primary-fixed/20 bg-primary-fixed/5'
              : cycle.score >= 4 ? 'text-secondary border-secondary/20 bg-secondary/5'
              : 'text-error border-error/20 bg-error/5'
            )}>
              {cycle.score !== null ? `${cycle.score}/10` : '—'}
            </span>
          </div>

          <div className="flex flex-col items-end gap-1 text-[10px] text-on-surface-variant/50 font-mono">
            <div className="flex items-center gap-1.5">
              {cycle.fearGreed != null && isFinite(cycle.fearGreed) && (
                <span>F&G <strong className="text-on-surface-variant/80 font-bold">{cycle.fearGreed}</strong></span>
              )}
              {cycle.fearGreed != null && <span>·</span>}
              <span>{formatAge(cycle.timestamp)}</span>
            </div>
            
            {cycle.decision === 'BUY' && cycle.token && cycle.positionSizeUSDC && (
              <span className="text-primary-fixed font-bold mt-1 text-[11px]">
                {formatMoney(cycle.positionSizeUSDC)} &rarr; {cycle.token}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface CyclesFeedProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cycles: any[];
}

export function CyclesFeed({ cycles }: { cycles: CyclesFeedProps['cycles'] }) {
  const normalized = [...cycles]
    .map((c, i) => normalizeCycle(c, i))
    .reverse()
    .slice(0, 12);

  if (normalized.length === 0) {
    return (
      <div className="obsidian-card rounded-xl p-12 text-center border-dashed">
        <TrendingUp className="w-8 h-8 text-on-surface-variant/40 mx-auto mb-3 opacity-60" />
        <p className="text-on-surface text-sm font-medium">No cycles recorded yet.</p>
        <p className="text-on-surface-variant/50 text-xs mt-1 font-mono">Agent will start scanning BNB narratives shortly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {normalized.map((cycle) => (
        <CycleRow key={cycle.key} cycle={cycle} />
      ))}
    </div>
  );
}
