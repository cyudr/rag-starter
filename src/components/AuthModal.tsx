import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, Zap } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-[#f0f3fa] text-[#787b86] hover:text-[#131722] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo and title */}
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-7 h-6 fill-current text-black" viewBox="0 0 36 28">
            <path
              clipRule="evenodd"
              d="M0 6.649h6.126V21.35H0V6.65zm9.362 0h6.126V28H9.362V6.649zm9.363 4.297h6.125V28h-6.125V10.946zM28.088 0h6.125v28h-6.125V0z"
              fillRule="evenodd"
            />
          </svg>
          <span className="font-extrabold text-xl tracking-tight text-[#131722]">TradingView</span>
        </div>

        <h3 className="text-2xl font-extrabold text-[#131722] tracking-tight mt-3">
          Get started with free paper trading
        </h3>
        <p className="text-xs sm:text-sm text-[#787b86] mt-1.5 leading-relaxed">
          Access real-time global markets, customizable interactive charts, and $100,000 in simulated practice capital.
        </p>

        {isSubmitted ? (
          <div className="my-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-in zoom-in-95">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Welcome aboard! Your simulated paper trading profile is now active.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#131722] mb-1">Email address</label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#f0f3fa] hover:bg-[#e8ecf4] focus:bg-white border border-transparent focus:border-[#2962ff] rounded-xl text-sm text-[#131722] focus:outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full tv-btn-gradient text-white text-sm font-semibold py-2.5 rounded-xl shadow-sm transition-all hover:shadow-md cursor-pointer mt-2"
            >
              Continue with Email
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSubmitted(true);
                setTimeout(() => {
                  setIsSubmitted(false);
                  onClose();
                }, 1500);
              }}
              className="w-full py-2.5 border border-gray-200 hover:bg-[#f0f3fa] rounded-xl text-xs font-bold text-[#131722] transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              1-Click Instant Demo Access
            </button>
          </form>
        )}

        {/* Feature badges */}
        <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-[#787b86]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Instant simulated funds</span>
          </div>
        </div>
      </div>
    </div>
  );
};
