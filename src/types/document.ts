export interface DocumentPage {
  pageNumber: number;
  text: string;
}

export interface ExtractedDocument {
  name: string;
  size: number;
  type: 'pdf' | 'docx' | 'txt';
  pages: DocumentPage[];
  fullText: string;
  hasExtractableText: boolean;
}

export type ProcessingStep =
  | 'idle'
  | 'reading_original'
  | 'reading_revised'
  | 'comparing'
  | 'preparing_results'
  | 'completed'
  | 'error';

export interface FileValidationError {
  code:
    | 'FILE_TOO_LARGE'
    | 'UNSUPPORTED_TYPE'
    | 'EMPTY_FILE'
    | 'READ_ERROR'
    | 'PASSWORD_PROTECTED'
    | 'NO_EXTRACTABLE_TEXT';
  message: string;
}
