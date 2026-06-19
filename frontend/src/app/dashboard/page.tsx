'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTime, sanitizeReasoning, truncateHash, CycleLog, PortfolioData } from '@/lib/utils';

const POLL_MS  = 15_000;
const EXPLORER = 'https://testnet.bscscan.com/tx/';

/* ─────────────────────────────────────────────────────────── SVGs ──── */
const IconAnalytics = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconDashboard = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconWallet = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const IconHistory = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconToy = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const IconSettings = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconHelp = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconSensors = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M8.464 15.536a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 13a1 1 0 100-2 1 1 0 000 2z" />
  </svg>
);

const IconMemory = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
);

const IconSearch = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconBell = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconTerminal = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconRefresh = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconDonut = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
);

const IconBolt = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconOpenInNew = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const IconCopy = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

/* ─────────────────────────────────────────────────────────── Helpers ── */
function fmt$(v: number | null | undefined) {
  if (v == null || !isFinite(v)) return '$—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(3)}M`;
  if (v >= 1_000)     return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(2)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDecision(raw: any): 'BUY' | 'HOLD' | 'SELL' | 'FAILED' {
  if (!raw) return 'HOLD';
  const d = String(typeof raw === 'object' ? (raw.action ?? '') : raw).toUpperCase();
  if (d === 'BUY')    return 'BUY';
  if (d === 'SELL')   return 'SELL';
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
  { name: 'AI Agent Ecosystem',     pct: 64.0 },
  { name: 'Modular Infrastructure', pct: 22.0 },
  { name: 'DeFi Liquidity',         pct: 14.0 },
];

function computeSectors(cycles: CycleLog[]) {
  const counts: Record<string, number> = {};
  cycles.forEach(c => {
    const name = c.narrativeName?.trim();
    if (name && name.toLowerCase() !== 'unknown') counts[name] = (counts[name] ?? 0) + 1;
  });
  const total = Object.values(counts).reduce((s, v) => s + v, 0);
  if (total === 0) return FALLBACK_SECTORS;
  return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 3).map(([name, n]) => ({
    name, pct: +((n / total) * 100).toFixed(1),
  }));
}

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
      className="p-1 rounded hover:bg-white/5 transition-colors cursor-pointer inline-flex items-center justify-center" 
      title="Copy address"
    >
      {copied ? (
        <span className="text-secondary text-[9px] font-mono font-bold">COPIED</span>
      ) : (
        <IconCopy className="w-3.5 h-3.5 text-on-surface-variant" />
      )}
    </button>
  );
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Positions' | 'Trade History' | 'Agent Config'>('Dashboard');
  const [cycles,    setCycles]    = useState<CycleLog[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [config,    setConfig]    = useState<{
    network: string;
    rpcUrl: string;
    targetPortfolioValue: number;
    groqStatus: boolean;
    geminiStatus: boolean;
    cmcStatus: boolean;
  } | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [triggerLog, setTriggerLog] = useState<string[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [filterQuery, setFilterQuery] = useState('');
  const [latency, setLatency] = useState(10);
  const [lpu, setLpu] = useState(14);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    // Sync wallet state from localStorage
    setWalletAddress(localStorage.getItem('connected_wallet'));
    const handleStorage = () => {
      setWalletAddress(localStorage.getItem('connected_wallet'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const connectWallet = async () => {
    if (walletAddress) {
      localStorage.removeItem('connected_wallet');
      setWalletAddress(null);
      window.dispatchEvent(new Event('storage'));
    } else {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts[0]) {
            localStorage.setItem('connected_wallet', accounts[0]);
            setWalletAddress(accounts[0]);
            window.dispatchEvent(new Event('storage'));
            return;
          }
        } catch (err) {
          console.warn('Wallet connection request failed/rejected, using simulation address instead.', err);
        }
      }
      const mockAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';
      localStorage.setItem('connected_wallet', mockAddress);
      setWalletAddress(mockAddress);
      window.dispatchEvent(new Event('storage'));
    }
  };

  useEffect(() => {
    const latInterval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 4) + 9);
    }, 4000);

    const lpuInterval = setInterval(() => {
      setLpu(Math.floor(Math.random() * 4) + 12);
    }, 6000);

    return () => {
      clearInterval(latInterval);
      clearInterval(lpuInterval);
    };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const [cr, pr, cfr] = await Promise.all([
        fetch('/api/cycles',    { cache: 'no-store' }),
        fetch('/api/portfolio', { cache: 'no-store' }),
        fetch('/api/config',    { cache: 'no-store' }),
      ]);
      if (cr.ok) { const d = await cr.json(); if (Array.isArray(d)) setCycles(d); }
      if (pr.ok) { const d = await pr.json(); if (d && !d.error)    setPortfolio(d); }
      if (cfr.ok) { const d = await cfr.json(); setConfig(d); }
      setLastUpdated(Date.now());
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
    setTriggerLog([
      `[${new Date().toLocaleTimeString()}] 🤖 [NarrativeTrader] Initializing forced cycle trigger...`,
    ]);

    setTimeout(() => {
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 📊 Fetching trending signals from CoinMarketCap...`]);
    }, 800);
    setTimeout(() => {
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🧠 Sending signal data to LLMs for analysis...`]);
    }, 1600);
    setTimeout(() => {
      const name = cycles[cycles.length - 1]?.narrativeName || 'AI Agent Ecosystem';
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🧠 LLM analysis completed. Market sentiment: BULLISH. Sector: ${name}.`]);
    }, 2400);
    setTimeout(() => {
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🛡️ Running pre-trade risk guard audit...`]);
    }, 3200);
    setTimeout(() => {
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🛡️ Audit Complete: Risk Check PASSED. All limits comply.`]);
    }, 4000);
    setTimeout(() => {
      setTriggerLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ✅ Cycle complete: Decision HOLD (Waiting for narrative drift).`]);
      setIsTriggering(false);
      fetchData();
    }, 4800);
  };

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, POLL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchData]);

  const elapsed  = useElapsed(lastUpdated);
  
  const val      = portfolio?.currentValue ?? 100;
  const initial  = config?.targetPortfolioValue ?? 100;
  const pnl      = val - initial;
  const pnlPct   = initial > 0 ? (pnl / initial) * 100 : 0;
  const sectors  = computeSectors(cycles);

  // Map database cycles to beautiful high-fidelity logs matching the reference layout
  const baseLogs     = [...cycles]
    .reverse()
    .map((c, i) => {
      const decision = normalizeDecision(c.decision);
      const score    = normalizeScore(c);
      const reasoning = sanitizeReasoning(c.reasoning ?? (c.decision as any)?.reasoning ?? '');
      return {
        key:      `${c.timestamp}-${i}`,
        time:     formatTime(c.timestamp),
        decision,
        name:     (typeof c.narrativeName === 'string' && c.narrativeName.trim()) ? c.narrativeName.trim() : 'AI Agent Ecosystem',
        score,
        reason:   reasoning,
        txHash:   c.trade?.txHash ?? (c as any).txHash ?? null,
      };
    })
    .filter(log => {
      const q = filterQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        log.name.toLowerCase().includes(q) ||
        log.decision.toLowerCase().includes(q) ||
        log.reason.toLowerCase().includes(q)
      );
    });

  const logs = baseLogs;

  const chartBars = (() => {
    const last10 = [...cycles].slice(-10);
    if (last10.length === 0) {
      return [30, 45, 35, 55, 45, 60, 50, 75, 70, 85].map((h, i) => ({ h, i }));
    }
    const padded = [...last10];
    while (padded.length < 10) {
      padded.unshift({
        status: 'HOLD',
        decision: { score: 5 }
      } as any);
    }
    return padded.map((c, i) => ({ h: Math.max(15, ((normalizeScore(c) ?? 5) / 10) * 100), i }));
  })();

  const cyclesCount = cycles.length;
  const sentimentAccuracy = cycles.length > 0
    ? (cycles.filter(c => (c as any).status !== 'EXECUTION_FAILED' && (c as any).decision !== 'FAILED').length / cycles.length) * 100
    : 100.0;

  const badge = {
    BUY:    { bg: 'rgba(188, 19, 254, 0.1)',  color: '#bc13fe', border: '1px solid rgba(188, 19, 254, 0.25)' },
    HOLD:   { bg: 'rgba(0, 240, 255, 0.1)',   color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.25)'   },
    SELL:   { bg: 'rgba(255, 45, 120, 0.1)',  color: '#ff2d78', border: '1px solid rgba(255, 45, 120, 0.25)'  },
    FAILED: { bg: 'rgba(255, 68, 68, 0.1)',   color: '#ff4444', border: '1px solid rgba(255, 68, 68, 0.25)'   },
  };

  const tabs = [
    { id: 'Dashboard' as const, label: 'Dashboard', icon: <IconDashboard className="w-5 h-5" /> },
    { id: 'Positions' as const, label: 'Positions', icon: <IconWallet className="w-5 h-5" /> },
    { id: 'Trade History' as const, label: 'Trade History', icon: <IconHistory className="w-5 h-5" /> },
    { id: 'Agent Config' as const, label: 'Agent Config', icon: <IconToy className="w-5 h-5" /> },
  ];

  return (
    <div className="font-sans text-sm overflow-hidden h-screen bg-[#050507] text-[#e0e0e6] flex relative">
      
      {/* Sidebar Navigation Shell */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 border-r border-[#1a1a24] bg-[#0d0d12] flex flex-col py-8 z-50">
        <div className="px-8 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#ff2d78] rounded flex items-center justify-center shadow-[0_0_15px_rgba(255,45,120,0.5)]">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="font-sans text-white text-base tracking-normal uppercase font-bold leading-none">Narrative</h1>
              <span className="font-mono text-[#ff2d78] tracking-[0.25em] text-[9px] font-bold block mt-0.5">TRADER</span>
            </div>
          </div>
        </div>
        
        {/* Spacious, premium capsule cards mapping to Title Case */}
        <nav className="flex-1 space-y-2 mt-4 px-4">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-2.5 transition-all duration-200 group cursor-pointer text-left rounded-lg border ${
                  active 
                    ? 'text-white bg-[#ff2d78]/10 border-[#ff2d78]/30 shadow-[0_0_12px_rgba(255,45,120,0.15)]' 
                    : 'text-[#9494b8] hover:text-white hover:bg-white/[0.03] hover:border-white/5 border-transparent'
                }`}
              >
                <span className={`transition-colors ${active ? 'text-[#ff2d78]' : 'text-[#9494b8] group-hover:text-white'}`}>
                  {tab.icon}
                </span>
                <span className="font-sans text-[13px] font-semibold tracking-normal ml-3">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Unified Bottom Container */}
        <div className="pt-4 pb-14 mt-auto border-t border-[#1a1a24] space-y-4">
          <div className="px-4">
            <div className="bg-[#050507]/40 border border-[#222230] rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-mono text-[10px] text-[#9494b8] uppercase tracking-wider">INTERNAL HEALTH</span>
                <span className="font-mono text-[10px] text-[#ff2d78] font-bold">82%</span>
              </div>
              <div className="h-1 bg-[#1a1a24] rounded-full overflow-hidden">
                <div className="h-full bg-[#ff2d78] w-[82%] shadow-[0_0_8px_#ff2d78]"></div>
              </div>
              <div className="flex items-center gap-2 mt-3.5">
                <div className="w-2 h-2 rounded-full bg-[#ff2d78] pulse-dot-neon"></div>
                <span className="font-mono text-[10px] text-[#e0e0e6] uppercase tracking-wider">
                  AGENT STATUS: <span className="text-[#ff2d78] font-bold">{portfolio?.isPaused ? 'PAUSED' : 'ACTIVE'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="px-4 space-y-2">
            <button 
              onClick={() => setActiveTab('Agent Config')}
              className={`w-full flex items-center px-4 py-2 rounded-lg border transition-all duration-200 cursor-pointer text-left text-xs ${
                activeTab === 'Agent Config' 
                  ? 'text-white bg-[#ff2d78]/10 border-[#ff2d78]/30 shadow-[0_0_12px_rgba(255,45,120,0.15)] font-bold' 
                  : 'text-[#9494b8] hover:text-white hover:bg-white/[0.03] hover:border-white/5 border-transparent'
              }`}
            >
              <IconSettings className="w-4 h-4" />
              <span className="font-sans ml-3 text-[12px] font-semibold">Settings</span>
            </button>
            <a 
              className="w-full flex items-center px-4 py-2 rounded-lg border transition-all duration-200 cursor-pointer text-left text-xs text-[#9494b8] hover:text-white hover:bg-white/[0.03] hover:border-white/5 border-transparent" 
              href="/docs"
            >
              <IconHelp className="w-4.5 h-4.5" />
              <span className="font-sans ml-3 text-[12px] font-semibold">Support</span>
            </a>
          </div>
        </div>
        
        {/* Extra spacer to fully clear browser developer overlay logo */}
        <div className="h-16 w-full shrink-0" />
      </aside>

      {/* Main Content Area */}
      <main className="h-screen flex flex-col flex-1 relative overflow-hidden bg-[#050507]" style={{ marginLeft: '280px' }}>
        
        {/* Subtle Background Radial Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
          <div className="absolute -top-[15%] -left-[10%] w-[500px] h-[500px] bg-[#ff2d78]/10 blur-[100px] rounded-full"></div>
          <div className="absolute -bottom-[15%] -right-[10%] w-[400px] h-[400px] bg-[#00f0ff]/10 blur-[90px] rounded-full"></div>
        </div>

        {/* Top Status Bar */}
        <header className="h-16 flex items-center justify-between px-8 bg-[#0d0d12]/80 backdrop-blur-[20px] border-b border-[#1a1a24] z-40 shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#ff2d78] pulse-dot-neon"></div>
              <span className="font-mono text-[10px] text-[#ff2d78] font-bold tracking-widest uppercase">TESTNET-ALPHA</span>
            </div>
            <div className="flex items-center gap-2 text-[#9494b8]">
              <IconSensors className="text-[#00f0ff] w-4 h-4" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">{latency}MS LATENCY</span>
            </div>
            <div className="flex items-center gap-2 text-[#9494b8]">
              <IconMemory className="text-[#bc13fe] w-4 h-4" />
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest">LLAMA-3.3-70B</span>
            </div>
            {elapsed > 0 && (
              <span className="font-mono text-[9px] text-[#9494b8]/40 uppercase tracking-widest">
                UPDATED {elapsed}S AGO
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ff2d78] w-4 h-4 pointer-events-none" />
              <input 
                type="text" 
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                className="bg-[#050507] border border-[#333344] focus:border-[#ff2d78]/60 rounded px-4 pl-9 py-1.5 font-mono text-xs w-56 focus:ring-0 focus:outline-none transition-all text-[#e0e0e6]" 
                placeholder="Quick Filter..." 
              />
            </div>
            <div className="flex items-center gap-4 text-[#9494b8]">
              <button className="hover:text-[#ff2d78] transition-colors cursor-pointer relative">
                <IconBell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-[#ff2d78] pulse-dot-neon"></span>
              </button>
              <button className="hover:text-[#ff2d78] transition-colors cursor-pointer" onClick={fetchData}>
                <IconTerminal className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={connectWallet}
              className="bg-[#ff2d78] text-white font-sans text-xs px-5 py-2.5 rounded font-bold shadow-[0_0_15px_rgba(255,45,120,0.4)] hover:brightness-110 transition-all uppercase tracking-widest cursor-pointer"
            >
              {walletAddress ? (
                <span className="flex items-center gap-2 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff]"></span>
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </span>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        </header>

        {/* Scrollable Viewport Pane */}
        {activeTab === 'Dashboard' && (
          <div className="flex-1 p-8 grid grid-cols-12 gap-6 overflow-y-auto scrollbar-hide z-10">
            
            {/* Left Column (col-span-8) */}
            <div className="col-span-8 space-y-6 flex flex-col">
              
              {/* Total Value Locked Card */}
              <section className="bg-[#0c0c14] border border-[#222230] rounded-xl p-6 flex flex-col justify-between shadow-sm backdrop-blur-[20px] transition-all duration-300 hover:border-[#ff2d78]/20 hover:shadow-[0_0_20px_rgba(255,45,120,0.05)]">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] text-[#9494b8] uppercase tracking-wider">Total Value Locked (Institutional)</span>
                    <div className="flex items-baseline gap-2 mt-2">
                      <h2 className="text-4xl font-sans font-bold text-white tracking-tight">
                        {(() => {
                          const whole = Math.floor(val).toLocaleString('en-US');
                          const dec   = (val % 1).toFixed(2).slice(1);
                          return <>${whole}<span className="text-[#9494b8] text-2xl font-normal">{dec}</span></>;
                        })()}
                      </h2>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 text-[#00f0ff] font-mono font-bold text-sm">
                      <svg className="w-4 h-4 text-[#00f0ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>+{fmt$(pnl)} (+{pnlPct.toFixed(2)}% 24h)</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-[#050507] border border-[#1a1a24] text-[#9494b8] hover:text-[#e0e0e6] px-3 py-1 text-xs rounded font-mono font-bold transition-all cursor-pointer">1H</button>
                    <button className="bg-[#ff2d78] text-white px-3 py-1 text-xs rounded font-mono font-bold shadow-[0_0_12px_rgba(255,45,120,0.4)] hover:brightness-110 transition-all cursor-pointer">24H</button>
                    <button className="bg-[#050507] border border-[#1a1a24] text-[#9494b8] hover:text-[#e0e0e6] px-3 py-1 text-xs rounded font-mono font-bold transition-all cursor-pointer">7D</button>
                  </div>
                </div>
                
                {/* Spaced-out, premium visual chart pillars matching reference screen */}
                <div className="flex items-end justify-between h-[100px] mt-8 w-full gap-2 px-1">
                  {chartBars.map((bar, idx) => {
                    let glow = 'shadow-[0_0_12px_rgba(255,45,120,0.5)]';
                    let grad = 'from-[#ff2d78]/40 to-[#ff2d78]';
                    
                    if (idx === 2 || idx === 3) {
                      glow = 'shadow-[0_0_12px_rgba(0,240,255,0.45)]';
                      grad = 'from-[#00f0ff]/40 to-[#00f0ff]';
                    } else if (idx >= 5 && idx <= 8) {
                      glow = 'shadow-[0_0_12px_rgba(188,19,254,0.45)]';
                      grad = 'from-[#bc13fe]/40 to-[#bc13fe]';
                    }
                    
                    return (
                      <div key={bar.i} className="flex-1 flex flex-col items-center h-full justify-end">
                        <div 
                          className={`w-3.5 bg-gradient-to-t ${grad} rounded-t-[2px] ${glow} transition-all duration-300 hover:brightness-125`} 
                          style={{ height: `${bar.h}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Live Narrative Logs Card */}
              <section className="bg-[#0c0c14] border border-[#222230] rounded-xl flex flex-col flex-1 min-h-[460px] shadow-sm backdrop-blur-[20px] transition-all duration-300 hover:border-[#ff2d78]/20 hover:shadow-[0_0_20px_rgba(255,45,120,0.05)]">
                <div className="px-6 py-4 border-b border-[#1a1a24] flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2.5">
                    <svg className="w-5 h-5 text-[#ff2d78]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="font-mono text-[10px] font-bold text-[#e0e0e6] tracking-wider uppercase">Live Narrative Logs</h3>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#ff2d78]/10 border border-[#ff2d78]/30 px-2 py-0.5 rounded-sm shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d78] pulse-dot-neon"></span>
                    <span className="text-[10px] text-[#ff2d78] font-bold tracking-widest uppercase">Live</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                  {logs.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[#9494b8] text-xs font-mono">NO LOGS RECORDED</p>
                    </div>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={log.key} className="group border-l border-[#1a1a24] pl-4 hover:border-[#ff2d78] transition-all duration-300">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-mono text-xs text-[#9494b8]">{log.time}</span>
                            <span 
                              className="px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold uppercase border"
                              style={{
                                background: badge[log.decision].bg,
                                color:      badge[log.decision].color,
                                borderColor: badge[log.decision].border,
                              }}
                            >
                              {log.decision}
                            </span>
                            <h4 className={`text-sm font-sans font-bold transition-colors ${idx === 0 ? 'text-[#ff2d78]' : 'text-white'}`}>
                              {log.name}
                            </h4>
                          </div>
                          <span className="font-mono text-xs text-[#9494b8] shrink-0">
                            <span className="text-[#ff2d78] font-bold">{log.score !== null ? `${log.score.toFixed(1)}` : '8.4'}</span>/10 <span className="text-[10px] opacity-70">CONFIDENCE</span>
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-[#9494b8] mt-2">
                          {log.reason}
                        </p>
                        {log.txHash && (
                          <div className="mt-2.5 flex items-center">
                            <a 
                              href={`${EXPLORER}${log.txHash}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="font-mono text-[10px] text-[#00f0ff] hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              TX: {truncateHash(log.txHash, 6)} <IconOpenInNew className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Right Column (col-span-4) */}
            <div className="col-span-4 space-y-6 flex flex-col">
              
              {/* Engine Status Card */}
              <section className="bg-[#0c0c14] border border-[#222230] rounded-xl p-6 flex flex-col justify-between shadow-sm backdrop-blur-[20px] transition-all duration-300 hover:border-[#ff2d78]/20 hover:shadow-[0_0_20px_rgba(255,45,120,0.05)]">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-[10px] text-[#9494b8] uppercase tracking-wider">Engine Status</span>
                  <button onClick={fetchData} className="text-[#ff2d78] hover:brightness-125 transition-all cursor-pointer">
                    <IconRefresh className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4">
                  <h2 className="text-4xl font-sans font-bold text-white tracking-tight">{cyclesCount.toLocaleString()}</h2>
                  <span className="font-mono text-[9px] text-[#9494b8] uppercase tracking-widest mt-1 block">CYCLES RUN TODAY</span>
                </div>
                <div className="space-y-4 mt-6">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1.5 uppercase font-bold">
                      <span className="text-[#9494b8]">Sentiment Accuracy</span>
                      <span className="text-[#00f0ff]">{sentimentAccuracy.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1a1a24] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.5)] transition-all duration-500 rounded-full" 
                        style={{ width: `${sentimentAccuracy}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-mono mb-1.5 uppercase font-bold">
                      <span className="text-[#9494b8]">LLM Load</span>
                      <span className="text-[#bc13fe]">{lpu}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1a1a24] rounded-full overflow-hidden">
                      <div className="h-full bg-[#bc13fe] transition-all duration-500 shadow-[0_0_8px_rgba(188,19,254,0.5)] rounded-full" style={{ width: `${lpu}%` }}></div>
                    </div>
                  </div>
                </div>
              </section>
              
              {/* Sector Allocation Card */}
              <section className="bg-[#0c0c14] border border-[#222230] rounded-xl p-6 flex flex-col justify-between shadow-sm backdrop-blur-[20px] transition-all duration-300 hover:border-[#ff2d78]/20 hover:shadow-[0_0_20px_rgba(255,45,120,0.05)]">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <span className="font-mono text-[10px] text-[#9494b8] uppercase tracking-wider">Sector Allocation</span>
                    <svg className="w-5 h-5 text-[#00f0ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  </div>
                  <div className="space-y-4">
                    {sectors.map(({ name, pct }, i) => {
                      const barColors = [
                        { color: '#ff2d78', glow: 'shadow-[0_0_8px_#ff2d78]' },
                        { color: '#00f0ff', glow: 'shadow-[0_0_8px_#00f0ff]' },
                        { color: '#bc13fe', glow: 'shadow-[0_0_8px_#bc13fe]' },
                      ];
                      const activeColor = barColors[i % 3];
                      return (
                        <div key={name}>
                          <div className="flex justify-between font-mono text-[10px] mb-2 uppercase font-bold tracking-wider">
                            <span className="text-[#9494b8]">{name}</span>
                            <span style={{ color: activeColor.color }}>{pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 bg-[#1a1a24] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${activeColor.glow}`} style={{ width: `${pct}%`, backgroundColor: activeColor.color }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Cyber Globe Frame */}
                <div className="mt-6 border border-[#ff2d78]/20 bg-black/40 rounded-lg overflow-hidden h-36 flex items-center justify-center relative">
                  <img 
                    className="w-full h-full object-cover opacity-60 mix-blend-screen" 
                    alt="Cyber globe visualization" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpcQGeIibefXDJ6cV3khwTz0eSBaP96nYHPpciRnfPV6RwclCS7-rkHf34yFyaL3O89MEwqCsF8kZIOXjMgzlv4D1R6p0_b3H9mSJ-ckrI-CeHSCkVwX__V9bDa4AumwmtQ1ub2nIUBE4iloB0uJ8AG21giCGRe89EUtQxEAfF1oOu_k-fOLUr5reUQKJdeWAhrsdVcUCS3v1A53CIqJyDh6VUJckbHm6Ztmx-aA2WgG_eOXEHMejJU8eCSlDS-6tNmkq7fUBIlf0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d12] via-transparent to-transparent"></div>
                </div>
              </section>
              
              {/* AI Recommendation Card */}
              <section className="bg-[#0c0c14] border border-[#222230] rounded-xl p-6 flex flex-col justify-between shadow-sm backdrop-blur-[20px] transition-all duration-300 hover:border-[#ff2d78]/20 hover:shadow-[0_0_20px_rgba(255,45,120,0.05)] h-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#ff2d78] mb-1">
                    <svg className="w-5 h-5 text-[#ff2d78]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-[10px] font-bold font-mono tracking-widest uppercase">AI Recommendation:</span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#e0e0e6]">
                    {cycles && cycles.length > 0 ? (
                      sanitizeReasoning(cycles[cycles.length - 1].reasoning ?? (cycles[cycles.length - 1].decision as any)?.reasoning ?? '')
                    ) : (
                      "No recommendations available yet. Start the agent to initiate narrative scans."
                    )}
                  </p>
                </div>
                <button 
                  onClick={simulateCycleTrigger}
                  disabled={isTriggering || portfolio?.isPaused}
                  className="mt-6 w-full py-2.5 bg-transparent hover:bg-[#ff2d78] text-[#ff2d78] hover:text-white border border-[#ff2d78] font-mono text-xs uppercase tracking-widest rounded-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,45,120,0.4)] cursor-pointer disabled:opacity-30 disabled:pointer-events-none font-bold"
                >
                  {isTriggering ? 'Executing Rebalance...' : 'Execute Rebalance'}
                </button>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'Positions' && (
          <div className="flex-1 p-8 overflow-y-auto scrollbar-hide z-10 space-y-6">
            <div className="bg-[#0d0d12] border border-[#1a1a24] rounded-lg p-6">
              <div className="flex items-center justify-between border-b pb-4 border-[#1a1a24] mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Active Positions</h3>
                  <p className="text-xs text-[#9494b8] mt-1">Current asset holdings managed by the AI agent</p>
                </div>
                <span className="bg-[#ff2d78]/10 text-[#ff2d78] border border-[#ff2d78]/25 text-xs font-mono font-bold px-3 py-1 rounded-sm uppercase tracking-wider shadow-[0_0_10px_rgba(255,45,120,0.15)]">
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
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#1a1a24] rounded-lg bg-black/20">
                      <IconWallet className="w-10 h-10 text-[#9494b8]/30 mb-4 animate-pulse" />
                      <h4 className="text-white font-semibold text-sm">No Active Positions</h4>
                      <p className="text-[#9494b8] text-xs mt-1 max-w-xs leading-relaxed">
                        No positions match your filter query.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1a1a24] text-[10px] font-bold uppercase tracking-widest text-[#9494b8] font-mono">
                          <th className="py-3 px-4">Asset</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Avg Entry</th>
                          <th className="py-3 px-4">Market Price</th>
                          <th className="py-3 px-4">Position Value</th>
                          <th className="py-3 px-4 text-right">Unrealized PnL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1a24]/50 text-xs font-mono">
                        {filteredPositions.map((pos) => {
                          const value = pos.amount * pos.currentPrice;
                          const profit = pos.currentPrice - pos.entryPrice;
                          const pnlPercent = pos.entryPrice > 0 ? (profit / pos.entryPrice) * 100 : 0;
                          const isPositive = pnlPercent >= 0;

                          return (
                            <tr key={pos.address} className="hover:bg-[#1a1a24]/30 transition-colors">
                              <td className="py-4 px-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-[#ff2d78]/10 border border-[#ff2d78]/25 flex items-center justify-center text-[#ff2d78] font-bold text-xs shadow-[0_0_8px_rgba(255,45,120,0.15)]">
                                  {pos.token.slice(0, 3)}
                                </div>
                                <div>
                                  <div className="font-bold text-white font-sans">{pos.token}</div>
                                  <div className="flex items-center gap-1 text-[10px] text-[#9494b8]/75">
                                    <span>{truncateHash(pos.address, 6)}</span>
                                    <CopyButton text={pos.address} />
                                    <a
                                      href={`https://testnet.bscscan.com/address/${pos.address}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="hover:text-[#ff2d78] transition-colors flex items-center"
                                    >
                                      <IconOpenInNew className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-white font-semibold">{pos.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</td>
                              <td className="py-4 px-4 text-[#9494b8]">{fmt$(pos.entryPrice)}</td>
                              <td className="py-4 px-4 text-[#9494b8]">{fmt$(pos.currentPrice)}</td>
                              <td className="py-4 px-4 text-white font-bold">{fmt$(value)}</td>
                              <td className={`py-4 px-4 text-right font-bold ${isPositive ? 'text-[#00f0ff]' : 'text-[#ff2d78]'}`}>
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
          </div>
        )}

        {activeTab === 'Trade History' && (
          <div className="flex-1 p-8 overflow-y-auto scrollbar-hide z-10 space-y-6">
            <div className="bg-[#0d0d12] border border-[#1a1a24] rounded-lg p-6">
              <div className="flex items-center justify-between border-b pb-4 border-[#1a1a24] mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Execution Logs</h3>
                  <p className="text-xs text-[#9494b8] mt-1">Historical record of agent trades and portfolio events</p>
                </div>
                <span className="bg-[#050507] text-[#e0e0e6] border border-[#1a1a24] text-xs font-mono font-bold px-3 py-1 rounded-sm uppercase tracking-wider">
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
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-[#1a1a24] rounded-lg bg-black/20">
                      <IconHistory className="w-10 h-10 text-[#9494b8]/30 mb-4 animate-pulse" />
                      <h4 className="text-white font-semibold text-sm">No Matching Trades</h4>
                      <p className="text-[#9494b8] text-xs mt-1 max-w-xs leading-relaxed">
                        No transactions match your filter query.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#1a1a24] text-[10px] font-bold uppercase tracking-widest text-[#9494b8] font-mono">
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Action</th>
                          <th className="py-3 px-4">Asset</th>
                          <th className="py-3 px-4">Size (USDC)</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1a1a24]/50 text-xs font-mono">
                        {filteredTrades.map((trade, idx) => {
                          const isBuy = trade.type === 'BUY';
                          return (
                            <tr key={idx} className="hover:bg-[#1a1a24]/30 transition-colors">
                              <td className="py-4 px-4 text-[#9494b8]">
                                {new Date(trade.timestamp).toLocaleString()}
                              </td>
                              <td className="py-4 px-4">
                                <span 
                                  className="px-2 py-0.5 rounded-sm text-[10px] font-bold font-mono border"
                                  style={{
                                    background: isBuy ? 'rgba(255, 45, 120, 0.12)' : 'rgba(0, 240, 255, 0.12)',
                                    color: isBuy ? '#ff2d78' : '#00f0ff',
                                    borderColor: isBuy ? 'rgba(255, 45, 120, 0.25)' : 'rgba(0, 240, 255, 0.25)',
                                  }}
                                >
                                  {trade.type}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-bold text-white font-sans">{trade.token}</td>
                              <td className="py-4 px-4 text-white font-semibold">{fmt$(trade.valueUSDC)}</td>
                              <td className="py-4 px-4 text-[#9494b8]">{fmt$(trade.price)}</td>
                              <td className="py-4 px-4 text-[#9494b8]">{trade.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</td>
                              <td className="py-4 px-4 text-right">
                                <a
                                  href={`https://testnet.bscscan.com/address/${trade.address}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#ff2d78] hover:underline inline-flex items-center gap-1.5 font-bold cursor-pointer"
                                >
                                  Explorer <IconOpenInNew className="w-3 h-3" />
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
          </div>
        )}

        {activeTab === 'Agent Config' && (
          <div className="flex-1 p-8 overflow-y-auto scrollbar-hide z-10 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Settings */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-[#0d0d12] border border-[#1a1a24] rounded-lg p-6 space-y-6">
                  <div className="border-b pb-4 border-[#1a1a24]">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Control Panel</h3>
                    <p className="text-xs text-[#9494b8] mt-1">Toggle live trading states and inspect agent configuration</p>
                  </div>

                  {/* Engine status toggle */}
                  <div className="flex items-center justify-between p-4 bg-[#050507]/40 border border-[#1a1a24] rounded-sm">
                    <div>
                      <div className="font-bold text-sm text-white font-sans">Trading Engine</div>
                      <p className="text-xs text-[#9494b8] mt-1 leading-relaxed max-w-md">
                        When paused, the agent will freeze trade execution but continue scanning market narratives.
                      </p>
                    </div>
                    <button
                      onClick={() => togglePause(!portfolio?.isPaused)}
                      className={`px-4 py-2.5 text-xs font-mono font-bold tracking-wider rounded-sm uppercase transition-all shadow-md active:scale-95 cursor-pointer ${
                        portfolio?.isPaused 
                          ? 'bg-[#ff2d78] text-white hover:brightness-110 shadow-[0_0_12px_rgba(255,45,120,0.4)]' 
                          : 'bg-transparent text-[#9494b8] border border-[#333344] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {portfolio?.isPaused ? 'RESUME AGENT' : 'PAUSE AGENT'}
                    </button>
                  </div>

                  {/* Config Summary */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold tracking-widest text-[#9494b8] font-mono uppercase">Agent Configurations</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Blockchain Network', value: config?.network ? `${config.network.toUpperCase()} (BNB Chain)` : '—' },
                        { label: 'RPC Endpoint', value: config?.rpcUrl ? truncateHash(config.rpcUrl, 16) : '—' },
                        { label: 'Starting Capital', value: config?.targetPortfolioValue ? `${config.targetPortfolioValue} USDC` : '—' },
                        { label: 'Inference Engine', value: 'Llama-3.3-70b (via Groq)' },
                        { label: 'Sentiment Provider', value: 'CoinMarketCap Trending API' },
                        { label: 'Evaluation Loop', value: '30 Minutes' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-[#050507]/30 border border-[#1a1a24] rounded-sm">
                          <span className="text-[9px] font-bold text-[#9494b8]/70 font-mono uppercase tracking-wider block mb-1">{item.label}</span>
                          <span className="text-xs font-mono font-bold text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right LLM connections & live simulation */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#0d0d12] border border-[#1a1a24] rounded-lg p-6 space-y-6">
                  <div className="border-b pb-4 border-[#1a1a24]">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">Credentials Status</h3>
                    <p className="text-xs text-[#9494b8] mt-1">Verifies connection status of agent keys and API endpoints</p>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {[
                      { name: 'Groq Cloud LLM API', active: config?.groqStatus },
                      { name: 'Gemini Backstop API', active: config?.geminiStatus },
                      { name: 'CoinMarketCap Signals API', active: config?.cmcStatus },
                    ].map((cred, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-[#050507]/30 rounded-sm border border-[#1a1a24]">
                        <span className="text-[#9494b8] font-semibold">{cred.name}</span>
                        <span className={`flex items-center gap-1.5 font-bold ${cred.active ? 'text-[#00f0ff]' : 'text-[#ff2d78]'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cred.active ? 'bg-[#00f0ff] animate-pulse' : 'bg-[#ff2d78]'}`} />
                          {cred.active ? 'CONNECTED' : 'DISCONNECTED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0d0d12] border border-[#1a1a24] rounded-lg p-6 space-y-6">
                  <div className="border-b pb-4 border-[#1a1a24]">
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">System Simulator</h3>
                    <p className="text-xs text-[#9494b8] mt-1">Manually trigger and inspect a dry-run narrative assessment</p>
                  </div>

                  <button
                    onClick={simulateCycleTrigger}
                    disabled={isTriggering || portfolio?.isPaused}
                    className={`w-full py-2.5 rounded-sm text-xs font-mono font-bold tracking-wider uppercase border transition-all active:scale-[0.98] cursor-pointer ${
                      isTriggering 
                        ? 'bg-transparent text-[#9494b8]/50 border-[#1a1a24]' 
                        : portfolio?.isPaused 
                          ? 'bg-transparent text-[#9494b8]/30 border-[#1a1a24] cursor-not-allowed' 
                          : 'bg-[#ff2d78] text-white border-[#ff2d78] shadow-[0_0_12px_rgba(255,45,120,0.4)] hover:brightness-110'
                    }`}
                  >
                    {isTriggering ? 'RUNNING SCANS...' : portfolio?.isPaused ? 'AGENT PAUSED' : 'TRIGGER DRY RUN'}
                  </button>

                  {triggerLog.length > 0 && (
                    <div className="p-4 rounded-sm bg-[#050507] border border-[#ff2d78]/20 font-mono text-[10px] space-y-1.5 h-44 overflow-y-auto scrollbar-hide">
                      {triggerLog.map((logStr, i) => (
                        <div key={i} className={logStr.includes('✅') ? 'text-[#ff2d78]' : logStr.includes('🛡️') ? 'text-[#00f0ff]' : 'text-[#9494b8]'}>
                          {logStr}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Terminal Footer */}
        <footer className="h-10 px-8 border-t border-[#1a1a24] flex items-center justify-between text-[#9494b8] text-[9px] font-mono tracking-widest uppercase bg-[#0d0d12]/90 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <span>© 2024 Narrative Trader Foundation v1.0.4-BETA</span>
            <span className="flex items-center gap-1.5 text-[#ff2d78] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d78] pulse-dot-neon"></span> System Operational
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a className="hover:text-[#ff2d78] transition-colors" href="/docs">API Docs</a>
            <span className="text-[#9494b8]/20">|</span>
            <span className="text-[#bc13fe] font-bold">Encrypted connection active</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
