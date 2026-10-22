import { diffWords, diffWordsWithSpace, diffChars, diffLines, Change } from 'diff';
import {
  ComparisonMode,
  DiffGranularity,
  DiffSegment,
  StructuredChange,
  ComparisonMetrics,
  ComparisonResult,
} from '../types/comparison';
import { ExtractedDocument, DocumentPage } from '../types/document';
import { normaliseText, countWords } from '../utils/normaliseText';

/**
 * Builds a fast lookup table to map character offset in text to page number.
 */
function buildPageOffsetIndex(pages: DocumentPage[]): { threshold: number; pageNumber: number }[] {
  const index: { threshold: number; pageNumber: number }[] = [];
  let currentOffset = 0;
  for (const page of pages) {
    currentOffset += page.text.length + 2;
    index.push({ threshold: currentOffset, pageNumber: page.pageNumber });
  }
  return index;
}

function findPageNumber(offset: number, pageIndex: { threshold: number; pageNumber: number }[]): number | undefined {
  if (pageIndex.length === 0) return undefined;
  for (const entry of pageIndex) {
    if (offset < entry.threshold) {
      return entry.pageNumber;
    }
  }
  return pageIndex[pageIndex.length - 1].pageNumber;
}

/**
 * Hierarchical diff engine:
 * First aligns documents at the paragraph/line level so that common words like "This is"
 * or "and" in completely different paragraphs don't falsely latch across distant sections.
 * Within changed paragraph blocks, performs fine-grained word diffing.
 */
function computeHierarchicalDiff(textA: string, textB: string, mode: ComparisonMode): Change[] {
  const lineChanges = diffLines(textA, textB);
  const result: Change[] = [];

  for (let i = 0; i < lineChanges.length; i++) {
    const curr = lineChanges[i];
    const next = lineChanges[i + 1];

    if (curr.removed && next && next.added) {
      // Do word diff within this matched modified block
      const wordDiff =
        mode === 'ignore_formatting'
          ? diffWords(curr.value, next.value)
          : diffWordsWithSpace(curr.value, next.value);
      result.push(...wordDiff);
      i++; // skip next since it was consumed in the pair
    } else {
      result.push(curr);
    }
  }

  return result;
}

export function compareDocuments(
  originalDoc: ExtractedDocument,
  revisedDoc: ExtractedDocument,
  mode: ComparisonMode = 'exact',
  granularity: DiffGranularity = 'words'
): ComparisonResult {
  const originalCleaned = normaliseText(originalDoc.fullText, mode);
  const revisedCleaned = normaliseText(revisedDoc.fullText, mode);

  // Compute diff according to selected granularity and mode
  let rawChanges: Change[] = [];
  if (granularity === 'words') {
    rawChanges = computeHierarchicalDiff(originalCleaned, revisedCleaned, mode);
  } else if (granularity === 'chars') {
    rawChanges = diffChars(originalCleaned, revisedCleaned);
  } else {
    rawChanges = diffLines(originalCleaned, revisedCleaned);
  }

  // Pre-calculate page offset indices for both documents if pages exist
  const originalPageIndex = originalDoc.type === 'pdf' ? buildPageOffsetIndex(originalDoc.pages) : [];
  const revisedPageIndex = revisedDoc.type === 'pdf' ? buildPageOffsetIndex(revisedDoc.pages) : [];

  let origOffset = 0;
  let revOffset = 0;

  const segments: DiffSegment[] = [];
  const sideBySideOriginal: DiffSegment[] = [];
  const sideBySideRevised: DiffSegment[] = [];

  let segmentIdCounter = 0;

  for (const change of rawChanges) {
    segmentIdCounter++;
    const id = `diff-seg-${segmentIdCounter}`;
    const value = change.value;

    const type: 'added' | 'removed' | 'unchanged' = change.added
      ? 'added'
      : change.removed
      ? 'removed'
      : 'unchanged';

    let originalPage: number | undefined;
    let revisedPage: number | undefined;

    if (type === 'removed') {
      originalPage = findPageNumber(origOffset, originalPageIndex);
      origOffset += value.length;
      sideBySideOriginal.push({ id: `${id}-orig`, type: 'removed', value, originalPage });
    } else if (type === 'added') {
      revisedPage = findPageNumber(revOffset, revisedPageIndex);
      revOffset += value.length;
      sideBySideRevised.push({ id: `${id}-rev`, type: 'added', value, revisedPage });
    } else {
      originalPage = findPageNumber(origOffset, originalPageIndex);
      revisedPage = findPageNumber(revOffset, revisedPageIndex);
      origOffset += value.length;
      revOffset += value.length;

      sideBySideOriginal.push({ id: `${id}-orig`, type: 'unchanged', value, originalPage });
      sideBySideRevised.push({ id: `${id}-rev`, type: 'unchanged', value, revisedPage });
    }

    segments.push({
      id,
      type,
      value,
      originalPage,
      revisedPage,
    });
  }

  // Group adjacent removals and additions into structured changes (including 'replaced')
  const changes: StructuredChange[] = [];
  let changeIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    const curr = segments[i];
    if (curr.type === 'unchanged') continue;

    const next = segments[i + 1];

    if (curr.type === 'removed' && next && next.type === 'added') {
      changeIndex++;
      changes.push({
        id: `change-${changeIndex}`,
        type: 'replaced',
        originalText: curr.value,
        revisedText: next.value,
        originalPage: curr.originalPage,
        revisedPage: next.revisedPage,
        wordCountRemoved: countWords(curr.value),
        wordCountAdded: countWords(next.value),
      });
      i++;
    } else if (curr.type === 'removed') {
      changeIndex++;
      changes.push({
        id: `change-${changeIndex}`,
        type: 'removed',
        originalText: curr.value,
        originalPage: curr.originalPage,
        wordCountRemoved: countWords(curr.value),
        wordCountAdded: 0,
      });
    } else if (curr.type === 'added') {
      changeIndex++;
      changes.push({
        id: `change-${changeIndex}`,
        type: 'added',
        revisedText: curr.value,
        revisedPage: curr.revisedPage,
        wordCountRemoved: 0,
        wordCountAdded: countWords(curr.value),
      });
    }
  }

  // Calculate high-fidelity metrics
  let totalAddedWords = 0;
  let totalRemovedWords = 0;
  let totalUnchangedWords = 0;

  for (const seg of segments) {
    const wc = countWords(seg.value);
    if (seg.type === 'added') totalAddedWords += wc;
    else if (seg.type === 'removed') totalRemovedWords += wc;
    else totalUnchangedWords += wc;
  }

  // Calculate changed lines
  const lineDiffs = diffLines(originalCleaned, revisedCleaned);
  let changedLinesCount = 0;
  for (const ld of lineDiffs) {
    if (ld.added || ld.removed) {
      changedLinesCount += ld.count || ld.value.split('\n').filter(Boolean).length;
    }
  }

  const identical = changes.length === 0;

  const metrics: ComparisonMetrics = {
    addedWords: totalAddedWords,
    removedWords: totalRemovedWords,
    unchangedWords: totalUnchangedWords,
    changedLines: changedLinesCount,
    totalPagesOriginal: originalDoc.type === 'pdf' ? originalDoc.pages.length : undefined,
    totalPagesRevised: revisedDoc.type === 'pdf' ? revisedDoc.pages.length : undefined,
    totalChanges: changes.length,
    identical,
  };

  return {
    originalFileName: originalDoc.name,
    revisedFileName: revisedDoc.name,
    mode,
    granularity,
    timestamp: new Date().toISOString(),
    segments,
    sideBySideOriginal,
    sideBySideRevised,
    changes,
    metrics,
  };
}
