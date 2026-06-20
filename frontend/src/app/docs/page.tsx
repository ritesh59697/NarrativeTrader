'use client';

import Link from 'next/link';

export default function DocsPage() {
  return (
    <div className="font-sans text-sm min-h-screen bg-[#050507] text-[#e0e0e6] relative overflow-x-hidden">
      {/* Background Radial Glows */}
      <div className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[600px] h-[600px] bg-[#ff2d78]/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[40%] right-[10%] w-[500px] h-[500px] bg-[#00ffcc]/10 blur-[100px] rounded-full"></div>
      </div>

      {/* Main Navbar */}
      <header className="h-16 flex items-center justify-between px-8 bg-[#0d0d12]/80 backdrop-blur-[20px] border-b border-[#1a1a24] z-50 sticky top-0">
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
        <Link 
          href="/#terminal"
          className="bg-transparent hover:bg-white/5 border border-[#333344] text-[#e0e0e6] font-sans text-xs px-5 py-2 rounded font-bold transition-all uppercase tracking-widest cursor-pointer flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12 relative z-10">
        
        {/* Title Block */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ffcc] pulse-dot-neon"></span>
            <span className="font-mono text-xs text-[#00ffcc] font-bold tracking-widest uppercase">System Docs & API Reference</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-sans font-bold text-white tracking-tight leading-tight">
            ArcMarkets Protocol Overview
          </h2>
          <p className="text-sm text-[#9494b8] max-w-3xl leading-relaxed">
            Welcome to the local system documentation. Narrative Trader is an institutional-grade crypto trading terminal that leverages Large Language Models (LLMs) to ingest real-time social sentiment metrics and on-chain trending volumes on BNB Chain. It executes asset rebalances automatically based on dynamic scoring parameters.
          </p>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Overview */}
          <section className="bg-[#0c0c14] border border-[#222230] rounded-xl p-6 shadow-sm backdrop-blur-[20px] transition-all duration-300 hover:border-[#ff2d78]/20 hover:shadow-[0_0_20px_rgba(255,45,120,0.05)]">
            <h3 className="text-base font-sans font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d78]" />
              1. Platform Overview
            </h3>
            <div className="space-y-3 text-xs leading-relaxed text-[#9494b8]">
              <p>
                The terminal works by executing recurring analysis cycles. Each cycle scans multiple social graphs and CoinMarketCap trending parameters to discover momentum breakouts across core sectors (AI Agents, Modular Infrastructure, DeFi Liquidity).
              </p>
              <p>
                Once a narrative gains critical mass, the engine constructs structured signal payloads and coordinates LLM prompts to assign confidence ratings and allocate capital dynamically.
              </p>
            </div>
          </section>

          {/* Card 2: Core Loop */}
          <section className="bg-[#0c0c14] border border-[#222230] rounded-xl p-6 shadow-sm backdrop-blur-[20px] transition-all duration-300 hover:border-[#ff2d78]/20 hover:shadow-[0_0_20px_rgba(255,45,120,0.05)]">
            <h3 className="text-base font-sans font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcc]" />
              2. Agent Architecture
            </h3>
            <ul className="space-y-2 text-xs leading-relaxed text-[#9494b8] list-disc list-inside">
              <li>
                <strong className="text-white">Signal Ingestion:</strong> Connects to external aggregator feeds to fetch delta volumes, price trends, and trending vectors.
              </li>
              <li>
                <strong className="text-white">LLM Scoring Engine:</strong> Scores narrative momentum (1–10 scale) using high-throughput Llama-3.3-70b inference via Groq Cloud APIs.
              </li>
              <li>
                <strong className="text-white">Risk Management:</strong> Screens all proposed allocations through Risk Guard limits, protecting against drawdowns.
              </li>
              <li>
                <strong className="text-white">BSC Execution:</strong> Swaps capital directly via PancakeSwap routers on BSC Testnet/Mainnet using secure contract routing.
              </li>
            </ul>
          </section>

          {/* Card 3: Backend Config */}
          <section className="bg-[#0c0c14] border border-[#222230] rounded-xl p-6 shadow-sm backdrop-blur-[20px] transition-all duration-300 hover:border-[#ff2d78]/20 hover:shadow-[0_0_20px_rgba(255,45,120,0.05)]">
            <h3 className="text-base font-sans font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#bc13fe]" />
              3. Terminal Settings
            </h3>
            <p className="text-xs leading-relaxed text-[#9494b8] mb-4">
              Configurations are governed by environment variables in the project root (.env) and persistent local files under the logs directory:
            </p>
            <div className="space-y-2 text-[11px] font-mono">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-[#9494b8]">BLOCKCHAIN NETWORK</span>
                <span className="text-white">BNB Chain Testnet</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-[#9494b8]">STARTING CAPITAL</span>
                <span className="text-white">100.00 USDC</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-[#9494b8]">EVALUATION WINDOW</span>
                <span className="text-white">30 Minutes</span>
              </div>
            </div>
          </section>

          {/* Card 4: Safety & Risk */}
          <section className="bg-[#0c0c14] border border-[#222230] rounded-xl p-6 shadow-sm backdrop-blur-[20px] transition-all duration-300 hover:border-[#ff2d78]/20 hover:shadow-[0_0_20px_rgba(255,45,120,0.05)]">
            <h3 className="text-base font-sans font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
              4. Guardrails & Drawdowns
            </h3>
            <p className="text-xs leading-relaxed text-[#9494b8]">
              Risk Guard acts as an automated safety layer. When the trading engine is paused via the dashboard Control Panel, swap routing is disabled while narrative scanning loops continue. In the event of extreme market volatility or drawdown bounds breaching, the Risk Guard automatically freezes further trades until bounds are manually reset.
            </p>
          </section>

        </div>

        {/* API Endpoint Reference Table */}
        <section className="bg-[#0c0c14] border border-[#222230] rounded-xl p-6 shadow-sm backdrop-blur-[20px] transition-all duration-300 hover:border-[#ff2d78]/20 hover:shadow-[0_0_20px_rgba(255,45,120,0.05)]">
          <div className="border-b border-[#1a1a24] pb-4 mb-6">
            <h3 className="text-base font-sans font-bold text-white uppercase tracking-wider">5. Local API Documentation</h3>
            <p className="text-xs text-[#9494b8] mt-1">Direct backend integration endpoints utilized by the frontend terminal</p>
          </div>

          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1a1a24] text-[10px] font-bold uppercase tracking-widest text-[#9494b8]">
                  <th className="py-2.5 px-4">METHOD</th>
                  <th className="py-2.5 px-4">ENDPOINT</th>
                  <th className="py-2.5 px-4">DESCRIPTION</th>
                  <th className="py-2.5 px-4 text-right">RESPONSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1a24]/50">
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4"><span className="text-[#00ffcc] font-bold">GET</span></td>
                  <td className="py-3 px-4 text-white">/api/cycles</td>
                  <td className="py-3 px-4 text-[#9494b8]">Returns historical records of narrative scoring metrics and rebalances.</td>
                  <td className="py-3 px-4 text-right text-white">CycleLog[]</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4"><span className="text-[#00ffcc] font-bold">GET</span></td>
                  <td className="py-3 px-4 text-white">/api/portfolio</td>
                  <td className="py-3 px-4 text-[#9494b8]">Returns current valuations, open asset allocations, and historical swaps.</td>
                  <td className="py-3 px-4 text-right text-white">PortfolioData</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4"><span className="text-[#ff2d78] font-bold">POST</span></td>
                  <td className="py-3 px-4 text-white">/api/portfolio</td>
                  <td className="py-3 px-4 text-[#9494b8]">Pauses or resumes the risk loop engine. Body format: {"{ isPaused: boolean }"}.</td>
                  <td className="py-3 px-4 text-right text-white">PortfolioData</td>
                </tr>
                <tr className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4"><span className="text-[#00ffcc] font-bold">GET</span></td>
                  <td className="py-3 px-4 text-white">/api/config</td>
                  <td className="py-3 px-4 text-[#9494b8]">Retrieves general network state parameters and API status flags.</td>
                  <td className="py-3 px-4 text-right text-white">ConfigData</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="h-12 border-t border-[#1a1a24] flex items-center justify-between text-[#9494b8] text-[9px] font-mono tracking-widest uppercase bg-[#0d0d12]/90 sticky bottom-0 z-50 px-8">
        <span>© 2024 Narrative Trader Foundation v1.0.4-BETA</span>
        <span className="text-[#bc13fe] font-bold">Local Connection Secure</span>
      </footer>
    </div>
  );
}
