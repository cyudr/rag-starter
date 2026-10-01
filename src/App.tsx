import React, { useState, useEffect, useCallback } from 'react';
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

export default function App() {
  const [currentCategory, setCurrentCategory] = useState<MarketCategory>('US stocks');
  const [categoryData, setCategoryData] = useState(CATEGORY_HIGHLIGHTS);
  const [tableData, setTableData] = useState(CATEGORY_TABLE_DATA);
  const [selectedItem, setSelectedItem] = useState<MarketItem | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [flashStates, setFlashStates] = useState<Record<string, 'up' | 'down' | null>>({});

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

  // Live simulation tick generator
  useEffect(() => {
    if (!liveUpdates) return;

    const interval = setInterval(() => {
      // Pick randomly between highlight cards or table items
      const targetCategory = currentCategory;
      const targetCards = categoryData[targetCategory]?.cards || [];
      const targetRows = tableData[targetCategory] || [];

      const pool = [...targetCards, ...targetRows];
      if (pool.length === 0) return;

      const randomIndex = Math.floor(Math.random() * pool.length);
      const chosen = pool[randomIndex];

      const changePctDelta = (Math.random() - 0.49) * 0.12;
      const priceDelta = chosen.price * (changePctDelta / 100);
      const newPrice = Number((chosen.price + priceDelta).toFixed(chosen.price < 5 ? 4 : 2));
      const newChangePct = Number((chosen.changePercent + changePctDelta).toFixed(2));
      const newChangeAmt = Number((chosen.changeAmount + priceDelta).toFixed(chosen.price < 5 ? 4 : 2));
      const direction: 'up' | 'down' = priceDelta >= 0 ? 'up' : 'down';

      // Update highlight card if chosen is a card
      setCategoryData((prev) => {
        const cat = prev[targetCategory];
        if (!cat) return prev;
        const updatedCards = cat.cards.map((c) => {
          if (c.id === chosen.id) {
            return {
              ...c,
              price: newPrice,
              changePercent: newChangePct,
              changeAmount: newChangeAmt,
            };
          }
          return c;
        });
        return {
          ...prev,
          [targetCategory]: {
            ...cat,
            cards: updatedCards,
          },
        };
      });

      // Update table data if chosen is in table
      setTableData((prev) => {
        const rows = prev[targetCategory] || [];
        const updatedRows = rows.map((r) => {
          if (r.id === chosen.id) {
            return {
              ...r,
              price: newPrice,
              changePercent: newChangePct,
              changeAmount: newChangeAmt,
            };
          }
          return r;
        });
        return {
          ...prev,
          [targetCategory]: updatedRows,
        };
      });

      // Flash effect trigger
      setFlashStates((prev) => ({ ...prev, [chosen.id]: direction }));
      setTimeout(() => {
        setFlashStates((prev) => ({ ...prev, [chosen.id]: null }));
      }, 1000);
    }, 3200);

    return () => clearInterval(interval);
  }, [liveUpdates, currentCategory, categoryData, tableData]);

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
