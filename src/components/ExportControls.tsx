import React, { useState } from 'react';
import { Download, FileDown, Copy, Check, ChevronDown } from 'lucide-react';
import { ComparisonResult } from '../types/comparison';
import { exportPdfReport, exportTxtReport } from '../services/reportGenerator';

interface ExportControlsProps {
  result: ComparisonResult;
}

export const ExportControls: React.FC<ExportControlsProps> = ({ result }) => {
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleCopySummary = async () => {
    try {
      const summaryText = `DiffPaper Summary:
Original: ${result.originalFileName}
Revised: ${result.revisedFileName}
Mode: ${result.mode}
Changes: ${result.metrics.totalChanges}
Added Words: +${result.metrics.addedWords}
Removed Words: -${result.metrics.removedWords}
Changed Lines: ${result.metrics.changedLines}`;

      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      alert('Unable to access clipboard. Please copy manually.');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Copy Summary Button */}
      <button
        onClick={handleCopySummary}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors shadow-xs"
        title="Copy summary statistics to clipboard"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700">Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            <span>Copy Summary</span>
          </>
        )}
      </button>

      {/* Export Options */}
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-medium text-white transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Report</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-20"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-30 text-xs">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  exportPdfReport(result);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700"
              >
                <FileDown className="w-4 h-4 text-rose-500" />
                <div>
                  <div className="font-semibold text-slate-800">PDF Report (.pdf)</div>
                  <div className="text-[10px] text-slate-400">Formatted with tables and metrics</div>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowDropdown(false);
                  exportTxtReport(result);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 border-t border-slate-100"
              >
                <FileDown className="w-4 h-4 text-slate-500" />
                <div>
                  <div className="font-semibold text-slate-800">Plain Text (.txt)</div>
                  <div className="text-[10px] text-slate-400">Lightweight plain-text diff</div>
                </div>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
