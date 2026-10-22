export type DiffGranularity = 'words' | 'chars' | 'lines';

export type ComparisonMode = 'exact' | 'ignore_formatting';

export type ChangeType = 'added' | 'removed' | 'unchanged' | 'replaced';

export interface DiffSegment {
  id: string;
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  originalPage?: number;
  revisedPage?: number;
}

export interface StructuredChange {
  id: string;
  type: ChangeType;
  originalText?: string;
  revisedText?: string;
  originalPage?: number;
  revisedPage?: number;
  wordCountAdded: number;
  wordCountRemoved: number;
}

export interface ComparisonMetrics {
  addedWords: number;
  removedWords: number;
  unchangedWords: number;
  changedLines: number;
  totalPagesOriginal?: number;
  totalPagesRevised?: number;
  totalChanges: number;
  identical: boolean;
}

export interface ComparisonResult {
  originalFileName: string;
  revisedFileName: string;
  mode: ComparisonMode;
  granularity: DiffGranularity;
  timestamp: string;
  segments: DiffSegment[];
  sideBySideOriginal: DiffSegment[];
  sideBySideRevised: DiffSegment[];
  changes: StructuredChange[];
  metrics: ComparisonMetrics;
}
