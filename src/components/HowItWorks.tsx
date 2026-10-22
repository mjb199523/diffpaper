import React from 'react';
import { UploadCloud, Cpu, FileCheck2, Info } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-16 bg-slate-50 border-t border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            How DiffPaper Works
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            A fast, private, and deterministic workflow designed for contracts, drafts, papers, and text reviews.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col items-start">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
              <UploadCloud className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Step 1
            </span>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Upload Documents
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Choose the original and revised versions of your document (PDF, DOCX, or TXT). Files remain inside your browser memory.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col items-start">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Step 2
            </span>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Deterministic Diff
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              DiffPaper extracts the text and compares both versions using deterministic algorithms. No hallucinations or AI opacity.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col items-start">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              Step 3
            </span>
            <h3 className="text-base font-semibold text-slate-900 mb-2">
              Review & Export
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Inspect additions, deletions, and replacements side-by-side or inline, then download a comprehensive change report as PDF or TXT.
            </p>
          </div>
        </div>

        {/* Note */}
        <div className="mt-8 bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800 leading-relaxed">
            <strong>Note on extraction:</strong> DiffPaper compares extracted text. It does not guarantee exact visual-layout comparison or perfect reading order for every PDF. OCR for scanned images is not included in this client-side version.
          </p>
        </div>
      </div>
    </section>
  );
};
