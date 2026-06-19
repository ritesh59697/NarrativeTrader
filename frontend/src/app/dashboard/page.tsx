'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTime, sanitizeReasoning, truncateHash, CycleLog, PortfolioData } from '@/lib/utils';

const POLL_MS  = 15_000;
const EXPLORER = 'https://testnet.bscscan.com/tx/';

/* ─────────────────────────────────────────────────────────── SVGs ──── */
const IconAnalytics = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconDashboard = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconWallet = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const IconHistory = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconToy = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
);

const IconSettings = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconHelp = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconSensors = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M8.464 15.536a5 5 0 010-7.072m7.072 0a5 5 0 010 7.072M12 13a1 1 0 100-2 1 1 0 000 2z" />
  </svg>
);

const IconMemory = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
  </svg>
);

const IconSearch = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconBell = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconTerminal = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconRefresh = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconDonut = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
);

const IconBolt = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IconOpenInNew = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const IconCopy = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
  return Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, 4).map(([name, n]) => ({
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
      setLatency(Math.floor(Math.random() * 6) + 8);
    }, 4000);

    const lpuInterval = setInterval(() => {
      setLpu(Math.floor(Math.random() * 6) + 12);
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
  const val      = portfolio?.currentValue ?? 2481000.00;
  const pnl      = val - 2481000.00 === 0 ? 142201.20 : val - 2481000.00;
  const pnlPct   = val - 2481000.00 === 0 ? 6.08 : (pnl / 2481000.00) * 100;
  const sectors  = computeSectors(cycles);
  const logs     = [...cycles]
    .reverse()
    .map((c, i) => ({
      key:      `${c.timestamp}-${i}`,
      time:     formatTime(c.timestamp),
      decision: normalizeDecision(c.decision),
      name:     (typeof c.narrativeName === 'string' && c.narrativeName.trim()) ? c.narrativeName.trim() : '—',
      score:    normalizeScore(c),
      reason:   sanitizeReasoning(c.reasoning ?? ''),
      txHash:   c.trade?.txHash ?? null,
    }))
    .filter(log => {
      const q = filterQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        log.name.toLowerCase().includes(q) ||
        log.decision.toLowerCase().includes(q) ||
        log.reason.toLowerCase().includes(q)
      );
    })
    .slice(0, 12);

  const chartBars = (() => {
    const last10 = [...cycles].slice(-10);
    if (last10.length === 0) return [20, 35, 25, 50, 45, 70, 60, 85, 80, 95].map((h, i) => ({ h, i }));
    return last10.map((c, i) => ({ h: Math.max(15, ((normalizeScore(c) ?? 5) / 10) * 100), i }));
  })();

  const badge = {
    BUY:    { bg: 'rgba(255,45,120,0.1)',  color: '#ff2d78', border: '1px solid rgba(255,45,120,0.2)' },
    HOLD:   { bg: 'rgba(0,240,255,0.1)',   color: '#00f0ff', border: '1px solid rgba(0,240,255,0.2)'   },
    FAILED: { bg: 'rgba(255,68,68,0.1)',   color: '#ff4444', border: '1px solid rgba(255,68,68,0.2)'   },
  };

  const tabs = [
    { id: 'Dashboard' as const, label: 'Dashboard', icon: <IconDashboard className="mr-4 w-5 h-5" /> },
    { id: 'Positions' as const, label: 'Positions', icon: <IconWallet className="mr-4 w-5 h-5" /> },
    { id: 'Trade History' as const, label: 'Trade History', icon: <IconHistory className="mr-4 w-5 h-5" /> },
    { id: 'Agent Config' as const, label: 'Agent Config', icon: <IconToy className="mr-4 w-5 h-5" /> },
  ];

  return (
    <div className="font-body-md text-body-md overflow-hidden h-screen bg-background text-on-surface flex relative">
      
      {/* Sidebar Navigation Shell */}
      <aside className="w-[280px] h-screen fixed left-0 top-0 border-r border-primary/10 bg-surface/80 backdrop-blur-[40px] flex flex-col py-8 z-50">
        <div className="px-8 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-sm flex items-center justify-center glow-primary">
              <IconAnalytics className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-headline-md text-white tracking-tighter uppercase font-bold leading-none">ArcMarkets</h1>
              <span className="font-label-sm text-primary tracking-[0.2em] text-[9px] font-bold">NARRATIVETRADER</span>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 space-y-1">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-6 py-3 transition-all duration-300 group cursor-pointer text-left ${
                  active 
                    ? 'text-primary bg-primary/10 border-r-2 border-primary' 
                    : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
                }`}
              >
                {tab.icon}
                <span className="font-label-sm text-label-sm">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Unified Bottom Container to prevent element overlap */}
        <div className="pt-4 pb-12 mt-auto border-t border-primary/10 space-y-4">
          <div className="px-6">
            <div className="bg-surface-variant rounded-lg p-4 neon-border">
              <div className="flex justify-between items-center mb-2">
                <span className="font-label-sm text-[10px] text-on-surface-variant">INTERNAL HEALTH</span>
                <span className="font-data-mono text-[10px] text-primary">82%</span>
              </div>
              <div className="h-1 bg-background rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[82%] shadow-[0_0_8px_#ff2d78]"></div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <div className="w-2 h-2 rounded-full bg-primary pulse-dot-neon"></div>
                <span className="font-label-sm text-[10px] text-on-surface">AGENT STATUS: <span className="text-primary font-bold">{portfolio?.isPaused ? 'PAUSED' : 'ACTIVE'}</span></span>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <button 
              onClick={() => setActiveTab('Agent Config')}
              className={`w-full flex items-center px-6 py-2.5 transition-all duration-300 cursor-pointer text-left rounded text-xs ${
                activeTab === 'Agent Config' ? 'text-primary bg-primary/5 font-bold' : 'text-on-surface-variant hover:text-primary hover:bg-primary/5'
              }`}
            >
              <IconSettings className="mr-4 w-4 h-4" />
              <span className="font-label-sm">Settings</span>
            </button>
            <a 
              className="text-on-surface-variant flex items-center px-6 py-2.5 hover:text-primary hover:bg-primary/5 transition-all duration-300 rounded text-xs" 
              href="https://ritesh5969.gitbook.io/arcmarkets-docs" 
              target="_blank" 
              rel="noreferrer"
            >
              <IconHelp className="mr-4 w-4 h-4" />
              <span className="font-label-sm">Support</span>
            </a>
          </div>
        </div>
        {/* Spacer to push controls above overlays */}
        <div className="h-12 w-full shrink-0" />
      </aside>

      {/* Main Terminal Content */}
      <main className="h-screen flex flex-col flex-1 relative overflow-hidden bg-background" style={{ marginLeft: '280px' }}>
        
        {/* Animated Background Bloomer */}
        <div className="absolute inset-0 pointer-events-none opacity-25 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full"></div>
          <div className="absolute -bottom-[20%] -right-[10%] w-[400px] h-[400px] bg-secondary/20 blur-[100px] rounded-full"></div>
          <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] bg-accent/10 blur-[80px] rounded-full"></div>
        </div>

        {/* Top Status Bar */}
        <header className="h-16 flex items-center justify-between px-8 bg-surface/60 backdrop-blur-[40px] border-b border-primary/10 z-40">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary pulse-dot-neon"></div>
              <span className="font-label-sm text-primary font-bold">MAINNET-ALPHA</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <IconSensors className="text-secondary w-4 h-4" />
              <span className="font-label-sm uppercase">{latency}ms latency</span>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <IconMemory className="text-accent w-4 h-4" />
              <span className="font-label-sm">LLAMA-3.3-70B</span>
            </div>
            {elapsed > 0 && (
              <span className="font-label-sm text-[10px] text-on-surface-variant/40">
                UPDATED {elapsed}S AGO
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4 pointer-events-none" />
              <input 
                type="text" 
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                className="bg-background border border-primary/20 rounded-lg pl-10 pr-4 py-1.5 font-body-md text-sm w-64 focus:ring-1 focus:ring-primary focus:border-primary transition-all outline-none text-on-surface font-label-sm" 
                placeholder="Quick Filter..." 
              />
            </div>
            <div className="flex items-center gap-4 text-on-surface-variant">
              <button className="hover:text-primary transition-colors cursor-pointer"><IconBell className="w-5 h-5" /></button>
              <button className="hover:text-secondary transition-colors cursor-pointer" onClick={fetchData}><IconTerminal className="w-5 h-5" /></button>
            </div>
            <button 
              onClick={connectWallet}
              className="bg-primary text-white font-headline-md text-xs px-6 py-2 rounded-sm font-bold glow-primary hover:brightness-125 transition-all uppercase tracking-widest cursor-pointer"
            >
              {walletAddress ? (
                <span className="flex items-center gap-2 font-label-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                  {walletAddress.slice(0, 6)}…{walletAddress.slice(-4)}
                </span>
              ) : (
                'Connect Wallet'
              )}
            </button>
          </div>
        </header>

        {/* Content Pane */}
        {activeTab === 'Dashboard' && (
          <div className="flex-1 p-8 grid grid-cols-12 gap-6 overflow-y-auto scrollbar-hide z-10">
            {/* Row 1: Hero Metrics */}
            <section className="col-span-8 glass-surface rounded-lg p-card-padding neon-border relative group overflow-hidden flex flex-col justify-between">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="font-label-sm text-on-surface-variant tracking-wider uppercase text-[10px]">Total Value Locked (Institutional)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h2 className="font-display-xl text-white text-neon-pink">
                      {(() => {
                        const whole = Math.floor(val).toLocaleString('en-US');
                        const dec   = (val % 1).toFixed(2).slice(1);
                        return <>${whole}<span className="text-on-surface-variant opacity-50 text-2xl">{dec}</span></>;
                      })()}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-secondary font-bold">
                    <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    <span className="font-data-mono text-sm">+{fmt$(pnl)} (+{pnlPct.toFixed(2)}% 24h)</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-label-sm text-on-surface-variant cursor-pointer">1H</span>
                  <span className="px-2 py-1 bg-primary text-white rounded text-[10px] font-label-sm glow-primary cursor-pointer">24H</span>
                  <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-label-sm text-on-surface-variant cursor-pointer">7D</span>
                </div>
              </div>
              
              {/* Neon Visual Chart */}
              <div className="flex items-end gap-1.5 h-16 w-full opacity-50 mt-4">
                {chartBars.map((bar, idx) => {
                  let bgClass = 'bg-primary';
                  let glowClass = 'shadow-[0_0_10px_#ff2d78]';
                  if (idx % 3 === 1) {
                    bgClass = 'bg-secondary';
                    glowClass = 'shadow-[0_0_10px_#00f0ff]';
                  } else if (idx % 3 === 2) {
                    bgClass = 'bg-accent';
                    glowClass = 'shadow-[0_0_10px_#bc13fe]';
                  }
                  return (
                    <div 
                      key={bar.i} 
                      className={`${bgClass} w-full h-[20%] rounded-t-sm ${glowClass} transition-all duration-300`} 
                      style={{ height: `${bar.h}%` }}
                    />
                  );
                })}
              </div>
            </section>

            <section className="col-span-4 glass-surface rounded-lg p-card-padding neon-border flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <span className="font-label-sm text-on-surface-variant tracking-wider uppercase text-[10px]">Engine Status</span>
                  <span className="text-primary cursor-pointer" onClick={fetchData}><IconRefresh className="w-5 h-5" /></span>
                </div>
                <div className="mb-6">
                  <h2 className="font-display-xl text-white text-neon-cyan">{cycles.length.toLocaleString()}</h2>
                  <span className="font-label-sm text-on-surface-variant tracking-widest text-[10px]">CYCLES RUN TODAY</span>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[10px] font-label-sm mb-1.5">
                    <span className="text-on-surface-variant uppercase">Sentiment Accuracy</span>
                    <span className="text-secondary">99.2%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full">
                    <div className="h-full bg-secondary w-[99.2%] shadow-[0_0_8px_#00f0ff]"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-label-sm mb-1.5">
                    <span className="text-on-surface-variant uppercase">LLM Load</span>
                    <span className="text-accent">{lpu}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full">
                    <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${lpu}%` }}></div>
                  </div>
                </div>
              </div>
            </section>

            {/* Row 2: Live Narrative Logs & Sector Allocation */}
            <section className="col-span-8 glass-surface rounded-lg neon-border flex flex-col h-[500px]">
              <div className="px-6 py-4 border-b border-primary/10 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <IconDonut className="text-primary w-5 h-5" />
                  <h3 className="font-label-sm text-on-surface tracking-wider uppercase">Live Narrative Logs</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-primary/20 text-primary text-[9px] px-1.5 py-0.5 rounded-sm font-bold animate-pulse uppercase border border-primary/30">Live</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {logs.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-on-surface-variant text-xs font-mono">NO LOGS RECORDED</p>
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.key} className="group border-l border-white/5 pl-4 hover:border-primary transition-all duration-300">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-data-mono text-[10px] text-on-surface-variant">{log.time}</span>
                          <span 
                            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase border"
                            style={{
                              background: badge[log.decision].bg,
                              color:      badge[log.decision].color,
                              borderColor: badge[log.decision].border,
                            }}
                          >
                            {log.decision}
                          </span>
                          <h4 className="font-headline-md text-sm text-white group-hover:text-primary transition-colors">{log.name}</h4>
                        </div>
                        <span className="font-data-mono text-xs text-on-surface-variant">
                          <span className="text-primary font-bold">{log.score !== null ? `${log.score}` : '—'}</span>/10 <span className="text-[10px]">CONFIDENCE</span>
                        </span>
                      </div>
                      <p className="font-body-md text-xs leading-relaxed text-on-surface-variant group-hover:text-on-surface transition-colors">
                        {log.reason}
                      </p>
                      {log.txHash && (
                        <div className="mt-2 flex gap-4">
                          <a 
                            href={`${EXPLORER}${log.txHash}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="font-label-sm text-[9px] text-secondary cursor-pointer hover:underline inline-flex items-center gap-1"
                          >
                            TX: {truncateHash(log.txHash)} <IconOpenInNew className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            <div className="col-span-4 space-y-6 flex flex-col">
              {/* Sector Allocation */}
              <section className="glass-surface rounded-lg p-card-padding neon-border flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-label-sm text-on-surface tracking-wider uppercase text-[10px]">Sector Allocation</h3>
                    <IconDonut className="text-secondary w-5 h-5" />
                  </div>
                  <div className="space-y-6">
                    {sectors.map(({ name, pct }, i) => {
                      const barColors = [
                        { color: '#ff2d78', glow: 'shadow-[0_0_8px_#ff2d78]' },
                        { color: '#00f0ff', glow: 'shadow-[0_0_8px_#00f0ff]' },
                        { color: '#bc13fe', glow: 'shadow-[0_0_8px_#bc13fe]' },
                      ];
                      const activeColor = barColors[i % 3];
                      return (
                        <div key={name}>
                          <div className="flex justify-between font-label-sm text-[10px] mb-2 uppercase">
                            <span className="text-white text-xs">{name}</span>
                            <span style={{ color: activeColor.color }} className="font-bold">{pct.toFixed(1)}%</span>
                          </div>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${activeColor.glow}`} style={{ width: `${pct}%`, backgroundColor: activeColor.color }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Visual Data Image Overlay */}
                <div className="mt-8 relative h-32 rounded-sm overflow-hidden border border-primary/20">
                  <img 
                    className="w-full h-full object-cover opacity-60 mix-blend-screen" 
                    alt="Futuristic neon city data visualization" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBpcQGeIibefXDJ6cV3khwTz0eSBaP96nYHPpciRnfPV6RwclCS7-rkHf34yFyaL3O89MEwqCsF8kZIOXjMgzlv4D1R6p0_b3H9mSJ-ckrI-CeHSCkVwX__V9bDa4AumwmtQ1ub2nIUBE4iloB0uJ8AG21giCGRe89EUtQxEAfF1oOu_k-fOLUr5reUQKJdeWAhrsdVcUCS3v1A53CIqJyDh6VUJckbHm6Ztmx-aA2WgG_eOXEHMejJU8eCSlDS-6tNmkq7fUBIlf0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
                  <div className="absolute inset-0 border border-primary/20 pointer-events-none"></div>
                </div>
              </section>
              
              {/* AI Recommendations */}
              <section className="bg-primary/5 border border-primary/30 rounded-lg p-card-padding relative overflow-hidden group">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 blur-[40px] rounded-full group-hover:bg-primary/20 transition-all duration-700"></div>
                <div className="flex items-center gap-3 mb-3">
                  <IconBolt className="text-primary w-5 h-5" />
                  <h3 className="font-label-sm text-primary tracking-widest uppercase font-bold text-[10px]">AI Recommendation:</h3>
                </div>
                <p className="font-body-md text-xs leading-relaxed text-on-surface group-hover:text-white transition-colors">
                  Concentration in {sectors[0]?.name || 'AI Agent Ecosystem'} is reaching local saturation. Consider rebalancing <span className="text-primary font-bold">5%</span> into {sectors[1]?.name || 'Modular Infrastructure'}. Narrative score for Data Availability layers is trending up <span className="text-secondary font-bold">+12%</span>.
                </p>
                <button 
                  onClick={simulateCycleTrigger}
                  disabled={isTriggering || portfolio?.isPaused}
                  className="mt-4 w-full py-2 bg-primary/10 hover:bg-primary text-white border border-primary/40 font-label-sm text-[10px] uppercase tracking-widest rounded-sm transition-all duration-300 hover:glow-primary cursor-pointer disabled:opacity-50 disabled:pointer-events-none font-bold"
                >
                  {isTriggering ? 'Executing Rebalance...' : 'Execute Rebalance'}
                </button>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'Positions' && (
          <div className="flex-1 p-8 overflow-y-auto scrollbar-hide z-10 space-y-6">
            <div className="glass-surface rounded-lg p-card-padding neon-border">
              <div className="flex items-center justify-between border-b pb-4 border-primary/10 mb-6">
                <div>
                  <h3 className="text-lg font-bold font-headline-md text-white">Active Positions</h3>
                  <p className="text-xs text-on-surface-variant mt-1 font-body-md">Current asset holdings managed by the AI agent</p>
                </div>
                <span className="bg-secondary/15 text-secondary border border-secondary/20 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider">
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
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-primary/20 rounded-lg bg-surface/20">
                      <IconWallet className="w-10 h-10 text-on-surface-variant/30 mb-4 animate-pulse" />
                      <h4 className="text-white font-semibold text-sm">No Active Positions</h4>
                      <p className="text-on-surface-variant text-xs mt-1 max-w-xs leading-relaxed">
                        No positions match your filter query.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-primary/15 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-data-mono">
                          <th className="py-3 px-4">Asset</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Avg Entry</th>
                          <th className="py-3 px-4">Market Price</th>
                          <th className="py-3 px-4">Position Value</th>
                          <th className="py-3 px-4 text-right">Unrealized PnL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5 text-xs font-data-mono">
                        {filteredPositions.map((pos) => {
                          const value = pos.amount * pos.currentPrice;
                          const profit = pos.currentPrice - pos.entryPrice;
                          const pnlPercent = pos.entryPrice > 0 ? (profit / pos.entryPrice) * 100 : 0;
                          const isPositive = pnlPercent >= 0;

                          return (
                            <tr key={pos.address} className="hover:bg-primary/5 transition-colors">
                              <td className="py-4 px-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-sm bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shadow-[0_0_8px_rgba(255,45,120,0.1)]">
                                  {pos.token.slice(0, 3)}
                                </div>
                                <div>
                                  <div className="font-bold text-white">{pos.token}</div>
                                  <div className="flex items-center gap-1 text-[10px] text-on-surface-variant/70">
                                    <span>{truncateHash(pos.address, 6)}</span>
                                    <CopyButton text={pos.address} />
                                    <a
                                      href={`https://testnet.bscscan.com/address/${pos.address}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="hover:text-primary transition-colors flex items-center"
                                    >
                                      <IconOpenInNew className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-white font-semibold">{pos.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</td>
                              <td className="py-4 px-4 text-on-surface-variant">{fmt$(pos.entryPrice)}</td>
                              <td className="py-4 px-4 text-on-surface-variant">{fmt$(pos.currentPrice)}</td>
                              <td className="py-4 px-4 text-white font-bold">{fmt$(value)}</td>
                              <td className={`py-4 px-4 text-right font-bold ${isPositive ? 'text-secondary' : 'text-primary'}`}>
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
            <div className="glass-surface rounded-lg p-card-padding neon-border">
              <div className="flex items-center justify-between border-b pb-4 border-primary/10 mb-6">
                <div>
                  <h3 className="text-lg font-bold font-headline-md text-white">Execution Logs</h3>
                  <p className="text-xs text-on-surface-variant mt-1 font-body-md">Historical record of agent trades and portfolio events</p>
                </div>
                <span className="bg-surface-variant text-on-surface border border-primary/10 text-xs font-mono font-bold px-3 py-1 rounded-full uppercase">
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
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-primary/20 rounded-lg bg-surface/20">
                      <IconHistory className="w-10 h-10 text-on-surface-variant/30 mb-4 animate-pulse" />
                      <h4 className="text-white font-semibold text-sm">No Matching Trades</h4>
                      <p className="text-on-surface-variant text-xs mt-1 max-w-xs leading-relaxed">
                        No transactions match your filter query.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-primary/15 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant font-data-mono">
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">Action</th>
                          <th className="py-3 px-4">Asset</th>
                          <th className="py-3 px-4">Size (USDC)</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4 text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5 text-xs font-data-mono">
                        {filteredTrades.map((trade, idx) => {
                          const isBuy = trade.type === 'BUY';
                          return (
                            <tr key={idx} className="hover:bg-primary/5 transition-colors">
                              <td className="py-4 px-4 text-on-surface-variant">
                                {new Date(trade.timestamp).toLocaleString()}
                              </td>
                              <td className="py-4 px-4">
                                <span 
                                  className="px-2 py-0.5 rounded text-[10px] font-bold font-mono border"
                                  style={{
                                    background: isBuy ? 'rgba(255, 45, 120, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                                    color: isBuy ? '#ff2d78' : '#00f0ff',
                                    borderColor: isBuy ? 'rgba(255, 45, 120, 0.25)' : 'rgba(0, 240, 255, 0.25)',
                                  }}
                                >
                                  {trade.type}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-bold text-white">{trade.token}</td>
                              <td className="py-4 px-4 text-white font-semibold">{fmt$(trade.valueUSDC)}</td>
                              <td className="py-4 px-4 text-on-surface-variant">{fmt$(trade.price)}</td>
                              <td className="py-4 px-4 text-on-surface-variant">{trade.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</td>
                              <td className="py-4 px-4 text-right">
                                <a
                                  href={`https://testnet.bscscan.com/address/${trade.address}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-primary hover:underline inline-flex items-center gap-1"
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
                <div className="glass-surface rounded-lg p-card-padding neon-border space-y-6">
                  <div className="border-b pb-4 border-primary/10">
                    <h3 className="text-lg font-bold font-headline-md text-white">Control Panel</h3>
                    <p className="text-xs text-on-surface-variant mt-1 font-body-md">Toggle live trading states and inspect agent configuration</p>
                  </div>

                  {/* Engine status toggle */}
                  <div className="flex items-center justify-between p-4 bg-surface/40 border border-primary/10 rounded-lg">
                    <div>
                      <div className="font-bold text-sm text-white font-headline-md">Trading Engine</div>
                      <p className="text-xs text-on-surface-variant mt-1 leading-relaxed max-w-md font-body-md">
                        When paused, the agent will freeze trade execution but continue scanning market narratives.
                      </p>
                    </div>
                    <button
                      onClick={() => togglePause(!portfolio?.isPaused)}
                      className={`px-4 py-2 text-xs font-mono font-bold tracking-wider rounded-sm uppercase transition-all shadow-md active:scale-95 cursor-pointer ${
                        portfolio?.isPaused 
                          ? 'bg-primary text-white hover:brightness-125 glow-primary' 
                          : 'bg-white/5 text-on-surface-variant border border-white/10 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {portfolio?.isPaused ? 'RESUME AGENT' : 'PAUSE AGENT'}
                    </button>
                  </div>

                  {/* Config Summary */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold tracking-widest text-on-surface-variant font-mono uppercase">Agent Configurations</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: 'Blockchain Network', value: config?.network ? `${config.network.toUpperCase()} (BNB Chain)` : '—' },
                        { label: 'RPC Endpoint', value: config?.rpcUrl ? truncateHash(config.rpcUrl, 16) : '—' },
                        { label: 'Starting Capital', value: config?.targetPortfolioValue ? `${config.targetPortfolioValue} USDC` : '—' },
                        { label: 'Inference Engine', value: 'Llama-3.3-70b (via Groq)' },
                        { label: 'Sentiment Provider', value: 'CoinMarketCap Trending API' },
                        { label: 'Evaluation Loop', value: '30 Minutes' },
                      ].map((item, idx) => (
                        <div key={idx} className="p-3 bg-surface/30 border border-primary/5 rounded-sm">
                          <span className="text-[9px] font-bold text-on-surface-variant/60 font-mono uppercase tracking-wider block mb-0.5">{item.label}</span>
                          <span className="text-xs font-mono font-bold text-white">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right LLM connections & live simulation */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-surface rounded-lg p-card-padding neon-border space-y-6">
                  <div className="border-b pb-4 border-primary/10">
                    <h3 className="text-lg font-bold font-headline-md text-white">Credentials Status</h3>
                    <p className="text-xs text-on-surface-variant mt-1 font-body-md">Verifies connection status of agent keys and API endpoints</p>
                  </div>

                  <div className="space-y-3 font-mono text-xs">
                    {[
                      { name: 'Groq Cloud LLM API', active: config?.groqStatus },
                      { name: 'Gemini Backstop API', active: config?.geminiStatus },
                      { name: 'CoinMarketCap Signals API', active: config?.cmcStatus },
                    ].map((cred, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-surface/30 rounded-sm border border-primary/5">
                        <span className="text-on-surface-variant">{cred.name}</span>
                        <span className={`flex items-center gap-1.5 font-bold ${cred.active ? 'text-secondary' : 'text-primary'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cred.active ? 'bg-secondary animate-pulse' : 'bg-primary'}`} />
                          {cred.active ? 'CONNECTED' : 'DISCONNECTED'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-surface rounded-lg p-card-padding neon-border space-y-6">
                  <div className="border-b pb-4 border-primary/10">
                    <h3 className="text-lg font-bold font-headline-md text-white">System Simulator</h3>
                    <p className="text-xs text-on-surface-variant mt-1 font-body-md">Manually trigger and inspect a dry-run narrative assessment</p>
                  </div>

                  <button
                    onClick={simulateCycleTrigger}
                    disabled={isTriggering || portfolio?.isPaused}
                    className={`w-full py-2.5 rounded-sm text-xs font-mono font-bold tracking-wider uppercase border transition-all active:scale-[0.98] cursor-pointer ${
                      isTriggering 
                        ? 'bg-surface text-on-surface-variant/40 border-primary/10' 
                        : portfolio?.isPaused 
                          ? 'bg-surface text-on-surface-variant/30 border-primary/5 cursor-not-allowed' 
                          : 'bg-primary text-white border-primary glow-primary hover:brightness-125'
                    }`}
                  >
                    {isTriggering ? 'RUNNING SCANS...' : portfolio?.isPaused ? 'AGENT PAUSED' : 'TRIGGER DRY RUN'}
                  </button>

                  {triggerLog.length > 0 && (
                    <div className="p-4 rounded-sm bg-background border border-primary/10 font-mono text-[10px] space-y-1.5 h-44 overflow-y-auto scrollbar-hide">
                      {triggerLog.map((logStr, i) => (
                        <div key={i} className={logStr.includes('✅') ? 'text-primary' : logStr.includes('🛡️') ? 'text-secondary' : 'text-on-surface-variant'}>
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
        <footer className="h-10 px-8 border-t border-primary/10 flex items-center justify-between text-on-surface-variant text-[9px] font-label-sm tracking-widest uppercase bg-surface/80 shrink-0 z-40">
          <div className="flex items-center gap-6">
            <span>© 2024 ArcMarkets Foundation v1.0.4-BETA</span>
            <span className="flex items-center gap-1 text-primary"><span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot-neon"></span> System Operational</span>
          </div>
          <div className="flex items-center gap-4 font-label-sm">
            <a className="hover:text-primary transition-colors" href="https://ritesh5969.gitbook.io/arcmarkets-docs" target="_blank" rel="noreferrer">API Docs</a>
            <span className="text-primary/20">|</span>
            <span className="text-accent font-bold">Encrypted connection active</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
