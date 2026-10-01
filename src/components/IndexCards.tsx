import React from 'react';
import { MarketItem } from '../types/market';

interface IndexCardsProps {
  cards: MarketItem[];
  onSelectCard: (card: MarketItem) => void;
  flashStates: Record<string, 'up' | 'down' | null>;
}

export const IndexCards: React.FC<IndexCardsProps> = ({
  cards,
  onSelectCard,
  flashStates,
}) => {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-purpose="market-indices-grid">
      {cards.map((card) => {
        const isPositive = card.changePercent >= 0;
        const colorClass = isPositive ? 'text-[#089981]' : 'text-[#f23645]';
        const bgClass = isPositive ? 'bg-[#089981]/10' : 'bg-[#f23645]/10';
        const strokeColor = isPositive ? '#089981' : '#f23645';
        const flash = flashStates[card.id];

        // Format sparkline path
        const points = card.sparkline || [20, 20, 20, 20];
        const step = 100 / (points.length - 1);
        const pathData = points
          .map((y, i) => `${i === 0 ? 'M' : 'L'} ${Math.round(i * step)} ${y}`)
          .join(' ');
        const areaData = `${pathData} V36 H0 Z`;

        const formattedPrice =
          card.currency === '%'
            ? `${card.price.toFixed(3)}%`
            : card.price > 1000
            ? card.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : card.price.toFixed(card.price < 5 ? 4 : 2);

        const formattedAmount =
          card.currency === '%'
            ? `${isPositive ? '+' : ''}${card.changeAmount.toFixed(3)}%`
            : `${isPositive ? '+' : ''}${card.changeAmount > 0 ? card.changeAmount.toFixed(2) : card.changeAmount.toFixed(2)} ${card.currency}`;

        return (
          <article
            key={card.id}
            onClick={() => onSelectCard(card)}
            className={`bg-[#f0f3fa]/50 hover:bg-[#e8ecf4]/70 border border-transparent hover:border-[#d1d4dc] rounded-2xl p-5 transition-all cursor-pointer group shadow-2xs ${
              flash === 'up' ? 'flash-up' : flash === 'down' ? 'flash-down' : ''
            }`}
            data-purpose="market-card"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* Round badge */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold tracking-tight shadow-sm shrink-0"
                  style={{
                    backgroundColor: card.badgeBg || '#131722',
                    color: card.badgeTextColor || '#ffffff',
                  }}
                >
                  {card.badgeLabel || card.ticker.substring(0, 3)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#131722] group-hover:text-[#2962ff] transition-colors">
                    {card.name}
                  </h3>
                  <span className="text-xs text-[#787b86]">
                    {card.type || 'INDEX'}
                  </span>
                </div>
              </div>

              {/* Live Change Badge */}
              <div className="text-right">
                <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${colorClass} ${bgClass}`}>
                  {isPositive ? `+${card.changePercent.toFixed(2)}%` : `${card.changePercent.toFixed(2)}%`}
                </span>
              </div>
            </div>

            {/* Price & Mini Sparkline Display */}
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="text-2xl font-bold tracking-tight text-[#131722]">
                  {formattedPrice}
                </div>
                <div className={`text-xs font-medium mt-0.5 ${colorClass}`}>
                  {formattedAmount}
                </div>
              </div>

              {/* Sparkline Chart */}
              <div className="w-28 h-10">
                <svg className="w-full h-full overflow-visible" fill="none" viewBox="0 0 100 36">
                  <path
                    d={pathData}
                    stroke={strokeColor}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                  <path
                    d={areaData}
                    fill={strokeColor}
                    fillOpacity="0.08"
                  />
                </svg>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
};
