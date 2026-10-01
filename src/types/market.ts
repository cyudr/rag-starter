export type MarketCategory =
  | 'US stocks'
  | 'World stocks'
  | 'Crypto'
  | 'Futures'
  | 'Forex'
  | 'Government bonds'
  | 'Corporate bonds'
  | 'ETFs'
  | 'Economy';

export interface HistoricalPoint {
  time: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  url?: string;
  sentiment: 'bullish' | 'neutral' | 'bearish';
}

export interface MarketItem {
  id: string;
  ticker: string;
  name: string;
  category: MarketCategory;
  price: number;
  currency: string;
  changePercent: number;
  changeAmount: number;
  volume: string;
  marketCap?: string;
  badgeLabel?: string;
  badgeBg?: string;
  badgeTextColor?: string;
  sparkline: number[];
  type?: 'INDEX' | 'STOCK' | 'CRYPTO' | 'FOREX' | 'FUTURES' | 'BOND' | 'ETF' | 'MACRO';
  dayLow?: number;
  dayHigh?: number;
  yearLow?: number;
  yearHigh?: number;
  peRatio?: number;
  divYield?: string;
  beta?: number;
  sentiment?: 'Strong Buy' | 'Buy' | 'Neutral' | 'Sell' | 'Strong Sell';
  sentimentScore?: number; // 0 - 100
  oscillatorsScore?: { buy: number; neutral: number; sell: number };
  movingAveragesScore?: { buy: number; neutral: number; sell: number };
  description?: string;
  news?: NewsItem[];
}

export interface WatchlistState {
  [ticker: string]: boolean;
}

export interface UserPosition {
  ticker: string;
  shares: number;
  avgPrice: number;
}
