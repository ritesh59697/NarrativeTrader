'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Navbar } from '@/components/navbar';

/* ─── Color palette (all hardcoded — no CSS vars) ──────────────────────── */
const C = {
  bg: '#0a0a12',
  surface: '#0f0f1a',
  containerLow: '#111118',
  container: '#141422',
  containerHigh: '#1e1e30',
  containerHighest: '#28283e',
  onSurface: '#e8e0f0',
  onSurfaceVar: '#a098b0',
  primary: '#ff2d78',
  primaryFixed: '#ffe0ec',
  primaryFixedDim: '#ff80aa',
  onPrimaryFixed: '#3d0020',
  secondary: '#00ffcc',
  tertiary: '#ffe04a',
  tertiaryFixed: '#fff0c0',
  outline: '#5a5068',
  outlineVar: '#302840',
  error: '#ff4444',
};

/* ─── Fonts ─────────────────────────────────────────────────────────────── */
const F = {
  display: "'Sora', sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'Space Grotesk', monospace",
};

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface CycleLog {
  timestamp: string;
  cycleNumber: number;
  narrativeName: string;
  score: number;
  decision: string | { action?: string; score?: number };
  reasoning: string;
  llmUsed: string;
  trade: { txHash: string; positionSizeUSDC: number; token: string } | null;
}
interface OpenPosition {
  token: string;
  address: string;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  timestamp: string;
}

interface TradeRecord {
  timestamp: string;
  type: 'BUY' | 'SELL';
  token: string;
  address: string;
  amount: number;
  price: number;
  valueUSDC: number;
}

interface PortfolioData {
  currentValue: number;
  peakValue: number;
  cashUSDC: number;
  isPaused: boolean;
  openPositions?: OpenPosition[];
  tradesHistory?: TradeRecord[];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function fmt$(v: number | null | undefined) {
  if (v == null || !isFinite(v)) return '$—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(3)}M`;
  if (v >= 1_000) return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(2)}`;
}
function fmtTime(ts: string) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDecision(raw: any): 'BUY' | 'HOLD' | 'FAILED' {
  if (!raw) return 'HOLD';
  const d = String(typeof raw === 'object' ? (raw.action ?? '') : raw).toUpperCase();
  if (d === 'BUY') return 'BUY';
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
function sanitize(s: string) {
  if (!s) return '';
  if (s.startsWith('http') || s.includes('generateContent')) return 'LLM scoring failed.';
  return s;
}
function getLLM(cycles: CycleLog[]) {
  const c = [...cycles].reverse().find(x => x.llmUsed && x.llmUsed !== 'failed');
  if (c?.llmUsed === 'gemini') return { name: 'Gemini', sub: 'Flash · 2.0' };
  return { name: 'Groq', sub: 'Llama-3.3-70b · Flash' };
}
function computeSectors(cycles: CycleLog[]) {
  const counts: Record<string, number> = {};
  cycles.forEach(c => {
    const name = c.narrativeName?.trim();
    if (name && name.toLowerCase() !== 'unknown') counts[name] = (counts[name] ?? 0) + 1;
  });
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  const FALLBACK = [
    { name: 'AI Agent Ecosystem', pct: 42.5 },
    { name: 'Modular Infrastructure', pct: 21.0 },
    { name: 'DeFi Liquidity', pct: 15.8 },
  ];
  if (total === 0) return FALLBACK;
  return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 4).map(([name, n]) => ({
    name, pct: +((n / total) * 100).toFixed(1),
  }));
}

/* ─── Icons ──────────────────────────────────────────────────────────────── */
const Icon = {
  QueryStats: ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  TrendUp: ({ color = 'currentColor' }: { color?: string }) => (
    <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Loop: ({ color = 'currentColor' }: { color?: string }) => (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Psych: ({ color = 'currentColor' }: { color?: string }) => (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  Dashboard: () => (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  Wallet: () => (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  History: () => (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Settings: () => (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  Search: () => (
    <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  PieChart: () => (
    <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  ),
  ListAlt: () => (
    <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  ),
  AutoRenew: () => (
    <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Bell: () => (
    <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Terminal: () => (
    <svg width={18} height={18} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Speed: () => (
    <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Memory: () => (
    <svg width={16} height={16} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
    </svg>
  ),
  Share: () => (
    <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
  Code: () => (
    <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  ExtLink: () => (
    <svg width={11} height={11} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════ PAGE ══ */
const POLL_MS = 15_000;
const EXPLORER = 'https://testnet.bscscan.com/tx/';

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '2px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {copied ? (
        <span style={{ color: C.secondary, fontSize: 9, fontFamily: F.mono }}>COPIED</span>
      ) : (
        <svg width={12} height={12} fill="none" viewBox="0 0 24 24" stroke="rgba(160,152,176,0.60)" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
        </svg>
      )}
    </button>
  );
};

export default function Page() {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Positions' | 'Trade History' | 'Agent Config'>('Dashboard');
  const [cycles, setCycles] = useState<CycleLog[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [config, setConfig] = useState<{
    network: string;
    rpcUrl: string;
    targetPortfolioValue: number;
    groqStatus: boolean;
    geminiStatus: boolean;
    cmcStatus: boolean;
  } | null>(null);
  const [triggerLog, setTriggerLog] = useState<string[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const [rebalanceStep, setRebalanceStep] = useState<number>(-1);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [filterQuery, setFilterQuery] = useState('');
  const [latency, setLatency] = useState(12);
  const [lpu, setLpu] = useState(84);
  const [uptime, setUptime] = useState('');
  const [tilt, setTilt] = useState({ x: 8, y: -5 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normalizedX = (x / rect.width) - 0.5;
    const normalizedY = (y / rect.height) - 0.5;
    setTilt({
      x: 8 - (normalizedY * 18),
      y: -5 + (normalizedX * 18)
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 8, y: -5 });
  };

  useEffect(() => {
    const latInterval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 6) + 9);
    }, 4000);

    const lpuInterval = setInterval(() => {
      setLpu(Math.floor(Math.random() * 5) + 81);
    }, 6000);

    const startDate = new Date('2026-06-05T00:00:00Z').getTime();
    const updateUptime = () => {
      const diff = Date.now() - startDate;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setUptime(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };
    updateUptime();
    const uptimeInterval = setInterval(updateUptime, 1000);

    return () => {
      clearInterval(latInterval);
      clearInterval(lpuInterval);
      clearInterval(uptimeInterval);
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [cr, pr, cfr] = await Promise.all([
        fetch('/api/cycles', { cache: 'no-store' }),
        fetch('/api/portfolio', { cache: 'no-store' }),
        fetch('/api/config', { cache: 'no-store' }),
      ]);
      if (cr.ok) { const d = await cr.json(); if (Array.isArray(d)) setCycles(d); }
      if (pr.ok) { const d = await pr.json(); if (d && !d.error) setPortfolio(d); }
      if (cfr.ok) { const d = await cfr.json(); setConfig(d); }
    } catch { /* silent */ }
  }, []);

  const togglePause = async (newVal: boolean) => {
    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaused: newVal }),
      });
      if (res.ok) {
        const d = await res.json();
        setPortfolio(d);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const simulateCycleTrigger = () => {
    if (isTriggering) return;
    setIsTriggering(true);
    setRebalanceStep(0);
    setTriggerLog([
      `[${new Date().toLocaleTimeString()}] 🤖 [NarrativeTrader] Forced cycle trigger initialized...`,
    ]);

    setTimeout(() => {
      setRebalanceStep(1);
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 📊 Loading latest signals from CMC API...`]);
    }, 1200);
    setTimeout(() => {
      setRebalanceStep(2);
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🧠 Prompting active models for sentiment analysis...`]);
    }, 2400);
    setTimeout(() => {
      setRebalanceStep(3);
      const name = cycles[cycles.length - 1]?.narrativeName || 'AI Agent Ecosystem';
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🧠 LLM classification success. Narrative: ${name}.`]);
    }, 3600);
    setTimeout(() => {
      setRebalanceStep(4);
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🛡️ Auditing risk constraints & allocation boundaries...`]);
    }, 4800);
    setTimeout(() => {
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🛡️ Risk Check: Approved. All limits comply.`]);
    }, 5400);
    setTimeout(() => {
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Dry-run cycle complete. Action: HOLD.`]);
      setRebalanceStep(-1);
      setIsTriggering(false);
      fetchData();
    }, 6400);
  };


  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchData]);

  const llm = getLLM(cycles);
  const val = portfolio?.currentValue ?? 100;
  const initial = config?.targetPortfolioValue ?? 100;
  const pnl = val - initial;
  const pnlPct = initial > 0 ? (pnl / initial) * 100 : 0;
  const sectors = computeSectors(cycles);

  const logs = [...cycles]
    .reverse()
    .map((c, i) => ({
      key: `${c.timestamp}-${i}`,
      time: fmtTime(c.timestamp),
      decision: normalizeDecision(c.decision),
      name: (c.narrativeName?.trim()) || '—',
      score: normalizeScore(c),
      reasoning: sanitize(c.reasoning ?? ''),
      txHash: c.trade?.txHash ?? null,
    }))
    .filter(log => {
      const q = filterQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        log.name.toLowerCase().includes(q) ||
        log.decision.toLowerCase().includes(q) ||
        log.reasoning.toLowerCase().includes(q)
      );
    })
    .slice(0, 10);

  const chartBars = (() => {
    const last8 = [...cycles].slice(-8);
    if (!last8.length) return [40, 35, 55, 45, 70, 65, 85, 100].map((h, i) => ({ h, i }));
    return last8.map((c, i) => ({ h: Math.max(10, ((normalizeScore(c) ?? 5) / 10) * 100), i }));
  })();

  const decisionBadge: Record<string, { bg: string; color: string; border: string }> = {
    BUY: { bg: 'rgba(255,45,120,0.10)', color: C.primaryFixed, border: 'rgba(255,224,236,0.20)' },
    HOLD: { bg: 'rgba(0,255,204,0.10)', color: C.secondary, border: 'rgba(0,255,204,0.20)' },
    FAILED: { bg: 'rgba(255,68,68,0.10)', color: C.error, border: 'rgba(255,68,68,0.20)' },
  };

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.onSurface, fontFamily: F.body, overflowX: 'hidden' }}>

      <Navbar />

      <div style={{ paddingTop: 80 }}>
        {/* Grid background */}
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.4,
          backgroundImage: `linear-gradient(rgba(255,45,120,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,120,0.02) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }} />

        {/* ═══════════════════════════ HERO ═══════════════════════════ */}
        <section style={{
          minHeight: 870, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '0 24px', position: 'relative', zIndex: 1,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,45,120,0.06) 0%, transparent 70%)',
        }}>
          <div style={{ maxWidth: 1000, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

            {/* Badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '4px 16px', borderRadius: 999,
              background: 'rgba(255,45,120,0.10)',
              border: `1px solid rgba(255,224,236,0.20)`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.primaryFixed, flexShrink: 0 }} />
              <span style={{ color: C.primaryFixed, fontFamily: F.mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.20em' }}>
                Institutional Engine Active
              </span>
            </div>

            {/* Headline */}
            <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 'clamp(48px, 6vw, 84px)', lineHeight: 1.05, letterSpacing: '-0.02em', color: C.onSurface, margin: 0 }}>
              The Narrative Trader:<br />
              <span style={{
                backgroundImage: `linear-gradient(to right, ${C.primaryFixed}, rgba(255,224,236,0.35))`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                AI-Driven Alpha
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{ color: C.onSurfaceVar, fontSize: 18, lineHeight: 1.7, maxWidth: 640, margin: 0 }}>
              Execute with the precision of a high-frequency firm. Leverage real-time LLM narrative analysis to capture asymmetric market moves before they hit the tape.
            </p>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', paddingTop: 8 }}>
              <a href="#terminal" style={{
                background: C.primaryFixed, color: C.onPrimaryFixed,
                fontFamily: F.mono, fontSize: 13, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '16px 40px', borderRadius: 8, textDecoration: 'none',
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.02)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                Launch Dashboard
              </a>
              <a href="/docs" style={{
                background: C.containerHigh,
                border: `1px solid rgba(48,40,64,0.30)`,
                color: C.onSurface,
                fontFamily: F.mono, fontSize: 13, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                padding: '16px 40px', borderRadius: 8, textDecoration: 'none',
              }}>
                Read Documentation
              </a>
            </div>

            {/* ── Terminal preview card ── */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '1280px', marginTop: 48 }}>
              {/* glow */}
              <div style={{
                position: 'absolute', inset: -16,
                background: 'rgba(255,224,236,0.08)',
                filter: 'blur(80px)', pointerEvents: 'none',
              }} />

              <div
                ref={cardRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  background: 'rgba(14,14,15,0.70)',
                  backdropFilter: 'blur(40px)',
                  border: `1px solid rgba(48,40,64,0.30)`,
                  borderRadius: 16,
                  padding: 32,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  transform: `perspective(2000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transition: 'transform 0.1s ease-out, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
              >
                {/* Window chrome */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, paddingBottom: 24, borderBottom: '1px solid rgba(48,40,64,0.10)' }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,68,68,0.80)' }} />
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(0,255,204,0.80)' }} />
                    <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,224,236,0.80)' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(255,224,236,0.05)', border: `1px solid rgba(255,224,236,0.20)` }}>
                      <span style={{ color: C.primaryFixed, fontFamily: F.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em' }}>LIVE FEED</span>
                    </div>
                    <span style={{ color: 'rgba(160,152,176,0.60)', fontFamily: F.mono, fontSize: 11, letterSpacing: '0.15em' }}>NARRATIVETRADER TERMINAL V1.0</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
                  {/* Portfolio */}
                  <div style={{ background: 'rgba(17,17,24,0.40)', backdropFilter: 'blur(12px)', border: `1px solid rgba(48,40,64,0.20)`, borderRadius: 12, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <span style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Portfolio Valuation</span>
                      <Icon.TrendUp color={C.primaryFixed} />
                    </div>
                    <div style={{ color: C.onSurface, fontFamily: F.display, fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em' }}>{fmt$(val)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <span style={{ color: pnl >= 0 ? C.primaryFixed : C.error, fontFamily: F.mono, fontSize: 13 }}>
                        {pnl >= 0 ? '+' : ''}{fmt$(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
                      </span>
                      <div style={{ height: 1, flex: 1, background: `linear-gradient(to right, rgba(255,224,236,0.20), transparent)` }} />
                    </div>
                  </div>

                  {/* Cycles */}
                  <div style={{ background: 'rgba(17,17,24,0.40)', backdropFilter: 'blur(12px)', border: `1px solid rgba(48,40,64,0.20)`, borderRadius: 12, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <span style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cycles Run</span>
                      <Icon.Loop color={C.secondary} />
                    </div>
                    <div style={{ color: C.onSurface, fontFamily: F.display, fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em' }}>{cycles.length}</div>
                    <div style={{ display: 'flex', gap: 6, marginTop: 16 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          height: 6, flex: 1, borderRadius: 999,
                          background: i < 2 ? C.primaryFixed : (cycles.length > 20 ? C.primaryFixed : 'rgba(48,40,64,0.30)'),
                          boxShadow: i < 2 ? `0 0 8px rgba(255,224,236,0.5)` : 'none',
                        }} />
                      ))}
                    </div>
                  </div>

                  {/* LLM */}
                  <div style={{ background: 'rgba(17,17,24,0.40)', backdropFilter: 'blur(12px)', border: `1px solid rgba(48,40,64,0.20)`, borderRadius: 12, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <span style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>LLM Engine</span>
                      <Icon.Psych color={C.tertiaryFixed} />
                    </div>
                    <div style={{ color: C.onSurface, fontFamily: F.display, fontSize: 40, fontWeight: 600, letterSpacing: '-0.02em' }}>{llm.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <span style={{ color: 'rgba(160,152,176,0.70)', fontFamily: F.mono, fontSize: 13 }}>Llama-3.3-70b</span>
                      <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.outlineVar }} />
                      <span style={{ color: 'rgba(255,224,236,0.80)', fontFamily: F.mono, fontSize: 13 }}>Flash</span>
                    </div>
                  </div>
                </div>

                {/* Status bar */}
                <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(48,40,64,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                    <div style={{ display: 'flex' }}>
                      {['AI', 'TX'].map((label, i) => (
                        <div key={label} style={{
                          width: 32, height: 32, borderRadius: '50%',
                          border: `2px solid ${C.bg}`,
                          background: i === 0 ? C.container : 'rgba(255,224,236,0.20)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          marginLeft: i > 0 ? -8 : 0,
                          color: i === 0 ? C.onSurface : C.primaryFixed,
                          fontFamily: F.mono, fontSize: 10, fontWeight: 700,
                        }}>{label}</div>
                      ))}
                    </div>
                    <span style={{ color: 'rgba(160,152,176,0.50)', fontFamily: F.mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.15em' }}>System Status: Optimal</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primaryFixed, animation: 'pulse 1.4s ease-in-out infinite' }} />
                    <span style={{ color: C.primaryFixed, fontFamily: F.mono, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Connected to Testnet</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'rgba(160,152,176,0.40)', fontFamily: F.mono, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.30em' }}>Explore Terminal</span>
            <div style={{ width: 1, height: 48, background: 'linear-gradient(to bottom, rgba(255,224,236,0.40), transparent)' }} />
          </div>
        </section>

        {/* ═══════════════════════════ TERMINAL SECTION ═══════════════════════════ */}
        <section id="terminal" style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(48,40,64,0.10)', background: 'rgba(10,10,18,0.50)' }}>

          {/* Status bar */}
          <div style={{ height: 56, borderBottom: '1px solid rgba(48,40,64,0.10)', background: 'rgba(10,10,18,0.60)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.primaryFixed }} />
                <span style={{ color: C.primaryFixed, fontFamily: F.mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Testnet-Alpha</span>
              </div>
              <div style={{ display: 'flex', gap: 16, color: 'rgba(160,152,176,0.60)' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Icon.Speed /><span style={{ fontFamily: F.mono, fontSize: 10 }}>{latency}ms LATENCY</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Icon.Memory /><span style={{ fontFamily: F.mono, fontSize: 10, textTransform: 'uppercase' }}>Llama-3.3-70b</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(17,17,24,0.50)', border: '1px solid rgba(48,40,64,0.10)', borderRadius: 4, padding: '4px 16px', width: 192 }}>
                <span style={{ color: 'rgba(160,152,176,0.60)' }}><Icon.Search /></span>
                <input
                  value={filterQuery}
                  onChange={e => setFilterQuery(e.target.value)}
                  placeholder="Quick Filter..."
                  style={{ background: 'transparent', border: 'none', outline: 'none', color: C.onSurface, fontFamily: F.mono, fontSize: 10, width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 16, color: 'rgba(160,152,176,0.60)' }}>
                <Icon.Bell /><Icon.Terminal />
              </div>
            </div>
          </div>

          {/* Sidebar + Content */}
          <div style={{ display: 'flex' }}>

            {/* Sidebar */}
            <aside style={{ width: 256, flexShrink: 0, padding: 24, borderRight: '1px solid rgba(48,40,64,0.10)', display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { icon: <Icon.Dashboard />, label: 'Dashboard', tab: 'Dashboard' as const },
                  { icon: <Icon.Wallet />, label: 'Positions', tab: 'Positions' as const },
                  { icon: <Icon.History />, label: 'Trade History', tab: 'Trade History' as const },
                  { icon: <Icon.Settings />, label: 'Agent Config', tab: 'Agent Config' as const },
                ].map(({ icon, label, tab }) => {
                  const active = activeTab === tab;
                  return (
                    <button
                      key={label}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 8,
                        background: active ? 'rgba(255,224,236,0.10)' : 'transparent',
                        color: active ? C.primaryFixed : C.onSurfaceVar,
                        border: active ? `1px solid rgba(255,224,236,0.20)` : '1px solid transparent',
                        fontFamily: F.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                        textTransform: 'uppercase', textDecoration: 'none',
                        transition: 'all 0.15s',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                      }}
                    >
                      {icon}{label}
                    </button>
                  );
                })}
              </div>

              {/* Health */}
              <div>
                <span style={{ color: 'rgba(160,152,176,0.40)', fontFamily: F.mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', display: 'block', padding: '0 16px', marginBottom: 16 }}>Internal Health</span>
                <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontFamily: F.mono, fontSize: 10 }}>
                      <span style={{ color: C.onSurfaceVar }}>LPU</span>
                      <span style={{ color: C.primaryFixed, float: 'right' }}>{lpu}%</span>
                    </div>
                    <div style={{ height: 4, background: C.container, borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${lpu}%`, background: C.primaryFixed, borderRadius: 999 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 10 }}>
                      <span style={{ color: C.onSurfaceVar }}>AGENT STATUS</span>
                      <span style={{ color: portfolio?.isPaused ? C.error : C.secondary, float: 'right', fontWeight: 'bold' }}>
                        {portfolio?.isPaused ? 'PAUSED' : 'ACTIVE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>


            {/* Main content */}
            <main style={{ flex: 1, padding: 32, background: 'rgba(0,0,0,0.10)' }}>
              <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

                {activeTab === 'Dashboard' && (
                  <>
                    {/* Row 1: TVL + Engine */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>

                      {/* TVL */}
                      <div style={{ background: 'rgba(14,14,15,0.70)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 16, padding: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
                          <div>
                            <span style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Total Value Locked (Institutional)</span>
                            <h2 style={{ color: C.onSurface, fontFamily: F.display, fontWeight: 700, fontSize: 48, margin: '8px 0 0', letterSpacing: '-0.02em', lineHeight: 1 }}>
                              ${Math.floor(val).toLocaleString('en-US')}<span style={{ color: 'rgba(232,224,240,0.40)', fontSize: 28 }}>{(val % 1).toFixed(2).slice(1)}</span>
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, color: pnl >= 0 ? C.primaryFixed : C.error, fontFamily: F.mono, fontSize: 13 }}>
                              <Icon.TrendUp color={pnl >= 0 ? C.primaryFixed : C.error} />
                              {pnl >= 0 ? '+' : ''}{fmt$(pnl)} ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}% 24h)
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={{ padding: '4px 8px', background: C.primaryFixed, color: C.onPrimaryFixed, fontFamily: F.mono, fontSize: 10, fontWeight: 700, borderRadius: 4, border: 'none', cursor: 'pointer' }}>1H</button>
                            <button style={{ padding: '4px 8px', background: C.container, color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 10, fontWeight: 700, borderRadius: 4, border: 'none', cursor: 'pointer' }}>1D</button>
                          </div>
                        </div>
                        {/* Bar chart */}
                        <div style={{ height: 96, display: 'flex', alignItems: 'flex-end', gap: 6, opacity: 0.35 }}>
                          {chartBars.map((bar, idx) => (
                            <div key={bar.i} style={{
                              flex: 1, borderRadius: '2px 2px 0 0',
                              height: `${bar.h}%`,
                              background: `rgba(255,224,236,${0.20 + (idx / chartBars.length) * 0.80})`,
                            }} />
                          ))}
                        </div>
                      </div>

                      {/* Engine */}
                      <div style={{ background: 'rgba(14,14,15,0.70)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 16, padding: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                          <span style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Engine Status</span>
                          <span style={{ color: C.primaryFixed }}><Icon.AutoRenew /></span>
                        </div>
                        <div style={{ color: C.onSurface, fontFamily: F.display, fontSize: 36, fontWeight: 600, marginBottom: 8 }}>{cycles.length.toLocaleString()}</div>
                        <div style={{ color: C.onSurfaceVar, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>Cycles Run Today</div>
                        <div>
                          {(() => {
                            const accuracy = cycles.length > 0
                              ? (cycles.filter(c => {
                                const decision = normalizeDecision(c.decision);
                                return decision !== 'FAILED' && (c as any).status !== 'EXECUTION_FAILED';
                              }).length / cycles.length) * 100
                              : 100;
                            return (
                              <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: F.mono, fontSize: 10, textTransform: 'uppercase', marginBottom: 8 }}>
                                  <span style={{ color: C.onSurfaceVar }}>Sentiment Accuracy</span>
                                  <span style={{ color: C.secondary }}>{accuracy.toFixed(1)}%</span>
                                </div>
                                <div style={{ height: 6, background: C.container, borderRadius: 999, overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${accuracy}%`, background: C.secondary, borderRadius: 999 }} />
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Logs + Sectors */}
                    <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 24 }}>

                      {/* Live Logs */}
                      <div style={{ background: 'rgba(14,14,15,0.70)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 16, display: 'flex', flexDirection: 'column', height: 500, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(48,40,64,0.10)', background: 'rgba(20,20,34,0.30)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: C.primaryFixed }}><Icon.ListAlt /></span>
                            <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live Narrative Logs</span>
                          </div>
                          <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(255,45,120,0.10)', color: C.primaryFixed, border: `1px solid rgba(255,224,236,0.20)`, fontFamily: F.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em' }}>LIVE</span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {logs.length === 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: C.onSurfaceVar, fontSize: 12 }}>No cycles yet.</div>
                          )}
                          {logs.map(log => (
                            <div key={log.key} style={{ padding: 16, borderRadius: 8, background: 'rgba(17,17,24,0.30)', border: '1px solid rgba(48,40,64,0.05)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                  <span style={{ color: 'rgba(160,152,176,0.40)', fontFamily: F.mono, fontSize: 10 }}>{log.time}</span>
                                  <span style={{
                                    padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: F.mono,
                                    background: decisionBadge[log.decision]?.bg,
                                    color: decisionBadge[log.decision]?.color,
                                    border: `1px solid ${decisionBadge[log.decision]?.border}`,
                                  }}>{log.decision}</span>
                                  <span style={{ color: C.onSurface, fontSize: 13, fontWeight: 700 }}>{log.name}</span>
                                </div>
                                <span style={{ color: log.decision === 'BUY' ? C.primaryFixed : C.onSurfaceVar, fontFamily: F.mono, fontSize: 13, flexShrink: 0 }}>
                                  {log.score !== null ? `${log.score}/10` : '—'}
                                </span>
                              </div>
                              {log.reasoning && <p style={{ color: C.onSurfaceVar, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{log.reasoning}</p>}
                              {log.txHash && (
                                <a href={`${EXPLORER}${log.txHash}`} target="_blank" rel="noreferrer"
                                  style={{ color: C.primaryFixed, fontFamily: F.mono, fontSize: 10, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                                  Tx: {log.txHash.slice(0, 6)}…{log.txHash.slice(-4)}
                                  <Icon.ExtLink />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sector Allocation */}
                      <div style={{ background: 'rgba(14,14,15,0.70)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 16, padding: 32, height: 500, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                          <span style={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sector Allocation</span>
                          <span style={{ color: C.onSurfaceVar }}><Icon.PieChart /></span>
                        </div>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
                          {sectors.map(({ name, pct }, i) => (
                            <div key={name}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: C.onSurface, fontSize: 12 }}>{name}</span>
                                <span style={{ color: i === 0 ? C.primaryFixed : C.onSurface, fontFamily: F.mono, fontSize: 12 }}>{pct.toFixed(1)}%</span>
                              </div>
                              <div style={{ height: 6, background: C.container, borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${pct}%`, background: i === 0 ? C.primaryFixed : C.onSurface, borderRadius: 999 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 32, padding: 16, borderRadius: 12, background: 'rgba(255,45,120,0.05)', border: `1px solid rgba(255,224,236,0.10)` }}>
                          <p style={{ margin: 0, fontSize: 11, color: C.onSurfaceVar, lineHeight: 1.6 }}>
                            <span style={{ color: C.primaryFixed, fontFamily: F.mono, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 4 }}>AI Recommendation:</span>
                            {(() => {
                              if (!cycles.length) return "No recommendations available yet. Start the agent to initiate narrative scans.";
                              const lastCycle = cycles[cycles.length - 1];
                              const r = lastCycle.reasoning ?? (lastCycle.decision as any)?.reasoning ?? '';
                              if (r.startsWith('http') || r.includes('generateContent')) return 'LLM scoring failed.';
                              return r || 'No recommendation details available.';
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'Positions' && (
                  <div style={{ background: 'rgba(14,14,15,0.70)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 16, padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(48,40,64,0.15)', paddingBottom: 16, marginBottom: 24 }}>
                      <div>
                        <h3 style={{ color: C.onSurface, fontFamily: F.display, fontWeight: 700, fontSize: 18, margin: 0 }}>Active Positions</h3>
                        <p style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 11, margin: '4px 0 0' }}>Current asset holdings managed by the AI agent</p>
                      </div>
                      <span style={{
                        background: 'rgba(0,255,204,0.10)',
                        color: C.secondary,
                        border: '1px solid rgba(0,255,204,0.20)',
                        fontFamily: F.mono, fontSize: 11, fontWeight: 700,
                        padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em'
                      }}>
                        {(portfolio?.openPositions?.length ?? 0)} Active
                      </span>
                    </div>

                    {(() => {
                      const filteredPositions = (portfolio?.openPositions ?? []).filter(pos => {
                        const q = filterQuery.toLowerCase().trim();
                        if (!q) return true;
                        return pos.token.toLowerCase().includes(q) || pos.address.toLowerCase().includes(q);
                      });

                      if (filteredPositions.length === 0) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', border: '1px dashed rgba(90,80,104,0.20)', borderRadius: 12, background: 'rgba(17,17,24,0.15)' }}>
                            <svg width={48} height={48} fill="none" viewBox="0 0 24 24" stroke="rgba(160,152,176,0.30)" strokeWidth={1} style={{ marginBottom: 16 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <h4 style={{ color: C.onSurface, fontWeight: 600, fontSize: 14, margin: 0 }}>No Matching Positions</h4>
                            <p style={{ color: 'rgba(160,152,176,0.60)', fontSize: 12, margin: '8px 0 0', maxWidth: 320, lineHeight: 1.6 }}>
                              No positions match your filter query.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: F.mono, fontSize: 11 }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(48,40,64,0.15)', color: 'rgba(160,152,176,0.60)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                <th style={{ padding: '12px 16px' }}>Asset</th>
                                <th style={{ padding: '12px 16px' }}>Amount</th>
                                <th style={{ padding: '12px 16px' }}>Avg Entry</th>
                                <th style={{ padding: '12px 16px' }}>Market Price</th>
                                <th style={{ padding: '12px 16px' }}>Position Value</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Unrealized PnL</th>
                              </tr>
                            </thead>
                            <tbody style={{ color: C.onSurface }}>
                              {filteredPositions.map((pos) => {
                                const value = pos.amount * pos.currentPrice;
                                const profit = pos.currentPrice - pos.entryPrice;
                                const pnlPercent = pos.entryPrice > 0 ? (profit / pos.entryPrice) * 100 : 0;
                                const isPositive = pnlPercent >= 0;

                                return (
                                  <tr key={pos.address} style={{ borderBottom: '1px solid rgba(48,40,64,0.10)' }}>
                                    <td style={{ padding: '16px' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                          width: 32, height: 32, borderRadius: 6,
                                          background: 'rgba(255,45,120,0.10)',
                                          border: '1px solid rgba(255,45,120,0.20)',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          color: C.primaryFixed, fontWeight: 'bold', fontSize: 11,
                                        }}>
                                          {pos.token.slice(0, 3)}
                                        </div>
                                        <div>
                                          <div style={{ fontWeight: 'bold', color: C.onSurface }}>{pos.token}</div>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(160,152,176,0.50)', marginTop: 2 }}>
                                            <span>{pos.address.slice(0, 6)}…{pos.address.slice(-4)}</span>
                                            <CopyButton text={pos.address} />
                                            <a href={`https://testnet.bscscan.com/address/${pos.address}`} target="_blank" rel="noreferrer" style={{ color: 'rgba(160,152,176,0.50)', display: 'inline-flex', alignItems: 'center' }}>
                                              <Icon.ExtLink />
                                            </a>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: 600 }}>{pos.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</td>
                                    <td style={{ padding: '16px', color: C.onSurfaceVar }}>{fmt$(pos.entryPrice)}</td>
                                    <td style={{ padding: '16px', color: C.onSurfaceVar }}>{fmt$(pos.currentPrice)}</td>
                                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{fmt$(value)}</td>
                                    <td style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: isPositive ? C.secondary : C.error }}>
                                      {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {activeTab === 'Trade History' && (
                  <div style={{ background: 'rgba(14,14,15,0.70)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 16, padding: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(48,40,64,0.15)', paddingBottom: 16, marginBottom: 24 }}>
                      <div>
                        <h3 style={{ color: C.onSurface, fontFamily: F.display, fontWeight: 700, fontSize: 18, margin: 0 }}>Execution Logs</h3>
                        <p style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 11, margin: '4px 0 0' }}>Historical record of agent trades and portfolio events</p>
                      </div>
                      <span style={{
                        background: 'rgba(20,20,34,0.30)',
                        color: C.onSurfaceVar,
                        border: '1px solid rgba(48,40,64,0.20)',
                        fontFamily: F.mono, fontSize: 11, fontWeight: 700,
                        padding: '4px 12px', borderRadius: 999, textTransform: 'uppercase'
                      }}>
                        {(portfolio?.tradesHistory?.length ?? 0)} Trades
                      </span>
                    </div>

                    {(() => {
                      const filteredTrades = (portfolio?.tradesHistory ?? []).filter(trade => {
                        const q = filterQuery.toLowerCase().trim();
                        if (!q) return true;
                        return trade.token.toLowerCase().includes(q) || trade.type.toLowerCase().includes(q) || trade.address.toLowerCase().includes(q);
                      });

                      if (filteredTrades.length === 0) {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', textAlign: 'center', border: '1px dashed rgba(90,80,104,0.20)', borderRadius: 12, background: 'rgba(17,17,24,0.15)' }}>
                            <svg width={48} height={48} fill="none" viewBox="0 0 24 24" stroke="rgba(160,152,176,0.30)" strokeWidth={1} style={{ marginBottom: 16 }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <h4 style={{ color: C.onSurface, fontWeight: 600, fontSize: 14, margin: 0 }}>No Matching Trades</h4>
                            <p style={{ color: 'rgba(160,152,176,0.60)', fontSize: 12, margin: '8px 0 0', maxWidth: 320, lineHeight: 1.6 }}>
                              No transactions match your filter query.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: F.mono, fontSize: 11 }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid rgba(48,40,64,0.15)', color: 'rgba(160,152,176,0.60)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                <th style={{ padding: '12px 16px' }}>Timestamp</th>
                                <th style={{ padding: '12px 16px' }}>Action</th>
                                <th style={{ padding: '12px 16px' }}>Token</th>
                                <th style={{ padding: '12px 16px' }}>Size (USDC)</th>
                                <th style={{ padding: '12px 16px' }}>Execution Price</th>
                                <th style={{ padding: '12px 16px' }}>Amount Received</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Transaction</th>
                              </tr>
                            </thead>
                            <tbody style={{ color: C.onSurface }}>
                              {[...filteredTrades].reverse().map((trade, i) => {
                                const isBuy = trade.type === 'BUY';
                                return (
                                  <tr key={trade.timestamp + i} style={{ borderBottom: '1px solid rgba(48,40,64,0.10)' }}>
                                    <td style={{ padding: '16px', color: 'rgba(160,152,176,0.70)' }}>
                                      {new Date(trade.timestamp).toLocaleString()}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                      <span style={{
                                        padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: F.mono,
                                        background: isBuy ? 'rgba(255,45,120,0.15)' : 'rgba(0,255,204,0.15)',
                                        color: isBuy ? C.primaryFixed : C.secondary,
                                        border: isBuy ? '1px solid rgba(255,45,120,0.25)' : '1px solid rgba(0,255,204,0.25)',
                                      }}>
                                        {trade.type}
                                      </span>
                                    </td>
                                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{trade.token}</td>
                                    <td style={{ padding: '16px', fontWeight: 600 }}>{fmt$(trade.valueUSDC)}</td>
                                    <td style={{ padding: '16px', color: C.onSurfaceVar }}>{fmt$(trade.price)}</td>
                                    <td style={{ padding: '16px', color: C.onSurfaceVar }}>{trade.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                      <a
                                        href={`https://testnet.bscscan.com/address/${trade.address}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{ color: C.primaryFixed, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                      >
                                        Explorer <Icon.ExtLink />
                                      </a>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {activeTab === 'Agent Config' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
                    {/* Left side config (7 cols) */}
                    <div style={{ gridColumn: 'span 7', display: 'flex', flexDirection: 'column', gap: 24 }}>
                      <div style={{ background: 'rgba(14,14,15,0.70)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ borderBottom: '1px solid rgba(48,40,64,0.15)', paddingBottom: 16 }}>
                          <h3 style={{ color: C.onSurface, fontFamily: F.display, fontWeight: 700, fontSize: 18, margin: 0 }}>Control Panel</h3>
                          <p style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 11, margin: '4px 0 0' }}>Toggle live trading states and inspect agent configuration</p>
                        </div>

                        {/* Engine status toggle */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'rgba(17,17,24,0.20)', border: '1px solid rgba(48,40,64,0.10)', borderRadius: 12 }}>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: 14, color: C.onSurface, fontFamily: F.display }}>Trading Engine</div>
                            <p style={{ fontSize: 11, color: C.onSurfaceVar, marginTop: 4, lineHeight: 1.5, margin: '4px 0 0' }}>
                              When paused, the agent will freeze trade execution but continue scanning market narratives.
                            </p>
                          </div>
                          <button
                            onClick={() => togglePause(!portfolio?.isPaused)}
                            style={{
                              padding: '8px 16px', fontSize: 11, fontFamily: F.mono, fontWeight: 700, letterSpacing: '0.05em', borderRadius: 8, textTransform: 'uppercase', transition: 'all 0.15s', cursor: 'pointer', border: portfolio?.isPaused ? 'none' : `1px solid ${C.outline}`,
                              background: portfolio?.isPaused ? C.primaryFixed : C.containerHighest,
                              color: portfolio?.isPaused ? C.onPrimaryFixed : C.onSurfaceVar,
                            }}
                          >
                            {portfolio?.isPaused ? 'RESUME AGENT' : 'PAUSE AGENT'}
                          </button>
                        </div>

                        {/* Config Summary Grid */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <h4 style={{ color: 'rgba(160,152,176,0.40)', fontFamily: F.mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0 }}>Agent Configurations</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            {[
                              { label: 'Blockchain Network', value: config?.network ? `${config.network.toUpperCase()} (BNB Chain)` : '—' },
                              { label: 'RPC Endpoint', value: config?.rpcUrl ? `${config.rpcUrl.slice(0, 16)}…` : '—' },
                              { label: 'Starting Capital', value: config?.targetPortfolioValue ? `${config.targetPortfolioValue} USDC` : '—' },
                              { label: 'Inference Engine', value: 'Llama-3.3-70b (via Groq)' },
                              { label: 'Sentiment Provider', value: 'CoinMarketCap Trending API' },
                              { label: 'Evaluation Loop', value: '30 Minutes' },
                            ].map((item, idx) => (
                              <div key={idx} style={{ padding: 12, background: 'rgba(10,10,18,0.40)', border: '1px solid rgba(48,40,64,0.10)', borderRadius: 8 }}>
                                <span style={{ fontSize: 9, fontFamily: F.mono, fontWeight: 700, color: 'rgba(160,152,176,0.40)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 2 }}>{item.label}</span>
                                <span style={{ fontSize: 12, fontFamily: F.mono, fontWeight: 700, color: 'rgba(232,224,240,0.90)' }}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right side credentials + system simulator (5 cols) */}
                    <div style={{ gridColumn: 'span 5', display: 'flex', flexDirection: 'column', gap: 24 }}>
                      {/* Credentials Status */}
                      <div style={{ background: 'rgba(14,14,15,0.70)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ borderBottom: '1px solid rgba(48,40,64,0.15)', paddingBottom: 16 }}>
                          <h3 style={{ color: C.onSurface, fontFamily: F.display, fontWeight: 700, fontSize: 18, margin: 0 }}>Credentials Status</h3>
                          <p style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 11, margin: '4px 0 0' }}>Verifies connection status of agent keys and API endpoints</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontFamily: F.mono, fontSize: 12 }}>
                          {[
                            { name: 'Groq Cloud LLM API', active: config?.groqStatus },
                            { name: 'Gemini Backstop API', active: config?.geminiStatus },
                            { name: 'CoinMarketCap Signals API', active: config?.cmcStatus },
                          ].map((cred, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'rgba(10,10,18,0.40)', borderRadius: 8, border: '1px solid rgba(48,40,64,0.05)' }}>
                              <span style={{ color: 'rgba(232,224,240,0.80)' }}>{cred.name}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', color: cred.active ? C.secondary : C.error }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cred.active ? C.secondary : C.error }} />
                                {cred.active ? 'CONNECTED' : 'DISCONNECTED'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* System Simulator */}
                      <div style={{ background: 'rgba(14,14,15,0.70)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 16, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
                        <div style={{ borderBottom: '1px solid rgba(48,40,64,0.15)', paddingBottom: 16 }}>
                          <h3 style={{ color: C.onSurface, fontFamily: F.display, fontWeight: 700, fontSize: 18, margin: 0 }}>System Simulator</h3>
                          <p style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 11, margin: '4px 0 0' }}>Manually trigger and inspect a dry-run narrative assessment</p>
                        </div>

                        {isTriggering ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontFamily: F.mono, fontSize: 9, color: C.primaryFixed, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>REBALANCE EXECUTION PIPELINE</span>
                              <span style={{ fontSize: 10, color: C.onSurfaceVar, fontFamily: F.mono, fontWeight: 700 }}>STEP {Math.min(4, rebalanceStep + 1)} / 4</span>
                            </div>
                            <div style={{ position: 'relative', paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                              {/* Vertical line connecting steps */}
                              <div style={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, background: C.container }} />
                              <div style={{ position: 'absolute', left: 9, top: 8, height: `${(Math.max(0, rebalanceStep) / 3) * 100}%`, width: 2, background: C.primaryFixed, transition: 'height 0.5s ease-in-out' }} />

                              {[
                                { label: 'Signal Ingestion', desc: 'Scan CMC trending APIs & social graphs' },
                                { label: 'LLM Narrative Analysis', desc: 'Llama-3.3-70b score computation' },
                                { label: 'Risk Guard Audit', desc: 'Verify allocations & drawdown boundaries' },
                                { label: 'BSC Contract Execution', desc: 'Route trade payload via PancakeSwap' }
                              ].map((st, sIdx) => {
                                const isDone = rebalanceStep > sIdx;
                                const isActive = rebalanceStep === sIdx;
                                return (
                                  <div key={sIdx} style={{ position: 'relative', display: 'flex', gap: 14, zIndex: 1 }}>
                                    {/* Step dot */}
                                    <div style={{ position: 'absolute', left: -23, top: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {isDone ? (
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#050507', fontSize: 9, fontWeight: 'black', boxShadow: `0 0 8px ${C.secondary}` }}>✓</div>
                                      ) : isActive ? (
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.primaryFixed, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.onPrimaryFixed, fontSize: 9, fontWeight: 'black', boxShadow: `0 0 8px ${C.primaryFixed}` }}>
                                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.primaryFixed, animation: 'ping 1s infinite' }} />
                                        </div>
                                      ) : (
                                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.bg, border: `1px solid ${C.outlineVar}` }} />
                                      )}
                                    </div>

                                    {/* Step text */}
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: F.display, color: isActive ? C.primaryFixed : isDone ? C.onSurface : C.onSurfaceVar }}>
                                        {st.label}
                                      </div>
                                      <div style={{ fontSize: 10, color: 'rgba(160,152,176,0.60)', fontFamily: F.mono, marginTop: 2 }}>{st.desc}</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Dynamic simulation logs screen */}
                            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(10,10,18,0.90)', border: `1px solid rgba(48,40,64,0.10)`, fontFamily: F.mono, fontSize: 9, display: 'flex', flexDirection: 'column', gap: 4, height: 112, overflowY: 'auto' }}>
                              {triggerLog.map((logStr, i) => {
                                let color = 'rgba(160,152,176,0.80)';
                                if (logStr.includes('✅')) color = C.primaryFixed;
                                else if (logStr.includes('🛡️')) color = C.secondary;
                                return (
                                  <div key={i} style={{ color }}>
                                    {logStr}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={simulateCycleTrigger}
                              disabled={portfolio?.isPaused}
                              style={{
                                width: '100%', padding: '10px 16px', borderRadius: 8, fontSize: 11, fontFamily: F.mono, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', transition: 'all 0.15s', border: portfolio?.isPaused ? `1px solid rgba(48,40,64,0.10)` : `1px solid ${C.primaryFixed}`,
                                background: portfolio?.isPaused ? 'rgba(10,10,18,0.50)' : C.primaryFixed,
                                color: portfolio?.isPaused ? 'rgba(160,152,176,0.30)' : C.onPrimaryFixed,
                                cursor: portfolio?.isPaused ? 'not-allowed' : 'pointer'
                              }}
                            >
                              {portfolio?.isPaused ? 'AGENT PAUSED' : 'TRIGGER DRY RUN'}
                            </button>

                            {triggerLog.length > 0 && (
                              <div style={{ padding: 16, borderRadius: 12, background: 'rgba(10,10,18,0.90)', border: '1px solid rgba(48,40,64,0.10)', fontFamily: F.mono, fontSize: 10, display: 'flex', flexDirection: 'column', gap: 6, height: 176, overflowY: 'auto' }}>
                                {triggerLog.map((logStr, i) => {
                                  let color = 'rgba(160,152,176,0.80)';
                                  if (logStr.includes('✅')) color = C.primaryFixed;
                                  else if (logStr.includes('🛡️')) color = C.secondary;
                                  return (
                                    <div key={i} style={{ color }}>
                                      {logStr}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>
        </section>

        {/* ═══════════════════════════ FOOTER ═══════════════════════════ */}
        <footer style={{ background: C.bg, borderTop: '1px solid rgba(48,40,64,0.10)', padding: '64px 32px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 48 }}>

            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 24, height: 24, background: C.primaryFixed, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon.QueryStats size={13} color={C.onPrimaryFixed} />
                </div>
                <span style={{ color: C.onSurface, fontFamily: F.display, fontWeight: 700, fontSize: 16, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>Narrative Trader</span>
              </div>
              <p style={{ color: C.onSurfaceVar, fontSize: 12, lineHeight: 1.7, margin: '0 0 24px', maxWidth: 280 }}>
                Next-generation institutional trading infrastructure powered by advanced Llama-3 inference and narrative-aware liquidity routing.
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                {[<Icon.Share key="s" />, <Icon.Code key="c" />].map((icon, i) => (
                  <a key={i} href="#" style={{ width: 32, height: 32, borderRadius: '50%', border: `1px solid rgba(48,40,64,0.20)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.onSurfaceVar, textDecoration: 'none' }}>{icon}</a>
                ))}
              </div>
            </div>

            {/* Platform (Simplified) */}
            <div>
              <h4 style={{ color: C.onSurface, fontFamily: F.mono, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 24px' }}>Platform Resources</h4>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <a href="#terminal" style={{ color: C.onSurfaceVar, fontSize: 12, textDecoration: 'none' }}>Live Terminal</a>
                <a href="/docs" style={{ color: C.onSurfaceVar, fontSize: 12, textDecoration: 'none' }}>Documentation</a>
              </nav>
            </div>

            {/* Health */}
            <div style={{ gridColumn: 'span 2' }}>
              <h4 style={{ color: C.onSurface, fontFamily: F.mono, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 0 24px' }}>System Health</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.primaryFixed }} />
                <span style={{ color: C.onSurface, fontSize: 11, fontWeight: 700 }}>OPERATIONAL</span>
              </div>
              <div style={{ color: 'rgba(160,152,176,0.60)', fontFamily: F.mono, fontSize: 10, lineHeight: 1.8 }}>
                UPTIME: {uptime}<br />ACTIVE NODES: 1,024<br />LATENCY: {latency}ms AVG
              </div>
            </div>
          </div>

          <div style={{ maxWidth: 1400, margin: '64px auto 0', paddingTop: 32, borderTop: '1px solid rgba(48,40,64,0.10)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'rgba(160,152,176,0.40)', fontFamily: F.mono, fontSize: 10 }}>© 2026 NARRATIVE TRADER FOUNDATION. V1.0.4-BETA</span>
            <a href="https://x.com/ritesh5969" target="_blank" rel="noreferrer" style={{ color: C.primaryFixedDim, fontFamily: F.mono, fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>Built by ritesh59697</a>
            <span style={{ color: 'rgba(160,152,176,0.40)', fontFamily: F.mono, fontSize: 10, textTransform: 'uppercase' }}>ENCRYPTED END-TO-END CONNECTION</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
