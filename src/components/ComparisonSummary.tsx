import React from 'react';
import { PlusCircle, MinusCircle, FileText, CheckCircle2, Layers } from 'lucide-react';
import { ComparisonMetrics } from '../types/comparison';

interface ComparisonSummaryProps {
  metrics: ComparisonMetrics;
}

export const ComparisonSummary: React.FC<ComparisonSummaryProps> = ({ metrics }) => {
  if (metrics.identical) {
    return (
      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 mb-6 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-emerald-900">
            No textual differences found between these documents.
          </h4>
          <p className="text-xs text-emerald-700 mt-0.5">
            The extracted texts from both versions match completely under the active comparison mode.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {/* Added Words */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Added Words</span>
          <PlusCircle className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-bold text-emerald-700">
          +{metrics.addedWords.toLocaleString()}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Words introduced in revised
        </p>
      </div>

      {/* Removed Words */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Removed Words</span>
          <MinusCircle className="w-4 h-4 text-rose-600" />
        </div>
        <div className="text-2xl font-bold text-rose-700">
          -{metrics.removedWords.toLocaleString()}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Words removed from original
        </p>
      </div>

      {/* Changed Lines */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">Changed Lines</span>
          <Layers className="w-4 h-4 text-blue-600" />
        </div>
        <div className="text-2xl font-bold text-slate-800">
          {metrics.changedLines.toLocaleString()}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Affected document lines
        </p>
      </div>

      {/* Total Changes / Pages */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium uppercase tracking-wider">
            {metrics.totalPagesOriginal ? 'Pages Processed' : 'Total Changes'}
          </span>
          <FileText className="w-4 h-4 text-purple-600" />
        </div>
        <div className="text-2xl font-bold text-slate-800">
          {metrics.totalPagesOriginal
            ? `${metrics.totalPagesOriginal} / ${metrics.totalPagesRevised || metrics.totalPagesOriginal}`
            : metrics.totalChanges}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {metrics.totalPagesOriginal
            ? 'Original / Revised pages'
            : `${metrics.totalChanges} distinct change blocks`}
        </p>
      </div>
    </div>
  );
};
