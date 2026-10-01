import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { CategoryPills } from './components/CategoryPills';
import { IndexCards } from './components/IndexCards';
import { MarketTable } from './components/MarketTable';
import { TickerDetailModal } from './components/TickerDetailModal';
import { SearchModal } from './components/SearchModal';
import { AuthModal } from './components/AuthModal';
import { Footer } from './components/Footer';
import { MarketCategory, MarketItem, WatchlistState } from './types/market';
import { CATEGORY_HIGHLIGHTS, CATEGORY_TABLE_DATA } from './data/marketData';
import { fetchBatchQuotes } from './services/yfinanceApi';

export default function App() {
  const [currentCategory, setCurrentCategory] = useState<MarketCategory>('US stocks');
  const [categoryData, setCategoryData] = useState(CATEGORY_HIGHLIGHTS);
  const [tableData, setTableData] = useState(CATEGORY_TABLE_DATA);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | null>>({});
  const [yfinanceConnected, setYfinanceConnected] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<number>(Date.now());
  const [lastUpdatedSeconds, setLastUpdatedSeconds] = useState<number>(0);

  // Keep a reference to current prices to detect real directional movements (flash-up / flash-down)
  const priceHistoryRef = useRef<Record<string, number>>({});

  // LocalStorage-backed Watchlist
  const [watchlist, setWatchlist] = useState<WatchlistState>(() => {
    try {
      const saved = localStorage.getItem('tv_watchlist');
      return saved ? JSON.parse(saved) : { NVDA: true, AAPL: true };
    } catch {
      return { NVDA: true, AAPL: true };
    }
  });

  const toggleWatchlist = (ticker: string) => {
    setWatchlist((prev) => {
      const next = { ...prev, [ticker]: !prev[ticker] };
      try {
        localStorage.setItem('tv_watchlist', JSON.stringify(next));
      } catch {
        // Ignore storage exceptions
      }
      return next;
    });
  };

  // Keyboard shortcut listener: Cmd/Ctrl + K to open search, Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setSelectedItem(null);
        setIsAuthOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update "Xs ago" counter every second
  useEffect(() => {
    const timer = setInterval(() => {
      setLastUpdatedSeconds(Math.floor((Date.now() - lastUpdatedTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdatedTime]);

  // Core Real-Time Yahoo Finance Fetcher (Runs live, completely replacing mock noise)
  const fetchLiveQuotes = useCallback(async () => {
    const targetCards = categoryData[currentCategory]?.cards || [];
    const targetRows = tableData[currentCategory] || [];
    const tickersToFetch = Array.from(
      new Set([...targetCards.map((c) => c.ticker), ...targetRows.map((r) => r.ticker)])
    );

    if (tickersToFetch.length === 0) return;

    setIsFetching(true);
    try {
      const quotesMap = await fetchBatchQuotes(tickersToFetch);
      if (!quotesMap || Object.keys(quotesMap).length === 0) {
        setIsFetching(false);
        return;
      }

      setYfinanceConnected(true);
      setLastUpdatedTime(Date.now());
      setLastUpdatedSeconds(0);

      // Track price changes for real flash animations
      const flashes: Record<string, 'up' | 'down'> = {};

      // 1. Update Cards
      setCategoryData((prev) => {
        const cat = prev[currentCategory];
        if (!cat) return prev;
        const updatedCards = cat.cards.map((card) => {
          const live = quotesMap[card.ticker];
          if (!live || typeof live.price !== 'number' || live.price <= 0) return card;

          const oldPrice = priceHistoryRef.current[card.id] ?? card.price;
          if (live.price > oldPrice) {
            flashes[card.id] = 'up';
          } else if (live.price < oldPrice) {
            flashes[card.id] = 'down';
          }
          priceHistoryRef.current[card.id] = live.price;

          return {
            ...card,
            price: live.price,
            changePercent: live.changePercent ?? card.changePercent,
            changeAmount: live.changeAmount ?? card.changeAmount,
            volume: live.volume || card.volume,
            marketCap: live.marketCap || card.marketCap,
            dayLow: live.dayLow ?? card.dayLow,
            dayHigh: live.dayHigh ?? card.dayHigh,
            yearLow: live.yearLow ?? card.yearLow,
            yearHigh: live.yearHigh ?? card.yearHigh,
            peRatio: live.peRatio ?? card.peRatio,
            divYield: live.divYield || card.divYield,
            beta: live.beta ?? card.beta,
            description: live.description || card.description,
            sparkline: live.sparkline && live.sparkline.length > 3 ? live.sparkline : card.sparkline,
          };
        });
        return { ...prev, [currentCategory]: { ...cat, cards: updatedCards } };
      });

      // 2. Update Table
      setTableData((prev) => {
        const rows = prev[currentCategory] || [];
        const updatedRows = rows.map((row) => {
          const live = quotesMap[row.ticker];
          if (!live || typeof live.price !== 'number' || live.price <= 0) return row;

          const oldPrice = priceHistoryRef.current[row.id] ?? row.price;
          if (live.price > oldPrice) {
            flashes[row.id] = 'up';
          } else if (live.price < oldPrice) {
            flashes[row.id] = 'down';
          }
          priceHistoryRef.current[row.id] = live.price;

          return {
            ...row,
            price: live.price,
            changePercent: live.changePercent ?? row.changePercent,
            changeAmount: live.changeAmount ?? row.changeAmount,
            volume: live.volume || row.volume,
            marketCap: live.marketCap || row.marketCap,
            dayLow: live.dayLow ?? row.dayLow,
            dayHigh: live.dayHigh ?? row.dayHigh,
            yearLow: live.yearLow ?? row.yearLow,
            yearHigh: live.yearHigh ?? row.yearHigh,
            peRatio: live.peRatio ?? row.peRatio,
            divYield: live.divYield || row.divYield,
            beta: live.beta ?? row.beta,
            description: live.description || row.description,
          };
        });
        return { ...prev, [currentCategory]: updatedRows };
      });

      // 3. Update Selected Item if modal is currently open
      setSelectedItem((curr) => {
        if (!curr) return null;
        const live = quotesMap[curr.ticker];
        if (!live || typeof live.price !== 'number') return curr;
        return {
          ...curr,
          price: live.price,
          changePercent: live.changePercent ?? curr.changePercent,
          changeAmount: live.changeAmount ?? curr.changeAmount,
          volume: live.volume || curr.volume,
          marketCap: live.marketCap || curr.marketCap,
          dayLow: live.dayLow ?? curr.dayLow,
          dayHigh: live.dayHigh ?? curr.dayHigh,
          yearLow: live.yearLow ?? curr.yearLow,
          yearHigh: live.yearHigh ?? curr.yearHigh,
          peRatio: live.peRatio ?? curr.peRatio,
          divYield: live.divYield || curr.divYield,
          beta: live.beta ?? curr.beta,
          description: live.description || curr.description,
        };
      });

      // Trigger visual flashes on genuine market price updates
      if (Object.keys(flashes).length > 0) {
        setFlashStates((prev) => ({ ...prev, ...flashes }));
        setTimeout(() => {
          setFlashStates((prev) => {
            const next = { ...prev };
            Object.keys(flashes).forEach((k) => delete next[k]);
            return next;
          });
        }, 1100);
      }
    } catch (err) {
      console.warn('[yfinance Live Polling Error]:', err);
    } finally {
      setIsFetching(false);
    }
  }, [currentCategory, categoryData, tableData]);

  // Immediate fetch on mount & category change
  useEffect(() => {
    fetchLiveQuotes();
  }, [currentCategory]);

  // Periodic Live Polling from Yahoo Finance (every 3.5 seconds)
  useEffect(() => {
    if (!liveUpdates) return;
    const interval = setInterval(() => {
      fetchLiveQuotes();
    }, 3500);

    return () => clearInterval(interval);
  }, [liveUpdates, fetchLiveQuotes]);

  // Current category highlight cards & table items
  const activeHighlights = categoryData[currentCategory] || categoryData['US stocks'];
  const activeTableItems = tableData[currentCategory] || tableData['US stocks'];

  const handleSelectItem = useCallback((item: MarketItem) => {
    setSelectedItem(item);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white selection:bg-blue-100 text-[#131722]">
      {/* Primary Sticky Header */}
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        liveUpdates={liveUpdates}
        onToggleLive={() => setLiveUpdates(!liveUpdates)}
        yfinanceConnected={yfinanceConnected}
        onRefresh={fetchLiveQuotes}
        lastUpdatedSeconds={lastUpdatedSeconds}
        isFetching={isFetching}
      />

      {/* Main Content Area */}
      <main className="flex-grow pt-14 pb-24" data-purpose="markets-overview">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Hero Title Section ("Markets, everywhere ⌄") */}
          <HeroSection
            currentCategory={currentCategory}
            onSelectCategory={setCurrentCategory}
          />

          {/* Navigation & Category Pills Row */}
          <CategoryPills
            currentCategory={currentCategory}
            onSelectCategory={setCurrentCategory}
            sectionTitle={activeHighlights.sectionTitle}
          />

          {/* Top 3 Indices / Highlight Cards */}
          <IndexCards
            cards={activeHighlights.cards}
            onSelectCard={handleSelectItem}
            flashStates={flashStates}
          />

          {/* Market Overview Table (NVDA, AAPL, TSLA, etc.) */}
          <MarketTable
            currentCategory={currentCategory}
            items={activeTableItems}
            onSelectItem={handleSelectItem}
            watchlist={watchlist}
            onToggleWatchlist={toggleWatchlist}
            flashStates={flashStates}
          />
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Interactive Detail Modal / Chart View */}
      {selectedItem && (
        <TickerDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          isWatchlisted={!!watchlist[selectedItem.ticker]}
          onToggleWatchlist={toggleWatchlist}
        />
      )}

      {/* Quick Search Modal (Ctrl+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectItem={handleSelectItem}
      />

      {/* Auth / Get Started Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}
