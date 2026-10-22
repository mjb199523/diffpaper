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

function processColumnLines(items: TextItemWithLayout[]): string[] {
  // Cluster items into lines by Y baseline
  const lineClusters: LineCluster[] = [];
  items.sort((a, b) => b.y - a.y);

  for (const item of items) {
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

  // Sort line clusters from top to bottom
  lineClusters.sort((a, b) => b.y - a.y);

  const lines: string[] = [];
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

    if (previousClusterY !== null) {
      const verticalDrop = previousClusterY - cluster.y;
      const avgHeight = Math.max((previousClusterHeight + cluster.height) / 2, 10);
      if (verticalDrop > avgHeight * 1.6) {
        lines.push('');
      }
    }

    lines.push(lineText);
    previousClusterY = cluster.y;
    previousClusterHeight = cluster.height;
  }

  return lines;
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
      const viewport = page.getViewport({ scale: 1.0 });
      const pageWidth = viewport.width;

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

      // 2. Multi-column / Sidebar detection:
      // Check if document has sidebar items (e.g. left margin x < 35% of page width with high vertical density)
      // and main body items (x > 35% of page width) at overlapping Y coordinates.
      const leftColItems: TextItemWithLayout[] = [];
      const rightColItems: TextItemWithLayout[] = [];
      const splitX = pageWidth * 0.35;

      let hasOverlap = false;
      for (const item of rawItems) {
        if (item.x + item.width < splitX) {
          leftColItems.push(item);
        } else {
          rightColItems.push(item);
        }
      }

      // Check if both left and right columns have multiple items spanning the same Y range
      if (leftColItems.length > 5 && rightColItems.length > 5) {
        const leftYMin = Math.min(...leftColItems.map(it => it.y));
        const leftYMax = Math.max(...leftColItems.map(it => it.y));
        const rightYMin = Math.min(...rightColItems.map(it => it.y));
        const rightYMax = Math.max(...rightColItems.map(it => it.y));

        const overlapY = Math.min(leftYMax, rightYMax) - Math.max(leftYMin, rightYMin);
        if (overlapY > 100) {
          hasOverlap = true;
        }
      }

      let allPageLines: string[] = [];

      if (hasOverlap) {
        // Multi-column or sidebar layout detected:
        // Process main column (or left column first if sidebar is header/sidebar) in coherent visual stream
        // Standard resume/cover letter convention: main letter stream first or left sidebar then main body
        const leftLines = processColumnLines(leftColItems);
        const rightLines = processColumnLines(rightColItems);

        // Put the header/sidebar content together, followed by the main body text
        allPageLines = [...leftLines, '', '---', '', ...rightLines];
      } else {
        // Standard single-column flow
        allPageLines = processColumnLines(rawItems);
      }

      page.cleanup();

      const pageText = allPageLines.join('\n').trim();
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
