import { MarketItem } from '../types/market';

export interface YFinanceQuoteResponse {
  success: boolean;
  source?: string;
  data: {
    ticker: string;
    symbol: string;
    name: string;
    price: number;
    currency: string;
    changePercent: number;
    changeAmount: number;
    volume: string;
    marketCap?: string;
    dayLow?: number;
    dayHigh?: number;
    yearLow?: number;
    yearHigh?: number;
    peRatio?: number;
    divYield?: string;
    beta?: number;
    description?: string;
    sparkline?: number[];
  };
}

export interface YFinanceBatchResponse {
  success: boolean;
  source?: string;
  data: Array<YFinanceQuoteResponse['data']>;
}

export async function fetchLiveQuote(ticker: string): Promise<YFinanceQuoteResponse['data'] | null> {
  try {
    const res = await fetch(`/api/yfinance/quote?ticker=${encodeURIComponent(ticker)}`);
    if (!res.ok) return null;
    const json: YFinanceQuoteResponse = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (err) {
    console.warn(`[yfinance API] fetchLiveQuote error for ${ticker}:`, err);
  }
  return null;
}

export async function fetchBatchQuotes(tickers: string[]): Promise<Record<string, YFinanceQuoteResponse['data']>> {
  try {
    const res = await fetch(`/api/yfinance/batch?tickers=${encodeURIComponent(tickers.join(','))}`);
    if (!res.ok) return {};
    const json: YFinanceBatchResponse = await res.json();
    if (json.success && Array.isArray(json.data)) {
      const map: Record<string, YFinanceQuoteResponse['data']> = {};
      json.data.forEach((item) => {
        if (item && item.ticker) {
          map[item.ticker] = item;
        }
      });
      return map;
    }
  } catch (err) {
    console.warn('[yfinance API] fetchBatchQuotes error:', err);
  }
  return {};
}

export async function fetchLiveHistory(
  ticker: string,
  period = '1mo',
  interval = '1d'
): Promise<Array<{ time: string; price: number; volume?: number }> | null> {
  try {
    const res = await fetch(
      `/api/yfinance/history?ticker=${encodeURIComponent(ticker)}&period=${period}&interval=${interval}`
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && Array.isArray(json.history)) {
      return json.history;
    }
  } catch (err) {
    console.warn(`[yfinance API] fetchLiveHistory error for ${ticker}:`, err);
  }
  return null;
}
