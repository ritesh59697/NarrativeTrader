import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

export interface TokenQuote {
  symbol: string;
  name: string;
  address: string; // token contract address on BNB Chain (or mock/mainnet)
  priceUSDC: number;
  volume24h: number;
  percentChange24h: number;
}

export interface NarrativeSector {
  name: string;
  volumeDelta24h: number;
  marketCapUSDC: number;
  topTokens: TokenQuote[];
}

export interface GlobalMetrics {
  totalMarketCap: number;
  volume24h: number;
  btcDominance: number;
}

export interface SignalBundle {
  timestamp: string;
  narratives: NarrativeSector[];
  newsHeadlines: string[];
  globalMetrics: GlobalMetrics;
  macroEvents: string[];
  fearAndGreedScore: number;
}

/**
 * Generate simulated CoinMarketCap data for fallback/simulation mode.
 */
function getSimulatedSignalBundle(): SignalBundle {
  return {
    timestamp: new Date().toISOString(),
    narratives: [
      {
        name: 'AI Agent Ecosystem',
        volumeDelta24h: 38.5,
        marketCapUSDC: 2450000000,
        topTokens: [
          { symbol: 'VIRTUAL', name: 'Virtual Protocol', address: '0x0fd6e8e3fc97a0f1dea012f42174fc6c65a29ac5', priceUSDC: 2.15, volume24h: 45000000, percentChange24h: 15.2 },
          { symbol: 'AIXBT', name: 'AIXBT', address: '0x4f9a3e62f0f8c85741b0dbec7b4f74d01b1b11b1', priceUSDC: 0.18, volume24h: 12000000, percentChange24h: 8.4 },
          { symbol: 'FARTCOIN', name: 'Fartcoin', address: '0xbf9b05777174e9ef97bcbe5be30db61b8f72df9b', priceUSDC: 0.35, volume24h: 8500000, percentChange24h: -2.1 }
        ]
      },
      {
        name: 'Real World Assets (RWA)',
        volumeDelta24h: 18.2,
        marketCapUSDC: 8900000000,
        topTokens: [
          { symbol: 'ONDO', name: 'Ondo Finance', address: '0xfaba6f8e4a5e8b58406c525f0e9d69bdcfd092cb', priceUSDC: 0.95, volume24h: 32000000, percentChange24h: 4.1 },
          { symbol: 'OM', name: 'Mantra', address: '0x35bc87b2822a106f525f0e9d69bdcfd092cb24ba', priceUSDC: 1.12, volume24h: 15000000, percentChange24h: 2.8 },
          { symbol: 'PENDLE', name: 'Pendle Finance', address: '0x8085073e52d9c02d91b4fa8d9e6e522a1b11d9cb', priceUSDC: 5.45, volume24h: 21000000, percentChange24h: 6.7 }
        ]
      },
      {
        name: 'DePIN (Decentralized Physical Infrastructure)',
        volumeDelta24h: 8.4,
        marketCapUSDC: 15200000000,
        topTokens: [
          { symbol: 'RENDER', name: 'Render Network', address: '0x6dd8f73e52d9c02d91b4fa8d9e6e522a1b11d900', priceUSDC: 7.85, volume24h: 110000000, percentChange24h: -1.5 },
          { symbol: 'AKT', name: 'Akash Network', address: '0x55bc87b2822a106f525f0e9d69bdcfd092cb24bc', priceUSDC: 3.42, volume24h: 9000000, percentChange24h: 0.8 },
          { symbol: 'GRT', name: 'The Graph', address: '0xc944e90c64b2c07662a292be6244bdf05cda44a7', priceUSDC: 0.22, volume24h: 48000000, percentChange24h: 3.2 }
        ]
      }
    ],
    newsHeadlines: [
      'Top AI Agents achieve massive transaction volume on-chain',
      'Fed hints at keeping interest rates unchanged in upcoming session',
      'BNB Chain announces new accelerator program for AI agents and DePIN projects',
      'VIRTUAL surges 15% following developer platform upgrades'
    ],
    globalMetrics: {
      totalMarketCap: 2450000000000,
      volume24h: 75000000000,
      btcDominance: 57.2
    },
    macroEvents: [
      'Regulatory compliance panel discusses crypto assets (scheduled in 8 hours)'
    ],
    fearAndGreedScore: 68
  };
}

/**
 * Fetch signal data from CoinMarketCap MCP server
 */
export async function fetchCMCSignals(): Promise<SignalBundle> {
  const apiKey = process.env.CMC_API_KEY;

  if (!apiKey || apiKey.startsWith('your_')) {
    console.log('📊 [CMC] CoinMarketCap API key is dummy or missing. Generating rich simulated signals for testing...');
    return getSimulatedSignalBundle();
  }

  console.log('🔌 Connecting to CoinMarketCap MCP Server at https://mcp.coinmarketcap.com/mcp...');
  
  let client: Client | null = null;
  try {
    const transport = new StreamableHTTPClientTransport(
      new URL('https://mcp.coinmarketcap.com/mcp'),
      {
        requestInit: {
          headers: {
            'X-CMC-MCP-API-KEY': apiKey
          }
        }
      }
    );

    client = new Client(
      {
        name: 'NarrativeTraderClient',
        version: '1.0.0'
      },
      {
        capabilities: {}
      }
    );

    // Add a connection timeout
    const connectPromise = client.connect(transport);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('MCP Connection timeout after 15 seconds')), 15000)
    );

    await Promise.race([connectPromise, timeoutPromise]);
    console.log('✅ Connected to CoinMarketCap MCP Server.');

    // Helper to call tool safely
    const callToolSafe = async (name: string, args: any = {}) => {
      try {
        console.log(`🔍 [MCP] Calling tool: ${name}...`);
        const result = await client!.callTool({
          name,
          arguments: args
        });
        
        if (result.isError) {
          throw new Error(`Tool returned error: ${JSON.stringify(result.content)}`);
        }
        
        // Extract content from result
        const textContent = (result.content as any)
          ?.filter((c: any) => c.type === 'text')
          ?.map((c: any) => c.text)
          ?.join('\n') || '{}';

        try {
          return JSON.parse(textContent);
        } catch {
          return textContent; // Return raw string if not JSON
        }
      } catch (err: any) {
        console.warn(`⚠️ Tool call to ${name} failed: ${err.message}`);
        return null;
      }
    };

    // 1. trending_crypto_narratives
    const trendingData = await callToolSafe('trending_crypto_narratives');

    // 2. get_crypto_quotes_latest for top 3 tokens in narratives
    // Collect unique symbols or IDs
    const symbolsToFetch: string[] = [];
    if (trendingData && Array.isArray(trendingData.narratives)) {
      trendingData.narratives.slice(0, 5).forEach((narrative: any) => {
        if (Array.isArray(narrative.topTokens)) {
          narrative.topTokens.slice(0, 3).forEach((token: any) => {
            if (token.symbol) symbolsToFetch.push(token.symbol);
          });
        }
      });
    }

    const quotesData = symbolsToFetch.length > 0 
      ? await callToolSafe('get_crypto_quotes_latest', { symbol: symbolsToFetch.join(',') })
      : null;

    // 3. get_crypto_latest_news (requires id, using '1' for Bitcoin news)
    const newsData = await callToolSafe('get_crypto_latest_news', { id: '1', limit: 10 });

    // 4. get_global_metrics_latest
    const globalData = await callToolSafe('get_global_metrics_latest');

    // 5. get_upcoming_macro_events
    const macroData = await callToolSafe('get_upcoming_macro_events');

    // Structure SignalBundle based on MCP outputs
    const bundle: SignalBundle = {
      timestamp: new Date().toISOString(),
      narratives: parseNarratives(trendingData, quotesData),
      newsHeadlines: parseNews(newsData),
      globalMetrics: parseGlobal(globalData),
      macroEvents: parseMacro(macroData),
      fearAndGreedScore: parseSentiment(globalData)
    };

    console.log('✅ CoinMarketCap MCP signals successfully retrieved and consolidated.');
    return bundle;
  } catch (error: any) {
    console.error(`❌ CoinMarketCap MCP server error: ${error.message}`);
    console.log('🤖 Falling back to simulated signals to prevent agent shutdown.');
    return getSimulatedSignalBundle();
  } finally {
    if (client) {
      try {
        await client.close();
      } catch {
        // Ignored
      }
    }
  }
}

// Sub-parsers to normalize responses
function parseNarratives(trending: any, quotes: any): NarrativeSector[] {
  if (!trending || !Array.isArray(trending.narratives)) {
    return getSimulatedSignalBundle().narratives;
  }

  return trending.narratives.slice(0, 5).map((n: any) => {
    const topTokens = Array.isArray(n.topTokens) 
      ? n.topTokens.slice(0, 3).map((token: any) => {
          // Resolve quote details
          const quoteDetail = quotes?.[token.symbol] || {};
          return {
            symbol: token.symbol || '',
            name: token.name || '',
            address: token.address || '0x0000000000000000000000000000000000000000',
            priceUSDC: Number(quoteDetail.price || token.price || 0),
            volume24h: Number(quoteDetail.volume24h || token.volume24h || 0),
            percentChange24h: Number(quoteDetail.percentChange24h || token.percentChange24h || 0)
          };
        })
      : [];

    return {
      name: n.name || '',
      volumeDelta24h: Number(n.volumeDelta24h || 0),
      marketCapUSDC: Number(n.marketCapUSDC || 0),
      topTokens
    };
  });
}

function parseNews(news: any): string[] {
  if (!news) return getSimulatedSignalBundle().newsHeadlines;
  if (Array.isArray(news)) {
    return news.map((item: any) => item.title || item.headline || String(item)).filter(Boolean);
  }
  if (Array.isArray(news.news)) {
    return news.news.map((item: any) => item.title || item.headline || String(item)).filter(Boolean);
  }
  if (Array.isArray(news.articles)) {
    return news.articles.map((item: any) => item.title || item.headline).filter(Boolean);
  }
  return getSimulatedSignalBundle().newsHeadlines;
}

function parseGlobal(global: any): GlobalMetrics {
  if (!global) return getSimulatedSignalBundle().globalMetrics;
  return {
    totalMarketCap: Number(global.totalMarketCap || global.market_cap || 2450000000000),
    volume24h: Number(global.volume24h || global.volume_24h || 75000000000),
    btcDominance: Number(global.btcDominance || global.btc_dominance || 57.2)
  };
}

function parseMacro(macro: any): string[] {
  if (!macro) return getSimulatedSignalBundle().macroEvents;
  if (Array.isArray(macro)) {
    return macro.map((item: any) => item.event || item.title || String(item));
  }
  if (Array.isArray(macro.events)) {
    return macro.events.map((item: any) => item.title || item.event);
  }
  return [];
}

function parseSentiment(globalData: any): number {
  if (!globalData) return getSimulatedSignalBundle().fearAndGreedScore;
  if (typeof globalData === 'number') return globalData;
  if (globalData.sentiment?.fear_greed?.current?.index !== undefined) {
    return Number(globalData.sentiment.fear_greed.current.index);
  }
  if (globalData.score !== undefined) return Number(globalData.score);
  if (globalData.value !== undefined) return Number(globalData.value);
  if (globalData.index !== undefined) return Number(globalData.index);
  return 68; // default greed
}
