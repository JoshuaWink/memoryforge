/**
 * Parse Bible app paste format into structured verse objects.
 *
 * Handles:
 * - YouVersion/Bible.com format: "Romans 1:1 NLT\n[1] Text...\nhttps://bible.com/..."
 * - Multi-verse: "Romans 1:1-3 NLT\n[1] Text [2] Text [3] Text\n..."
 * - Plain "Reference - Text" format
 * - Reference without translation
 */

// Matches a Bible reference line: "Book Chapter:Verse(-Verse)? (Translation)?"
// Supports numbered books (1 Corinthians) and multi-word (Song of Solomon)
const REF_LINE_RE = /^(\d?\s?[A-Za-z][A-Za-z\s]+?)\s+(\d+:\d+(?:-\d+)?)\s*([A-Z]{2,5})?\s*$/;

// Matches a verse number bracket: [1], [16], etc.
const VERSE_NUM_RE = /\[(\d+)\]\s*/g;

// URL line from Bible app
const URL_RE = /^https?:\/\//;

// Plain format: "John 3:16 - For God so loved..."
const PLAIN_RE = /^(\d?\s?[A-Za-z][A-Za-z\s]+?\s+\d+:\d+)\s*[-–—]\s*(.+)$/;

/**
 * Parse a pasted Bible text into verse objects.
 * @param {string} input - Raw pasted text
 * @returns {{ reference: string, text: string, translation: string }[]}
 */
export function parseBiblePaste(input) {
  if (!input || typeof input !== 'string') return [];
  input = input.trim();
  if (!input) return [];

  // Try Bible app format first (reference line + body + optional URL)
  const bibleAppResult = tryBibleAppFormat(input);
  if (bibleAppResult.length > 0) return bibleAppResult;

  // Try mobile Bible app format (text first, reference last)
  const refLastResult = tryRefLastFormat(input);
  if (refLastResult.length > 0) return refLastResult;

  // Try plain "Ref - text" format (one per line)
  const plainResult = tryPlainFormat(input);
  if (plainResult.length > 0) return plainResult;

  return [];
}

function tryBibleAppFormat(input) {
  const lines = input.split('\n');

  // First line should be the reference
  const firstLine = lines[0].trim();
  const refMatch = firstLine.match(REF_LINE_RE);
  if (!refMatch) return [];

  const book = refMatch[1].trim();
  const chapterVerse = refMatch[2]; // e.g. "1:1" or "1:1-3"
  const translation = refMatch[3] || '';

  // Gather body text (everything except first line and URL lines)
  const bodyLines = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (URL_RE.test(line)) continue; // skip URL
    if (line) bodyLines.push(line);
  }

  const body = bodyLines.join(' ').replace(/\s{2,}/g, ' ').trim();
  if (!body) return [];

  // Check if body has verse number brackets
  const hasVerseNums = /\[\d+\]/.test(body);

  if (hasVerseNums) {
    return parseMultiVerse(book, chapterVerse, translation, body);
  }

  // Single verse, strip any leading bracket
  const text = body.replace(/^\[\d+\]\s*/, '').trim();
  const ref = buildReference(book, chapterVerse);

  return [{ reference: ref, text, translation }];
}

function parseMultiVerse(book, chapterVerse, translation, body) {
  // Split on verse number brackets: [1] text [2] text [3] text
  const parts = body.split(/\[(\d+)\]\s*/);
  // parts = ['', '1', 'text1 ', '2', 'text2 ', '3', 'text3']

  const verses = [];
  const chapterNum = chapterVerse.split(':')[0];

  for (let i = 1; i < parts.length; i += 2) {
    const verseNum = parts[i];
    const text = (parts[i + 1] || '').trim();
    if (!text) continue;

    const ref = `${book} ${chapterNum}:${verseNum}`;
    verses.push({ reference: ref, text, translation });
  }

  return verses;
}

function buildReference(book, chapterVerse) {
  // chapterVerse might be "1:1-3" for a range; just use the base
  const cv = chapterVerse.includes('-') ? chapterVerse.split('-')[0] : chapterVerse;
  return `${book} ${cv}`;
}

function tryPlainFormat(input) {
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
  const results = [];

  for (const line of lines) {
    const match = line.match(PLAIN_RE);
    if (match) {
      results.push({
        reference: match[1].trim(),
        text: match[2].trim(),
        translation: '',
      });
    }
  }

  return results;
}


function tryRefLastFormat(input) {
  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Find the reference line (could be last or second-to-last before URL)
  let refLineIdx = -1;
  let refMatch = null;
  for (let i = lines.length - 1; i >= 1; i--) {
    if (URL_RE.test(lines[i])) continue;
    // Try matching as a reference line (with unicode dashes too)
    const normalized = lines[i].replace(/[\u2013\u2014\u2012]/g, '-');
    const m = normalized.match(REF_LINE_RE);
    if (m) {
      refLineIdx = i;
      refMatch = m;
      break;
    }
  }

  if (!refMatch || refLineIdx < 1) return [];

  const book = refMatch[1].trim();
  const chapterVerse = refMatch[2];
  const translation = refMatch[3] || '';

  // Body is everything before the reference line (and excluding URL lines)
  const bodyLines = [];
  for (let i = 0; i < refLineIdx; i++) {
    if (!URL_RE.test(lines[i])) bodyLines.push(lines[i]);
  }
  const body = bodyLines.join(' ').replace(/\s{2,}/g, ' ').trim();
  if (!body) return [];

  // Check for verse brackets
  if (/\[\d+\]/.test(body)) {
    return parseMultiVerse(book, chapterVerse, translation, body);
  }

  // Single verse
  const text = body.replace(/^\[\d+\]\s*/, '').trim();
  const ref = buildReference(book, chapterVerse);
  return [{ reference: ref, text, translation }];
}

/**
 * Parse a Bible.com URL into structured reference data.
 * URL format: https://bible.com/bible/{versionId}/{book}.{chapter}.{verse(-end)}.{translation}
 * @param {string} url
 * @returns {{ book: string, chapter: number, startVerse: number|null, endVerse: number|null, translation: string, versionId: string, url: string }|null}
 */
export function parseBibleUrl(url) {
  if (!url || typeof url !== 'string') return null;
  url = url.trim();

  // Match: https://(www.)bible.com/bible/{versionId}/{book}.{chapter}(.{verse(-end)}).{translation}
  const m = url.match(
    /^https?:\/\/(?:www\.)?bible\.com\/bible\/(\d+)\/([\w]+)\.(\d+)(?:\.(\d+)(?:-(\d+))?)?\.([A-Z]+)$/i
  );
  if (!m) return null;

  const versionId = m[1];
  const book = m[2].toLowerCase();
  const chapter = parseInt(m[3], 10);
  const startVerse = m[4] ? parseInt(m[4], 10) : null;
  const endVerse = m[5] ? parseInt(m[5], 10) : (m[4] ? parseInt(m[4], 10) : null);
  const translation = m[6].toUpperCase();

  return { book, chapter, startVerse, endVerse, translation, versionId, url };
}
