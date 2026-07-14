"use client";

import { useEffect, useState } from "react";

interface CreditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreditModal({ isOpen, onClose }: CreditModalProps) {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Small delay to allow the DOM to render before triggering the transition
      const frame = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(frame);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300); // match duration-300
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 py-6">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Box */}
      <div 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="credit-modal-title"
        className={`relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center transition-all duration-300 transform ${isVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
      >
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-4xl mb-4 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
          <span aria-hidden="true">⚡</span>
        </div>
        
        <h2 id="credit-modal-title" className="text-2xl font-black text-white mb-2 tracking-tight">
          Out of Fuel!
        </h2>
        
        <p className="text-sm text-slate-300 leading-relaxed mb-8">
          You've used all your free AI generations for this beta phase. <strong>Pro Pilot</strong> tier is launching soon to unlock unlimited access!
        </p>
        
        <button 
          onClick={onClose}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all active:scale-[0.98] min-h-[48px]"
        >
          Understood
        </button>
      </div>
    </div>
  );
}
