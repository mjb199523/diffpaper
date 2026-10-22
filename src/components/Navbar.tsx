import React from 'react';
import { FileText, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onReset: () => void;
  onNavigateHowItWorks: () => void;
  onNavigateCompare: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onReset,
  onNavigateHowItWorks,
  onNavigateCompare,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <button
          onClick={onReset}
          className="flex items-center gap-2.5 focus:outline-none group text-left"
          title="Return to main comparison screen"
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              DiffPaper
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded">
              v1.0
            </span>
          </div>
        </button>

        {/* Navigation links & Privacy Badge */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={onNavigateCompare}
            className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
          >
            Compare
          </button>
          <button
            onClick={onNavigateHowItWorks}
            className="text-sm font-medium text-slate-700 hover:text-blue-600 transition-colors"
          >
            How It Works
          </button>

          {/* Privacy badge */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Files stay on your device</span>
          </div>
        </div>
      </div>
    </header>
  );
};
