import { ComparisonMode } from '../types/comparison';

/**
 * Normalises text for diffing:
 * - Keeps the text format, spelling, and line structure intact.
 * - Standardizes line breaks (\r\n -> \n).
 * - Standardizes dash characters (em-dash —, en-dash –) and smart quotes so cross-format font variations don't trigger false changes.
 * - In 'ignore_formatting' mode: collapses multiple consecutive spaces/tabs into a single space, and collapses more than two consecutive empty lines to standard paragraph separation (\n\n).
 */
export function normaliseText(text: string, mode: ComparisonMode): string {
  if (!text) return '';

  // 1. Standardize line endings (\r\n -> \n, \r -> \n)
  let cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Normalize typographic dashes and quotes so they don't produce false diffs across formats
  cleaned = cleaned
    .replace(/[\u2014\u2013\u2015]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  if (mode === 'ignore_formatting') {
    // Normalise intra-line repeated spaces and trailing spaces
    cleaned = cleaned
      .split('\n')
      .map(line => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n')
      // Collapse excessive blank lines down to standard double newline
      .replace(/\n{3,}/g, '\n\n');
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
