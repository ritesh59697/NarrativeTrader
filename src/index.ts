import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fetchCMCSignals, SignalBundle } from './signal/cmcSignal';
import { ScoreBreakdown, scoreNarratives, ScorerDecision } from './decision/narrativeScorer';
import { RiskGuard } from './risk/riskGuard';
import { executeTrade } from './execution/tradeExecutor';

// Load environment configuration
dotenv.config();

const riskGuard = new RiskGuard();
let cycleInterval: NodeJS.Timeout | null = null;

interface CycleLog {
  timestamp: string;
  cycleNumber: number;
  narrativeName: string;
  narrativeTokens: string[];
  score: number;
  scoreBreakdown: ScoreBreakdown;
  decision: 'BUY' | 'HOLD' | 'FAILED';
  reasoning: string;
  marketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS';
  fearGreed: number | null;
  llmUsed: 'groq' | 'gemini' | 'failed';
  trade: {
    token: string;
    positionSizeUSDC: number;
    txHash: string;
  } | null;
}

/**
 * Helper to look up a token's price from the SignalBundle
 */
function lookupTokenPrice(signals: SignalBundle, symbol: string): number {
  for (const narrative of signals.narratives) {
    const token = narrative.topTokens.find(
      (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
    );
    if (token) return token.priceUSDC;
  }
  return 1.0; // fallback if not found
}

function getNextCycleNumber(): number {
  const filePath = path.join(process.cwd(), 'logs', 'cycles.json');
  if (!fs.existsSync(filePath)) {
    return 1;
  }

  try {
    const logs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return Array.isArray(logs) ? logs.length + 1 : 1;
  } catch {
    return 1;
  }
}

function createCycleLog(
  timestamp: string,
  cycleNumber: number,
  decision: ScorerDecision,
  finalDecision: 'BUY' | 'HOLD' | 'FAILED',
  txHash?: string
): CycleLog {
  return {
    timestamp,
    cycleNumber,
    narrativeName: decision.narrativeName,
    narrativeTokens: decision.narrativeTokens,
    score: decision.score,
    scoreBreakdown: decision.scoreBreakdown,
    decision: finalDecision,
    reasoning: decision.reasoning,
    marketRegime: decision.marketRegime,
    fearGreed: decision.fearGreed,
    llmUsed: decision.llmUsed,
    trade: finalDecision === 'BUY' && txHash
      ? {
          token: decision.token,
          positionSizeUSDC: decision.positionSizeUSDC,
          txHash
        }
      : null
  };
}

function createFailedCycleLog(timestamp: string, cycleNumber: number, reasoning: string, narrativeName = ''): CycleLog {
  return {
    timestamp,
    cycleNumber,
    narrativeName,
    narrativeTokens: [],
    score: 0,
    scoreBreakdown: {
      momentum: 0,
      catalyst: 0,
      regime: 0,
      safety: 0
    },
    decision: 'FAILED',
    reasoning,
    marketRegime: 'SIDEWAYS',
    fearGreed: null,
    llmUsed: 'failed',
    trade: null
  };
}

/**
 * Appends a cycle record to logs/cycles.json
 */
function appendCycleLog(log: CycleLog): void {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    const filePath = path.join(logsDir, 'cycles.json');
    let logs: any[] = [];

    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      try {
        logs = JSON.parse(raw);
        if (!Array.isArray(logs)) logs = [];
      } catch {
        logs = [];
      }
    }

    logs.push(log);
    fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err: any) {
    console.error(`❌ [NarrativeTrader] Failed to write cycle log: ${err.message}`);
  }
}

/**
 * The core agent cycle loop
 */
async function agentLoop() {
  const timestamp = new Date().toISOString();
  const cycleNumber = getNextCycleNumber();
  console.log('\n---');
  console.log(`📊 [NarrativeTrader] Cycle start: ${timestamp} 📊`);
  
  const currentPortfolio = riskGuard.getState();
  if (currentPortfolio.isPaused) {
    console.log('⏸️ [NarrativeTrader] Trading is currently PAUSED due to Risk Guard drawdown limit.');
    appendCycleLog(createFailedCycleLog(timestamp, cycleNumber, 'Risk Guard is paused.'));
    return;
  }

  // Keep a reference to signals so the catch block can still read narrativeName
  let signals: SignalBundle | null = null;

  try {
    // 1. Fetch Signal Bundle from CMC MCP
    console.log('📊 [Step 1] Fetching signals from CoinMarketCap...');
    signals = await fetchCMCSignals();

    // 2. Update risk guard valuations using latest prices
    console.log('🛡️ [Step 2] Updating open position valuations in Risk Guard...');
    riskGuard.updateValuations(signals);
    const portfolioValueUSDC = riskGuard.getState().currentValue;

    // 3. Score narratives using LLM Client
    console.log('🧠 [Step 3] Scoring narrative sectors...');
    const decision = await scoreNarratives(signals, portfolioValueUSDC);

    // 4. Act on the scoring decision
    if (decision.action === 'BUY') {
      console.log(`🛡️ [Step 4] Verifying risk compliance for ${decision.token}...`);
      
      const riskCheck = riskGuard.check(
        decision.token,
        decision.tokenAddress,
        decision.positionSizeUSDC
      );

      if (riskCheck.pass) {
        console.log('✅ [Risk] Risk check passed! Executing swap...');
        
        // 5. Execute swap transaction
        const result = await executeTrade(
          decision.token,
          decision.tokenAddress,
          decision.positionSizeUSDC
        );

        if (result.success && result.txHash) {
          const tokenPrice = lookupTokenPrice(signals, decision.token);
          
          // Record successful trade
          riskGuard.recordTrade(
            'BUY',
            decision.token,
            decision.tokenAddress,
            tokenPrice,
            decision.positionSizeUSDC,
            result.txHash
          );

          console.log(`✅ [NarrativeTrader] Cycle completed with SUCCESS. Position opened for ${decision.token}.`);
          appendCycleLog(createCycleLog(timestamp, cycleNumber, decision, 'BUY', result.txHash));
        } else {
          console.error(`❌ [NarrativeTrader] Swap execution failed: ${result.error}`);
          appendCycleLog(createCycleLog(
            timestamp,
            cycleNumber,
            {
              ...decision,
              reasoning: `${decision.reasoning} Execution failed: ${result.error || 'Unknown execution error.'}`
            },
            'FAILED'
          ));
        }
      } else {
        console.warn(`⏸️ [Risk] Risk check blocked trade: ${riskCheck.reason}`);
        appendCycleLog(createCycleLog(
          timestamp,
          cycleNumber,
          {
            ...decision,
            reasoning: `${decision.reasoning} Risk blocked trade: ${riskCheck.reason || 'Unknown risk guard reason.'}`
          },
          'HOLD'
        ));
      }
    } else {
      console.log('⏸️ [NarrativeTrader] Cycle completed. Decision is HOLD. No trades executed.');
      appendCycleLog(createCycleLog(timestamp, cycleNumber, decision, 'HOLD'));
    }

  } catch (error: any) {
    console.error(`❌ [NarrativeTrader] Cycle encountered critical error: ${error.message}`);
    // BUG 1/4 fix: pass the signal-layer narrative name so it is always persisted
    const fallbackName = signals?.narratives?.[0]?.name ?? 'Unknown';
    appendCycleLog(createFailedCycleLog(timestamp, cycleNumber, error.message, fallbackName));
  }
}

/**
 * Main application entrypoint
 */
function main() {
  console.log('=====================================================');
  console.log('🔥 NarrativeTrader Agent Initializing...');
  console.log(`   - Network: ${(process.env.NETWORK || 'testnet').toUpperCase()}`);
  console.log(`   - Configured Portfolio Value: $${process.env.PORTFOLIO_VALUE_USDC || 100} USDC`);
  console.log('=====================================================');

  // Run initial cycle immediately
  agentLoop().catch((err) => {
    console.error('❌ Critical error in initial agent loop:', err);
  });

  // Schedule loop every 30 minutes
  const intervalMins = 30;
  console.log(`⏰ Scheduled loop to run every ${intervalMins} minutes.`);
  
  cycleInterval = setInterval(() => {
    agentLoop().catch((err) => {
      console.error('❌ Critical error in recurring agent loop:', err);
    });
  }, intervalMins * 60 * 1000);

  // Graceful shutdown handling
  const shutdown = () => {
    console.log('\n🛑 [NarrativeTrader] Shutting down agent loop...');
    if (cycleInterval) {
      clearInterval(cycleInterval);
      cycleInterval = null;
    }
    console.log('👋 Clean exit successful. Goodbye!');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
