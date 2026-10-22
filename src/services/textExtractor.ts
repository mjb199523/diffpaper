import { ExtractedDocument, FileValidationError } from '../types/document';
import { extractTxt } from './txtExtractor';
import { extractDocx } from './docxExtractor';
import { extractPdf } from './pdfExtractor';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateDocumentFile(file: File): FileValidationError | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `File exceeds the 25 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select a smaller file.`,
    };
  }

  const name = file.name.toLowerCase();
  const valid = name.endsWith('.pdf') || name.endsWith('.docx') || name.endsWith('.txt');
  if (!valid) {
    return {
      code: 'UNSUPPORTED_TYPE',
      message: 'Unsupported format. DiffPaper accepts PDF, DOCX, and TXT documents.',
    };
  }

  return null;
}

export async function extractDocumentText(file: File): Promise<ExtractedDocument> {
  const validation = validateDocumentFile(file);
  if (validation) {
    const error = new Error(validation.message);
    (error as any).code = validation.code;
    throw error;
  }

  const name = file.name.toLowerCase();
  let extracted: ExtractedDocument;

  try {
    if (name.endsWith('.pdf')) {
      extracted = await extractPdf(file);
    } else if (name.endsWith('.docx')) {
      extracted = await extractDocx(file);
    } else if (name.endsWith('.txt')) {
      extracted = await extractTxt(file);
    } else {
      throw new Error('Unsupported format');
    }
  } catch (err: any) {
    if (err.code) throw err;
    const error = new Error('Unable to read this document. Please check that the file is valid and try again.');
    (error as any).code = 'READ_ERROR';
    throw error;
  }

  if (!extracted.hasExtractableText) {
    if (extracted.type === 'pdf') {
      const error = new Error('No extractable text was found. This PDF may contain scanned pages or images.');
      (error as any).code = 'NO_EXTRACTABLE_TEXT';
      throw error;
    }
  }

  return extracted;
}
