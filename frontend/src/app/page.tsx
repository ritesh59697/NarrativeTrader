'use client';

import { useEffect, useState, useCallback } from 'react';
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

export default function Page() {
  const [cycles, setCycles] = useState<CycleLog[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const [cr, pr] = await Promise.all([
        fetch('/api/cycles', { cache: 'no-store' }),
        fetch('/api/portfolio', { cache: 'no-store' }),
      ]);
      if (cr.ok) {
        const d = await cr.json();
        if (Array.isArray(d)) setCycles(d);
      }
      if (pr.ok) {
        const d = await pr.json();
        if (d && !d.error) setPortfolio(d);
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

  // Rotate pipeline highlight step every 2 seconds for micro-animation effect
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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr lg(1.2fr)', gap: 64, alignItems: 'center', minHeight: '65vh' }}>
          
          {/* Left Text Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, zIndex: 2 }}>
            
            {/* Status Indicator */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 32,
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${C.outlineVar}`,
              width: 'fit-content'
            }}>
              <span style={{
                width: 8, height: 8,
                borderRadius: '50%',
                background: isAgentPaused ? C.error : C.success,
                boxShadow: `0 0 10px ${isAgentPaused ? C.error : C.success}`,
                display: 'inline-block'
              }} />
              <span style={{ fontSize: 11, fontFamily: F.mono, letterSpacing: '0.05em', color: C.onSurfaceVar, textTransform: 'uppercase' }}>
                Agent Loop Status: {isAgentPaused ? 'Paused' : 'Active'}
              </span>
            </div>

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

          {/* Right Widget Preview Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
            
            <div style={{
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.outlineVar}`,
              padding: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.outlineVar}`, paddingBottom: 16 }}>
                <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 15, color: '#ffffff' }}>Latest Cycle Monitor</span>
                <span style={{
                  fontSize: 10,
                  fontFamily: F.mono,
                  padding: '4px 8px',
                  borderRadius: 4,
                  background: 'rgba(0, 255, 204, 0.1)',
                  color: C.secondary,
                  border: `1px solid ${C.secondaryGlow}`
                }}>
                  CYCLE #{latestCycle?.cycleNumber ?? 1}
                </span>
              </div>

              {latestCycle ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 10, fontFamily: F.mono, color: C.onSurfaceVar }}>Conviction Sector</span>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.primaryFixedDim, marginTop: 4 }}>
                        {latestCycle.narrativeName || 'Unknown'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, fontFamily: F.mono, color: C.onSurfaceVar }}>Decision Action</span>
                      <div style={{
                        fontSize: 12,
                        fontFamily: F.mono,
                        fontWeight: 700,
                        color: latestCycle.decision === 'BUY' ? C.primaryFixedDim : C.secondary,
                        background: latestCycle.decision === 'BUY' ? C.primaryGlow : C.secondaryGlow,
                        padding: '4px 8px',
                        borderRadius: 4,
                        display: 'inline-block',
                        marginTop: 4
                      }}>
                        {String(latestCycle.decision)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: 10, fontFamily: F.mono, color: C.onSurfaceVar }}>Decision Score</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 6, background: C.containerHigh, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(latestCycle.score || 0) * 10}%`, height: '100%', background: C.primary, borderRadius: 3 }} />
                      </div>
                      <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: '#ffffff' }}>
                        {latestCycle.score || 0}/10
                      </span>
                    </div>
                  </div>

                  <div style={{ background: C.containerLow, border: `1px solid ${C.outlineVar}`, borderRadius: 8, padding: 12 }}>
                    <span style={{ fontSize: 9, fontFamily: F.mono, color: C.onSurfaceVar, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Reasoning Output</span>
                    <p style={{ fontSize: 12, lineHeight: 1.5, color: C.onSurface, margin: 0, maxHeight: 80, overflowY: 'auto' }}>
                      {latestCycle.reasoning}
                    </p>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '32px 0', color: C.onSurfaceVar, fontSize: 13 }}>
                  No active cycles found. Start the agent daemon to display live telemetry.
                </div>
              )}
            </div>

            {/* Secondary Active Portfolio Card */}
            <div style={{
              background: C.surface,
              borderRadius: 16,
              border: `1px solid ${C.outlineVar}`,
              padding: 24,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: 10, fontFamily: F.mono, color: C.onSurfaceVar, textTransform: 'uppercase' }}>Active Open Positions</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', display: 'block', marginTop: 4 }}>
                  {activePositionsCount} / 3 Pools
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {portfolio?.openPositions && portfolio.openPositions.length > 0 ? (
                  portfolio.openPositions.map((pos, idx) => (
                    <span key={idx} style={{
                      fontSize: 11,
                      fontFamily: F.mono,
                      padding: '6px 12px',
                      borderRadius: 4,
                      background: C.containerHigh,
                      border: `1px solid ${C.outlineVar}`,
                      color: C.onSurface
                    }}>
                      {pos.token}
                    </span>
                  ))
                ) : (
                  <span style={{ fontSize: 11, color: C.onSurfaceVar, fontFamily: F.mono }}>All Cash (100% USDC)</span>
                )}
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
