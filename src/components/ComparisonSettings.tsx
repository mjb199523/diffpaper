import React from 'react';
import { Sliders, HelpCircle } from 'lucide-react';
import { ComparisonMode, DiffGranularity } from '../types/comparison';

interface ComparisonSettingsProps {
  mode: ComparisonMode;
  onModeChange: (mode: ComparisonMode) => void;
  granularity: DiffGranularity;
  onGranularityChange: (granularity: DiffGranularity) => void;
  disabled?: boolean;
}

export const ComparisonSettings: React.FC<ComparisonSettingsProps> = ({
  mode,
  onModeChange,
  granularity,
  onGranularityChange,
  disabled = false,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Comparison Mode Selection */}
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-800 uppercase tracking-wider">
              Comparison Mode
            </span>
            <div className="group relative cursor-pointer" title="Controls how differences are evaluated">
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onModeChange('exact')}
              className={`p-2.5 rounded-lg border text-left transition-all text-xs ${
                mode === 'exact'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-medium'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold mb-0.5">Exact Text Mode</div>
              <p className="text-[11px] text-slate-500 font-normal">
                Compares text preserving all whitespaces, line breaks & punctuation.
              </p>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onModeChange('ignore_formatting')}
              className={`p-2.5 rounded-lg border text-left transition-all text-xs ${
                mode === 'ignore_formatting'
                  ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-medium'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="font-semibold mb-0.5">Ignore Formatting Noise</div>
              <p className="text-[11px] text-slate-500 font-normal">
                Ignores extra spaces, tabs, and duplicate blank lines.
              </p>
            </button>
          </div>
        </div>

        {/* Diff Granularity Selection */}
        <div className="md:w-64 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4">
          <label className="block text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
            Comparison Detail
          </label>
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onGranularityChange('words')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                granularity === 'words'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Words
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onGranularityChange('chars')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                granularity === 'chars'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Characters
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onGranularityChange('lines')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-all ${
                granularity === 'lines'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lines
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
