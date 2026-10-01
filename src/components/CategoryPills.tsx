import React from 'react';
import { ChevronRight } from 'lucide-react';
import { MarketCategory } from '../types/market';
import { CATEGORIES } from '../data/marketData';

interface CategoryPillsProps {
  currentCategory: MarketCategory;
  onSelectCategory: (cat: MarketCategory) => void;
  sectionTitle: string;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  currentCategory,
  onSelectCategory,
  sectionTitle,
}) => {
  return (
    <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8" data-purpose="market-categories">
      {/* Section Breadcrumb / Category Title */}
      <div className="flex items-center">
        <button
          onClick={() => {}}
          className="group inline-flex items-center gap-1.5 text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#131722] hover:text-[#2962ff] transition-colors focus:outline-none"
        >
          <span>{sectionTitle}</span>
          <ChevronRight className="w-6 h-6 stroke-[3] text-[#131722] group-hover:text-[#2962ff] group-hover:translate-x-1 transition-all" />
        </button>
      </div>

      {/* Pill Navigation Bar */}
      <div
        className="border border-[#e0e3eb] rounded-full p-1 bg-white inline-flex items-center overflow-x-auto no-scrollbar max-w-full shadow-2xs"
        data-purpose="category-pills"
      >
        {CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#2a2e39] text-white px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap shadow-sm'
                  : 'text-[#131722] hover:bg-[#f0f3fa] px-3.5 py-1.5 rounded-full text-[13px] font-medium whitespace-nowrap'
              }`}
              type="button"
            >
              {cat}
            </button>
          );
        })}
      </div>
    </section>
  );
};
