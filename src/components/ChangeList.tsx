import React from 'react';
import { StructuredChange } from '../types/comparison';
import { ArrowRight, FileText } from 'lucide-react';

interface ChangeListProps {
  changes: StructuredChange[];
  selectedChangeIndex?: number;
  onSelectChange: (index: number) => void;
}

export const ChangeList: React.FC<ChangeListProps> = ({
  changes,
  selectedChangeIndex,
  onSelectChange,
}) => {
  if (changes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
        <p className="text-sm font-medium text-slate-700">
          No textual differences found.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
      {changes.map((change, index) => {
        const isSelected = selectedChangeIndex === index;

        let badgeBg = 'bg-blue-50 text-blue-700 border-blue-200';
        if (change.type === 'added') badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (change.type === 'removed') badgeBg = 'bg-rose-50 text-rose-700 border-rose-200';

        return (
          <div
            key={change.id}
            onClick={() => onSelectChange(index)}
            className={`p-4 transition-colors cursor-pointer hover:bg-slate-50/80 ${
              isSelected ? 'bg-blue-50/40 ring-1 ring-blue-500/30' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-slate-500">
                  #{index + 1}
                </span>
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeBg}`}
                >
                  {change.type}
                </span>
              </div>

              {(change.originalPage || change.revisedPage) && (
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <FileText className="w-3 h-3 text-slate-400" />
                  <span>
                    {change.originalPage ? `Orig p.${change.originalPage}` : ''}
                    {change.originalPage && change.revisedPage ? ' → ' : ''}
                    {change.revisedPage ? `Rev p.${change.revisedPage}` : ''}
                  </span>
                </div>
              )}
            </div>

            {change.type === 'replaced' ? (
              <div className="space-y-1.5 text-xs font-mono">
                <div className="bg-rose-50/80 border border-rose-100 text-rose-900 rounded p-2 line-through break-all">
                  - {change.originalText}
                </div>
                <div className="flex items-center justify-center text-slate-400">
                  <ArrowRight className="w-3.5 h-3.5 rotate-90 sm:rotate-0" />
                </div>
                <div className="bg-emerald-50/80 border border-emerald-100 text-emerald-900 rounded p-2 break-all">
                  + {change.revisedText}
                </div>
              </div>
            ) : change.type === 'removed' ? (
              <div className="bg-rose-50/80 border border-rose-100 text-rose-900 rounded p-2 text-xs font-mono line-through break-all">
                - {change.originalText}
              </div>
            ) : (
              <div className="bg-emerald-50/80 border border-emerald-100 text-emerald-900 rounded p-2 text-xs font-mono break-all">
                + {change.revisedText}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
