'use client';

import { useEffect, useRef, useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';
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
  buy:     'text-primary-fixed',
  sell:    'text-primary-fixed-dim',
  fail:    'text-error',
  hold:    'text-secondary',
  info:    'text-primary-fixed-dim',
  default: 'text-on-surface-variant/60',
};

export function AgentTerminal({ cycles }: AgentTerminalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<LogLine[]>([]);
  const [copied, setCopied] = useState(false);

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

  const copyToClipboard = () => {
    const textToCopy = lines.map(l => l.text).join('\n');
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="obsidian-card rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-outline-variant/15 bg-surface-container-low/20">
        {/* macOS Action Dots */}
        <div className="flex gap-1.5 select-none">
          <span className="w-2 h-2 rounded-full bg-error/70 hover:bg-error transition-colors duration-150 cursor-pointer" />
          <span className="w-2 h-2 rounded-full bg-secondary/70 hover:bg-secondary transition-colors duration-150 cursor-pointer" />
          <span className="w-2 h-2 rounded-full bg-primary-fixed/70 hover:bg-primary-fixed transition-colors duration-150 cursor-pointer" />
        </div>
        <div className="h-4 w-[1px] bg-outline-variant/30 mx-1" />
        <Terminal className="w-4 h-4 text-on-surface-variant/60" />
        <span className="text-on-surface-variant text-xs font-mono font-medium">agent.log</span>
        
        {/* Actions / Meta */}
        <div className="ml-auto flex items-center gap-3">
          <span className="text-on-surface-variant/40 text-[10px] font-mono leading-none">{lines.length} lines</span>
          <button
            onClick={copyToClipboard}
            className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant/60 hover:text-on-surface transition-all active:scale-95 flex items-center gap-1 text-[10px] font-mono"
            title="Copy Logs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-primary-fixed" />
                <span className="text-primary-fixed">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="h-44 overflow-y-auto px-5 py-4 bg-surface-container-lowest/80 font-mono text-[11px] leading-relaxed space-y-1 select-text">
        {lines.length === 0 && (
          <p className="text-on-surface-variant/40 animate-pulse">Waiting for agent cycles…</p>
        )}
        {lines.map((line) => (
          <div key={line.key} className={cn('block truncate border-l border-transparent pl-1 hover:border-outline-variant/35 hover:bg-surface-container/20 transition-colors', typeColor[line.type])}>
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
}
