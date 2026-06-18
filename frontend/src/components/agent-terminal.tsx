'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'lucide-react';
import { cn, formatTime, sanitizeReasoning, CycleLog } from '@/lib/utils';

interface AgentTerminalProps {
  cycles: CycleLog[];
}

interface LogLine {
  key: string;
  text: string;
  type: 'buy' | 'sell' | 'fail' | 'hold' | 'info' | 'default';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNarrativeName(cycle: any): string {
  const name = typeof cycle.narrativeName === 'string' ? cycle.narrativeName.trim() : '';
  if (name && name.toLowerCase() !== 'unknown') return name;
  return '—';
}

function getType(text: string): LogLine['type'] {
  if (text.startsWith('✅') || text.includes('BUY')) return 'buy';
  if (text.startsWith('❌') || text.includes('FAIL')) return 'fail';
  if (text.startsWith('⚠️') || text.includes('HOLD')) return 'hold';
  if (text.startsWith('📊') || text.startsWith('🔄') || text.startsWith('🤖')) return 'info';
  return 'default';
}

const typeColor: Record<LogLine['type'], string> = {
  buy:     'text-buy',
  sell:    'text-accent',
  fail:    'text-fail',
  hold:    'text-hold',
  info:    'text-accent',
  default: 'text-arc-400',
};

export function AgentTerminal({ cycles }: AgentTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LogLine[]>([]);

  useEffect(() => {
    const built: LogLine[] = [];

    cycles.forEach((cycle, ci) => {
      const time = formatTime(cycle.timestamp);
      const decision = getDecisionStr(cycle);
      const scoreVal = getScore(cycle);
      const score = scoreVal !== null ? scoreVal.toFixed(1) : '—';
      const narrative = getNarrativeName(cycle);

      const summary = `[${time}] #${cycle.cycleNumber ?? ci + 1} · ${narrative} · ${decision} · score ${score}/10`;
      built.push({ key: `${cycle.timestamp}-${ci}-summary`, text: summary, type: getType(decision) });

      if (cycle.trade?.txHash) {
        built.push({
          key: `${cycle.timestamp}-${ci}-tx`,
          text: `[${time}] ✅ TX ${cycle.trade.txHash.slice(0, 18)}… confirmed`,
          type: 'buy',
        });
      }

      const reasoning = sanitizeReasoning(cycle.reasoning);
      if (reasoning && (decision === 'FAILED' || reasoning.includes('failed') || reasoning.includes('unavailable'))) {
        built.push({
          key: `${cycle.timestamp}-${ci}-reason`,
          text: `[${time}] ⚠ ${reasoning.slice(0, 80)}`,
          type: 'fail',
        });
      }
    });

    setLines(built.slice(-50));
  }, [cycles]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="rounded-xl border border-arc-700 bg-arc-800 shadow-card overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-arc-700 bg-arc-800">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-fail/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-hold/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-buy/60" />
        </div>
        <Terminal className="w-3.5 h-3.5 text-arc-400" />
        <span className="text-arc-400 text-[11px] font-mono">agent.log</span>
        <span className="ml-auto text-arc-600 text-[10px] font-mono">{lines.length} lines</span>
      </div>

      <div ref={scrollRef} className="h-40 overflow-y-auto px-4 py-3 bg-arc-950 font-mono text-[11px] leading-relaxed space-y-0.5">
        {lines.length === 0 && (
          <p className="text-arc-600">Waiting for agent cycles…</p>
        )}
        {lines.map((line) => (
          <div key={line.key} className={cn('block truncate', typeColor[line.type])}>
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
