'use client';

import { ExternalLink, Layers } from 'lucide-react';
import { cn, formatMoney, formatAge, truncateHash, OpenPosition } from '@/lib/utils';

const EXPLORER_ADDR = 'https://testnet.bscscan.com/address/';

interface OpenPositionsProps {
  positions: OpenPosition[];
}

export function OpenPositions({ positions }: OpenPositionsProps) {
  if (positions.length === 0) {
    return (
      <div className="obsidian-card rounded-xl p-6 flex flex-col justify-between h-full min-h-[280px]">
        <div>
          <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-wider font-semibold mb-4">Open Positions</p>
          <div className="flex flex-col items-center justify-center py-12 text-center bg-surface-container-low/20 border border-dashed border-outline-variant/30 rounded-xl">
            <Layers className="w-8 h-8 text-on-surface-variant/40 mb-3" />
            <p className="text-on-surface text-sm font-medium">No Active Positions</p>
            <p className="text-on-surface-variant/50 text-xs mt-1 font-mono">Agent will buy when scores meet criteria.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="obsidian-card rounded-xl overflow-hidden flex flex-col justify-between h-full">
      <div>
        <div className="px-5 py-4 border-b border-outline-variant/10 bg-surface-container-low/20">
          <div className="flex items-center justify-between">
            <p className="text-on-surface-variant font-mono text-[10px] uppercase tracking-wider font-semibold">Active Positions</p>
            <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {positions.length} active
            </span>
          </div>
        </div>

        <div className="divide-y divide-outline-variant/10">
          {positions.map((pos) => {
            const pnlPct   = pos.entryPrice > 0 ? ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100 : 0;
            const posValue = pos.amount * pos.currentPrice;
            const positive = pnlPct >= 0;

            return (
              <div key={pos.address} className="p-5 hover:bg-surface-container-low/20 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <span className="text-primary text-[11px] font-mono font-extrabold uppercase">
                        {pos.token.slice(0, 3)}
                      </span>
                    </div>
                    <div>
                      <p className="text-on-surface text-sm font-display font-bold tracking-tight">{pos.token}</p>
                      <a
                        href={`${EXPLORER_ADDR}${pos.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-on-surface-variant/60 text-[10px] font-mono hover:text-primary transition-colors flex items-center gap-0.5 mt-0.5"
                      >
                        {truncateHash(pos.address, 6)}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-on-surface text-sm font-mono font-bold">{formatMoney(posValue)}</p>
                    <span className={cn(
                      'inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-bold mt-1 border',
                      positive
                        ? 'bg-secondary/10 text-secondary border-secondary/20'
                        : 'bg-error/10 text-error border-error/20'
                    )}>
                      {positive ? '+' : ''}{pnlPct.toFixed(2)}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-surface-container-lowest/50 p-2.5 rounded-lg border border-outline-variant/10 text-[11px]">
                  <div>
                    <p className="text-on-surface-variant/40 mb-0.5 font-mono font-semibold uppercase text-[9px] tracking-wider">Amount</p>
                    <p className="text-on-surface/80 font-mono font-semibold">{pos.amount.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant/40 mb-0.5 font-mono font-semibold uppercase text-[9px] tracking-wider">Entry</p>
                    <p className="text-on-surface/80 font-mono font-semibold">{formatMoney(pos.entryPrice)}</p>
                  </div>
                  <div>
                    <p className="text-on-surface-variant/40 mb-0.5 font-mono font-semibold uppercase text-[9px] tracking-wider">Age</p>
                    <p className="text-on-surface/80 font-mono font-semibold">{formatAge(pos.timestamp)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
