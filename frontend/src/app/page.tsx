'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatMoney, CycleLog, PortfolioData, formatAge } from '@/lib/utils';

export default function LandingPage() {
  const [cycles, setCycles] = useState<CycleLog[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [transformStyle, setTransformStyle] = useState('perspective(1000px) rotateX(-12deg) rotateY(-8deg)');

  useEffect(() => {
    Promise.all([
      fetch('/api/cycles', { cache: 'no-store' }).then(res => res.json()).catch(() => []),
      fetch('/api/portfolio', { cache: 'no-store' }).then(res => res.json()).catch(() => null)
    ]).then(([cyclesData, portfolioData]) => {
      if (Array.isArray(cyclesData)) setCycles(cyclesData);
      if (portfolioData && !portfolioData.error) setPortfolio(portfolioData);
    });
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 25;
    const rotateY = (centerX - x) / 25;
    
    setTransformStyle(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
  };

  const handleMouseLeave = () => {
    setTransformStyle('perspective(1000px) rotateX(-12deg) rotateY(-8deg)');
  };

  const lastCycle = cycles[cycles.length - 1];
  const activeCycleNum = lastCycle?.cycleNumber ?? cycles.length ?? 30;
  const portfolioVal = portfolio?.currentValue ?? 100.00;
  const cyclesCount = cycles.length ?? 30;
  const llmEngine = lastCycle?.llmUsed ?? 'groq';

  // Format decision text
  const getDecision = (c: CycleLog) => {
    const d = c.decision as any;
    if (typeof d === 'string') return d.toUpperCase();
    if (d && typeof d === 'object') return String(d.action ?? 'HOLD').toUpperCase();
    return 'HOLD';
  };

  return (
    <div className="bg-background text-on-background font-sans selection:bg-primary-fixed selection:text-on-primary-fixed overflow-x-hidden min-h-screen">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 h-16 bg-background/60 backdrop-blur-[40px] border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-8 w-full max-w-7xl mx-auto h-full">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="font-geist text-lg text-on-surface font-bold tracking-tighter uppercase">Narrative Trader</span>
              <div className="animate-pulse bg-primary-fixed w-2 h-2 rounded-full shadow-[0_0_8px_#72ff70]"></div>
            </Link>
            <div className="hidden md:flex items-center gap-6 ml-8">
              <Link href="/dashboard" className="text-primary-fixed font-bold border-b-2 border-primary-fixed pb-1 text-sm">
                Dashboard
              </Link>
              <a className="text-on-surface-variant hover:text-on-surface transition-colors text-sm" href="#">API Documentation</a>
              <a className="text-on-surface-variant hover:text-on-surface transition-colors text-sm" href="#">Institutional</a>
              <a className="text-on-surface-variant hover:text-on-surface transition-colors text-sm" href="#">Governance</a>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center bg-surface-container-low border border-outline-variant/20 rounded-full px-4 py-1.5 gap-3">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">search</span>
              <input className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm w-32 placeholder:text-on-surface-variant/50 text-on-surface" placeholder="Search Markets..." type="text" />
            </div>
            <div className="flex gap-4">
              <button className="material-symbols-outlined text-on-surface-variant hover:text-primary-fixed transition-colors">notifications_active</button>
              <button className="material-symbols-outlined text-on-surface-variant hover:text-primary-fixed transition-colors">sensors</button>
            </div>
            <Link href="/dashboard" className="bg-primary-fixed text-on-primary-fixed px-6 py-2 rounded-full font-mono text-[11px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all neon-glow font-bold">
              Connect Wallet
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
          <div className="absolute inset-0 grid-bg pointer-events-none opacity-40"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-fixed/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="relative z-10 max-w-4xl mx-auto space-y-8 pt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-fixed/5 border border-primary-fixed/20 rounded-full">
              <span className="material-symbols-outlined text-[16px] text-primary-fixed">bolt</span>
              <span className="font-mono text-[11px] font-bold text-primary-fixed uppercase">AGENT CYCLE #{activeCycleNum} IS LIVE</span>
            </div>
            <h1 className="font-geist text-5xl md:text-7xl tracking-tighter leading-none bg-gradient-to-b from-on-surface to-on-surface/60 bg-clip-text text-transparent font-bold">
              The Narrative Trader:<br />AI-Driven Alpha.
            </h1>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
              Institutional-grade execution powered by Large Language Models. We ingest real-time social signals and on-chain flows to score ecosystem narratives and deploy capital where the momentum lives.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/dashboard" className="w-full sm:w-auto bg-primary-fixed text-on-primary-fixed px-10 py-4 rounded-lg font-bold hover:brightness-110 transition-all neon-glow text-center">
                Launch Dashboard
              </Link>
              <a href="#" className="w-full sm:w-auto border border-outline-variant px-10 py-4 rounded-lg font-bold text-on-surface hover:bg-white/5 transition-all text-center">
                Read Documentation
              </a>
            </div>
          </div>

          {/* Interactive Preview Dashboard Teaser */}
          <div className="relative mt-20 w-full max-w-5xl mx-auto group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-fixed/20 to-transparent blur-2xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
            <div 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{ transform: transformStyle }}
              className="obsidian-card p-6 rounded-xl border border-outline-variant/30 transition-all duration-150 cursor-pointer"
            >
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-outline-variant/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-error"></div>
                  <div className="w-3 h-3 rounded-full bg-secondary"></div>
                  <div className="w-3 h-3 rounded-full bg-primary-fixed"></div>
                </div>
                <div className="font-mono text-[11px] text-on-surface-variant/50">NARRATIVETRADER TERMINAL V1.0</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {/* Valuation Card */}
                <div className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/20">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold">Portfolio Valuation</span>
                    <span className="material-symbols-outlined text-primary-fixed text-[18px]">trending_up</span>
                  </div>
                  <div className="mt-2 text-3xl font-geist text-on-surface font-bold">{formatMoney(portfolioVal)}</div>
                  <div className="text-primary-fixed font-mono text-[11px] font-bold">BNB Chain Testnet</div>
                </div>
                {/* Metric Card */}
                <div className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/20">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold">Cycles Run</span>
                    <span className="material-symbols-outlined text-secondary text-[18px]">loop</span>
                  </div>
                  <div className="mt-2 text-3xl font-geist text-on-surface font-bold">{cyclesCount}</div>
                  <div className="flex gap-1 mt-2">
                    <div className="h-1 w-full bg-primary-fixed/30 rounded"></div>
                    <div className="h-1 w-full bg-primary-fixed/70 rounded"></div>
                    <div className="h-1 w-full bg-primary-fixed rounded"></div>
                  </div>
                </div>
                {/* LLM Engine */}
                <div className="bg-surface-container-low p-5 rounded-lg border border-outline-variant/20">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold">LLM Engine</span>
                    <span className="material-symbols-outlined text-tertiary text-[18px]">psychology</span>
                  </div>
                  <div className="mt-2 text-3xl font-geist text-on-surface font-bold uppercase">{llmEngine}</div>
                  <div className="text-on-surface-variant/60 font-mono text-[11px]">Llama-3.3-70b • Flash</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="py-24 px-8 max-w-7xl mx-auto">
          <div className="mb-16 text-left">
            <h2 className="font-geist text-3xl md:text-5xl font-bold mb-4">Precision Ecosystem Analysis</h2>
            <p className="text-on-surface-variant max-w-xl">Our proprietary inference pipeline evaluates narrative strength through three core pillars of quantitative and qualitative data.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-left">
            {/* Feature 1 */}
            <div className="md:col-span-8 obsidian-card rounded-2xl overflow-hidden min-h-[400px] flex flex-col">
              <div className="p-8">
                <div className="w-12 h-12 bg-primary-fixed/10 rounded-lg flex items-center justify-center mb-6 border border-primary-fixed/20">
                  <span className="material-symbols-outlined text-primary-fixed text-3xl">radar</span>
                </div>
                <h3 className="font-geist text-2xl font-bold mb-4 text-on-surface">Real-time Cycle Scanning</h3>
                <p className="text-on-surface-variant max-w-md">The agent continuously monitors social graph APIs and blockchain explorers to detect the genesis of new market trends before they reach saturation.</p>
              </div>
              <div className="mt-auto bg-surface-container-high/50 p-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase">SCAN LATENCY</span>
                    <span className="font-mono text-primary-fixed font-bold">24ms</span>
                  </div>
                  <div className="w-px h-8 bg-outline-variant/30"></div>
                  <div className="flex flex-col">
                    <span className="font-mono text-[10px] text-on-surface-variant font-bold uppercase">ACTIVE NARRATIVES</span>
                    <span className="font-mono text-on-surface font-bold">5+ tracked</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">arrow_right_alt</span>
              </div>
            </div>
            {/* Feature 2 */}
            <div className="md:col-span-4 obsidian-card rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-6 border border-secondary/20">
                  <span className="material-symbols-outlined text-secondary text-3xl">smart_toy</span>
                </div>
                <h3 className="font-geist text-2xl font-bold mb-4 text-on-surface">LLM Sentiment Scoring</h3>
                <p className="text-on-surface-variant">Leveraging state-of-the-art inference engines for sub-second analysis of complex narrative structures and catalyst events.</p>
              </div>
              <div className="pt-8">
                <div className="bg-background/40 rounded-lg p-4 space-y-3 border border-outline-variant/15">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono text-on-surface-variant font-bold">ACCURACY REGIME</span>
                    <span className="font-mono text-primary-fixed font-bold">99.4%</span>
                  </div>
                  <div className="h-1 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary-fixed w-[99.4%]"></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Feature 3 */}
            <div className="md:col-span-12 obsidian-card rounded-2xl p-8 flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <div className="w-12 h-12 bg-tertiary/15 rounded-lg flex items-center justify-center mb-6 border border-tertiary/20">
                  <span className="material-symbols-outlined text-tertiary text-3xl">terminal</span>
                </div>
                <h3 className="font-geist text-2xl font-bold mb-4 text-on-surface">Automated Execution</h3>
                <p className="text-on-surface-variant mb-6">Seamless integration with decentralized liquidity pools. When a narrative scores &gt;8.0, the terminal automatically initiates execution rules on BSC Testnet.</p>
                <div className="flex gap-3 flex-wrap">
                  <div className="px-4 py-2 bg-surface-container rounded-lg font-mono text-xs border border-outline-variant/10 text-on-surface">BSC TESTNET</div>
                  <div className="px-4 py-2 bg-surface-container rounded-lg font-mono text-xs border border-outline-variant/10 text-on-surface">PANCAKESWAP</div>
                  <div className="px-4 py-2 bg-surface-container rounded-lg font-mono text-xs border border-outline-variant/10 text-on-surface">USDC COLLATERAL</div>
                </div>
              </div>
              <div className="flex-1 w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                    <span className="text-on-surface-variant font-medium text-sm">AI Agent Ecosystem</span>
                    <span className="text-primary-fixed font-bold text-sm">BUY SCORE &gt; 8.0</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                    <span className="text-on-surface-variant font-medium text-sm">L2 Scalability Hubs</span>
                    <span className="text-secondary font-bold text-sm">HOLD SCORE 5.0</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-outline-variant/10">
                    <span className="text-on-surface-variant font-medium text-sm">Real World Assets</span>
                    <span className="text-on-surface-variant/70 font-bold text-sm">HOLD SCORE 3.0</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-on-surface-variant font-medium text-sm">Social Fi 2.0</span>
                    <span className="text-error font-bold text-sm">FAIL SCORE 2.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Narrative Feed Teaser */}
        {cycles.length > 0 && (
          <section className="py-24 px-8 max-w-7xl mx-auto text-left">
            <div className="text-center mb-16">
              <h2 className="font-geist text-3xl md:text-5xl font-bold mb-4">Recent Agent Insights</h2>
              <p className="text-on-surface-variant">Transcripts from recent autonomous scoring cycles.</p>
            </div>
            <div className="space-y-4">
              {cycles.slice(-2).reverse().map((cycle, idx) => {
                const dec = getDecision(cycle);
                const scoreVal = cycle.score ?? 5;
                const borderClass = dec === 'BUY' ? 'border-l-primary-fixed' : dec === 'FAILED' ? 'border-l-error' : 'border-l-secondary';
                const pillColor = dec === 'BUY' ? 'bg-primary-fixed/10 text-primary-fixed border-primary-fixed/20' : dec === 'FAILED' ? 'bg-error/10 text-error border-error/20' : 'bg-surface-container text-on-surface-variant/80 border-outline-variant/20';

                return (
                  <div key={idx} className={`obsidian-card p-6 rounded-xl border-l-4 ${borderClass} group cursor-pointer`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="font-geist text-xl font-bold text-on-surface">{cycle.narrativeName || 'BNB Market Cycle'}</span>
                        <div className="flex gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${pillColor}`}>{dec}</span>
                          <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-mono rounded uppercase">Cycle #{cycle.cycleNumber ?? idx + 1}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-mono text-primary-fixed text-xl font-bold">{scoreVal}/10</span>
                        <span className="text-xs text-on-surface-variant/60 font-mono">{formatAge(cycle.timestamp)}</span>
                      </div>
                    </div>
                    <p className="mt-4 text-on-surface-variant text-sm line-clamp-1">
                      {cycle.reasoning}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-12 text-center">
              <Link href="/dashboard" className="text-primary-fixed font-mono text-xs font-bold hover:underline inline-flex items-center gap-2 mx-auto uppercase tracking-wider">
                Launch Live Terminal <span className="material-symbols-outlined text-[16px]">arrow_outward</span>
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-8 border-t border-outline-variant/10 bg-surface-container-lowest mt-24">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto text-left">
          <div className="col-span-1">
            <span className="font-geist text-lg text-on-surface font-bold uppercase tracking-tight">Narrative Trader</span>
            <p className="mt-4 text-on-surface-variant text-sm leading-relaxed">
              The next evolution of quantitative DeFi trading. AI-native, autonomous, and narrative-focused.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-xs font-bold text-primary-fixed uppercase mb-4 tracking-wider">Platform</h4>
            <ul className="space-y-2">
              <li><Link href="/dashboard" className="text-on-surface-variant hover:text-on-surface transition-colors text-sm">Live Terminal</Link></li>
              <li><a className="text-on-surface-variant hover:text-on-surface transition-colors text-sm" href="#">API Docs</a></li>
              <li><a className="text-on-surface-variant hover:text-on-surface transition-colors text-sm" href="#">Smart Contracts</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs font-bold text-primary-fixed uppercase mb-4 tracking-wider">Ecosystem</h4>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-on-surface transition-colors text-sm" href="https://testnet.bscscan.com" target="_blank" rel="noreferrer">BSC Explorer</a></li>
              <li><a className="text-on-surface-variant hover:text-on-surface transition-colors text-sm" href="https://github.com/ritesh59697/NarrativeTrader" target="_blank" rel="noreferrer">GitHub Repo</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs font-bold text-primary-fixed uppercase mb-4 tracking-wider">Legal</h4>
            <ul className="space-y-2">
              <li><a className="text-on-surface-variant hover:text-on-surface transition-colors text-sm" href="#">Privacy Policy</a></li>
              <li><a className="text-on-surface-variant hover:text-on-surface transition-colors text-sm" href="#">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-outline-variant/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-on-surface-variant/50">
          <span>© 2026 Narrative Trader AI. Built for BNB Chain Hackathon.</span>
          <span className="text-primary-fixed/80">BNB Chain Testnet Connected</span>
        </div>
      </footer>
    </div>
  );
}
