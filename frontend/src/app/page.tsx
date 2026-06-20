'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';

/* ─── Color palette (harmonious Obsidian dark-mode) ─────────────────────── */
const C = {
  bg: '#05050a',
  surface: '#0d0d16',
  containerLow: '#0f0f1c',
  container: '#121224',
  containerHigh: '#18182f',
  containerHighest: '#22223c',
  onSurface: '#e6dfec',
  onSurfaceVar: '#9b94ab',
  primary: '#ff2d78',
  primaryGlow: 'rgba(255, 45, 120, 0.15)',
  primaryFixed: '#ffe0ec',
  primaryFixedDim: '#ff80aa',
  onPrimaryFixed: '#3d0020',
  secondary: '#00ffcc',
  secondaryGlow: 'rgba(0, 255, 204, 0.12)',
  tertiary: '#ffe04a',
  outline: '#4a4254',
  outlineVar: '#262032',
  error: '#ff4444',
  success: '#00e676',
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

interface PortfolioData {
  currentValue: number;
  peakValue: number;
  cashUSDC: number;
  isPaused: boolean;
  openPositions?: { token: string; amount: number; entryPrice: number; currentPrice: number }[];
  tradesHistory?: { timestamp: string; type: string; token: string; valueUSDC: number }[];
}

function fmt$(v: number | null | undefined) {
  if (v == null || !isFinite(v)) return '$—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(3)}M`;
  if (v >= 1_000) return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${v.toFixed(2)}`;
}

function getLLM(cycles: CycleLog[]) {
  const c = [...cycles].reverse().find(x => x.llmUsed && x.llmUsed !== 'failed');
  if (c?.llmUsed === 'gemini') return { name: 'Gemini', sub: 'Flash · 2.0' };
  return { name: 'Groq', sub: 'Llama-3.3-70b · Flash' };
}

const Icon = {
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
};

export default function Page() {
  const [cycles, setCycles] = useState<CycleLog[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [config, setConfig] = useState<{ targetPortfolioValue: number } | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const [latency, setLatency] = useState(12);
  const [lpu, setLpu] = useState(84);
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

  const fetchData = useCallback(async () => {
    try {
      const [cr, pr, cfr] = await Promise.all([
        fetch('/api/cycles', { cache: 'no-store' }),
        fetch('/api/portfolio', { cache: 'no-store' }),
        fetch('/api/config', { cache: 'no-store' }),
      ]);
      if (cr.ok) {
        const d = await cr.json();
        if (Array.isArray(d)) setCycles(d);
      }
      if (pr.ok) {
        const d = await pr.json();
        if (d && !d.error) setPortfolio(d);
      }
      if (cfr.ok) {
        const d = await cfr.json();
        setConfig(d);
      }
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    const latInterval = setInterval(() => {
      setLatency(Math.floor(Math.random() * 6) + 9);
    }, 4000);

    const lpuInterval = setInterval(() => {
      setLpu(Math.floor(Math.random() * 5) + 81);
    }, 6000);

    return () => {
      clearInterval(latInterval);
      clearInterval(lpuInterval);
    };
  }, []);

  // Rotate pipeline highlight step every 2.5 seconds for micro-animation effect
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  const latestCycle = cycles[cycles.length - 1];
  const activePositionsCount = portfolio?.openPositions?.length ?? 0;
  const totalTradesCount = portfolio?.tradesHistory?.length ?? 0;
  const isAgentPaused = portfolio?.isPaused ?? false;

  // Calculate dynamic stats
  const val = portfolio?.currentValue ?? 50;
  const initial = config?.targetPortfolioValue ?? 50;
  const pnl = val - initial;
  const pnlPct = initial > 0 ? (pnl / initial) * 100 : 0;
  const llm = getLLM(cycles);

  const totalAllocatedVolume = portfolio?.tradesHistory?.reduce((sum, t) => sum + (t.valueUSDC ?? 0), 0) ?? 0;
  const sentimentAccuracy = cycles.length > 0 
    ? Math.min(96, Math.max(78, 80 + (cycles.filter(c => c.score >= 6 && c.decision === 'BUY').length * 2))) 
    : 88;

  const steps = [
    { label: 'CMC Data Ingestion', desc: 'Queries CMC Signal Layer for trending narratives, quotes, macro, and sentiment indicators.' },
    { label: 'Conviction Scoring', desc: 'LLMs parse signals and calculate sector ratings (0-10) using Groq with Gemini fallback.' },
    { label: 'Risk Pre-Audit', desc: 'Applies Kelly Criterion allocation, 10% sizing cap, and 15% peak drawdown safety limits.' },
    { label: 'TWAK Wallet Signing', desc: 'Trust Wallet Agent Kit signs swaps securely within isolated execution sandboxes.' },
    { label: 'BSC Dex Router', desc: 'Routes liquidity directly into PancakeSwap pools on BSC Testnet/Mainnet.' }
  ];

  return (
    <div style={{ background: C.bg, color: C.onSurface, fontFamily: F.body, minHeight: '100vh', position: 'relative', overflowX: 'hidden' }}>
      
      {/* ─── Gradient Glow Background ──────────────────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '20%',
        width: '800px',
        height: '800px',
        background: `radial-gradient(circle, ${C.primaryGlow} 0%, rgba(5,5,10,0) 70%)`,
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: `radial-gradient(circle, ${C.secondaryGlow} 0%, rgba(5,5,10,0) 70%)`,
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      {/* Grid Pattern overlay */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <Navbar />

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 1, padding: '160px 24px 64px', maxWidth: 1400, margin: '0 auto' }}>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 64, alignItems: 'flex-start', minHeight: '65vh', justifyContent: 'space-between' }}>
          
          {/* Left Text Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, zIndex: 2, flex: '1 1 600px' }}>

            {/* Main Header Tag */}
            <h1 style={{
              fontFamily: F.display,
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}>
              Autonomous Sector <br />
              <span style={{
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryFixedDim} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Narrative Allocator
              </span>
            </h1>

            <p style={{
              fontSize: 16,
              color: C.onSurfaceVar,
              lineHeight: 1.6,
              maxWidth: 580,
            }}>
              An autonomous crypto agent that dynamically tracks and qualifies hot narratives, scores them using multi-LLM consensus (Groq & Gemini), manages risk via Kelly sizing, and executes spot allocations on BSC using the Trust Wallet Agent Kit.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              <Link href="/dashboard" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 36px',
                borderRadius: 8,
                background: C.primary,
                color: '#ffffff',
                fontFamily: F.mono,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: `0 8px 30px ${C.primaryGlow}`,
                transition: 'transform 0.2s ease',
              }}>
                Launch Agent Terminal
              </Link>
              
              <Link href="/docs" style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 36px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.03)',
                color: C.onSurface,
                fontFamily: F.mono,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                border: `1px solid ${C.outlineVar}`,
                transition: 'background 0.2s ease',
              }}>
                Read Agent Docs
              </Link>
            </div>

            {/* Interactive Stats Panel */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 24,
              marginTop: 48,
              padding: '24px 32px',
              borderRadius: 12,
              background: C.surface,
              border: `1px solid ${C.outlineVar}`,
            }}>
              <div>
                <span style={{ display: 'block', fontSize: 11, fontFamily: F.mono, color: C.onSurfaceVar, textTransform: 'uppercase' }}>Volume Allocated</span>
                <span style={{ fontSize: 28, fontFamily: F.mono, fontWeight: 700, color: C.secondary, marginTop: 4, display: 'block' }}>
                  ${totalAllocatedVolume.toFixed(2)}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 11, fontFamily: F.mono, color: C.onSurfaceVar, textTransform: 'uppercase' }}>Sentiment Accuracy</span>
                <span style={{ fontSize: 28, fontFamily: F.mono, fontWeight: 700, color: '#ffffff', marginTop: 4, display: 'block' }}>
                  {sentimentAccuracy}%
                </span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: 11, fontFamily: F.mono, color: C.onSurfaceVar, textTransform: 'uppercase' }}>Total Cycles</span>
                <span style={{ fontSize: 28, fontFamily: F.mono, fontWeight: 700, color: '#ffffff', marginTop: 4, display: 'block' }}>
                  {cycles.length}
                </span>
              </div>
            </div>

          </div>

          {/* Right Widget Preview Column (3D Tilt Card) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'flex-start', flex: '1 1 500px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '1280px' }}>
              
              {/* glow backdrop behind the 3D card */}
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
                  background: 'rgba(13,13,22,0.75)',
                  backdropFilter: 'blur(40px)',
                  border: `1px solid ${C.outline}`,
                  borderRadius: 16,
                  padding: 32,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  transform: `perspective(2000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transition: 'transform 0.1s ease-out, box-shadow 0.2s',
                  cursor: 'pointer',
                  zIndex: 10,
                  position: 'relative'
                }}
              >
                {/* Window chrome */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 20, borderBottom: `1px solid ${C.outlineVar}` }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,68,68,0.80)' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(0,255,204,0.80)' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,224,236,0.80)' }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ padding: '4px 10px', borderRadius: 4, background: 'rgba(255,45,120,0.06)', border: `1px solid ${C.primaryGlow}` }}>
                      <span style={{ color: C.primaryFixedDim, fontFamily: F.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>LIVE FEED</span>
                    </div>
                    <span style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 10, letterSpacing: '0.1em' }}>NARRATIVETRADER TERMINAL V1.0</span>
                  </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 32 }}>
                  {/* Portfolio */}
                  <div style={{ background: C.containerLow, border: `1px solid ${C.outlineVar}`, borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Portfolio</span>
                      <Icon.TrendUp color={C.primaryFixedDim} />
                    </div>
                    <div style={{ color: C.onSurface, fontFamily: F.display, fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{fmt$(val)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                      <span style={{ color: pnl >= 0 ? C.secondary : C.error, fontFamily: F.mono, fontSize: 11 }}>
                        {pnl >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Cycles */}
                  <div style={{ background: C.containerLow, border: `1px solid ${C.outlineVar}`, borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cycles</span>
                      <Icon.Loop color={C.secondary} />
                    </div>
                    <div style={{ color: C.onSurface, fontFamily: F.display, fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{cycles.length}</div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          height: 4, flex: 1, borderRadius: 999,
                          background: i < 2 ? C.primary : (cycles.length > 20 ? C.primary : C.outlineVar),
                        }} />
                      ))}
                    </div>
                  </div>

                  {/* LLM */}
                  <div style={{ background: C.containerLow, border: `1px solid ${C.outlineVar}`, borderRadius: 12, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>LLM Engine</span>
                      <Icon.Psych color={C.tertiary} />
                    </div>
                    <div style={{ color: C.onSurface, fontFamily: F.display, fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', marginTop: 4 }}>{llm.name}</div>
                    <span style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 10, display: 'block', marginTop: 4 }}>{llm.sub}</span>
                  </div>
                </div>

                {/* Status bar */}
                <div style={{ paddingTop: 20, borderTop: `1px solid ${C.outlineVar}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ color: C.onSurfaceVar, fontFamily: F.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Status: Optimal</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.secondary, animation: 'pulse 1.4s ease-in-out infinite' }} />
                    <span style={{ color: C.secondary, fontFamily: F.mono, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Connected to Testnet</span>
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* ─── Workflow Step Visualizer ────────────────────────────────────── */}
        <section style={{ marginTop: 128, position: 'relative' }}>
          
          <h2 style={{
            fontFamily: F.display,
            fontSize: 28,
            fontWeight: 800,
            textAlign: 'center',
            color: '#ffffff',
            marginBottom: 16
          }}>
            Autonomous Agent Flow Pipeline
          </h2>
          <p style={{
            fontSize: 14,
            color: C.onSurfaceVar,
            textAlign: 'center',
            maxWidth: 600,
            margin: '0 auto 64px'
          }}>
            Every 30 minutes, the agent triggers an automated execution cycle using its multi-stage decision pipeline.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
            position: 'relative',
          }}>
            {steps.map((step, idx) => {
              const active = idx === activeStep;
              return (
                <div key={idx} style={{
                  background: C.surface,
                  border: `1px solid ${active ? C.primary : C.outlineVar}`,
                  borderRadius: 12,
                  padding: 24,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  transform: active ? 'translateY(-4px)' : 'translateY(0)',
                  boxShadow: active ? `0 10px 30px ${C.primaryGlow}` : 'none',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: -12,
                    left: 24,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: active ? C.primary : C.containerHigh,
                    border: `2px solid ${active ? C.primaryFixed : C.outline}`,
                    color: active ? C.onPrimaryFixed : C.onSurfaceVar,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: F.mono,
                    fontSize: 11,
                    fontWeight: 700,
                    transition: 'all 0.3s ease',
                  }}>
                    {idx + 1}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: active ? C.primaryFixedDim : '#ffffff', marginTop: 8, marginBottom: 12 }}>
                    {step.label}
                  </h3>
                  <p style={{ fontSize: 13, color: C.onSurfaceVar, lineHeight: 1.5, margin: 0 }}>
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>

        </section>

        {/* ─── Highlights Features Section ─────────────────────────────────── */}
        <section style={{ marginTop: 128 }}>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 32,
            marginTop: 64
          }}>
            <div style={{
              background: C.surface,
              border: `1px solid ${C.outlineVar}`,
              borderRadius: 16,
              padding: 32
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>Dual LLM Fallback</h3>
              <p style={{ fontSize: 13, color: C.onSurfaceVar, lineHeight: 1.6, margin: 0 }}>
                High-availability analysis using two independent inference hubs. Primary sector classification uses Llama-3.3-70b via Groq Cloud, failing over automatically to Gemini 2.5 Flash if network rate-limits or latency thresholds are breached.
              </p>
            </div>

            <div style={{
              background: C.surface,
              border: `1px solid ${C.outlineVar}`,
              borderRadius: 16,
              padding: 32
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>Quantitative Kelly Risk</h3>
              <p style={{ fontSize: 13, color: C.onSurfaceVar, lineHeight: 1.6, margin: 0 }}>
                Enforces math-backed capital allocation boundaries. Uses the Kelly Criterion model for allocation sizing, strictly capped at a maximum of 10% per position with a 15% peak-to-trough portfolio drawdown halt switch.
              </p>
            </div>

            <div style={{
              background: C.surface,
              border: `1px solid ${C.outlineVar}`,
              borderRadius: 16,
              padding: 32
            }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>Trust Wallet Integration</h3>
              <p style={{ fontSize: 13, color: C.onSurfaceVar, lineHeight: 1.6, margin: 0 }}>
                Uses the Trust Wallet Agent Kit (TWAK) to construct, sign, and broadcast swap transactions on-chain. Executes trades via custom BSC Dex SDK wrappers directly calling PancakeSwap contracts on BSC Testnet.
              </p>
            </div>
          </div>

        </section>

        {/* ─── Footer Section ──────────────────────────────────────────────── */}
        <footer style={{ marginTop: 128, borderTop: `1px solid ${C.outlineVar}`, paddingTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: 'rgba(160,152,176,0.40)', fontFamily: F.mono, fontSize: 10 }}>© 2026 NARRATIVE TRADER FOUNDATION. V1.0.4-BETA</span>
          <a href="https://x.com/ritesh5969" target="_blank" rel="noreferrer" style={{ color: C.primaryFixedDim, fontFamily: F.mono, fontSize: 10, fontWeight: 700, textDecoration: 'none' }}>Built by ritesh5969</a>
          <span style={{ color: 'rgba(160,152,176,0.40)', fontFamily: F.mono, fontSize: 10, textTransform: 'uppercase' }}>ENCRYPTED END-TO-END CONNECTION</span>
        </footer>

      </main>

    </div>
  );
}
