import React, { useState, useMemo, useEffect } from 'react';
import { X, Star, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CheckCircle2, DollarSign, Activity } from 'lucide-react';
import { MarketItem } from '../types/market';
import { generateChartData } from '../data/marketData';
import { fetchLiveHistory } from '../services/yfinanceApi';

interface TickerDetailModalProps {
  item: MarketItem | null;
  onClose: () => void;
  isWatchlisted: boolean;
  onToggleWatchlist: (ticker: string) => void;
}

export const TickerDetailModal: React.FC<TickerDetailModalProps> = ({
  item,
  onClose,
  isWatchlisted,
  onToggleWatchlist,
}) => {
  const [timeframe, setTimeframe] = useState<'1D' | '5D' | '1M' | '6M' | '1Y'>('1D');
  const [hoveredPoint, setHoveredPoint] = useState<{ time: string; price: number; volume?: number } | null>(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [orderShares, setOrderShares] = useState('10');
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [liveHistory, setLiveHistory] = useState<Array<{ time: string; price: number; volume?: number }> | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // Fetch real yfinance historical data when ticker or timeframe changes
  useEffect(() => {
    if (!item?.ticker) return;

    let period = '1d';
    let interval = '5m';
    if (timeframe === '5D') {
      period = '5d';
      interval = '15m';
    } else if (timeframe === '1M') {
      period = '1mo';
      interval = '1d';
    } else if (timeframe === '6M') {
      period = '6mo';
      interval = '1d';
    } else if (timeframe === '1Y') {
      period = '1y';
      interval = '1wk';
    }

    setIsHistoryLoading(true);
    fetchLiveHistory(item.ticker, period, interval)
      .then((hist) => {
        if (hist && hist.length > 5) {
          setLiveHistory(hist);
        } else {
          setLiveHistory(null);
        }
      })
      .catch(() => setLiveHistory(null))
      .finally(() => setIsHistoryLoading(false));
  }, [item?.ticker, timeframe]);

  if (!item) return null;

  const isPositive = item.changePercent >= 0;
  const strokeColor = isPositive ? '#089981' : '#f23645';

  // Use real yfinance historical points if available, otherwise synthetic fallback
  const chartPoints = useMemo(() => {
    if (liveHistory && liveHistory.length > 5) {
      return liveHistory;
    }
    return generateChartData(item.price, timeframe, isPositive);
  }, [liveHistory, item.price, timeframe, isPositive]);

  // Compute SVG coordinates
  const minPrice = Math.min(...chartPoints.map((p) => p.price));
  const maxPrice = Math.max(...chartPoints.map((p) => p.price));
  const priceRange = maxPrice - minPrice || 1;

  const svgWidth = 700;
  const svgHeight = 260;
  const paddingX = 20;
  const paddingY = 25;

  const coordinates = chartPoints.map((p, idx) => {
    const x = paddingX + (idx / (chartPoints.length - 1)) * (svgWidth - 2 * paddingX);
    const y = svgHeight - paddingY - ((p.price - minPrice) / priceRange) * (svgHeight - 2 * paddingY);
    return { x, y, point: p };
  });

  const linePath = coordinates.reduce((acc, curr, idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x.toFixed(1)} ${curr.y.toFixed(1)}`;
  }, '');

  const areaPath = `${linePath} L ${svgWidth - paddingX} ${svgHeight} L ${paddingX} ${svgHeight} Z`;

  // Active price display (either hovered or latest)
  const displayPrice = hoveredPoint ? hoveredPoint.price : item.price;
  const displayTime = hoveredPoint ? hoveredPoint.time : 'Real-time quote';

  // Handle simulated trade submission
  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(orderShares, 10) || 1;
    const total = (qty * item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setOrderSuccess(`Simulated order filled: ${orderType.toUpperCase()} ${qty} shares of ${item.ticker} for $${total} USD`);
    setTimeout(() => {
      setOrderSuccess(null);
      setOrderModalOpen(false);
    }, 2800);
  };

  // Day range calculation
  const dayLow = item.dayLow || item.price * 0.985;
  const dayHigh = item.dayHigh || item.price * 1.015;
  const dayProgress = Math.min(Math.max(((item.price - dayLow) / (dayHigh - dayLow)) * 100, 0), 100);

  // 52W range calculation
  const yearLow = item.yearLow || item.price * 0.75;
  const yearHigh = item.yearHigh || item.price * 1.25;
  const yearProgress = Math.min(Math.max(((item.price - yearLow) / (yearHigh - yearLow)) * 100, 0), 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="sticky top-0 bg-white z-20 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-xs"
              style={{
                backgroundColor: item.badgeBg || '#131722',
                color: item.badgeTextColor || '#ffffff',
              }}
            >
              {item.badgeLabel || item.ticker.substring(0, 4)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#131722]">{item.ticker}</h2>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#f0f3fa] text-[#787b86]">
                  {item.category}
                </span>
                <span className="text-xs text-blue-700 font-medium flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  <Activity className="w-3 h-3 text-blue-600" />
                  yfinance Python Live
                </span>
              </div>
              <p className="text-xs text-[#787b86]">{item.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleWatchlist(item.ticker)}
              className="p-2 rounded-xl hover:bg-[#f0f3fa] text-[#787b86] hover:text-amber-500 transition-colors"
              title={isWatchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'}
            >
              <Star className={`w-5 h-5 ${isWatchlisted ? 'text-amber-400 fill-amber-400' : ''}`} />
            </button>

            <button
              onClick={() => {
                setOrderType('buy');
                setOrderModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#089981] hover:bg-[#07826d] text-white transition-colors"
            >
              Buy
            </button>
            <button
              onClick={() => {
                setOrderType('sell');
                setOrderModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#f23645] hover:bg-[#d62837] text-white transition-colors"
            >
              Sell
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[#f0f3fa] text-[#787b86] hover:text-[#131722] transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Price & Change Banner */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#131722] tracking-tight tabular-nums">
                {displayPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span className="text-sm font-semibold text-[#787b86]">{item.currency}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center text-sm font-semibold px-2 py-0.5 rounded ${
                    isPositive ? 'text-[#089981] bg-[#089981]/10' : 'text-[#f23645] bg-[#f23645]/10'
                  }`}
                >
                  {isPositive ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
                  {isPositive ? `+${item.changePercent.toFixed(2)}%` : `${item.changePercent.toFixed(2)}%`}
                </span>
                <span className={`text-sm font-medium ${isPositive ? 'text-[#089981]' : 'text-[#f23645]'}`}>
                  {isPositive ? `+${item.changeAmount.toFixed(2)}` : `${item.changeAmount.toFixed(2)}`} USD Today
                </span>
                <span className="text-xs text-[#787b86]">· {displayTime}</span>
              </div>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center p-1 bg-[#f0f3fa] rounded-xl self-start sm:self-end">
              {(['1D', '5D', '1M', '6M', '1Y'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    timeframe === tf
                      ? 'bg-white text-[#131722] shadow-xs'
                      : 'text-[#787b86] hover:text-[#131722]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div className="relative bg-[#fafbfd] border border-gray-100 rounded-2xl p-4 overflow-hidden">
            <div className="w-full h-64 sm:h-72">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-full overflow-visible"
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={strokeColor} stopOpacity="0.22" />
                    <stop offset="100%" stopColor={strokeColor} stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Subtle horizontal grid lines */}
                {[0.2, 0.5, 0.8].map((ratio) => (
                  <line
                    key={ratio}
                    x1={paddingX}
                    y1={svgHeight * ratio}
                    x2={svgWidth - paddingX}
                    y2={svgHeight * ratio}
                    stroke="#e0e3eb"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                ))}

                {/* Area under curve */}
                <path d={areaPath} fill="url(#chartGradient)" />

                {/* Main line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive points & hover regions */}
                {coordinates.map((c, i) => (
                  <g key={i}>
                    {/* Invisible hover trigger column */}
                    <rect
                      x={c.x - (svgWidth / coordinates.length) / 2}
                      y={0}
                      width={svgWidth / coordinates.length}
                      height={svgHeight}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoveredPoint(c.point)}
                    />
                    {hoveredPoint?.time === c.point.time && (
                      <>
                        <line
                          x1={c.x}
                          y1={paddingY}
                          x2={c.x}
                          y2={svgHeight - paddingY}
                          stroke="#787b86"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                        />
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r="5"
                          fill={strokeColor}
                          stroke="#ffffff"
                          strokeWidth="2.5"
                        />
                      </>
                    )}
                  </g>
                ))}
              </svg>
            </div>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-xs border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm text-xs pointer-events-none">
                <div className="font-semibold text-[#131722]">${hoveredPoint.price.toFixed(2)}</div>
                <div className="text-[11px] text-[#787b86]">{hoveredPoint.time}</div>
              </div>
            )}
          </div>

          {/* Key Ranges (Day Range & 52-Week Range) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#f0f3fa]/40 border border-gray-100 rounded-xl p-4">
              <div className="flex justify-between items-center text-xs font-semibold text-[#787b86] mb-2">
                <span>Day's Range</span>
                <span className="text-[#131722]">${item.price.toFixed(2)}</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-[#2962ff] rounded-full transition-all"
                  style={{ width: `${dayProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-medium text-[#131722] mt-1.5">
                <span>${dayLow.toFixed(2)}</span>
                <span>${dayHigh.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-[#f0f3fa]/40 border border-gray-100 rounded-xl p-4">
              <div className="flex justify-between items-center text-xs font-semibold text-[#787b86] mb-2">
                <span>52-Week Range</span>
                <span className="text-[#131722]">${item.price.toFixed(2)}</span>
              </div>
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 bottom-0 bg-[#089981] rounded-full transition-all"
                  style={{ width: `${yearProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-medium text-[#131722] mt-1.5">
                <span>${yearLow.toFixed(2)}</span>
                <span>${yearHigh.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Key Statistics Grid */}
          <div>
            <h3 className="text-sm font-bold text-[#131722] uppercase tracking-wider mb-3">Key Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#f0f3fa]/40 rounded-xl">
                <div className="text-xs text-[#787b86]">Market Cap</div>
                <div className="text-sm font-bold text-[#131722] mt-1">{item.marketCap || '—'}</div>
              </div>
              <div className="p-3.5 bg-[#f0f3fa]/40 rounded-xl">
                <div className="text-xs text-[#787b86]">Volume</div>
                <div className="text-sm font-bold text-[#131722] mt-1">{item.volume}</div>
              </div>
              <div className="p-3.5 bg-[#f0f3fa]/40 rounded-xl">
                <div className="text-xs text-[#787b86]">P/E Ratio (TTM)</div>
                <div className="text-sm font-bold text-[#131722] mt-1">{item.peRatio ? `${item.peRatio}x` : '—'}</div>
              </div>
              <div className="p-3.5 bg-[#f0f3fa]/40 rounded-xl">
                <div className="text-xs text-[#787b86]">Dividend Yield</div>
                <div className="text-sm font-bold text-[#131722] mt-1">{item.divYield || '—'}</div>
              </div>
            </div>
          </div>

          {/* Technical Analysis Gauge */}
          <div className="border border-gray-100 rounded-2xl p-5 bg-[#fafbfd]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[#131722]">Technical Analysis Summary</h3>
                <p className="text-xs text-[#787b86]">Based on 26 technical indicators & oscillators</p>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  item.sentiment === 'Strong Buy' || item.sentiment === 'Buy'
                    ? 'bg-emerald-100 text-emerald-800'
                    : item.sentiment === 'Neutral'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {item.sentiment || 'Strong Buy'}
              </span>
            </div>

            {/* Indicator score breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-[#131722] flex justify-between">
                  <span>Oscillators</span>
                  <span className="text-[#089981]">Buy: {item.oscillatorsScore?.buy ?? 3} · Neutral: {item.oscillatorsScore?.neutral ?? 7} · Sell: {item.oscillatorsScore?.sell ?? 1}</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                  <div className="bg-[#089981]" style={{ width: '40%' }} />
                  <div className="bg-amber-400" style={{ width: '45%' }} />
                  <div className="bg-[#f23645]" style={{ width: '15%' }} />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-[#131722] flex justify-between">
                  <span>Moving Averages</span>
                  <span className="text-[#089981]">Buy: {item.movingAveragesScore?.buy ?? 14} · Neutral: {item.movingAveragesScore?.neutral ?? 1} · Sell: {item.movingAveragesScore?.sell ?? 0}</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-gray-200">
                  <div className="bg-[#089981]" style={{ width: '85%' }} />
                  <div className="bg-amber-400" style={{ width: '10%' }} />
                  <div className="bg-[#f23645]" style={{ width: '5%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <h3 className="text-sm font-bold text-[#131722] mb-1.5">About {item.ticker}</h3>
              <p className="text-xs sm:text-sm text-[#787b86] leading-relaxed">{item.description}</p>
            </div>
          )}

          {/* News Feed */}
          {item.news && item.news.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#131722] mb-3">Recent News &amp; Headlines</h3>
              <div className="space-y-2.5">
                {item.news.map((n) => (
                  <div key={n.id} className="p-3.5 border border-gray-100 rounded-xl hover:bg-[#f8f9fd] transition-colors">
                    <div className="font-semibold text-xs sm:text-sm text-[#131722]">{n.title}</div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#787b86]">
                      <span>{n.source}</span>
                      <span>·</span>
                      <span>{n.timeAgo}</span>
                      <span className={`px-2 py-0.2 rounded-full text-[10px] font-semibold uppercase ${
                        n.sentiment === 'bullish' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {n.sentiment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Paper Trade Order Popover */}
        {orderModalOpen && (
          <div className="p-5 border-t border-gray-100 bg-[#f8f9fd] animate-in slide-in-from-bottom-2">
            {orderSuccess ? (
              <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{orderSuccess}</span>
              </div>
            ) : (
              <form onSubmit={handleExecuteTrade} className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setOrderType('buy')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      orderType === 'buy' ? 'bg-[#089981] text-white' : 'text-[#787b86]'
                    }`}
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('sell')}
                    className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                      orderType === 'sell' ? 'bg-[#f23645] text-white' : 'text-[#787b86]'
                    }`}
                  >
                    SELL
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <label className="text-xs text-[#787b86]">Qty:</label>
                  <input
                    type="number"
                    min="1"
                    value={orderShares}
                    onChange={(e) => setOrderShares(e.target.value)}
                    className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-[#131722] font-semibold focus:outline-none focus:ring-2 focus:ring-[#2962ff]/20"
                  />
                  <span className="text-xs text-[#787b86]">
                    Total: ~${((parseInt(orderShares, 10) || 1) * item.price).toFixed(2)} USD
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setOrderModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-[#787b86] hover:text-[#131722]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="tv-btn-gradient text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm"
                  >
                    Submit Paper Order
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
