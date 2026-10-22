import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ChangeNavigatorProps {
  currentIndex: number;
  totalChanges: number;
  onNext: () => void;
  onPrevious: () => void;
}

export const ChangeNavigator: React.FC<ChangeNavigatorProps> = ({
  currentIndex,
  totalChanges,
  onNext,
  onPrevious,
}) => {
  if (totalChanges === 0) return null;

  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-xs">
      <span className="text-xs font-medium text-slate-600 px-2">
        Change {currentIndex + 1} of {totalChanges}
      </span>

      <div className="flex items-center gap-0.5 border-l border-slate-200 pl-1">
        <button
          onClick={onPrevious}
          disabled={currentIndex <= 0}
          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
          title="Previous change (Left Arrow or Shift+N)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onNext}
          disabled={currentIndex >= totalChanges - 1}
          className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent"
          title="Next change (Right Arrow or N)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
