import React from 'react';
import { Loader2 } from 'lucide-react';
import { ProcessingStep } from '../types/document';

interface LoadingStateProps {
  step: ProcessingStep;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ step }) => {
  const getStepMessage = () => {
    switch (step) {
      case 'reading_original':
        return 'Reading original document...';
      case 'reading_revised':
        return 'Reading revised document...';
      case 'comparing':
        return 'Extracting text and comparing documents...';
      case 'preparing_results':
        return 'Preparing comparison report and highlights...';
      default:
        return 'Extracting text and comparing documents...';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs text-center flex flex-col items-center justify-center my-6">
      <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-4 animate-spin">
        <Loader2 className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">
        {getStepMessage()}
      </h3>
      <p className="text-xs text-slate-500 max-w-sm">
        Processing 100% locally in your browser. Large documents with many pages may take a few seconds.
      </p>
    </div>
  );
};
