import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, ArrowRight } from 'lucide-react';
import { MarketItem } from '../types/market';
import { MOST_ACTIVE_STOCKS, CATEGORY_HIGHLIGHTS, CATEGORY_TABLE_DATA } from '../data/marketData';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectItem: (item: MarketItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectItem,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Stocks' | 'Crypto' | 'Forex' | 'Futures' | 'Indices'>('All');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Aggregate all items for searching
  const allItems = React.useMemo(() => {
    const list: MarketItem[] = [];
    const seen = new Set<string>();

    Object.values(CATEGORY_HIGHLIGHTS).forEach((cat) => {
      cat.cards.forEach((c) => {
        if (!seen.has(c.ticker)) {
          seen.add(c.ticker);
          list.push(c);
        }
      });
    });

    Object.values(CATEGORY_TABLE_DATA).forEach((catItems) => {
      catItems.forEach((c) => {
        if (!seen.has(c.ticker)) {
          seen.add(c.ticker);
          list.push(c);
        }
      });
    });

    MOST_ACTIVE_STOCKS.forEach((c) => {
      if (!seen.has(c.ticker)) {
        seen.add(c.ticker);
        list.push(c);
      }
    });

    return list;
  }, []);

  // Filter items
  const filtered = allItems.filter((item) => {
    const matchesQuery =
      item.ticker.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase());

    if (!matchesQuery) return false;

    if (filterType === 'Stocks') return item.type === 'STOCK';
    if (filterType === 'Crypto') return item.type === 'CRYPTO';
    if (filterType === 'Forex') return item.type === 'FOREX';
    if (filterType === 'Futures') return item.type === 'FUTURES';
    if (filterType === 'Indices') return item.type === 'INDEX';

    return true;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-gray-100">
          <Search className="w-5 h-5 text-[#787b86] mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search markets, tickers, or companies (e.g. NVDA, AAPL, BTC)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-base font-medium text-[#131722] placeholder:text-[#787b86] focus:outline-none bg-transparent"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[11px] bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[#787b86] font-mono">
            ESC
          </kbd>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-gray-50/70 border-b border-gray-100 overflow-x-auto no-scrollbar">
          {(['All', 'Stocks', 'Indices', 'Crypto', 'Forex', 'Futures'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === t
                  ? 'bg-[#131722] text-white shadow-2xs'
                  : 'text-[#787b86] hover:bg-gray-200/60 hover:text-[#131722]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-gray-50 p-2">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#787b86]">
              No instruments found matching "{query}".
            </div>
          ) : (
            filtered.slice(0, 15).map((item) => {
              const isPositive = item.changePercent >= 0;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectItem(item);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#f0f3fa] transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0"
                      style={{
                        backgroundColor: item.badgeBg || '#131722',
                        color: item.badgeTextColor || '#ffffff',
                      }}
                    >
                      {item.badgeLabel || item.ticker.substring(0, 3)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#131722] group-hover:text-[#2962ff] flex items-center gap-1.5">
                        {item.ticker}
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-gray-100 text-[#787b86]">
                          {item.type || 'ASSET'}
                        </span>
                      </div>
                      <div className="text-xs text-[#787b86] truncate max-w-xs">{item.name}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-sm text-[#131722] tabular-nums">
                      ${item.price > 1000 ? item.price.toLocaleString() : item.price.toFixed(2)}
                    </div>
                    <div
                      className={`text-xs font-semibold tabular-nums ${
                        isPositive ? 'text-[#089981]' : 'text-[#f23645]'
                      }`}
                    >
                      {isPositive ? `+${item.changePercent.toFixed(2)}%` : `${item.changePercent.toFixed(2)}%`}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-[#787b86] flex items-center justify-between">
          <span>Tip: Click any ticker to view real-time charts and financial metrics</span>
          <span className="font-medium text-[#131722]">{filtered.length} results</span>
        </div>
      </div>
    </div>
  );
};
