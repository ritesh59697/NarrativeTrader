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
  const endRef   = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LogLine[]>([]);

  useEffect(() => {
    const built: LogLine[] = [];

    cycles.forEach((cycle, ci) => {
      const time = formatTime(cycle.timestamp);
      const decision = cycle.decision ?? 'HOLD';
      const score = typeof cycle.score === 'number' ? cycle.score.toFixed(1) : '—';
      const narrative = cycle.narrativeName?.trim() || '—';

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
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
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

      <div className="h-40 overflow-y-auto px-4 py-3 bg-arc-950 font-mono text-[11px] leading-relaxed space-y-0.5">
        {lines.length === 0 && (
          <p className="text-arc-600">Waiting for agent cycles…</p>
        )}
        {lines.map((line) => (
          <div key={line.key} className={cn('block truncate', typeColor[line.type])}>
            {line.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
