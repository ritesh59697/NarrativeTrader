import { Groq } from 'groq-sdk';
import fetch from 'node-fetch';

export interface LLMResponse {
  action: 'BUY' | 'HOLD';
  token: string;
  tokenAddress: string;
  positionSizeUSDC?: number;
  score: number;
  scoreBreakdown: {
    momentum: number;
    catalyst: number;
    regime: number;
    safety: number;
  };
  narrativeName: string;
  reasoning: string;
  marketRegime: 'BULL' | 'BEAR' | 'SIDEWAYS';
  llmUsed: 'groq' | 'gemini' | 'failed';
}

function cleanJsonResponse(rawText: string): string {
  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '');
    cleaned = cleaned.replace(/```$/, '');
  }
  return cleaned.trim();
}

function getSimulatedLLMDecision(): LLMResponse {
  const shouldBuy = Math.random() > 0.3; // 70% chance of buy for demonstration
  if (shouldBuy) {
    return {
      action: 'BUY',
      token: 'VIRTUAL',
      tokenAddress: '0x0fd6e8e3fc97a0f1dea012f42174fc6c65a29ac5',
      positionSizeUSDC: 10,
      score: 8.5,
      scoreBreakdown: {
        momentum: 3,
        catalyst: 3,
        regime: 2,
        safety: 0.5
      },
      narrativeName: 'AI Agent Ecosystem',
      reasoning: 'AI Agent Ecosystem shows major momentum (+38.5% volume spike) and top token VIRTUAL has surged 15.2%. Sentiment is bullish (Fear & Greed 68), news verifies catalyst, and safety checks are clear.',
      marketRegime: 'BULL',
      llmUsed: 'failed'
    };
  } else {
    return {
      action: 'HOLD',
      token: '',
      tokenAddress: '',
      positionSizeUSDC: 0,
      score: 4.8,
      scoreBreakdown: {
        momentum: 2,
        catalyst: 1,
        regime: 1,
        safety: 0.8
      },
      narrativeName: 'AI Agent Ecosystem',
      reasoning: 'No narrative sector is showing sufficient volume delta or strong news catalysts to cross the score threshold of 6.',
      marketRegime: 'SIDEWAYS',
      llmUsed: 'failed'
    };
  }
}

/**
 * Call the dual-LLM fallback chain.
 * Enforces JSON mode on both APIs to guarantee parsed structure.
 */
export async function getLLMDecision(
  systemPrompt: string,
  userPrompt: string
): Promise<LLMResponse> {
  // 1. Try Groq (Llama-3.3-70b-versatile)
  const groqApiKey = process.env.GROQ_API_KEY;
  if (groqApiKey && !groqApiKey.startsWith('your_')) {
    try {
      console.log('🤖 Calling primary LLM: Groq (llama-3.3-70b-versatile)...');
      const groq = new Groq({ apiKey: groqApiKey });
      
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      const rawText = chatCompletion.choices[0]?.message?.content;
      if (!rawText) {
        throw new Error('Groq returned an empty response.');
      }

      const parsed = JSON.parse(cleanJsonResponse(rawText));
      validateLLMResponse(parsed);
      console.log('✅ Groq response successfully parsed and validated.');
      return {
        ...(parsed as Omit<LLMResponse, 'llmUsed'>),
        llmUsed: 'groq'
      };
    } catch (error: any) {
      console.warn(`⚠️ Groq API call failed or rate limited: ${error.message}. Falling back to Gemini...`);
    }
  } else {
    console.log('⚠️ Groq API key is missing or dummy. Skipping to Gemini fallback...');
  }

  // 2. Fallback to Gemini 2.5 Flash via REST API
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey || geminiApiKey.startsWith('your_')) {
    console.log('📊 [LLM] Groq and Gemini API keys are missing or dummy. Generating a simulated narrative decision...');
    return getSimulatedLLMDecision();
  }

  try {
    console.log('🤖 Calling fallback LLM: Gemini 2.5 Flash...');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    
    const payload = {
      systemInstruction: {
        parts: [
          {
            text: systemPrompt
          }
        ]
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: userPrompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned HTTP ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!rawText) {
      throw new Error('Gemini API returned an empty completion structure.');
    }

    const parsed = JSON.parse(cleanJsonResponse(rawText));
    validateLLMResponse(parsed);
    console.log('✅ Gemini fallback response successfully parsed and validated.');
    return {
      ...(parsed as Omit<LLMResponse, 'llmUsed'>),
      llmUsed: 'gemini'
    };
  } catch (error: any) {
    console.error('❌ Both Groq and Gemini LLM calls failed.');
    throw error;
  }
}

function validateLLMResponse(data: any): void {
  if (!data || typeof data !== 'object') {
    throw new Error('LLM response is not a valid JSON object.');
  }
  if (data.action !== 'BUY' && data.action !== 'HOLD') {
    throw new Error(`LLM action must be either 'BUY' or 'HOLD'. Got: ${data.action}`);
  }
  if (data.action === 'BUY') {
    if (typeof data.token !== 'string' || !data.token) {
      throw new Error('LLM response missing "token" string for BUY action.');
    }
    if (typeof data.tokenAddress !== 'string' || !data.tokenAddress) {
      throw new Error('LLM response missing "tokenAddress" string for BUY action.');
    }
  }
  if (typeof data.score !== 'number' || isNaN(data.score)) {
    throw new Error('LLM response missing or invalid "score" number.');
  }
  if (!data.scoreBreakdown || typeof data.scoreBreakdown !== 'object') {
    throw new Error('LLM response missing "scoreBreakdown" object.');
  }
  ['momentum', 'catalyst', 'regime', 'safety'].forEach((key) => {
    if (typeof data.scoreBreakdown[key] !== 'number' || isNaN(data.scoreBreakdown[key])) {
      throw new Error(`LLM response missing or invalid scoreBreakdown.${key} number.`);
    }
  });
  if (typeof data.narrativeName !== 'string' || !data.narrativeName) {
    throw new Error('LLM response missing "narrativeName" string.');
  }
  if (typeof data.reasoning !== 'string' || !data.reasoning) {
    throw new Error('LLM response missing "reasoning" explanation.');
  }
  if (!['BULL', 'BEAR', 'SIDEWAYS'].includes(data.marketRegime)) {
    throw new Error(`LLM marketRegime must be 'BULL', 'BEAR', or 'SIDEWAYS'. Got: ${data.marketRegime}`);
  }
}
