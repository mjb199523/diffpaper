import { ExtractedDocument, DocumentPage } from '../types/document';

export async function extractTxt(file: File): Promise<ExtractedDocument> {
  const text = await file.text();
  const pages: DocumentPage[] = [
    {
      pageNumber: 1,
      text: text,
    },
  ];

  return {
    name: file.name,
    size: file.size,
    type: 'txt',
    pages,
    fullText: text,
    hasExtractableText: text.trim().length > 0,
  };
}
