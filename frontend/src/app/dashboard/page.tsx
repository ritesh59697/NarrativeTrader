'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Navbar } from '@/components/navbar';
import { formatTime, sanitizeReasoning, truncateHash, CycleLog, PortfolioData } from '@/lib/utils';

const POLL_MS  = 15_000;
const EXPLORER = 'https://testnet.bscscan.com/tx/';

/* ─────────────────────────────────────────────────────────── Helpers ── */
function fmt$(v: number | null | undefined) {
  if (v == null || !isFinite(v)) return '$—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(3)}M`;
  if (v >= 1_000)     return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(2)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDecision(raw: any): 'BUY' | 'HOLD' | 'FAILED' {
  if (!raw) return 'HOLD';
  const d = String(typeof raw === 'object' ? (raw.action ?? '') : raw).toUpperCase();
  if (d === 'BUY')    return 'BUY';
  if (d === 'FAILED') return 'FAILED';
  return 'HOLD';
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeScore(c: any): number | null {
  if (typeof c.score === 'number' && isFinite(c.score)) return c.score;
  const d = c.decision;
  if (d && typeof d === 'object' && typeof d.score === 'number') return d.score;
  return null;
}

/* ─────────────────────────────────────────────────────── Sector calc ── */
const FALLBACK_SECTORS = [
  { name: 'AI Agent Ecosystem',     pct: 42.5 },
  { name: 'Modular Infrastructure', pct: 21.0 },
  { name: 'DeFi Liquidity',         pct: 15.8 },
];

function computeSectors(cycles: CycleLog[]) {
  const counts: Record<string, number> = {};
  cycles.forEach(c => {
    const name = c.narrativeName?.trim();
    if (name && name.toLowerCase() !== 'unknown') counts[name] = (counts[name] ?? 0) + 1;
  });
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (total === 0) return FALLBACK_SECTORS;
  return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 4).map(([name, n]) => ({
    name, pct: +((n / total) * 100).toFixed(1),
  }));
}

/* ─────────────────────────────────────────────────────────── Icons ── */
const IC = {
  TrendUp: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  Loop:    () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Dash:    () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Wallet:  () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  History: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Config:  () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
  Search:  () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Pie:     () => <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
  List:    () => <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>,
  Renew:   () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Bell:    () => <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  Term:    () => <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Speed:   () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
  Mem:     () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /></svg>,
  Ext:     () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
};

/* ─────────────────────────────────────────────── Elapsed updater ── */
function useElapsed(lastUpdated: number) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!lastUpdated) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - lastUpdated) / 1000)), 1000);
    return () => clearInterval(t);
  }, [lastUpdated]);
  return elapsed;
}

/* ═══════════════════════════════════════════════════════ Dashboard ══ */
export default function Dashboard() {
  const [cycles,    setCycles]    = useState<CycleLog[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [cr, pr] = await Promise.all([
        fetch('/api/cycles',    { cache: 'no-store' }),
        fetch('/api/portfolio', { cache: 'no-store' }),
      ]);
      if (cr.ok) { const d = await cr.json(); if (Array.isArray(d)) setCycles(d); }
      if (pr.ok) { const d = await pr.json(); if (d && !d.error)    setPortfolio(d); }
      setLastUpdated(Date.now());
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchData]);

  const elapsed  = useElapsed(lastUpdated);
  const val      = portfolio?.currentValue ?? 100;
  const pnl      = val - 100;
  const pnlPct   = ((val - 100) / 100) * 100;
  const sectors  = computeSectors(cycles);
  const logs     = [...cycles].reverse().slice(0, 12).map((c, i) => ({
    key:      `${c.timestamp}-${i}`,
    time:     formatTime(c.timestamp),
    decision: normalizeDecision(c.decision),
    name:     (typeof c.narrativeName === 'string' && c.narrativeName.trim()) ? c.narrativeName.trim() : '—',
    score:    normalizeScore(c),
    reason:   sanitizeReasoning(c.reasoning ?? ''),
    txHash:   c.trade?.txHash ?? null,
  }));

  const chartBars = (() => {
    const last8 = [...cycles].slice(-8);
    if (last8.length === 0) return [40, 35, 55, 45, 70, 65, 85, 100].map((h, i) => ({ h, i }));
    return last8.map((c, i) => ({ h: Math.max(10, ((normalizeScore(c) ?? 5) / 10) * 100), i }));
  })();

  /* badge styles */
  const badge = {
    BUY:    { bg: 'rgba(255,45,120,0.10)',  color: 'var(--color-primary-fixed)', border: 'rgba(255,224,236,0.20)' },
    HOLD:   { bg: 'rgba(0,255,204,0.10)',   color: 'var(--color-secondary)',     border: 'rgba(0,255,204,0.20)'   },
    FAILED: { bg: 'rgba(255,68,68,0.10)',   color: 'var(--color-error)',         border: 'rgba(255,68,68,0.20)'   },
  };

  return (
    <div
      className="bg-surface-container-lowest text-on-background"
      style={{ minHeight: '100vh', fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
    >
      <Navbar />

      {/* below fixed navbar (80px) */}
      <div style={{ paddingTop: 80 }}>

        {/* ── Status bar (Terminal header) ── */}
        <div
          className="h-14 border-b flex items-center justify-between px-8"
          style={{ background: 'rgba(10,10,18,0.60)', borderColor: 'rgba(48,40,64,0.10)' }}
        >
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full animate-dot" style={{ background: 'var(--color-primary-fixed)' }} />
              <span
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-primary-fixed)', fontFamily: 'var(--font-space-grotesk)' }}
              >
                Mainnet-Alpha
              </span>
            </div>
            <div className="flex items-center gap-4" style={{ color: 'rgba(160,152,176,0.60)' }}>
              <div className="flex items-center gap-2">
                <IC.Speed />
                <span className="text-[10px]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>12ms LATENCY</span>
              </div>
              <div className="flex items-center gap-2">
                <IC.Mem />
                <span className="text-[10px] uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>Llama-3.3-70b</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div
              className="hidden sm:flex items-center rounded px-4 py-1 gap-3 w-48"
              style={{ background: 'rgba(17,17,24,0.50)', border: '1px solid rgba(48,40,64,0.10)' }}
            >
              <span style={{ color: 'rgba(160,152,176,0.60)' }}><IC.Search /></span>
              <input
                className="bg-transparent border-none p-0 focus:ring-0 text-[10px] w-full"
                placeholder="Quick Filter..."
                style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-space-grotesk)', outline: 'none' }}
              />
            </div>
            <div className="flex gap-4" style={{ color: 'rgba(160,152,176,0.60)' }}>
              <IC.Bell /><IC.Term />
            </div>
            {elapsed > 0 && (
              <span className="text-[10px]" style={{ color: 'rgba(160,152,176,0.40)', fontFamily: 'var(--font-space-grotesk)' }}>
                Updated {elapsed}s ago
              </span>
            )}
          </div>
        </div>

        {/* ── Main flex: Sidebar + Content ── */}
        <div className="flex flex-col lg:flex-row">

          {/* Sidebar */}
          <aside
            className="w-full lg:w-64 p-6 space-y-8 flex-shrink-0"
            style={{ borderRight: '1px solid rgba(48,40,64,0.10)' }}
          >
            <div className="space-y-1">
              {[
                { icon: <IC.Dash />,    label: 'Dashboard',    active: true  },
                { icon: <IC.Wallet />,  label: 'Positions',    active: false },
                { icon: <IC.History />, label: 'Trade History', active: false },
                { icon: <IC.Config />,  label: 'Agent Config',  active: false },
              ].map(({ icon, label, active }) => (
                <a
                  key={label}
                  href="#"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                  style={{
                    background:     active ? 'rgba(255,224,236,0.10)' : 'transparent',
                    color:          active ? 'var(--color-primary-fixed)' : 'var(--color-on-surface-variant)',
                    border:         active ? '1px solid rgba(255,224,236,0.20)' : '1px solid transparent',
                    fontFamily:     'var(--font-space-grotesk)',
                    fontSize:       11,
                    fontWeight:     700,
                    letterSpacing:  '0.05em',
                    textDecoration: 'none',
                  }}
                >
                  {icon}
                  {label.toUpperCase()}
                </a>
              ))}
            </div>

            <div className="space-y-4">
              <span
                className="text-[10px] font-bold tracking-widest uppercase block px-4"
                style={{ color: 'rgba(160,152,176,0.40)', fontFamily: 'var(--font-space-grotesk)' }}
              >
                Internal Health
              </span>
              <div className="px-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                    <span style={{ color: 'var(--color-on-surface-variant)' }}>LPU</span>
                    <span style={{ color: 'var(--color-primary-fixed)' }}>84%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container)' }}>
                    <div className="h-full rounded-full w-[84%]" style={{ background: 'var(--color-primary-fixed)' }} />
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Content area */}
          <main className="flex-1 p-8" style={{ background: 'rgba(0,0,0,0.10)' }}>
            <div className="max-w-[1400px] mx-auto space-y-8">

              {/* ── Row 1: TVL + Engine Status ── */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* TVL */}
                <div className="xl:col-span-8 obsidian-card p-8 rounded-2xl relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-space-grotesk)' }}
                      >
                        Total Value Locked (Institutional)
                      </span>
                      <h2
                        className="text-[48px] mt-2"
                        style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-sora)', fontWeight: 700 }}
                      >
                        {(() => {
                          const whole = Math.floor(val).toLocaleString('en-US');
                          const dec   = (val % 1).toFixed(2).slice(1);
                          return <>${whole}<span style={{ color: 'rgba(232,224,240,0.40)', fontSize: 28 }}>{dec}</span></>;
                        })()}
                      </h2>
                      <div
                        className="flex items-center gap-2 mt-2 text-[13px]"
                        style={{ color: pnl >= 0 ? 'var(--color-primary-fixed)' : 'var(--color-error)', fontFamily: 'var(--font-space-grotesk)' }}
                      >
                        <IC.TrendUp />
                        {pnl >= 0 ? '+' : ''}{fmt$(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}% 24h)
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-2 py-1 text-[10px] font-bold rounded" style={{ background: 'var(--color-primary-fixed)', color: 'var(--color-on-primary-fixed)', fontFamily: 'var(--font-space-grotesk)' }}>1H</button>
                      <button className="px-2 py-1 text-[10px] font-bold rounded" style={{ background: 'var(--color-surface-container)', color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-space-grotesk)' }}>1D</button>
                    </div>
                  </div>

                  {/* Bar chart */}
                  <div className="h-24 flex items-end gap-1.5 opacity-30 group-hover:opacity-60 transition-opacity">
                    {chartBars.map((bar, idx) => (
                      <div
                        key={bar.i}
                        className="flex-1 rounded-t transition-all duration-300"
                        style={{
                          height:     `${bar.h}%`,
                          background: `rgba(255,224,236,${0.20 + (idx / chartBars.length) * 0.80})`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Engine Status */}
                <div className="xl:col-span-4 obsidian-card p-8 rounded-2xl flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <span
                        className="text-[10px] font-bold uppercase tracking-widest"
                        style={{ color: 'var(--color-on-surface-variant)', fontFamily: 'var(--font-space-grotesk)' }}
                      >
                        Engine Status
                      </span>
                      <span style={{ color: 'var(--color-primary-fixed)' }}><IC.Renew /></span>
                    </div>
                    <div
                      className="text-[36px] mb-2"
                      style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-sora)', fontWeight: 600 }}
                    >
                      {cycles.length.toLocaleString()}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider mb-6" style={{ color: 'var(--color-on-surface-variant)' }}>
                      Cycles Run Today
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        <span style={{ color: 'var(--color-on-surface-variant)' }}>Sentiment Accuracy</span>
                        <span style={{ color: 'var(--color-secondary)' }}>99.2%</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container)' }}>
                        <div className="h-full rounded-full w-[99%]" style={{ background: 'var(--color-secondary)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Row 2: Logs + Sector Allocation ── */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Live Narrative Logs */}
                <div
                  className="xl:col-span-7 obsidian-card rounded-2xl flex flex-col overflow-hidden"
                  style={{ height: 500 }}
                >
                  <div
                    className="px-6 py-4 border-b flex justify-between items-center flex-shrink-0"
                    style={{ borderColor: 'rgba(48,40,64,0.10)', background: 'rgba(20,20,34,0.30)' }}
                  >
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--color-primary-fixed)' }}><IC.List /></span>
                      <span
                        className="text-[11px] font-bold uppercase tracking-widest"
                        style={{ fontFamily: 'var(--font-space-grotesk)' }}
                      >
                        Live Narrative Logs
                      </span>
                    </div>
                    <span
                      className="px-2 py-0.5 text-[9px] font-bold rounded"
                      style={{
                        background: 'rgba(255,45,120,0.10)',
                        color:      'var(--color-primary-fixed)',
                        border:     '1px solid rgba(255,224,236,0.20)',
                        fontFamily: 'var(--font-space-grotesk)',
                        letterSpacing: '0.05em',
                      }}
                    >
                      LIVE
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {logs.length === 0 && (
                      <div className="flex items-center justify-center h-full">
                        <p style={{ color: 'var(--color-on-surface-variant)', fontSize: 12 }}>No cycles recorded yet.</p>
                      </div>
                    )}
                    {logs.map(log => (
                      <div
                        key={log.key}
                        className="p-4 rounded-lg"
                        style={{ background: 'rgba(17,17,24,0.30)', border: '1px solid rgba(48,40,64,0.05)' }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-3">
                            <span
                              className="text-[10px]"
                              style={{ color: 'rgba(160,152,176,0.40)', fontFamily: 'var(--font-space-grotesk)' }}
                            >
                              {log.time}
                            </span>
                            <span
                              className="px-2 py-0.5 text-[10px] font-bold"
                              style={{
                                background: badge[log.decision].bg,
                                color:      badge[log.decision].color,
                                border:     `1px solid ${badge[log.decision].border}`,
                                fontFamily: 'var(--font-space-grotesk)',
                              }}
                            >
                              {log.decision}
                            </span>
                            <span className="font-bold text-[13px]" style={{ color: 'var(--color-on-surface)' }}>
                              {log.name}
                            </span>
                          </div>
                          <span
                            className="text-[13px] flex-shrink-0"
                            style={{
                              fontFamily: 'var(--font-space-grotesk)',
                              color: log.decision === 'BUY' ? 'var(--color-primary-fixed)' : 'var(--color-on-surface-variant)',
                            }}
                          >
                            {log.score !== null ? `${log.score}/10` : '—'}
                          </span>
                        </div>
                        {log.reason && (
                          <p
                            className="text-[12px] leading-relaxed"
                            style={{ color: 'var(--color-on-surface-variant)' }}
                          >
                            {log.reason}
                          </p>
                        )}
                        {log.txHash && (
                          <a
                            href={`${EXPLORER}${log.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 mt-1.5 text-[10px] hover:underline"
                            style={{ color: 'var(--color-primary-fixed)', fontFamily: 'var(--font-space-grotesk)' }}
                          >
                            Tx: {truncateHash(log.txHash)}
                            <IC.Ext />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sector Allocation */}
                <div
                  className="xl:col-span-5 obsidian-card rounded-2xl p-8 flex flex-col"
                  style={{ height: 500 }}
                >
                  <div className="flex justify-between items-center mb-8">
                    <span
                      className="text-[11px] font-bold uppercase tracking-widest"
                      style={{ fontFamily: 'var(--font-space-grotesk)' }}
                    >
                      Sector Allocation
                    </span>
                    <span style={{ color: 'var(--color-on-surface-variant)' }}><IC.Pie /></span>
                  </div>

                  <div className="flex-1 space-y-6 overflow-y-auto pr-2">
                    {sectors.map(({ name, pct }, i) => (
                      <div key={name} className="space-y-2">
                        <div className="flex justify-between items-center text-[12px]">
                          <span style={{ color: 'var(--color-on-surface)' }}>{name}</span>
                          <span
                            style={{
                              fontFamily: 'var(--font-space-grotesk)',
                              color: i === 0 ? 'var(--color-primary-fixed)' : 'var(--color-on-surface)',
                            }}
                          >
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-container)' }}>
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width:      `${pct}%`,
                              background: i === 0 ? 'var(--color-primary-fixed)' : 'var(--color-on-surface)',
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendation */}
                  <div
                    className="mt-8 p-4 rounded-xl"
                    style={{ background: 'rgba(255,45,120,0.05)', border: '1px solid rgba(255,224,236,0.10)' }}
                  >
                    <p className="text-[11px] leading-normal" style={{ color: 'var(--color-on-surface-variant)' }}>
                      <span
                        className="font-bold uppercase tracking-wider block mb-1"
                        style={{ color: 'var(--color-primary-fixed)', fontFamily: 'var(--font-space-grotesk)' }}
                      >
                        Recommendation:
                      </span>
                      {sectors[0]
                        ? `Concentration in ${sectors[0].name} is high. Consider rebalancing 5% into ${sectors[1]?.name ?? 'Modular Infrastructure'}.`
                        : 'Concentration in AI narrative is high. Consider rebalancing 5% into Modular Infrastructure.'
                      }
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </main>
        </div>

        {/* ── Footer ── */}
        <footer
          className="border-t py-16 px-8"
          style={{ background: 'var(--color-surface-container-lowest)', borderColor: 'rgba(48,40,64,0.10)' }}
        >
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-fixed)' }}>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--color-on-primary-fixed)' }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                </div>
                <span className="font-bold tracking-tighter uppercase text-[16px]" style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-sora)' }}>Narrative Trader</span>
              </div>
              <p className="text-[12px] leading-relaxed max-w-xs" style={{ color: 'var(--color-on-surface-variant)' }}>
                Next-generation institutional trading infrastructure powered by advanced Llama-3 inference and narrative-aware liquidity routing.
              </p>
            </div>
            {/* Platform */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-space-grotesk)' }}>Platform</h4>
              <nav className="flex flex-col gap-3">
                {['Terminal', 'Liquidity Hubs', 'Agent SDK', 'Node Program'].map(item => (
                  <a key={item} href="#" className="text-[12px] transition-colors" style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none' }}>{item}</a>
                ))}
              </nav>
            </div>
            {/* Governance */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-space-grotesk)' }}>Governance</h4>
              <nav className="flex flex-col gap-3">
                {['Documentation', 'Whitepaper', 'Risk Protocol', 'Privacy Policy'].map(item => (
                  <a key={item} href="#" className="text-[12px] transition-colors" style={{ color: 'var(--color-on-surface-variant)', textDecoration: 'none' }}>{item}</a>
                ))}
              </nav>
            </div>
            {/* System Health */}
            <div className="space-y-6">
              <h4 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-on-surface)', fontFamily: 'var(--font-space-grotesk)' }}>System Health</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full animate-dot" style={{ background: 'var(--color-primary-fixed)' }} />
                  <span className="text-[11px] font-bold" style={{ color: 'var(--color-on-surface)' }}>OPERATIONAL</span>
                </div>
                <div className="text-[10px] leading-tight" style={{ color: 'rgba(160,152,176,0.60)', fontFamily: 'var(--font-space-grotesk)' }}>
                  UPTIME: 14d 22h 11m 4s<br />
                  ACTIVE NODES: 1,024<br />
                  LATENCY: 12ms AVG
                </div>
              </div>
            </div>
          </div>
          <div
            className="max-w-[1400px] mx-auto mt-16 pt-8 flex flex-col md:flex-row justify-between gap-4"
            style={{ borderTop: '1px solid rgba(48,40,64,0.10)' }}
          >
            <span className="text-[10px]" style={{ color: 'rgba(160,152,176,0.40)', fontFamily: 'var(--font-space-grotesk)' }}>
              © 2024 NARRATIVE TRADER FOUNDATION. V1.0.4-BETA
            </span>
            <span className="text-[10px] uppercase" style={{ color: 'rgba(160,152,176,0.40)', fontFamily: 'var(--font-space-grotesk)' }}>
              ENCRYPTED END-TO-END CONNECTION
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
