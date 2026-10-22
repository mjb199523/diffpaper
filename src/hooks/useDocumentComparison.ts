import { useState, useCallback } from 'react';
import { ComparisonMode, DiffGranularity, ComparisonResult } from '../types/comparison';
import { ExtractedDocument, ProcessingStep } from '../types/document';
import { extractDocumentText, validateDocumentFile } from '../services/textExtractor';
import { compareDocuments } from '../services/diffEngine';

export function useDocumentComparison() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [revisedFile, setRevisedFile] = useState<File | null>(null);

  const [originalFileError, setOriginalFileError] = useState<string | null>(null);
  const [revisedFileError, setRevisedFileError] = useState<string | null>(null);

  const [mode, setMode] = useState<ComparisonMode>('exact');
  const [granularity, setGranularity] = useState<DiffGranularity>('words');

  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Cached extraction results to prevent re-extracting unchanged documents
  const [cachedOriginalDoc, setCachedOriginalDoc] = useState<ExtractedDocument | null>(null);
  const [cachedRevisedDoc, setCachedRevisedDoc] = useState<ExtractedDocument | null>(null);

  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);

  const handleSelectOriginal = useCallback((file: File) => {
    const val = validateDocumentFile(file);
    if (val) {
      setOriginalFileError(val.message);
      return;
    }
    setOriginalFileError(null);
    setOriginalFile(file);
    setCachedOriginalDoc(null);
    setGeneralError(null);
  }, []);

  const handleSelectRevised = useCallback((file: File) => {
    const val = validateDocumentFile(file);
    if (val) {
      setRevisedFileError(val.message);
      return;
    }
    setRevisedFileError(null);
    setRevisedFile(file);
    setCachedRevisedDoc(null);
    setGeneralError(null);
  }, []);

  const handleClearOriginal = useCallback(() => {
    setOriginalFile(null);
    setOriginalFileError(null);
    setCachedOriginalDoc(null);
    setComparisonResult(null);
  }, []);

  const handleClearRevised = useCallback(() => {
    setRevisedFile(null);
    setRevisedFileError(null);
    setCachedRevisedDoc(null);
    setComparisonResult(null);
  }, []);

  const resetAll = useCallback(() => {
    setOriginalFile(null);
    setRevisedFile(null);
    setOriginalFileError(null);
    setRevisedFileError(null);
    setCachedOriginalDoc(null);
    setCachedRevisedDoc(null);
    setComparisonResult(null);
    setProcessingStep('idle');
    setGeneralError(null);
  }, []);

  const recomputeWithMode = useCallback(
    (newMode: ComparisonMode, newGranularity: DiffGranularity) => {
      setMode(newMode);
      setGranularity(newGranularity);
      if (cachedOriginalDoc && cachedRevisedDoc) {
        const updated = compareDocuments(cachedOriginalDoc, cachedRevisedDoc, newMode, newGranularity);
        setComparisonResult(updated);
      }
    },
    [cachedOriginalDoc, cachedRevisedDoc]
  );

  const runComparison = useCallback(async () => {
    if (!originalFile || !revisedFile) return;

    setGeneralError(null);
    try {
      // Step 1: Read original
      setProcessingStep('reading_original');
      let origDoc = cachedOriginalDoc;
      if (!origDoc) {
        origDoc = await extractDocumentText(originalFile);
        setCachedOriginalDoc(origDoc);
      }

      // Step 2: Read revised
      setProcessingStep('reading_revised');
      let revDoc = cachedRevisedDoc;
      if (!revDoc) {
        revDoc = await extractDocumentText(revisedFile);
        setCachedRevisedDoc(revDoc);
      }

      // Step 3: Comparing
      setProcessingStep('comparing');
      // Allow the UI to paint step change
      await new Promise(res => setTimeout(res, 50));

      const result = compareDocuments(origDoc, revDoc, mode, granularity);

      // Step 4: Results ready
      setProcessingStep('preparing_results');
      await new Promise(res => setTimeout(res, 30));

      setComparisonResult(result);
      setProcessingStep('completed');
    } catch (err: any) {
      setProcessingStep('error');
      setGeneralError(err.message || 'An unexpected error occurred during document comparison.');
    }
  }, [originalFile, revisedFile, cachedOriginalDoc, cachedRevisedDoc, mode, granularity]);

  return {
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
  };
}
