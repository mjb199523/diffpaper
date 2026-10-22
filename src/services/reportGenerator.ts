import { jsPDF } from 'jspdf';
import { ComparisonResult } from '../types/comparison';
import { downloadBlob, downloadText } from '../utils/downloadFile';

export function generateTxtReport(result: ComparisonResult): string {
  const lines: string[] = [];
  lines.push('=====================================================');
  lines.push('               DIFFPAPER CHANGE REPORT               ');
  lines.push('=====================================================');
  lines.push('');
  lines.push(`Generated: ${new Date(result.timestamp).toLocaleString()}`);
  lines.push(`Original Document: ${result.originalFileName}`);
  lines.push(`Revised Document:  ${result.revisedFileName}`);
  lines.push(`Comparison Mode:   ${result.mode === 'exact' ? 'Exact Text' : 'Ignore Formatting Noise'}`);
  lines.push(`Granularity:       ${result.granularity.toUpperCase()}`);
  lines.push('');
  lines.push('-----------------------------------------------------');
  lines.push('                   CHANGE SUMMARY                    ');
  lines.push('-----------------------------------------------------');
  lines.push(`Total Changes:     ${result.metrics.totalChanges}`);
  lines.push(`Added Words:       +${result.metrics.addedWords}`);
  lines.push(`Removed Words:     -${result.metrics.removedWords}`);
  lines.push(`Unchanged Words:   ${result.metrics.unchangedWords}`);
  lines.push(`Changed Lines:     ${result.metrics.changedLines}`);
  if (result.metrics.totalPagesOriginal) {
    lines.push(`Pages in Original: ${result.metrics.totalPagesOriginal}`);
  }
  if (result.metrics.totalPagesRevised) {
    lines.push(`Pages in Revised:  ${result.metrics.totalPagesRevised}`);
  }
  lines.push('');
  lines.push('-----------------------------------------------------');
  lines.push('                  DETAILED CHANGES                   ');
  lines.push('-----------------------------------------------------');
  lines.push('');

  if (result.changes.length === 0) {
    lines.push('No textual differences found between these documents.');
  } else {
    result.changes.forEach((change, idx) => {
      lines.push(`[#${idx + 1}] Type: ${change.type.toUpperCase()}`);
      if (change.originalPage !== undefined || change.revisedPage !== undefined) {
        const origP = change.originalPage ? `p. ${change.originalPage}` : 'N/A';
        const revP = change.revisedPage ? `p. ${change.revisedPage}` : 'N/A';
        lines.push(`     Pages: Original [${origP}] -> Revised [${revP}]`);
      }
      if (change.type === 'replaced') {
        lines.push(`     (-) Removed: "${change.originalText?.replace(/\n/g, ' ')}"`);
        lines.push(`     (+) Added:   "${change.revisedText?.replace(/\n/g, ' ')}"`);
      } else if (change.type === 'removed') {
        lines.push(`     (-) Removed: "${change.originalText?.replace(/\n/g, ' ')}"`);
      } else if (change.type === 'added') {
        lines.push(`     (+) Added:   "${change.revisedText?.replace(/\n/g, ' ')}"`);
      }
      lines.push('');
    });
  }

  lines.push('=====================================================');
  lines.push('End of DiffPaper Report - Built with local privacy');
  return lines.join('\n');
}

export function exportTxtReport(result: ComparisonResult): void {
  const content = generateTxtReport(result);
  const filename = `diffpaper-report-${Date.now()}.txt`;
  downloadText(content, filename);
}

export function exportPdfReport(result: ComparisonResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text('DiffPaper Document Comparison Report', margin, y);
  y += 24;

  // Metadata block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Generated on: ${new Date(result.timestamp).toLocaleString()}`, margin, y);
  y += 14;
  doc.text(`Original Document: ${result.originalFileName}`, margin, y);
  y += 14;
  doc.text(`Revised Document:  ${result.revisedFileName}`, margin, y);
  y += 14;
  doc.text(`Comparison Mode:   ${result.mode === 'exact' ? 'Exact Text' : 'Ignore Formatting Noise'}  |  Granularity: ${result.granularity.toUpperCase()}`, margin, y);
  y += 20;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  // Summary Metrics Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 54, 4, 4, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Summary of Differences', margin + 12, y + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const metricsText = `Changes: ${result.metrics.totalChanges}    |    Added Words: +${result.metrics.addedWords}    |    Removed Words: -${result.metrics.removedWords}    |    Changed Lines: ${result.metrics.changedLines}`;
  doc.text(metricsText, margin + 12, y + 36);
  y += 70;

  // Changes Section Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text('Detailed Changes List', margin, y);
  y += 16;

  if (result.changes.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('No textual differences found between these documents.', margin, y);
  } else {
    result.changes.forEach((change, idx) => {
      checkPageBreak(50);

      // Change tag
      const tag = `#${idx + 1} [${change.type.toUpperCase()}]`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      if (change.type === 'added') {
        doc.setTextColor(22, 101, 52); // green
      } else if (change.type === 'removed') {
        doc.setTextColor(185, 28, 28); // red
      } else {
        doc.setTextColor(30, 58, 138); // blue
      }

      let pageInfo = '';
      if (change.originalPage || change.revisedPage) {
        const op = change.originalPage ? `p.${change.originalPage}` : '-';
        const rp = change.revisedPage ? `p.${change.revisedPage}` : '-';
        pageInfo = ` (Page ${op} -> ${rp})`;
      }

      doc.text(`${tag}${pageInfo}`, margin, y);
      y += 13;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      if (change.type === 'replaced') {
        if (change.originalText) {
          doc.setTextColor(185, 28, 28);
          const origLines = doc.splitTextToSize(`(-) Removed: ${change.originalText}`, contentWidth - 10);
          checkPageBreak(origLines.length * 12);
          doc.text(origLines, margin + 10, y);
          y += origLines.length * 12;
        }
        if (change.revisedText) {
          doc.setTextColor(22, 101, 52);
          const revLines = doc.splitTextToSize(`(+) Added:   ${change.revisedText}`, contentWidth - 10);
          checkPageBreak(revLines.length * 12);
          doc.text(revLines, margin + 10, y);
          y += revLines.length * 12;
        }
      } else if (change.type === 'removed' && change.originalText) {
        doc.setTextColor(185, 28, 28);
        const origLines = doc.splitTextToSize(`(-) Removed: ${change.originalText}`, contentWidth - 10);
        checkPageBreak(origLines.length * 12);
        doc.text(origLines, margin + 10, y);
        y += origLines.length * 12;
      } else if (change.type === 'added' && change.revisedText) {
        doc.setTextColor(22, 101, 52);
        const revLines = doc.splitTextToSize(`(+) Added: ${change.revisedText}`, contentWidth - 10);
        checkPageBreak(revLines.length * 12);
        doc.text(revLines, margin + 10, y);
        y += revLines.length * 12;
      }

      y += 8; // spacing between changes
    });
  }

  // Footer on each page
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `DiffPaper — Local Document Comparison | Page ${i} of ${totalPages}`,
      margin,
      pageHeight - 20
    );
  }

  const filename = `diffpaper-report-${Date.now()}.pdf`;
  const blob = doc.output('blob');
  downloadBlob(blob, filename);
}
