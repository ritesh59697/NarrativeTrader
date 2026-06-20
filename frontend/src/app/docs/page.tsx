'use client';

import { useState } from 'react';
import Link from 'next/link';

/* ─── Obsidian Theme Colors ─────────────────────────────────────────────── */
const C = {
  bg:              '#0a0a12',
  surface:         '#0f0f1a',
  containerLow:    '#111118',
  container:       '#141422',
  containerHigh:   '#1e1e30',
  containerHighest:'#28283e',
  onSurface:       '#e8e0f0',
  onSurfaceVar:    '#a098b0',
  primary:         '#ff2d78',
  primaryFixed:    '#ffe0ec',
  primaryFixedDim: '#ff80aa',
  onPrimaryFixed:  '#3d0020',
  secondary:       '#00ffcc',
  tertiary:        '#ffe04a',
  outlineVar:      '#302840',
  error:           '#ff4444',
};

const F = {
  display: "'Sora', sans-serif",
  body:    "'Inter', system-ui, sans-serif",
  mono:    "'Space Grotesk', monospace",
};

interface DocSection {
  id: string;
  title: string;
  category: string;
}

const SECTIONS: DocSection[] = [
  { id: 'intro', title: 'Introduction', category: 'GETTING STARTED' },
  { id: 'features', title: 'Core Features', category: 'GETTING STARTED' },
  { id: 'architecture', title: 'System Architecture', category: 'SYSTEM DETAILS' },
  { id: 'risk', title: 'Risk Guardrails', category: 'SYSTEM DETAILS' },
  { id: 'api', title: 'Local API Reference', category: 'DEVELOPER REFERENCE' },
  { id: 'roadmap', title: 'What\'s Next', category: 'FUTURE OUTLOOK' },
];

/* ─── Code Snippets for APIs ────────────────────────────────────────────── */
const API_CYCLES_JSON = `[
  {
    "timestamp": "2026-06-20T08:00:00.000Z",
    "cycleNumber": 48,
    "narrativeName": "AI Agent Ecosystem",
    "score": 8.4,
    "decision": "HOLD",
    "reasoning": "CMC scanning indicates strong capital rotation into AI coins, but PancakeSwap liquidity thresholds recommend holding execution sizes.",
    "llmUsed": "llama-3.3-70b",
    "trade": null
  }
]`;

const API_PORTFOLIO_JSON = `{
  "peakValue": 100,
  "currentValue": 100,
  "cashUSDC": 80,
  "isPaused": false,
  "openPositions": [
    {
      "token": "VIRTUAL",
      "address": "0x0fd6e8e3fc97a0f1dea012f42174fc6c65a29ac5",
      "entryPrice": 2.15,
      "currentPrice": 2.15,
      "amount": 9.3023,
      "timestamp": "2026-06-18T07:51:10.529Z"
    }
  ],
  "tradesHistory": [
    {
      "timestamp": "2026-06-18T07:51:10.529Z",
      "type": "BUY",
      "token": "VIRTUAL",
      "address": "0x0fd6e8e3fc97a0f1dea012f42174fc6c65a29ac5",
      "amount": 4.6511,
      "price": 2.15,
      "valueUSDC": 10
    }
  ]
}`;

const API_CONFIG_JSON = `{
  "network": "testnet",
  "rpcUrl": "https://data-seed-prebsc-1-s1.binance.org:8545",
  "targetPortfolioValue": 100,
  "groqStatus": true,
  "geminiStatus": true,
  "cmcStatus": true
}`;

/* ─── Copy Button for Code Snippets ──────────────────────────────────────── */
const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{
      position: 'relative',
      marginTop: 16,
      background: 'rgba(17,17,24,0.60)',
      border: `1px solid ${C.outlineVar}`,
      borderRadius: 8,
      padding: '20px',
      fontFamily: F.mono,
      fontSize: 11,
      overflowX: 'auto',
      whiteSpace: 'pre',
      color: '#c5c2d9',
      lineHeight: 1.6,
    }}>
      <button
        onClick={handleCopy}
        style={{
          position: 'absolute',
          right: 12,
          top: 12,
          background: 'rgba(255,45,120,0.10)',
          border: `1px solid ${C.primary}30`,
          borderRadius: 4,
          color: C.primaryFixedDim,
          padding: '4px 10px',
          cursor: 'pointer',
          fontFamily: F.mono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          transition: 'all 0.15s',
        }}
      >
        {copied ? 'COPIED' : 'COPY'}
      </button>
      {code}
    </div>
  );
};

export default function DocsPage() {
  const [activeTopic, setActiveTopic] = useState<string>('intro');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Group sections by category
  const categories = Array.from(new Set(SECTIONS.map(s => s.category)));

  const renderSidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {categories.map(cat => (
        <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{
            fontSize: 10,
            fontFamily: F.mono,
            fontWeight: 700,
            color: 'rgba(160,152,176,0.40)',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '0 8px',
          }}>
            {cat}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.filter(s => s.category === cat).map(sec => {
              const active = activeTopic === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveTopic(sec.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: active ? 'rgba(255,45,120,0.08)' : 'transparent',
                    color: active ? C.primaryFixed : C.onSurfaceVar,
                    border: active ? `1px solid ${C.primary}25` : '1px solid transparent',
                    fontFamily: F.body,
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    width: '100%',
                  }}
                >
                  {sec.title}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{
      background: C.bg,
      minHeight: '100vh',
      color: C.onSurface,
      fontFamily: F.body,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Background Glows */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.15,
        backgroundImage: `linear-gradient(rgba(255,45,120,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,45,120,0.02) 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
      }} />

      {/* Main Header / Topbar */}
      <header style={{
        height: 64,
        borderBottom: `1px solid ${C.outlineVar}`,
        background: C.surface,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              background: 'none',
              border: 'none',
              color: C.onSurface,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: 4,
            }}
            className="md:hidden"
          >
            <svg width={24} height={24} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 28, height: 28,
              background: C.primaryFixed,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.onPrimaryFixed,
            }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontFamily: F.display, fontWeight: 700, textTransform: 'uppercase', lineHeight: 1.1, color: 'white' }}>Narrative</span>
              <span style={{ fontSize: 8, fontFamily: F.mono, fontWeight: 700, letterSpacing: '0.2em', color: C.primary, lineHeight: 1 }}>TRADER</span>
            </div>
          </div>
        </div>

        <Link
          href="/#terminal"
          style={{
            background: 'rgba(255,224,236,0.06)',
            border: `1px solid ${C.primary}30`,
            borderRadius: 6,
            color: C.primaryFixedDim,
            fontFamily: F.mono,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            padding: '8px 16px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            transition: 'background 0.15s',
          }}
        >
          <svg width={14} height={14} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Terminal
        </Link>
      </header>

      {/* Main Container */}
      <div style={{
        display: 'flex',
        flex: 1,
        position: 'relative',
      }}>
        {/* Left Desktop Sidebar */}
        <aside style={{
          width: 280,
          borderRight: `1px solid ${C.outlineVar}`,
          background: C.surface,
          padding: '32px 24px',
          position: 'sticky',
          top: 64,
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
          flexShrink: 0,
          zIndex: 40,
        }} className="hidden md:block">
          {renderSidebarContent()}
        </aside>

        {/* Mobile slide-over drawer sidebar */}
        {mobileMenuOpen && (
          <>
            <div
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.60)',
                backdropFilter: 'blur(4px)',
                zIndex: 140,
              }}
            />
            <aside style={{
              position: 'fixed',
              left: 0, top: 0, bottom: 0,
              width: 280,
              background: C.surface,
              borderRight: `1px solid ${C.outlineVar}`,
              padding: '32px 24px',
              zIndex: 150,
              overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <span style={{ fontSize: 13, fontFamily: F.display, fontWeight: 700, textTransform: 'uppercase', color: 'white' }}>Chapters</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ background: 'none', border: 'none', color: C.onSurfaceVar, cursor: 'pointer' }}
                >
                  <svg width={20} height={20} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {renderSidebarContent()}
            </aside>
          </>
        )}

        {/* Content Pane */}
        <main style={{
          flex: 1,
          padding: '48px 24px',
          maxWidth: 900,
          margin: '0 auto',
          position: 'relative',
          zIndex: 1,
        }}>
          {activeTopic === 'intro' && (
            <article style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.secondary }} />
                <span style={{ fontSize: 11, fontFamily: F.mono, fontWeight: 700, color: C.secondary, letterSpacing: '0.15em', textTransform: 'uppercase' }}>BNB Hack: AI Trading Agent Submission</span>
              </div>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>Introduction</h1>
              <p style={{ fontSize: 14, color: C.onSurface, lineHeight: 1.8, margin: 0 }}>
                Welcome to the documentation center for <strong>NarrativeTrader</strong>. This terminal is an autonomous, on-chain crypto trading agent designed to capture sentiment cycles before they settle into general board leaderboards.
              </p>
              
              <div style={{
                borderLeft: `4px solid ${C.primary}`,
                padding: '16px 20px',
                background: 'rgba(255,45,120,0.05)',
                borderRadius: '0 8px 8px 0',
                fontSize: 13,
                color: C.onSurfaceVar,
                lineHeight: 1.6,
              }}>
                <span style={{ color: C.primaryFixedDim, fontWeight: 700, fontFamily: F.mono, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warning Note</span>
                The engine operates fully autonomously without per-transaction human validation. Ensure that environment config values and private keys are isolated securely before running loops on mainnet.
              </div>

              <h3 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 18, color: 'white', margin: '16px 0 0' }}>Core Philosophy</h3>
              <p style={{ fontSize: 13, color: C.onSurfaceVar, lineHeight: 1.7, margin: 0 }}>
                In crypto markets, narratives determine capital velocity. Indicators like moving averages tell you where volume was, not where it is headed. By monitoring raw trending vectors and validating them against liquidity regimes, the agent triggers trading payloads exactly as narratives build momentum.
              </p>
            </article>
          )}

          {activeTopic === 'features' && (
            <article style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>Core Features</h1>
              <p style={{ fontSize: 14, color: C.onSurface, lineHeight: 1.7, margin: 0 }}>
                NarrativeTrader combines three components to execute decisions reliably under a single workflow.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 16 }}>
                {[
                  { title: '30-Minute Ingestion Scan', desc: 'Queries CoinMarketCap trending API data, news aggregators, and volume deltas to isolate trending sectors and candidate tickers.' },
                  { title: 'Conviction Scoring Engine', desc: 'Pushes prompt payloads to Llama-3.3-70b via Groq to grade assets from 0 to 10 across regime parameters, sentiment, and risk guardrails.' },
                  { title: 'Kelly Criterion Allocator', desc: 'Sizes positions dynamically.conviction never overrides mathematical boundary constraints (capped at 10% per narrative swap).' },
                  { title: 'BSC Execution & Settlement', desc: 'Autonomous transaction signing and contract routing onto PancakeSwap pools using the Trust Wallet Agent Kit.' }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    padding: 20,
                    background: 'rgba(20,20,34,0.30)',
                    border: `1px solid ${C.outlineVar}`,
                    borderRadius: 8,
                  }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontFamily: F.mono, color: C.primary, fontWeight: 700 }}>0{idx + 1}.</span>
                      {item.title}
                    </h4>
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: C.onSurfaceVar, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </article>
          )}

          {activeTopic === 'architecture' && (
            <article style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>System Architecture</h1>
              <p style={{ fontSize: 14, color: C.onSurface, lineHeight: 1.7, margin: 0 }}>
                The terminal is structured into three execution layers that correspond to key BNB Hack tracks:
              </p>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                borderLeft: `2px solid ${C.outlineVar}`,
                paddingLeft: 20,
                margin: '16px 0',
              }}>
                {[
                  { phase: 'SIGNAL LAYER', tech: 'CoinMarketCap MCP Integration', desc: 'Queries social metrics, volume spikes, and trending chains. Resolves narrative pools and updates global scoring context.' },
                  { phase: 'DECISION LAYER', tech: 'Llama-3 & Gemini Backstops', desc: 'Processes signal metrics to generate structured confidence ratios, risk validations, and audit logs explaining choices.' },
                  { phase: 'SETTLEMENT LAYER', tech: 'Trust Wallet Agent Kit & PancakeSwap', desc: 'Auto-approves token limits and swaps USDC capital for narrative tokens directly on BSC Testnet contracts.' }
                ].map((item, idx) => (
                  <div key={idx} style={{ position: 'relative' }}>
                    <div style={{
                      position: 'absolute',
                      left: -27, top: 4,
                      width: 12, height: 12,
                      borderRadius: '50%',
                      background: idx === 0 ? C.secondary : idx === 1 ? C.primary : '#bc13fe',
                    }} />
                    <span style={{ fontSize: 10, fontFamily: F.mono, fontWeight: 700, color: 'rgba(160,152,176,0.60)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.phase} · {item.tech}</span>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: C.onSurface, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </article>
          )}

          {activeTopic === 'risk' && (
            <article style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>Risk Guardrails</h1>
              <p style={{ fontSize: 14, color: C.onSurface, lineHeight: 1.7, margin: 0 }}>
                A custom safety circuit breaker filters every proposed transaction before execution.conviction cannot override safety caps.
              </p>

              <div style={{
                borderLeft: `4px solid ${C.tertiary}`,
                padding: '16px 20px',
                background: 'rgba(255,224,74,0.03)',
                borderRadius: '0 8px 8px 0',
                fontSize: 13,
                color: C.onSurfaceVar,
                lineHeight: 1.6,
                margin: '16px 0',
              }}>
                <span style={{ color: C.tertiary, fontWeight: 700, fontFamily: F.mono, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guardrail Policies</span>
                The following boundaries are actively enforced by the agent code:
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { policy: 'Max Drawdown', value: '15%', desc: 'Triggers global engine pause if portfolio value falls 15% below peak valuation.' },
                  { policy: 'Position Cap', value: '10%', desc: 'Cap on individual asset exposure to prevent asset concentration risks.' },
                  { policy: 'Token Cooldown', value: '2 Hours', desc: 'Restricts duplicate trades on a token within 2 hours to avoid slippage/fees.' },
                  { policy: 'Slippage Guard', value: '1.0%', desc: 'Rejects transactions if route pools experience liquidity swings > 1%.' }
                ].map((g, idx) => (
                  <div key={idx} style={{
                    padding: 16,
                    background: 'rgba(10,10,18,0.40)',
                    border: `1px solid ${C.outlineVar}`,
                    borderRadius: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: F.display }}>{g.policy}</span>
                      <span style={{ fontSize: 12, fontFamily: F.mono, fontWeight: 700, color: C.primaryFixedDim }}>{g.value}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: C.onSurfaceVar, lineHeight: 1.5 }}>{g.desc}</p>
                  </div>
                ))}
              </div>
            </article>
          )}

          {activeTopic === 'api' && (
            <article style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>Local API Reference</h1>
              <p style={{ fontSize: 14, color: C.onSurface, lineHeight: 1.7, margin: 0 }}>
                These routes query current system state variables and trigger forced loops.
              </p>

              {/* Endpoint 1: GET /api/cycles */}
              <div style={{ marginTop: 24, borderTop: `1px solid ${C.outlineVar}`, paddingTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ background: 'rgba(0,255,204,0.12)', color: C.secondary, border: `1px solid ${C.secondary}30`, padding: '4px 10px', borderRadius: 4, fontFamily: F.mono, fontSize: 10, fontWeight: 700 }}>GET</span>
                  <span style={{ fontSize: 14, fontFamily: F.mono, fontWeight: 700, color: 'white' }}>/api/cycles</span>
                </div>
                <p style={{ fontSize: 12, color: C.onSurfaceVar, lineHeight: 1.6, margin: '0 0 16px' }}>
                  Returns a log array of all autonomous sentiment cycle scans, conviction scores, and trigger events.
                </p>
                <CodeBlock code={API_CYCLES_JSON} />
              </div>

              {/* Endpoint 2: GET /api/portfolio */}
              <div style={{ marginTop: 32, borderTop: `1px solid ${C.outlineVar}`, paddingTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ background: 'rgba(0,255,204,0.12)', color: C.secondary, border: `1px solid ${C.secondary}30`, padding: '4px 10px', borderRadius: 4, fontFamily: F.mono, fontSize: 10, fontWeight: 700 }}>GET</span>
                  <span style={{ fontSize: 14, fontFamily: F.mono, fontWeight: 700, color: 'white' }}>/api/portfolio</span>
                </div>
                <p style={{ fontSize: 12, color: C.onSurfaceVar, lineHeight: 1.6, margin: '0 0 16px' }}>
                  Retrieves current valuation parameters, active narrative holdings, and transaction execution histories.
                </p>
                <CodeBlock code={API_PORTFOLIO_JSON} />
              </div>

              {/* Endpoint 3: GET /api/config */}
              <div style={{ marginTop: 32, borderTop: `1px solid ${C.outlineVar}`, paddingTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ background: 'rgba(0,255,204,0.12)', color: C.secondary, border: `1px solid ${C.secondary}30`, padding: '4px 10px', borderRadius: 4, fontFamily: F.mono, fontSize: 10, fontWeight: 700 }}>GET</span>
                  <span style={{ fontSize: 14, fontFamily: F.mono, fontWeight: 700, color: 'white' }}>/api/config</span>
                </div>
                <p style={{ fontSize: 12, color: C.onSurfaceVar, lineHeight: 1.6, margin: '0 0 16px' }}>
                  Exposes connected network rpc, starting valuations, and key status credentials without leaking secret hashes.
                </p>
                <CodeBlock code={API_CONFIG_JSON} />
              </div>
            </article>
          )}

          {activeTopic === 'roadmap' && (
            <article style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <h1 style={{ fontFamily: F.display, fontWeight: 700, fontSize: 36, color: 'white', margin: 0, letterSpacing: '-0.02em' }}>What's Next</h1>
              <p style={{ fontSize: 14, color: C.onSurface, lineHeight: 1.7, margin: 0 }}>
                Following the BNB Hack hackathon build phase, development plans focus on scaling risk boundaries and introducing direct user integrations.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                {[
                  { phase: 'Phase 1', title: 'Mainnet Deployment', desc: 'Moving from Testnet tokens to real capital loops on BNB Smart Chain mainnet using verifiable self-custodial vaults.' },
                  { phase: 'Phase 2', title: 'Multi-Narrative Asset Rotation', desc: 'Adapting decision prompts to output split ratios, allowing the agent to spread capital across multiple narratives concurrently.' },
                  { phase: 'Phase 3', title: 'CMC Backtesting Mode', desc: 'Enabling developer scripts to run historical conviction scoring algorithms against archived CMC trending records.' },
                  { phase: 'Phase 4', title: 'Public Performance Terminal', desc: 'A verified on-chain analytics dashboard showing cumulative yield and token swaps directly signed by the agent wallet.' }
                ].map((item, idx) => (
                  <div key={idx} style={{
                    padding: 20,
                    background: 'rgba(17,17,24,0.40)',
                    border: `1px solid ${C.outlineVar}`,
                    borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 10, fontFamily: F.mono, color: C.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.phase}</span>
                    <h4 style={{ margin: '4px 0 0', fontSize: 14, fontWeight: 700, color: 'white' }}>{item.title}</h4>
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: C.onSurfaceVar, lineHeight: 1.6 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </article>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer style={{
        height: 48,
        borderTop: `1px solid ${C.outlineVar}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: C.surface,
        fontSize: 10,
        fontFamily: F.mono,
        color: C.onSurfaceVar,
        position: 'relative',
        zIndex: 50,
      }}>
        <span>© 2026 NarrativeTrader · Built for BNB Hack</span>
        <a href="https://x.com/ritesh59697" target="_blank" rel="noreferrer" style={{ color: C.primaryFixedDim, fontWeight: 700, textDecoration: 'none' }}>Built by ritesh59697</a>
      </footer>
    </div>
  );
}