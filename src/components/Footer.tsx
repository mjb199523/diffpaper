import React from 'react';
import { FileText, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-white border-t border-slate-200 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white">
                <FileText className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 text-base">DiffPaper</span>
              <span className="text-xs text-slate-400 font-mono">v1.0.0</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm">
              Local, deterministic document change detector. Compare PDF, DOCX, and TXT files directly in your web browser.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Supported Formats</span>
              <span>PDF (.pdf), Word (.docx), Plain Text (.txt)</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Privacy Guarantee</span>
              <span className="flex items-center gap-1 text-emerald-700">
                <Shield className="w-3.5 h-3.5" />
                Zero server transmission
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} DiffPaper. All processing takes place locally in memory.</p>
          <div className="flex items-center gap-4">
            <span>Client-side only</span>
            <span>•</span>
            <span>No telemetry on document content</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
