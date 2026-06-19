import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const network = process.env.NETWORK || 'testnet';
    const rpcUrl = process.env.BSC_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';
    const targetPortfolioValue = Number(process.env.PORTFOLIO_VALUE_USDC) || 100;
    
    // Check key presence without exposing the values
    const groqStatus = !!process.env.GROQ_API_KEY;
    const geminiStatus = !!process.env.GEMINI_API_KEY;
    const cmcStatus = !!process.env.CMC_API_KEY;
    
    return NextResponse.json({
      network,
      rpcUrl,
      targetPortfolioValue,
      groqStatus,
      geminiStatus,
      cmcStatus
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
