import React, { useState } from 'react';
import { RefreshCw, SplitSquareVertical, AlignLeft, ListFilter } from 'lucide-react';
import { ComparisonResult, ComparisonMode, DiffGranularity } from '../types/comparison';
import { ComparisonSummary } from './ComparisonSummary';
import { SideBySideView } from './SideBySideView';
import { InlineDiffView } from './InlineDiffView';
import { ChangeList } from './ChangeList';
import { ChangeNavigator } from './ChangeNavigator';
import { ExportControls } from './ExportControls';

interface ComparisonViewProps {
  result: ComparisonResult;
  onNewComparison: () => void;
  onModeChange?: (mode: ComparisonMode, granularity: DiffGranularity) => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({
  result,
  onNewComparison,
  onModeChange,
}) => {
  const [activeTab, setActiveTab] = useState<'side-by-side' | 'inline' | 'summary'>('side-by-side');
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);

  const totalChanges = result.changes.length;

  const handleNextChange = () => {
    if (currentChangeIndex < totalChanges - 1) {
      setCurrentChangeIndex(prev => prev + 1);
    }
  };

  const handlePrevChange = () => {
    if (currentChangeIndex > 0) {
      setCurrentChangeIndex(prev => prev - 1);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
      {/* Results Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {/* Interactive mode switcher directly on results screen */}
              {onModeChange ? (
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                  <button
                    onClick={() => onModeChange('exact', result.granularity)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      result.mode === 'exact'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Exact Text
                  </button>
                  <button
                    onClick={() => onModeChange('ignore_formatting', result.granularity)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      result.mode === 'ignore_formatting'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Ignore Formatting Noise
                  </button>
                </div>
              ) : (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                  {result.mode === 'exact' ? 'Exact Text' : 'Ignore Formatting'}
                </span>
              )}

              {onModeChange && (
                <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
                  <button
                    onClick={() => onModeChange(result.mode, 'words')}
                    className={`px-2 py-1 rounded-md font-medium ${
                      result.granularity === 'words' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Words
                  </button>
                  <button
                    onClick={() => onModeChange(result.mode, 'lines')}
                    className={`px-2 py-1 rounded-md font-medium ${
                      result.granularity === 'lines' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Lines
                  </button>
                </div>
              )}

              <span className="text-xs font-mono text-slate-400">
                {new Date(result.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-800">
              <span className="font-semibold text-slate-900">Comparing:</span>
              <span className="font-mono text-slate-700 font-medium">{result.originalFileName}</span>
              <span className="text-slate-400">vs</span>
              <span className="font-mono text-slate-700 font-medium">{result.revisedFileName}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ExportControls result={result} />

            <button
              onClick={onNewComparison}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>New Comparison</span>
            </button>
          </div>
        </div>
      </div>

      {/* Change Summary Cards */}
      <ComparisonSummary metrics={result.metrics} />

      {/* Navigation Controls: Tabs and Previous/Next Change Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Tabs */}
        <div className="flex rounded-lg border border-slate-200 p-1 bg-white shadow-xs">
          <button
            onClick={() => setActiveTab('side-by-side')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'side-by-side'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            onClick={() => setActiveTab('inline')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'inline'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span>Inline Diff</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Summary List</span>
          </button>
        </div>

        {/* Change Navigator */}
        {totalChanges > 0 && activeTab !== 'summary' && (
          <ChangeNavigator
            currentIndex={currentChangeIndex}
            totalChanges={totalChanges}
            onNext={handleNextChange}
            onPrevious={handlePrevChange}
          />
        )}
      </div>

      {/* Views */}
      {activeTab === 'side-by-side' && (
        <SideBySideView
          originalSegments={result.sideBySideOriginal}
          revisedSegments={result.sideBySideRevised}
          originalFileName={result.originalFileName}
          revisedFileName={result.revisedFileName}
          selectedChangeIndex={currentChangeIndex}
        />
      )}

      {activeTab === 'inline' && (
        <InlineDiffView
          segments={result.segments}
          selectedChangeIndex={currentChangeIndex}
        />
      )}

      {activeTab === 'summary' && (
        <ChangeList
          changes={result.changes}
          selectedChangeIndex={currentChangeIndex}
          onSelectChange={setCurrentChangeIndex}
        />
      )}
    </div>
  );
};
