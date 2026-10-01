import React, { useState } from 'react';

export const Footer: React.FC = () => {
  const [modalContent, setModalContent] = useState<string | null>(null);

  return (
    <>
      <footer className="border-t border-[#e0e3eb] bg-white py-6 text-xs text-[#787b86]" data-purpose="page-footer">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            © 2025 TradingView. Real-time market quotes and financial analysis tools.
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setModalContent('Terms of Use: Market data is provided for informational and simulated educational purposes.')}
              className="hover:underline hover:text-[#131722] transition-colors"
            >
              Terms of use
            </button>
            <button
              onClick={() => setModalContent('Privacy Policy: We respect your privacy. No personal financial credentials or sensitive data are collected.')}
              className="hover:underline hover:text-[#131722] transition-colors"
            >
              Privacy policy
            </button>
            <button
              onClick={() => setModalContent('Cookies Policy: Minimal operational cookies are used solely to persist your local watchlist and UI preferences.')}
              className="hover:underline hover:text-[#131722] transition-colors"
            >
              Cookies
            </button>
          </div>
        </div>
      </footer>

      {/* Info notice dialog for terms/privacy */}
      {modalContent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs"
          onClick={() => setModalContent(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-bold text-base text-[#131722] mb-2">Policy Details</h4>
            <p className="text-xs text-[#787b86] leading-relaxed mb-4">{modalContent}</p>
            <button
              onClick={() => setModalContent(null)}
              className="w-full py-2 bg-[#131722] text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
