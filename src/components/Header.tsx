import React, { useState, useEffect, useRef } from 'react';
import { Search, Globe, User, ChevronDown, Check, Sparkles, TrendingUp, BarChart2, BookOpen, Layers, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAuth: () => void;
  liveUpdates: boolean;
  onToggleLive: () => void;
  yfinanceConnected?: boolean;
  onRefresh?: () => void;
  lastUpdatedSeconds?: number;
  isFetching?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSearch,
  onOpenAuth,
  liveUpdates,
  onToggleLive,
  yfinanceConnected = true,
  onRefresh,
  lastUpdatedSeconds = 0,
  isFetching = false,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [currentLang, setCurrentLang] = useState('EN');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setShowLangMenu(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languages = [
    { code: 'EN', name: 'English (US)' },
    { code: 'ES', name: 'Español' },
    { code: 'DE', name: 'Deutsch' },
    { code: 'FR', name: 'Français' },
    { code: 'JA', name: '日本語' },
    { code: 'ZH', name: '简体中文' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100" ref={dropdownRef}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left side: Logo & Navigation Links */}
        <div className="flex items-center gap-6 xl:gap-8">
          {/* TradingView Logo Mark */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="TradingView Home"
            className="flex items-center text-black hover:opacity-85 transition-opacity focus:outline-none"
          >
            <svg
              className="w-8 h-7 fill-current"
              viewBox="0 0 36 28"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Accurate TradingView vector icon */}
              <path
                clipRule="evenodd"
                d="M0 6.649h6.126V21.35H0V6.65zm9.362 0h6.126V28H9.362V6.649zm9.363 4.297h6.125V28h-6.125V10.946zM28.088 0h6.125v28h-6.125V0z"
                fill="currentColor"
                fillRule="evenodd"
              />
            </svg>
          </button>

          {/* Search Bar with Shortcut */}
          <div className="relative w-48 sm:w-60 md:w-64">
            <button
              onClick={onOpenSearch}
              className="w-full flex items-center justify-between px-3.5 py-2 bg-[#f0f3fa] hover:bg-[#e4e7ee] rounded-full text-sm text-[#787b86] transition-colors group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2962ff]/20"
              type="button"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-[#787b86] group-hover:text-[#131722] transition-colors" />
                <span className="font-normal text-xs sm:text-sm text-[#787b86]">Search (Ctrl+K)</span>
              </div>
              <span className="hidden md:inline-block text-[10px] bg-white border border-[#e0e3eb] px-1.5 py-0.5 rounded text-[#787b86] font-mono shadow-xs">
                ⌘K
              </span>
            </button>
          </div>

          {/* Primary Navigation Links */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center space-x-6 text-[15px] font-medium">
            {/* Products dropdown trigger */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'products' ? null : 'products')}
                className={`py-2 flex items-center gap-1 transition-colors ${
                  activeDropdown === 'products' ? 'text-[#2962ff]' : 'text-[#131722] hover:text-[#2962ff]'
                }`}
              >
                Products
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {activeDropdown === 'products' && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-2 hover:bg-[#f0f3fa] rounded-lg cursor-pointer transition-colors">
                    <div className="flex items-center gap-2.5 font-semibold text-sm text-[#131722]">
                      <BarChart2 className="w-4 h-4 text-[#2962ff]" /> Supercharts
                    </div>
                    <p className="text-xs text-[#787b86] mt-0.5 pl-6.5">Next-generation financial charting</p>
                  </div>
                  <div className="p-2 hover:bg-[#f0f3fa] rounded-lg cursor-pointer transition-colors">
                    <div className="flex items-center gap-2.5 font-semibold text-sm text-[#131722]">
                      <Layers className="w-4 h-4 text-[#089981]" /> Screeners
                    </div>
                    <p className="text-xs text-[#787b86] mt-0.5 pl-6.5">Scan stocks, crypto & forex</p>
                  </div>
                  <div className="p-2 hover:bg-[#f0f3fa] rounded-lg cursor-pointer transition-colors">
                    <div className="flex items-center gap-2.5 font-semibold text-sm text-[#131722]">
                      <TrendingUp className="w-4 h-4 text-[#902cfb]" /> Heatmaps
                    </div>
                    <p className="text-xs text-[#787b86] mt-0.5 pl-6.5">Visual market sector performance</p>
                  </div>
                </div>
              )}
            </div>

            {/* Community */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'community' ? null : 'community')}
                className={`py-2 flex items-center gap-1 transition-colors ${
                  activeDropdown === 'community' ? 'text-[#2962ff]' : 'text-[#131722] hover:text-[#2962ff]'
                }`}
              >
                Community
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>

              {activeDropdown === 'community' && (
                <div className="absolute top-full left-0 mt-1 w-60 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-2 hover:bg-[#f0f3fa] rounded-lg cursor-pointer transition-colors">
                    <div className="font-semibold text-sm text-[#131722]">Trading Ideas</div>
                    <p className="text-xs text-[#787b86] mt-0.5">Authoritative market breakdowns</p>
                  </div>
                  <div className="p-2 hover:bg-[#f0f3fa] rounded-lg cursor-pointer transition-colors">
                    <div className="font-semibold text-sm text-[#131722]">Pine Script® Wizards</div>
                    <p className="text-xs text-[#787b86] mt-0.5">Custom indicators & algorithms</p>
                  </div>
                  <div className="p-2 hover:bg-[#f0f3fa] rounded-lg cursor-pointer transition-colors">
                    <div className="font-semibold text-sm text-[#131722]">Educational Streams</div>
                    <p className="text-xs text-[#787b86] mt-0.5">Live technical workshops</p>
                  </div>
                </div>
              )}
            </div>

            {/* Active Page Indicator */}
            <button
              onClick={() => setActiveDropdown(null)}
              className="text-[#2962ff] font-semibold py-2 relative"
            >
              Markets
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2962ff] rounded-full" />
            </button>

            <a className="text-[#131722] hover:text-[#2962ff] transition-colors py-2" href="#brokers">
              Brokers
            </a>

            {/* More */}
            <div className="relative">
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'more' ? null : 'more')}
                className="text-[#131722] hover:text-[#2962ff] transition-colors py-2 flex items-center gap-1"
              >
                More
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </button>
              {activeDropdown === 'more' && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="p-2 hover:bg-[#f0f3fa] rounded-lg cursor-pointer text-sm text-[#131722]">
                    Economic Calendar
                  </div>
                  <div className="p-2 hover:bg-[#f0f3fa] rounded-lg cursor-pointer text-sm text-[#131722]">
                    News & Breaking Events
                  </div>
                  <div className="p-2 hover:bg-[#f0f3fa] rounded-lg cursor-pointer text-sm text-[#131722]">
                    Desktop Apps & Mobile
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Side Utilities */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Yahoo Finance Feed status with refresh button */}
          <div className="flex items-center bg-[#f0f3fa] rounded-full p-1 pl-3 gap-2 border border-gray-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#131722]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">Live Yahoo Finance</span>
              <span className="text-[10px] text-[#787b86] font-normal">
                {lastUpdatedSeconds === 0 ? 'Just now' : `${lastUpdatedSeconds}s ago`}
              </span>
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                title="Refresh live prices from Yahoo Finance"
                className="p-1 rounded-full hover:bg-white text-[#787b86] hover:text-[#2962ff] transition-colors cursor-pointer"
                disabled={isFetching}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-[#2962ff]' : ''}`} />
              </button>
            )}
          </div>

          {/* Live Streaming Toggle */}
          <button
            onClick={onToggleLive}
            title={liveUpdates ? 'Auto-polling live Yahoo Finance prices every 3s' : 'Live updates paused'}
            className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              liveUpdates
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}
          >
            <span>{liveUpdates ? 'Auto-Poll On' : 'Paused'}</span>
          </button>

          {/* Language Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowUserMenu(false);
              }}
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#131722] hover:text-[#2962ff] transition-colors p-1"
              title="Select Language"
              type="button"
            >
              <Globe className="w-4.5 h-4.5 text-current" strokeWidth={1.8} />
              <span className="uppercase tracking-wider text-xs">{currentLang}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 p-1 z-50 animate-in fade-in duration-100">
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setCurrentLang(l.code);
                      setShowLangMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg hover:bg-[#f0f3fa] text-left transition-colors"
                  >
                    <span className="text-[#131722]">{l.name}</span>
                    {currentLang === l.code && <Check className="w-3.5 h-3.5 text-[#2962ff]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile / Sign In Icon */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowLangMenu(false);
              }}
              aria-label="User Account"
              className="p-1 text-[#131722] hover:text-[#2962ff] transition-colors rounded-full focus:outline-none"
              type="button"
            >
              <User className="w-5.5 h-5.5" strokeWidth={1.8} />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in duration-100">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <div className="text-xs text-[#787b86]">Signed in as</div>
                  <div className="text-sm font-semibold text-[#131722] truncate">trader@example.com</div>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenAuth();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#131722] hover:bg-[#f0f3fa] rounded-lg transition-colors"
                >
                  Paper Trading Account
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenAuth();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#131722] hover:bg-[#f0f3fa] rounded-lg transition-colors"
                >
                  Profile & Settings
                </button>
              </div>
            )}
          </div>

          {/* Get Started Button */}
          <button
            onClick={onOpenAuth}
            className="tv-btn-gradient text-white text-sm font-semibold px-4 sm:px-5 py-2 rounded-lg shadow-sm transition-all flex items-center justify-center cursor-pointer hover:shadow-md active:scale-[0.98]"
            type="button"
          >
            Get started
          </button>
        </div>
      </div>
    </header>
  );
};
