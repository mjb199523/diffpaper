import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { ExtractedDocument, DocumentPage } from '../types/document';

// Configure worker URL reliably for Vite
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

interface TextItemWithLayout {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LineCluster {
  y: number;
  height: number;
  items: TextItemWithLayout[];
}

export async function extractPdf(file: File): Promise<ExtractedDocument> {
  const arrayBuffer = await file.arrayBuffer();

  let pdfDoc: pdfjsLib.PDFDocumentProxy | null = null;
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      disableRange: true,
      disableStream: true,
    });

    pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pages: DocumentPage[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();

      // 1. Gather all text items with coordinates
      const rawItems: TextItemWithLayout[] = [];
      for (const item of textContent.items) {
        if ('str' in item && typeof item.str === 'string') {
          const transform = item.transform;
          const x = transform ? transform[4] : 0;
          const y = transform ? transform[5] : 0;
          const height = item.height || (transform ? Math.abs(transform[0]) : 12);
          const width = item.width || 0;
          rawItems.push({
            str: item.str,
            x,
            y,
            width,
            height,
          });
        }
      }

      // 2. Cluster into lines based on vertical baseline tolerance
      const lineClusters: LineCluster[] = [];
      rawItems.sort((a, b) => b.y - a.y);

      for (const item of rawItems) {
        let matchedCluster: LineCluster | null = null;
        for (const cluster of lineClusters) {
          const verticalThreshold = Math.max(cluster.height * 0.45, 4);
          if (Math.abs(item.y - cluster.y) <= verticalThreshold) {
            matchedCluster = cluster;
            break;
          }
        }

        if (matchedCluster) {
          matchedCluster.items.push(item);
          matchedCluster.y =
            (matchedCluster.y * (matchedCluster.items.length - 1) + item.y) / matchedCluster.items.length;
          matchedCluster.height = Math.max(matchedCluster.height, item.height);
        } else {
          lineClusters.push({
            y: item.y,
            height: item.height,
            items: [item],
          });
        }
      }

      // 3. Sort line clusters from top of page to bottom
      lineClusters.sort((a, b) => b.y - a.y);

      // 4. Assemble lines and measure vertical gaps between consecutive lines
      const clusteredLines: { text: string; isParagraphBreak: boolean }[] = [];
      let previousClusterY: number | null = null;
      let previousClusterHeight: number = 12;

      for (const cluster of lineClusters) {
        cluster.items.sort((a, b) => a.x - b.x);

        const linePieces: string[] = [];
        let prevItem: TextItemWithLayout | null = null;

        for (const item of cluster.items) {
          if (!prevItem) {
            linePieces.push(item.str);
          } else {
            const gap = item.x - (prevItem.x + prevItem.width);
            const prevStr = prevItem.str;
            const currStr = item.str;

            if (
              gap > 1.8 &&
              !prevStr.endsWith(' ') &&
              !currStr.startsWith(' ') &&
              !prevStr.endsWith('/') &&
              !currStr.startsWith('/')
            ) {
              linePieces.push(' ');
            }
            linePieces.push(currStr);
          }
          prevItem = item;
        }

        const lineText = linePieces.join('').trim();
        if (lineText.length === 0) continue;

        let isParagraphBreak = false;
        if (previousClusterY !== null) {
          const verticalDrop = previousClusterY - cluster.y;
          const avgHeight = Math.max((previousClusterHeight + cluster.height) / 2, 10);
          // A physical gap > 1.6x the line height signals a blank line / paragraph break in the document layout
          if (verticalDrop > avgHeight * 1.6) {
            isParagraphBreak = true;
          }
        }

        clusteredLines.push({ text: lineText, isParagraphBreak });
        previousClusterY = cluster.y;
        previousClusterHeight = cluster.height;
      }

      // 5. Build paragraphs based purely on visual gaps and explicit structural headers
      const paragraphs: string[] = [];
      let currentParagraph: string[] = [];

      for (let idx = 0; idx < clusteredLines.length; idx++) {
        const { text, isParagraphBreak } = clusteredLines[idx];

        // Explicit structural headers or date/bullet lines are standalone paragraphs
        const isStructuralHeader =
          /^(Dear\s+|To\s+|From\s+|Re:|Subject:|Executive\s+|Ayang\s+)/i.test(text) ||
          /^[•\-\*]\s+/.test(text) ||
          /^\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4}$/.test(text) ||
          /^[A-Z\s]{4,}$/.test(text);

        if ((isParagraphBreak || isStructuralHeader) && currentParagraph.length > 0) {
          paragraphs.push(currentParagraph.join(' '));
          currentParagraph = [];
        }

        if (isStructuralHeader) {
          paragraphs.push(text);
        } else {
          currentParagraph.push(text);
        }
      }

      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
      }

      page.cleanup();

      const pageText = paragraphs.join('\n\n').trim();
      pages.push({
        pageNumber: i,
        text: pageText,
      });
    }

    const fullText = pages.map(p => p.text).filter(t => t.length > 0).join('\n\n');
    const hasExtractableText = fullText.trim().length > 0;

    return {
      name: file.name,
      size: file.size,
      type: 'pdf',
      pages,
      fullText,
      hasExtractableText,
    };
  } catch (error: any) {
    if (error?.name === 'PasswordException') {
      const err = new Error('This PDF is password-protected. Please provide an unlocked document.');
      (err as any).code = 'PASSWORD_PROTECTED';
      throw err;
    }
    if (error?.name === 'InvalidPDFException') {
      const err = new Error('Unable to read this document. Please check that the file is valid and try again.');
      (err as any).code = 'READ_ERROR';
      throw err;
    }
    throw error;
  } finally {
    if (pdfDoc) {
      try {
        if (typeof (pdfDoc as any).destroy === 'function') {
          (pdfDoc as any).destroy();
        } else if (typeof (pdfDoc as any).cleanup === 'function') {
          (pdfDoc as any).cleanup();
        }
      } catch {
        // ignore cleanup error
      }
    }
  }
}
