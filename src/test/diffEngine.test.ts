import { describe, it, expect } from 'vitest';
import { compareDocuments } from '../services/diffEngine';
import { normaliseText, countWords } from '../utils/normaliseText';
import { generateTxtReport } from '../services/reportGenerator';
import { validateDocumentFile } from '../services/textExtractor';
import { ExtractedDocument } from '../types/document';

function makeDoc(name: string, text: string, pages?: { pageNumber: number; text: string }[]): ExtractedDocument {
  return {
    name,
    size: text.length,
    type: name.endsWith('.pdf') ? 'pdf' : name.endsWith('.docx') ? 'docx' : 'txt',
    fullText: text,
    hasExtractableText: text.trim().length > 0,
    pages: pages || [{ pageNumber: 1, text }],
  };
}

describe('DiffPaper Comparison Engine & Core Requirements', () => {
  // Case 1: Identical documents
  it('1. should identify identical documents accurately', () => {
    const text = 'The application must be submitted within 15 days.';
    const orig = makeDoc('doc1.txt', text);
    const rev = makeDoc('doc2.txt', text);

    const result = compareDocuments(orig, rev, 'exact', 'words');
    expect(result.metrics.identical).toBe(true);
    expect(result.metrics.totalChanges).toBe(0);
    expect(result.metrics.addedWords).toBe(0);
    expect(result.metrics.removedWords).toBe(0);
  });

  // Case 2: One word added
  it('2. should detect one word added', () => {
    const orig = makeDoc('doc1.txt', 'The application must be submitted.');
    const rev = makeDoc('doc2.txt', 'The official application must be submitted.');

    const result = compareDocuments(orig, rev, 'exact', 'words');
    expect(result.metrics.identical).toBe(false);
    expect(result.metrics.addedWords).toBe(1);
    expect(result.metrics.removedWords).toBe(0);

    const addChange = result.changes.find(c => c.type === 'added');
    expect(addChange).toBeDefined();
    expect(addChange?.revisedText?.trim()).toBe('official');
  });

  // Case 3: One word removed
  it('3. should detect one word removed', () => {
    const orig = makeDoc('doc1.txt', 'The official application must be submitted.');
    const rev = makeDoc('doc2.txt', 'The application must be submitted.');

    const result = compareDocuments(orig, rev, 'exact', 'words');
    expect(result.metrics.identical).toBe(false);
    expect(result.metrics.addedWords).toBe(0);
    expect(result.metrics.removedWords).toBe(1);

    const removeChange = result.changes.find(c => c.type === 'removed');
    expect(removeChange).toBeDefined();
    expect(removeChange?.originalText?.trim()).toBe('official');
  });

  // Case 4: A word replaced with another word (the prompt's exact example: 15 days vs 30 days)
  it('4. should detect word replacement (e.g. 15 -> 30 days)', () => {
    const orig = makeDoc('doc1.txt', 'The application must be submitted within 15 days.');
    const rev = makeDoc('doc2.txt', 'The application must be submitted within 30 days.');

    const result = compareDocuments(orig, rev, 'exact', 'words');
    expect(result.metrics.identical).toBe(false);
    expect(result.metrics.removedWords).toBe(1);
    expect(result.metrics.addedWords).toBe(1);

    const replaced = result.changes.find(c => c.type === 'replaced');
    expect(replaced).toBeDefined();
    expect(replaced?.originalText?.trim()).toBe('15');
    expect(replaced?.revisedText?.trim()).toBe('30');
  });

  // Case 5: Multiple changes in one paragraph
  it('5. should handle multiple changes in one paragraph', () => {
    const orig = makeDoc('doc1.txt', 'Alice loves red apples and yellow bananas in the morning.');
    const rev = makeDoc('doc2.txt', 'Alice enjoys green apples and sweet bananas in the evening.');

    const result = compareDocuments(orig, rev, 'exact', 'words');
    expect(result.changes.length).toBeGreaterThanOrEqual(3);
  });

  // Case 6: Punctuation changes
  it('6. should detect punctuation changes correctly', () => {
    const orig = makeDoc('doc1.txt', 'Hello world!');
    const rev = makeDoc('doc2.txt', 'Hello world?');

    const result = compareDocuments(orig, rev, 'exact', 'words');
    expect(result.metrics.identical).toBe(false);
    expect(result.changes.length).toBeGreaterThan(0);
  });

  // Case 7: Whitespace-only differences under exact vs ignore_formatting
  it('7. should distinguish whitespace in exact mode but ignore in ignore_formatting mode', () => {
    const origText = 'Hello    world\n\n\nTest   line';
    const revText = 'Hello world\n\nTest line';

    const orig = makeDoc('doc1.txt', origText);
    const rev = makeDoc('doc2.txt', revText);

    // In exact mode: differences found
    const exactResult = compareDocuments(orig, rev, 'exact', 'words');
    expect(exactResult.metrics.identical).toBe(false);

    // In ignore formatting mode: identical
    const ignoredResult = compareDocuments(orig, rev, 'ignore_formatting', 'words');
    expect(ignoredResult.metrics.identical).toBe(true);
  });

  // Case 8: Empty documents
  it('8. should handle empty documents without throwing', () => {
    const orig = makeDoc('empty1.txt', '');
    const rev = makeDoc('empty2.txt', '');

    const result = compareDocuments(orig, rev, 'exact', 'words');
    expect(result.metrics.identical).toBe(true);
    expect(result.metrics.totalChanges).toBe(0);
  });

  // Case 9: Unicode and non-English text
  it('9. should support Unicode, accents, and non-English text', () => {
    const orig = makeDoc('doc1.txt', 'Bonjour le monde! Ça va bien?');
    const rev = makeDoc('doc2.txt', 'Bonjour tout le monde! Ça va très bien?');

    const result = compareDocuments(orig, rev, 'exact', 'words');
    expect(result.metrics.identical).toBe(false);
    expect(result.metrics.addedWords).toBeGreaterThan(0);
  });

  // Case 10: Multi-page PDF extraction page-tracking
  it('10. should accurately track page numbers across pages', () => {
    const origPages = [
      { pageNumber: 1, text: 'First page original content here.' },
      { pageNumber: 2, text: 'Second page original paragraph with 15 days.' },
    ];
    const revPages = [
      { pageNumber: 1, text: 'First page original content here.' },
      { pageNumber: 2, text: 'Second page revised paragraph with 30 days.' },
    ];

    const orig = makeDoc('test.pdf', origPages.map(p => p.text).join('\n\n'), origPages);
    const rev = makeDoc('test.pdf', revPages.map(p => p.text).join('\n\n'), revPages);

    const result = compareDocuments(orig, rev, 'exact', 'words');
    expect(result.metrics.totalPagesOriginal).toBe(2);
    expect(result.metrics.totalPagesRevised).toBe(2);

    const page2Change = result.changes.find(c => c.originalPage === 2);
    expect(page2Change).toBeDefined();
  });

  // Case 11: Unsupported files validation
  it('11. should reject unsupported file formats', () => {
    const fakeFile = new File(['foo'], 'image.png', { type: 'image/png' });
    const validation = validateDocumentFile(fakeFile);
    expect(validation).not.toBeNull();
    expect(validation?.code).toBe('UNSUPPORTED_TYPE');
  });

  // Case 12: Large file validation
  it('12. should reject files exceeding 25 MB', () => {
    const largeFile = new File([new ArrayBuffer(26 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    const validation = validateDocumentFile(largeFile);
    expect(validation).not.toBeNull();
    expect(validation?.code).toBe('FILE_TOO_LARGE');
  });

  // Case 13: Exported reports containing actual changes
  it('13. should generate a TXT report containing exact real diff stats and text', () => {
    const orig = makeDoc('orig.txt', 'The price is 100 dollars.');
    const rev = makeDoc('rev.txt', 'The price is 200 dollars.');

    const result = compareDocuments(orig, rev, 'exact', 'words');
    const report = generateTxtReport(result);

    expect(report).toContain('DIFFPAPER CHANGE REPORT');
    expect(report).toContain('Total Changes:     1');
    expect(report).toContain('(-) Removed: "100"');
    expect(report).toContain('(+) Added:   "200"');
  });

  // Case 14: countWords and normaliseText utility sanity
  it('14. should count words accurately across different whitespace variations', () => {
    expect(countWords('   Hello   world!  This is a   test.  ')).toBe(6);
    expect(countWords('')).toBe(0);
    expect(countWords('     ')).toBe(0);

    const raw = 'Line 1   with   spaces\r\n\r\n\r\n\r\nLine 2';
    const norm = normaliseText(raw, 'ignore_formatting');
    expect(norm).toBe('Line 1 with spaces\n\nLine 2');
  });
});
