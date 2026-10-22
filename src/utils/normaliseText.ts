import { ComparisonMode } from '../types/comparison';

/**
 * Normalises text based on the selected comparison mode.
 * - Standardizes dash characters (em-dash —, en-dash –, horizontal bar ―) to standard hyphen (-)
 * - Standardizes typographic smart quotes (“” ‘’) to standard quotes (" ')
 * - Standardizes line breaks (\r\n -> \n)
 * - In 'ignore_formatting' mode: collapses whitespace and spaces around line breaks
 */
export function normaliseText(text: string, mode: ComparisonMode): string {
  if (!text) return '';

  // 1. Standardize line endings (\r\n -> \n, \r -> \n)
  let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Normalize typographic dashes and quotes so they don't produce false diffs between PDF and Word
  cleaned = cleaned
    .replace(/[\u2014\u2013\u2015]/g, '-') // em-dash, en-dash, horizontal bar to standard hyphen
    .replace(/[\u2018\u2019]/g, "'")       // smart single quotes to straight quote
    .replace(/[\u201C\u201D]/g, '"');      // smart double quotes to straight quote

  if (mode === 'ignore_formatting') {
    // Trim each line, collapse repeated spaces and collapse multiple empty lines to a clean double-newline
    cleaned = cleaned
      .split('\n')
      .map(line => line.replace(/[ \t]+/g, ' ').trim())
      .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0))
      .join('\n')
      .trim();
  }

  return cleaned;
}

/**
 * Counts words accurately in a string
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const matches = text.trim().match(/\S+/g);
  return matches ? matches.length : 0;
}
