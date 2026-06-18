import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: number | null | undefined): string {
  if (value == null || !isFinite(value)) return '$—';
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value: number | null | undefined, showPlus = false): string {
  if (value == null || !isFinite(value)) return '—';
  const prefix = showPlus && value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function formatAge(timestamp: string | null | undefined): string {
  if (!timestamp) return '—';
  const ms = Date.now() - new Date(timestamp).getTime();
  if (ms < 0) return 'just now';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function formatTime(timestamp: string | null | undefined): string {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const rem = String(s % 60).padStart(2, '0');
  return `${m}:${rem}`;
}

export function truncateHash(hash: string | null | undefined, chars = 6): string {
  if (!hash || hash.length <= chars * 2 + 3) return hash ?? '';
  return `${hash.slice(0, chars)}…${hash.slice(-4)}`;
}

export function getDecisionFromCycle(cycle: CycleLog): 'BUY' | 'HOLD' | 'FAILED' {
  if (!cycle) return 'HOLD';
  const d = String(cycle.decision ?? '').toUpperCase();
  if (d === 'BUY') return 'BUY';
  if (d === 'FAILED') return 'FAILED';
  return 'HOLD';
}

export function sanitizeReasoning(text: string | null | undefined): string {
  if (!text) return '';
  const s = String(text);
  if (s.startsWith('http')) return 'LLM scoring failed';
  if (s.includes('generateContent')) return 'Gemini API unavailable';
  return s;
}

// ── Shared types ──────────────────────────────────────────────────────────────

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

export interface PortfolioData {
  peakValue: number;
  currentValue: number;
  cashUSDC: number;
  isPaused: boolean;
  openPositions: OpenPosition[];
  tradesHistory: TradeRecord[];
}

export interface ScoreBreakdown {
  momentum: number;
  catalyst: number;
  regime: number;
  safety: number;
}

export interface CycleLog {
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
