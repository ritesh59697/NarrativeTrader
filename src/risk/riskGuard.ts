import * as fs from 'fs';
import * as path from 'path';
import { SignalBundle } from '../signal/cmcSignal';

export interface OpenPosition {
  token: string;
  address: string;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  timestamp: string;
}

export interface TradeRecord {
  timestamp: string;
  type: 'BUY' | 'SELL';
  token: string;
  address: string;
  amount: number;
  price: number;
  valueUSDC: number;
}

export interface PortfolioState {
  peakValue: number;
  currentValue: number;
  cashUSDC: number;
  isPaused: boolean;
  openPositions: OpenPosition[];
  tradesHistory: TradeRecord[];
}

export class RiskGuard {
  private stateFilePath: string;
  private state!: PortfolioState;

  constructor() {
    // Save files in the logs directory under the project root
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.stateFilePath = path.join(logsDir, 'portfolio.json');
    this.loadState();
  }

  /**
   * Load portfolio state from disk or initialize it.
   */
  private loadState(): void {
    const startingValue = Number(process.env.PORTFOLIO_VALUE_USDC) || 100;
    
    if (fs.existsSync(this.stateFilePath)) {
      try {
        const raw = fs.readFileSync(this.stateFilePath, 'utf8');
        this.state = JSON.parse(raw);
        // Ensure required fields exist
        if (typeof this.state.peakValue !== 'number') this.state.peakValue = startingValue;
        if (typeof this.state.currentValue !== 'number') this.state.currentValue = startingValue;
        if (typeof this.state.cashUSDC !== 'number') this.state.cashUSDC = startingValue;
        if (typeof this.state.isPaused !== 'boolean') this.state.isPaused = false;
        if (!Array.isArray(this.state.openPositions)) this.state.openPositions = [];
        if (!Array.isArray(this.state.tradesHistory)) this.state.tradesHistory = [];
      } catch (error: any) {
        console.error(`⚠️ Failed to parse portfolio.json: ${error.message}. Initializing fresh state.`);
        this.initFreshState(startingValue);
      }
    } else {
      this.initFreshState(startingValue);
    }
  }

  private initFreshState(startingValue: number): void {
    this.state = {
      peakValue: startingValue,
      currentValue: startingValue,
      cashUSDC: startingValue,
      isPaused: false,
      openPositions: [],
      tradesHistory: []
    };
    this.saveState();
  }

  private saveState(): void {
    try {
      fs.writeFileSync(this.stateFilePath, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (error: any) {
      console.error(`❌ Failed to save portfolio state: ${error.message}`);
    }
  }

  public getState(): PortfolioState {
    return this.state;
  }

  /**
   * Update open position valuations and total portfolio value based on latest market signals.
   * Also updates the peak value and checks for drawdown.
   */
  public updateValuations(signals: SignalBundle): void {
    if (this.state.isPaused) return;

    let totalPositionsValue = 0;

    // Scan open positions and look up their latest prices from CMC signals
    this.state.openPositions.forEach((pos) => {
      // Find the token in narratives
      let foundPrice = false;
      for (const narrative of signals.narratives) {
        const tokenSignal = narrative.topTokens.find(
          (t) => t.symbol.toLowerCase() === pos.token.toLowerCase()
        );
        if (tokenSignal) {
          pos.currentPrice = tokenSignal.priceUSDC;
          foundPrice = true;
          break;
        }
      }

      if (!foundPrice) {
        // If not found in latest signal bundle (narrative changed), keep last price
        console.log(`📊 [Risk] Price for open position ${pos.token} not found in latest trending sectors. Using last known price: $${pos.currentPrice}`);
      }

      totalPositionsValue += pos.amount * pos.currentPrice;
    });

    const previousValue = this.state.currentValue;
    this.state.currentValue = Number((this.state.cashUSDC + totalPositionsValue).toFixed(2));

    if (this.state.currentValue > this.state.peakValue) {
      this.state.peakValue = this.state.currentValue;
      console.log(`🚀 [Risk] Portfolio hit a new peak value: $${this.state.peakValue.toFixed(2)} USDC`);
    }

    // Check Drawdown Cap (15% from peak)
    const drawdown = (this.state.peakValue - this.state.currentValue) / this.state.peakValue;
    if (drawdown >= 0.15) {
      this.state.isPaused = true;
      console.error(`🚨🚨🚨 [Risk] DRAWDOWN BREACHED! Peak: $${this.state.peakValue.toFixed(2)}, Current: $${this.state.currentValue.toFixed(2)} (${(drawdown * 100).toFixed(2)}% drawdown). HALTING ALL TRADING.`);
    } else if (drawdown > 0) {
      console.log(`📊 [Risk] Portfolio value: $${this.state.currentValue.toFixed(2)} (Drawdown: ${(drawdown * 100).toFixed(2)}% from peak of $${this.state.peakValue.toFixed(2)})`);
    } else {
      console.log(`📊 [Risk] Portfolio value: $${this.state.currentValue.toFixed(2)} (At peak)`);
    }

    this.saveState();
  }

  /**
   * Run safety pre-trade checks.
   */
  public check(token: string, tokenAddress: string, positionSizeUSDC: number): { pass: boolean; reason?: string } {
    this.loadState(); // reload to get fresh disk state

    if (this.state.isPaused) {
      return { pass: false, reason: 'Trading is PAUSED due to drawdown cap breach.' };
    }

    // 1. Drawdown check
    const drawdown = (this.state.peakValue - this.state.currentValue) / this.state.peakValue;
    if (drawdown >= 0.15) {
      this.state.isPaused = true;
      this.saveState();
      return { pass: false, reason: 'Drawdown limit of 15% breached. Halted.' };
    }

    // 2. Position Size Limit (10% of current portfolio per trade)
    const maxSizeAllowed = this.state.currentValue * 0.10;
    if (positionSizeUSDC > maxSizeAllowed + 0.01) { // 1 cent grace for floating point
      return { pass: false, reason: `Position size $${positionSizeUSDC} exceeds 10% limit ($${maxSizeAllowed.toFixed(2)}).` };
    }

    // 3. Max Open Positions (3 simultaneous)
    const existingPosition = this.state.openPositions.find(p => p.token.toLowerCase() === token.toLowerCase());
    if (!existingPosition && this.state.openPositions.length >= 3) {
      return { pass: false, reason: `Maximum open positions (3) reached. Current positions: ${this.state.openPositions.map(p => p.token).join(', ')}` };
    }

    // 4. Per-Token Cooldown (2 hours)
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const recentTrade = this.state.tradesHistory.find(
      t => t.token.toLowerCase() === token.toLowerCase() && new Date(t.timestamp).getTime() > twoHoursAgo
    );
    if (recentTrade) {
      const minsLeft = Math.ceil((new Date(recentTrade.timestamp).getTime() + 2 * 60 * 60 * 1000 - Date.now()) / (60 * 1000));
      return { pass: false, reason: `Token ${token} is in cooldown. ${minsLeft} minutes remaining.` };
    }

    // 5. Cash balance check
    if (this.state.cashUSDC < positionSizeUSDC) {
      return { pass: false, reason: `Insufficient USDC cash balance. Available: $${this.state.cashUSDC.toFixed(2)}, Required: $${positionSizeUSDC.toFixed(2)}` };
    }

    return { pass: true };
  }

  /**
   * Record a completed trade on disk.
   */
  public recordTrade(
    type: 'BUY' | 'SELL',
    token: string,
    address: string,
    price: number,
    valueUSDC: number
  ): void {
    const amount = valueUSDC / price;
    const record: TradeRecord = {
      timestamp: new Date().toISOString(),
      type,
      token,
      address,
      amount: Number(amount.toFixed(6)),
      price,
      valueUSDC
    };

    this.state.tradesHistory.push(record);

    if (type === 'BUY') {
      // Deduct cash
      this.state.cashUSDC = Number((this.state.cashUSDC - valueUSDC).toFixed(2));

      // Add or update open position
      const existing = this.state.openPositions.find(p => p.token.toLowerCase() === token.toLowerCase());
      if (existing) {
        // Average entry price
        const totalCost = (existing.amount * existing.entryPrice) + valueUSDC;
        existing.amount += amount;
        existing.entryPrice = Number((totalCost / existing.amount).toFixed(6));
        existing.currentPrice = price;
        existing.timestamp = new Date().toISOString();
      } else {
        this.state.openPositions.push({
          token,
          address,
          entryPrice: price,
          currentPrice: price,
          amount: Number(amount.toFixed(6)),
          timestamp: new Date().toISOString()
        });
      }
    } else {
      // Sell
      const existingIndex = this.state.openPositions.findIndex(p => p.token.toLowerCase() === token.toLowerCase());
      if (existingIndex !== -1) {
        const pos = this.state.openPositions[existingIndex];
        // For simplicity in spot agent, we sell the entire position
        const sellCredit = pos.amount * price;
        this.state.cashUSDC = Number((this.state.cashUSDC + sellCredit).toFixed(2));
        this.state.openPositions.splice(existingIndex, 1);
      }
    }

    // Re-verify peak and current value
    const totalPositionsValue = this.state.openPositions.reduce(
      (sum, p) => sum + (p.amount * p.currentPrice), 
      0
    );
    this.state.currentValue = Number((this.state.cashUSDC + totalPositionsValue).toFixed(2));
    if (this.state.currentValue > this.state.peakValue) {
      this.state.peakValue = this.state.currentValue;
    }

    this.saveState();
    console.log(`📝 [Risk] Recorded ${type} trade for ${token}. New cash balance: $${this.state.cashUSDC.toFixed(2)} USDC`);
  }
}
