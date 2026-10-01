import React, { useState } from 'react';
import { ChevronRight, Star } from 'lucide-react';
import { MarketCategory, MarketItem, WatchlistState } from '../types/market';

interface MarketTableProps {
  currentCategory: MarketCategory;
  items: MarketItem[];
  onSelectItem: (item: MarketItem) => void;
  watchlist: WatchlistState;
  onToggleWatchlist: (ticker: string) => void;
  flashStates: Record<string, 'up' | 'down' | null>;
}

export const MarketTable: React.FC<MarketTableProps> = ({
  currentCategory,
  items,
  onSelectItem,
  watchlist,
  onToggleWatchlist,
  flashStates,
}) => {
  const [filterTab, setFilterTab] = useState<'active' | 'gainers' | 'losers' | 'volume'>('active');
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter items based on active tab
  const sortedItems = [...items].sort((a, b) => {
    if (filterTab === 'gainers') return b.changePercent - a.changePercent;
    if (filterTab === 'losers') return a.changePercent - b.changePercent;
    if (filterTab === 'volume') {
      const volA = parseFloat(a.volume) || 0;
      const volB = parseFloat(b.volume) || 0;
      return volB - volA;
    }
    return 0; // Default order
  });

  const displayedItems = isExpanded ? sortedItems : sortedItems.slice(0, 3);

  const getTableTitle = () => {
    if (currentCategory === 'US stocks') return 'Most Active US Stocks';
    if (currentCategory === 'World stocks') return 'Leading World Equities';
    if (currentCategory === 'Crypto') return 'Top Crypto Assets by Volume';
    if (currentCategory === 'Futures') return 'Commodity & Energy Futures';
    if (currentCategory === 'Forex') return 'Major FX Currency Pairs';
    if (currentCategory === 'Government bonds') return 'Sovereign Treasury Curves';
    if (currentCategory === 'Corporate bonds') return 'Corporate Bond Markets';
    if (currentCategory === 'ETFs') return 'Popular Exchange Traded Funds';
    return 'Key Macroeconomic Benchmarks';
  };

  return (
    <section className="mt-14 pt-8 border-t border-[#f0f3fa]" data-purpose="market-trending-overview">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <h2 className="text-lg font-bold text-[#131722]">{getTableTitle()}</h2>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#f0f3fa] p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilterTab('active')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterTab === 'active' ? 'bg-white text-[#131722] shadow-xs' : 'text-[#787b86] hover:text-[#131722]'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterTab('gainers')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterTab === 'gainers' ? 'bg-white text-[#089981] shadow-xs' : 'text-[#787b86] hover:text-[#089981]'
              }`}
            >
              Gainers
            </button>
            <button
              onClick={() => setFilterTab('losers')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterTab === 'losers' ? 'bg-white text-[#f23645] shadow-xs' : 'text-[#787b86] hover:text-[#f23645]'
              }`}
            >
              Losers
            </button>
          </div>
        </div>

        {/* Toggle see more stocks */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-semibold text-[#2962ff] hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-center"
        >
          <span>{isExpanded ? 'Show less' : 'See more stocks'}</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
        <table className="w-full text-left text-sm text-[#131722]">
          <thead className="border-b border-[#e0e3eb] text-xs uppercase text-[#787b86] bg-gray-50/50">
            <tr>
              <th className="py-3 px-4 font-semibold w-10 text-center" scope="col">
                <span className="sr-only">Watchlist</span>
              </th>
              <th className="py-3 px-4 font-semibold" scope="col">Ticker</th>
              <th className="py-3 px-4 font-semibold text-right" scope="col">Price (USD)</th>
              <th className="py-3 px-4 font-semibold text-right" scope="col">Change %</th>
              <th className="py-3 px-4 font-semibold text-right" scope="col">Volume</th>
              <th className="py-3 px-4 font-semibold text-right hidden sm:table-cell" scope="col">Market Cap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3fa] font-medium">
            {displayedItems.map((item) => {
              const isPositive = item.changePercent >= 0;
              const flash = flashStates[item.id];
              const isSaved = !!watchlist[item.ticker];

              const formattedPrice =
                item.currency === '%'
                  ? `${item.price.toFixed(3)}%`
                  : item.price > 1000
                  ? item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : item.price.toFixed(item.price < 5 ? 4 : 2);

              return (
                <tr
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  className={`hover:bg-[#f8f9fd] transition-colors cursor-pointer group ${
                    flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
                  }`}
                >
                  {/* Watchlist Star */}
                  <td
                    className="py-3.5 px-3 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(item.ticker);
                    }}
                  >
                    <button
                      className="text-gray-300 hover:text-amber-400 p-1 rounded-md transition-colors"
                      title={isSaved ? 'Remove from Watchlist' : 'Add to Watchlist'}
                      type="button"
                    >
                      <Star
                        className={`w-4 h-4 ${
                          isSaved ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  </td>

                  {/* Ticker & Name */}
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 border border-gray-100 shadow-2xs"
                      style={{
                        backgroundColor: item.badgeBg || '#131722',
                        color: item.badgeTextColor || '#ffffff',
                      }}
                    >
                      {item.badgeLabel || item.ticker.substring(0, 4)}
                    </div>
                    <div className="flex items-center flex-wrap">
                      <span className="font-bold text-[#131722] group-hover:text-[#2962ff] transition-colors">
                        {item.ticker}
                      </span>
                      <span className="text-xs text-[#787b86] ml-2 hidden md:inline truncate max-w-[200px]">
                        {item.name}
                      </span>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-3.5 px-4 text-right font-bold tabular-nums">
                    {formattedPrice}
                  </td>

                  {/* Change % */}
                  <td
                    className={`py-3.5 px-4 text-right font-semibold tabular-nums ${
                      isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                    }`}
                  >
                    {isPositive ? `+${item.changePercent.toFixed(2)}%` : `${item.changePercent.toFixed(2)}%`}
                  </td>

                  {/* Volume */}
                  <td className="py-3.5 px-4 text-right text-[#787b86] tabular-nums">
                    {item.volume}
                  </td>

                  {/* Market Cap */}
                  <td className="py-3.5 px-4 text-right text-[#787b86] hidden sm:table-cell tabular-nums">
                    {item.marketCap || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};
