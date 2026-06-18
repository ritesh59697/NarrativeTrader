import { NarrativeSector, SignalBundle } from '../signal/cmcSignal';
import { getLLMDecision, LLMResponse } from '../utils/llmClient';
import { isAddress } from 'viem';

export interface ScoreBreakdown {
  momentum: number;
  catalyst: number;
  regime: number;
  safety: number;
}

export interface ScorerDecision {
  action: 'BUY' | 'HOLD';
  token: string;
  tokenAddress: string;
  positionSizeUSDC: number;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  narrativeName: string;
  narrativeTokens: string[];
  reasoning: string;
  marketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS';
  fearGreed: number | null;
  llmUsed: 'groq' | 'gemini' | 'failed';
}

function clampScore(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function getTopNarrative(signals: SignalBundle): NarrativeSector | null {
  return signals.narratives[0] || null;
}

function findNarrative(signals: SignalBundle, rawDecision: LLMResponse): NarrativeSector | null {
  const byToken = rawDecision.token
    ? signals.narratives.find((narrative) =>
        narrative.topTokens.some((token) => token.symbol.toLowerCase() === rawDecision.token.toLowerCase())
      )
    : null;

  if (byToken) return byToken;

  const byName = rawDecision.narrativeName
    ? signals.narratives.find((narrative) => narrative.name.toLowerCase() === rawDecision.narrativeName.toLowerCase())
    : null;

  return byName || getTopNarrative(signals);
}

function getNarrativeTokens(narrative: NarrativeSector | null): string[] {
  return narrative ? narrative.topTokens.slice(0, 3).map((token) => token.symbol).filter(Boolean) : [];
}

function normalizeBreakdown(breakdown: ScoreBreakdown): ScoreBreakdown {
  return {
    momentum: clampScore(breakdown.momentum, 0, 3),
    catalyst: clampScore(breakdown.catalyst, 0, 3),
    regime: clampScore(breakdown.regime, 0, 2),
    safety: clampScore(breakdown.safety, 0, 2)
  };
}

function getFearGreed(signals: SignalBundle): number | null {
  return Number.isFinite(signals.fearAndGreedScore) ? signals.fearAndGreedScore : null;
}

/**
 * Score the narratives using the LLM and calculate the sized position.
 * 
 * @param signals Consolidated CMC signals
 * @param portfolioValueUSDC Total portfolio value for sizing calculation
 */
export async function scoreNarratives(
  signals: SignalBundle,
  portfolioValueUSDC: number
): Promise<ScorerDecision> {
  console.log('🧠 [Scorer] Analyzing market signals via LLM...');

  const systemPrompt = `You are a professional quantitative crypto trading agent.
Your task is to analyze emerging crypto narratives and score them based on a strict criteria.

SCORING CRITERIA (Total 0-10 points):
1. Momentum (0-3 pts): Based on narrative volume delta % and price trends of top tokens.
2. Catalyst (0-3 pts): Based on whether news headlines confirm/validate the narrative.
3. Regime (0-2 pts): Award 2 pts if global metrics are bullish and Fear & Greed > 45. Otherwise 0.
4. Safety (0-2 pts): Award 2 pts if there are no major upcoming macro events in next 6 hours and Fear & Greed is not in extreme greed (>80). Otherwise 0.

DECISION RULE:
- If the top-scoring narrative sector has a combined score of >= 6 points, you should issue a BUY action for its highest performing token.
- If the score is < 6, you must output a HOLD action.

You MUST respond in strict JSON only. Do not include markdown code fences, headers, or conversational text.
JSON Schema to output:
{
  "action": "BUY" | "HOLD",
  "token": "TOKEN_SYMBOL, or empty string for HOLD",
  "tokenAddress": "TOKEN_CONTRACT_ADDRESS, or empty string for HOLD",
  "score": <number from 0 to 10 representing the top narrative score>,
  "scoreBreakdown": {
    "momentum": <number from 0 to 3>,
    "catalyst": <number from 0 to 3>,
    "regime": <number from 0 to 2>,
    "safety": <number from 0 to 2>
  },
  "narrativeName": "EXACT_TOP_NARRATIVE_NAME_FROM_SIGNAL_BUNDLE",
  "reasoning": "Reasoning detailing point breakdown for Momentum, Catalyst, Regime, and Safety",
  "marketRegime": "BULL" | "BEAR" | "SIDEWAYS"
}`;

  const userPrompt = `Here is the current SignalBundle data:
${JSON.stringify(signals, null, 2)}

Please evaluate the narrative sectors, determine the score for the top narrative, select the top token if score >= 6, and return your analysis in the required JSON format. Always include the actual top narrative name and score breakdown, even when action is HOLD.`;

  try {
    const rawDecision: LLMResponse = await getLLMDecision(systemPrompt, userPrompt);
    const topNarrative = findNarrative(signals, rawDecision);
    const scoreBreakdown = normalizeBreakdown(rawDecision.scoreBreakdown);
    
    // Default response structure
    const decision: ScorerDecision = {
      action: 'HOLD',
      token: '',
      tokenAddress: '',
      positionSizeUSDC: 0,
      score: clampScore(rawDecision.score, 0, 10),
      scoreBreakdown,
      narrativeName: topNarrative?.name || rawDecision.narrativeName,
      narrativeTokens: getNarrativeTokens(topNarrative),
      reasoning: rawDecision.reasoning,
      marketRegime: rawDecision.marketRegime,
      fearGreed: getFearGreed(signals),
      llmUsed: rawDecision.llmUsed
    };

    if (rawDecision.score >= 6 && rawDecision.action === 'BUY') {
      // BUG 3 fix: validate token address before proceeding with any BUY execution
      if (!rawDecision.tokenAddress || !isAddress(rawDecision.tokenAddress)) {
        console.warn(`⚠️ [Scorer] LLM returned invalid token address: "${rawDecision.tokenAddress}". Downgrading to HOLD.`);
        decision.reasoning = `${rawDecision.reasoning} | Invalid token address returned by LLM — trade blocked.`;
        return decision; // action is already HOLD
      }
      // 1. Calculate Kelly Criterion
      const p = rawDecision.score / 10; // Win probability estimate (0.6 to 1.0)
      const b = 1.5; // Upside ratio (target 50% profit/loss ratio)
      
      // kellyFraction = (p * b - (1 - p)) / b
      const kellyFraction = (p * b - (1 - p)) / b;
      
      // safeKelly = kellyFraction * 0.25 (quarter-Kelly)
      const safeKelly = kellyFraction * 0.25;
      
      // Calculate raw position size
      let positionSize = portfolioValueUSDC * Math.max(0, safeKelly);
      
      // Cap at 10% of portfolio per trade
      const maxPositionCap = portfolioValueUSDC * 0.10;
      if (positionSize > maxPositionCap) {
        console.log(`⚖️ [Scorer] Raw sized trade of $${positionSize.toFixed(2)} USDC exceeds 10% limit. Capping to $${maxPositionCap.toFixed(2)} USDC.`);
        positionSize = maxPositionCap;
      }

      decision.action = 'BUY';
      decision.token = rawDecision.token;
      decision.tokenAddress = rawDecision.tokenAddress;
      decision.positionSizeUSDC = Number(positionSize.toFixed(2));
      
      console.log(`✅ [Scorer] Narrative scored ${decision.score}/10 (>=6). Decided: BUY $${decision.positionSizeUSDC} of ${decision.token}.`);
    } else {
      console.log(`⏸️ [Scorer] Top narrative scored ${rawDecision.score}/10 (<6). Decided: HOLD.`);
    }

    return decision;
  } catch (error: any) {
    console.error(`❌ [Scorer] Error during narrative scoring: ${error.message}`);
    // Safe fallback: HOLD
    return {
      action: 'HOLD',
      token: '',
      tokenAddress: '',
      positionSizeUSDC: 0,
      score: 0,
      scoreBreakdown: {
        momentum: 0,
        catalyst: 0,
        regime: 0,
        safety: 0
      },
      narrativeName: getTopNarrative(signals)?.name || '',
      narrativeTokens: getNarrativeTokens(getTopNarrative(signals)),
      reasoning: `Scoring failed: ${error.message}`,
      marketRegime: 'SIDEWAYS',
      fearGreed: getFearGreed(signals),
      llmUsed: 'failed'
    };
  }
}
