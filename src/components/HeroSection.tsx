import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { MarketCategory } from '../types/market';

interface HeroSectionProps {
  currentCategory: MarketCategory;
  onSelectCategory: (category: MarketCategory) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  currentCategory,
  onSelectCategory,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const presets: { label: string; category: MarketCategory }[] = [
    { label: 'Markets, everywhere', category: 'US stocks' },
    { label: 'Stocks & Equities', category: 'US stocks' },
    { label: 'Global World Indices', category: 'World stocks' },
    { label: 'Crypto & Digital Assets', category: 'Crypto' },
    { label: 'Commodities & Futures', category: 'Futures' },
    { label: 'Foreign Exchange & Currencies', category: 'Forex' },
    { label: 'Sovereign & Govt Bonds', category: 'Government bonds' },
    { label: 'Exchange Traded Funds (ETFs)', category: 'ETFs' },
    { label: 'Macro & Economic Indicators', category: 'Economy' },
  ];

  const [selectedLabel, setSelectedLabel] = useState('Markets, everywhere');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <section className="text-center mb-12 sm:mb-16 relative" data-purpose="hero-title" ref={dropdownRef}>
      <div className="inline-block relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="inline-flex items-center gap-3 text-4xl sm:text-5xl md:text-[54px] font-extrabold tracking-tight text-[#131722] hover:opacity-85 transition-opacity group cursor-pointer focus:outline-none"
          type="button"
          aria-expanded={dropdownOpen}
        >
          <span>{selectedLabel}</span>
          <ChevronDown
            className={`w-7 h-7 sm:w-8 sm:h-8 text-[#131722] transition-transform duration-200 stroke-[3] ${
              dropdownOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'
            }`}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="px-3 py-2 text-xs font-semibold text-[#787b86] uppercase tracking-wider">
              Explore Market Sectors
            </div>
            <div className="space-y-0.5 max-h-80 overflow-y-auto">
              {presets.map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    setSelectedLabel(item.label);
                    onSelectCategory(item.category);
                    setDropdownOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-[#f0f3fa] text-sm font-medium text-[#131722] transition-colors text-left"
                >
                  <span>{item.label}</span>
                  {selectedLabel === item.label && (
                    <Check className="w-4 h-4 text-[#2962ff] stroke-[2.5]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
