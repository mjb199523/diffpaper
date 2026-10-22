import React from 'react';
import { ArrowDown, HelpCircle, Lock } from 'lucide-react';

interface HeroProps {
  onCompareClick: () => void;
  onHowItWorksClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onCompareClick,
  onHowItWorksClick,
}) => {
  return (
    <section className="pt-12 pb-8 sm:pt-16 sm:pb-12 text-center max-w-4xl mx-auto px-4 sm:px-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-6">
        <Lock className="w-3 h-3" />
        <span>100% Client-Side Processing • No Server Uploads</span>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
        Compare documents. Catch every change.
      </h1>

      <p className="mt-4 sm:mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Compare two document versions and instantly identify additions, deletions, and text changes. No AI. No uploads. Your documents stay on your device.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <button
          onClick={onCompareClick}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <span>Compare Documents</span>
          <ArrowDown className="w-4 h-4" />
        </button>

        <button
          onClick={onHowItWorksClick}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-medium text-sm transition-colors flex items-center justify-center gap-2"
        >
          <HelpCircle className="w-4 h-4 text-slate-500" />
          <span>See How It Works</span>
        </button>
      </div>
    </section>
  );
};
