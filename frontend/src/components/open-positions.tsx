'use client';

import { ExternalLink, Package } from 'lucide-react';
import { cn, formatMoney, formatAge, truncateHash, OpenPosition } from '@/lib/utils';

const EXPLORER_ADDR = 'https://testnet.bscscan.com/address/';

interface OpenPositionsProps {
  positions: OpenPosition[];
}

export function OpenPositions({ positions }: OpenPositionsProps) {
  if (positions.length === 0) {
    return (
      <div className="rounded-xl border border-arc-700 bg-arc-800 p-6 shadow-card">
        <p className="text-arc-400 text-xs uppercase tracking-widest font-medium mb-4">Open Positions</p>
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <Package className="w-6 h-6 text-arc-600 mb-2" />
          <p className="text-arc-500 text-sm">No open positions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-arc-700 bg-arc-800 shadow-card overflow-hidden">
      <div className="px-4 py-3 border-b border-arc-700">
        <div className="flex items-center justify-between">
          <p className="text-arc-400 text-xs uppercase tracking-widest font-medium">Open Positions</p>
          <span className="bg-accent/15 text-accent border border-accent/20 text-[10px] font-mono px-2 py-0.5 rounded-full">
            {positions.length} active
          </span>
        </div>
      </div>

      <div className="divide-y divide-arc-700">
        {positions.map((pos) => {
          const pnlPct   = pos.entryPrice > 0 ? ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100 : 0;
          const pnlValue = (pos.currentPrice - pos.entryPrice) * pos.amount;
          const posValue = pos.amount * pos.currentPrice;
          const positive = pnlPct >= 0;

          return (
            <div key={pos.address} className="px-4 py-3 hover:bg-arc-750 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center">
                    <span className="text-accent text-[10px] font-mono font-bold">
                      {pos.token.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="text-arc-100 text-sm font-semibold">{pos.token}</p>
                    <a
                      href={`${EXPLORER_ADDR}${pos.address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-arc-500 text-[10px] font-mono hover:text-accent transition-colors flex items-center gap-0.5"
                    >
                      {truncateHash(pos.address, 8)}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-arc-100 text-sm font-mono font-medium">{formatMoney(posValue)}</p>
                  <p className={cn('text-[11px] font-mono', positive ? 'text-buy' : 'text-fail')}>
                    {positive ? '+' : ''}{pnlPct.toFixed(2)}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div>
                  <p className="text-arc-500 mb-0.5">Amount</p>
                  <p className="text-arc-300 font-mono">{pos.amount.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-arc-500 mb-0.5">Entry</p>
                  <p className="text-arc-300 font-mono">{formatMoney(pos.entryPrice)}</p>
                </div>
                <div>
                  <p className="text-arc-500 mb-0.5">Opened</p>
                  <p className="text-arc-300 font-mono">{formatAge(pos.timestamp)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
