import mammoth from 'mammoth';
import { ExtractedDocument, DocumentPage } from '../types/document';

export async function extractDocx(file: File): Promise<ExtractedDocument> {
  const arrayBuffer = await file.arrayBuffer();

  // Extract raw text from Word document preserving original paragraph and line boundaries
  const result = await mammoth.extractRawText({ arrayBuffer });
  let rawText = result.value || '';

  // Standardize line endings while preserving the author's original lines
  const cleanedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  const pages: DocumentPage[] = [
    {
      pageNumber: 1,
      text: cleanedText,
    },
  ];

  return {
    name: file.name,
    size: file.size,
    type: 'docx',
    pages,
    fullText: cleanedText,
    hasExtractableText: cleanedText.trim().length > 0,
  };
}
