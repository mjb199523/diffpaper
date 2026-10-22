import React, { useRef, useEffect } from 'react';
import { DiffSegment } from '../types/comparison';

interface SideBySideViewProps {
  originalSegments: DiffSegment[];
  revisedSegments: DiffSegment[];
  originalFileName: string;
  revisedFileName: string;
  selectedChangeIndex?: number;
}

export const SideBySideView: React.FC<SideBySideViewProps> = ({
  originalSegments,
  revisedSegments,
  originalFileName,
  revisedFileName,
  selectedChangeIndex,
}) => {
  const origRef = useRef<HTMLDivElement>(null);
  const revRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  // Synchronised smooth scrolling between side-by-side view panels
  const handleScroll = (source: 'orig' | 'rev') => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    const sourceElem = source === 'orig' ? origRef.current : revRef.current;
    const targetElem = source === 'orig' ? revRef.current : origRef.current;

    if (sourceElem && targetElem) {
      const percentage = sourceElem.scrollTop / (sourceElem.scrollHeight - sourceElem.clientHeight || 1);
      targetElem.scrollTop = percentage * (targetElem.scrollHeight - targetElem.clientHeight);
    }

    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  // Scroll to active change when selectedChangeIndex changes
  useEffect(() => {
    if (selectedChangeIndex === undefined) return;
    const activeEl = document.querySelector(`[data-change-target="${selectedChangeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedChangeIndex]);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden shadow-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        {/* Original Document Panel */}
        <div className="flex flex-col h-[520px]">
          <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Original Version
            </span>
            <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={originalFileName}>
              {originalFileName}
            </span>
          </div>

          <div
            ref={origRef}
            onScroll={() => handleScroll('orig')}
            className="flex-1 p-5 overflow-y-auto text-sm leading-relaxed font-sans text-slate-800 whitespace-pre-wrap select-text selection:bg-blue-100"
          >
            {originalSegments.map((segment, idx) => {
              const isRemoved = segment.type === 'removed';
              return (
                <span
                  key={segment.id || idx}
                  className={
                    isRemoved
                      ? 'bg-rose-100/90 text-rose-950 px-1 py-0.5 rounded-sm line-through decoration-rose-400'
                      : 'text-slate-800'
                  }
                  title={
                    segment.originalPage
                      ? `Original: Page ${segment.originalPage}`
                      : undefined
                  }
                >
                  {segment.value}
                </span>
              );
            })}
          </div>
        </div>

        {/* Revised Document Panel */}
        <div className="flex flex-col h-[520px]">
          <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Revised Version
            </span>
            <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={revisedFileName}>
              {revisedFileName}
            </span>
          </div>

          <div
            ref={revRef}
            onScroll={() => handleScroll('rev')}
            className="flex-1 p-5 overflow-y-auto text-sm leading-relaxed font-sans text-slate-800 whitespace-pre-wrap select-text selection:bg-blue-100"
          >
            {revisedSegments.map((segment, idx) => {
              const isAdded = segment.type === 'added';
              return (
                <span
                  key={segment.id || idx}
                  className={
                    isAdded
                      ? 'bg-emerald-100/90 text-emerald-950 font-medium px-1 py-0.5 rounded-sm'
                      : 'text-slate-800'
                  }
                  title={
                    segment.revisedPage
                      ? `Revised: Page ${segment.revisedPage}`
                      : undefined
                  }
                >
                  {segment.value}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
