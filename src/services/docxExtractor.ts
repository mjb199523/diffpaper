import mammoth from 'mammoth';
import { ExtractedDocument, DocumentPage } from '../types/document';

export async function extractDocx(file: File): Promise<ExtractedDocument> {
  const arrayBuffer = await file.arrayBuffer();

  // Extract raw text preserving paragraph breaks
  const result = await mammoth.extractRawText({ arrayBuffer });
  let rawText = result.value || '';

  // Standardize line endings and collapse empty line variations to standard double-newline paragraphs
  const cleanedText = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.trim())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0))
    .join('\n')
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
