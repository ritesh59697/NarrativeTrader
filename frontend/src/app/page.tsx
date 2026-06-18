'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Sidebar }        from '@/components/sidebar';
import { Header }         from '@/components/header';
import { PortfolioCard }  from '@/components/portfolio-card';
import { StatsGrid }      from '@/components/stats-grid';
import { CyclesFeed }     from '@/components/cycles-feed';
import { OpenPositions }  from '@/components/open-positions';
import { AgentTerminal }  from '@/components/agent-terminal';
import { CycleLog, PortfolioData } from '@/lib/utils';

const POLL_MS = 15_000;

export default function Dashboard() {
  const [cycles,      setCycles]      = useState<CycleLog[]>([]);
  const [portfolio,   setPortfolio]   = useState<PortfolioData | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [cyclesRes, portfolioRes] = await Promise.all([
        fetch('/api/cycles',    { cache: 'no-store' }),
        fetch('/api/portfolio', { cache: 'no-store' }),
      ]);

      if (cyclesRes.ok) {
        const data = await cyclesRes.json();
        if (Array.isArray(data)) setCycles(data);
      }
      if (portfolioRes.ok) {
        const data = await portfolioRes.json();
        if (data && !data.error) setPortfolio(data);
      }
      setLastUpdated(Date.now());
    } catch (err) {
      console.error('[Dashboard] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchData]);

  return (
    <div className="flex h-screen overflow-hidden bg-arc-900">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          cycles={cycles}
          portfolio={portfolio}
          isLoading={isLoading}
          lastUpdatedAt={lastUpdated}
          onRefresh={fetchData}
        />

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 py-5 space-y-5">

          {/* Stats row */}
          <StatsGrid cycles={cycles} portfolio={portfolio} />

          {/* Portfolio + Open Positions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <PortfolioCard portfolio={portfolio} cycles={cycles} />
            <OpenPositions positions={portfolio?.openPositions ?? []} />
          </div>

          {/* Cycles Feed */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-arc-300 text-xs uppercase tracking-widest font-medium">Recent Cycles</h2>
              <span className="text-arc-500 text-[11px] font-mono">{cycles.length} total</span>
            </div>
            <CyclesFeed cycles={cycles} />
          </section>

          {/* Agent Terminal */}
          <section>
            <div className="mb-3">
              <h2 className="text-arc-300 text-xs uppercase tracking-widest font-medium">Agent Log</h2>
            </div>
            <AgentTerminal cycles={cycles} />
          </section>

          {/* Footer */}
          <footer className="flex items-center justify-between pt-2 pb-4 border-t border-arc-700">
            <p className="text-arc-600 text-[11px] font-mono">
              NarrativeTrader v1.0 · BNB Hack 2026 · BSC Testnet
            </p>
            <a
              href="https://github.com/ritesh59697/NarrativeTrader"
              target="_blank"
              rel="noreferrer"
              className="text-arc-500 text-[11px] hover:text-accent transition-colors font-mono"
            >
              GitHub ↗
            </a>
          </footer>
        </main>
      </div>
    </div>
  );
}
