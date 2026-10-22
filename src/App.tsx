import React, { useRef } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FileUploader } from './components/FileUploader';
import { ComparisonSettings } from './components/ComparisonSettings';
import { ComparisonView } from './components/ComparisonView';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { HowItWorks } from './components/HowItWorks';
import { Footer } from './components/Footer';
import { useDocumentComparison } from './hooks/useDocumentComparison';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export const App: React.FC = () => {
  const {
    originalFile,
    revisedFile,
    originalFileError,
    revisedFileError,
    mode,
    setMode,
    granularity,
    setGranularity,
    processingStep,
    generalError,
    comparisonResult,
    handleSelectOriginal,
    handleSelectRevised,
    handleClearOriginal,
    handleClearRevised,
    resetAll,
    runComparison,
    recomputeWithMode,
  } = useDocumentComparison();

  const uploadSectionRef = useRef<HTMLDivElement>(null);

  const scrollToUpload = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const isProcessing =
    processingStep === 'reading_original' ||
    processingStep === 'reading_revised' ||
    processingStep === 'comparing' ||
    processingStep === 'preparing_results';

  const canCompare = Boolean(originalFile && revisedFile && !isProcessing);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Navigation */}
      <Navbar
        onReset={resetAll}
        onNavigateHowItWorks={scrollToHowItWorks}
        onNavigateCompare={scrollToUpload}
      />

      <main className="flex-1">
        {comparisonResult ? (
          /* Dedicated Comparison Results View */
          <ComparisonView
            result={comparisonResult}
            onNewComparison={resetAll}
            onModeChange={recomputeWithMode}
          />
        ) : (
          /* Main Landing / Upload Area */
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
            <Hero
              onCompareClick={scrollToUpload}
              onHowItWorksClick={scrollToHowItWorks}
            />

            {/* Document Upload Section */}
            <div ref={uploadSectionRef} className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUploader
                  label="Original Version"
                  description="Upload the earlier document (PDF, DOCX, TXT)"
                  file={originalFile}
                  onFileSelect={handleSelectOriginal}
                  onClear={handleClearOriginal}
                  error={originalFileError}
                  disabled={isProcessing}
                />

                <FileUploader
                  label="Revised Version"
                  description="Upload the updated document (PDF, DOCX, TXT)"
                  file={revisedFile}
                  onFileSelect={handleSelectRevised}
                  onClear={handleClearRevised}
                  error={revisedFileError}
                  disabled={isProcessing}
                />
              </div>

              {/* Text Normalisation & Comparison Settings */}
              <div className="mt-4">
                <ComparisonSettings
                  mode={mode}
                  onModeChange={setMode}
                  granularity={granularity}
                  onGranularityChange={setGranularity}
                  disabled={isProcessing}
                />
              </div>

              {/* Compare Action Button */}
              <div className="mt-6 flex flex-col items-center">
                <button
                  type="button"
                  onClick={runComparison}
                  disabled={!canCompare}
                  className={`w-full sm:w-80 py-3.5 px-6 rounded-xl font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
                    canCompare
                      ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer hover:shadow-md'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300'
                  }`}
                >
                  <span>Compare Documents</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {!originalFile || !revisedFile ? (
                  <p className="text-xs text-slate-400 mt-2">
                    Please upload both document versions to enable comparison
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Processing takes place in memory on your device</span>
                  </div>
                )}
              </div>

              {/* Loading State during comparison */}
              {isProcessing && <LoadingState step={processingStep} />}

              {/* Error State if extraction or diff fails */}
              {generalError && (
                <ErrorState
                  message={generalError}
                  onRetry={runComparison}
                />
              )}
            </div>

            {/* How It Works Explanatory Section */}
            <div className="mt-16">
              <HowItWorks />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
