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

      // 4. Assemble visual lines
      const visualLines: { text: string; isBreak: boolean }[] = [];
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

        let isBreak = false;
        if (previousClusterY !== null) {
          const verticalDrop = previousClusterY - cluster.y;
          const avgHeight = Math.max((previousClusterHeight + cluster.height) / 2, 10);
          // A physical gap > 1.5x line height marks a blank line / paragraph separation
          if (verticalDrop > avgHeight * 1.5) {
            isBreak = true;
          }
        }

        visualLines.push({ text: lineText, isBreak });
        previousClusterY = cluster.y;
        previousClusterHeight = cluster.height;
      }

      // 5. De-wrap soft line breaks within body paragraphs:
      // Lines within the same paragraph wrap across lines in PDF fixed-width formatting.
      // Joining wrapped lines with a single space makes the paragraph continuous and flowing,
      // exactly like Word (.docx), eliminating the mid-sentence line skips.
      const paragraphs: string[] = [];
      let currentParaLines: string[] = [];

      for (const item of visualLines) {
        // Headers, bullet points, salutations, or dates are distinct structural lines
        const isHeaderOrBullet =
          item.isBreak ||
          item.text.includes('|') ||
          /^(Dear\s+|To\s+|From\s+|Re:|Subject:|Executive\s+|Ayang\s+)/i.test(item.text) ||
          /^[•\-\*]\s+/.test(item.text) ||
          /^\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4}$/.test(item.text) ||
          /^[A-Z\s]{4,}$/.test(item.text);

        if (isHeaderOrBullet && currentParaLines.length > 0) {
          paragraphs.push(currentParaLines.join(' '));
          currentParaLines = [];
        }

        if (isHeaderOrBullet) {
          paragraphs.push(item.text);
        } else {
          // De-hyphenate words broken at line ends e.g. "large-" + "scale" -> "large-scale"
          if (currentParaLines.length > 0 && currentParaLines[currentParaLines.length - 1].endsWith('-')) {
            const last = currentParaLines.pop()!;
            currentParaLines.push(last + item.text);
          } else {
            currentParaLines.push(item.text);
          }
        }
      }

      if (currentParaLines.length > 0) {
        paragraphs.push(currentParaLines.join(' '));
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
