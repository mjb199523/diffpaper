import React, { useEffect } from 'react';
import { DiffSegment } from '../types/comparison';

interface InlineDiffViewProps {
  segments: DiffSegment[];
  selectedChangeIndex?: number;
}

export const InlineDiffView: React.FC<InlineDiffViewProps> = ({
  segments,
  selectedChangeIndex,
}) => {
  // Scroll to active change when selectedChangeIndex changes
  useEffect(() => {
    if (selectedChangeIndex === undefined) return;
    const activeEl = document.querySelector(`[data-inline-change="${selectedChangeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedChangeIndex]);

  let changeCounter = -1;

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
      {/* Legend Header */}
      <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
          Unified Inline Diff
        </span>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-rose-100 border border-rose-300 inline-block line-through text-[9px] text-center text-rose-700"></span>
            <span className="text-slate-600">Removed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-emerald-100 border border-emerald-300 inline-block"></span>
            <span className="text-slate-600">Added</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-slate-100 border border-slate-300 inline-block"></span>
            <span className="text-slate-600">Unchanged</span>
          </div>
        </div>
      </div>

      <div className="p-6 h-[520px] overflow-y-auto text-sm leading-relaxed font-sans text-slate-800 whitespace-pre-wrap select-text selection:bg-blue-100">
        {segments.map((segment, idx) => {
          let changeIndexForAttr: number | undefined;
          if (segment.type !== 'unchanged') {
            changeCounter++;
            changeIndexForAttr = changeCounter;
          }

          if (segment.type === 'removed') {
            return (
              <span
                key={segment.id || idx}
                data-inline-change={changeIndexForAttr}
                className="bg-rose-100 text-rose-900 line-through decoration-rose-500/80 px-1 py-0.5 rounded-sm mx-0.5"
                title={
                  segment.originalPage
                    ? `Removed from Original Page ${segment.originalPage}`
                    : 'Removed'
                }
              >
                {segment.value}
              </span>
            );
          }

          if (segment.type === 'added') {
            return (
              <span
                key={segment.id || idx}
                data-inline-change={changeIndexForAttr}
                className="bg-emerald-100 text-emerald-900 font-medium px-1 py-0.5 rounded-sm mx-0.5"
                title={
                  segment.revisedPage
                    ? `Added in Revised Page ${segment.revisedPage}`
                    : 'Added'
                }
              >
                {segment.value}
              </span>
            );
          }

          return (
            <span key={segment.id || idx} className="text-slate-800">
              {segment.value}
            </span>
          );
        })}
      </div>
    </div>
  );
};
