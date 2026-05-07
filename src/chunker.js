/**
 * Chunker — splits verse text into phrase-sized chunks at natural boundaries.
 * Splits on: commas, semicolons, colons, and conjunctions (but, and, for, that, or)
 * when the resulting chunks are meaningful length (>3 words).
 */

const PUNCTUATION_SPLIT = /([,;:])\s+/;
const CONJUNCTION_RE = /\b(but|that|and|for|or|yet|so|nor)\s+/i;
const MIN_CHUNK_WORDS = 3;

/**
 * Split a single verse into phrase chunks.
 * @param {string} text - Verse text
 * @returns {string[]} Array of chunks that join back to the original
 */
export function chunkVerse(text) {
  if (!text || !text.trim()) return [''];
  text = text.trim();

  // First pass: split on punctuation (,;:)
  let parts = splitOnPunctuation(text);

  // Second pass: split long chunks on conjunctions
  let result = [];
  for (const part of parts) {
    const words = part.trim().split(/\s+/);
    if (words.length > 8) {
      const subParts = splitOnConjunction(part.trim());
      result.push(...subParts);
    } else {
      result.push(part.trim());
    }
  }

  // Merge tiny chunks back into their neighbor
  result = mergeTiny(result);

  // Clean up whitespace
  result = result.map(c => c.replace(/\s{2,}/g, ' ').trim()).filter(Boolean);

  return result.length === 0 ? [text] : result;
}

/**
 * Chunk multiple verses maintaining verse boundaries.
 * @param {{ reference: string, text: string }[]} verses
 * @returns {{ reference: string, chunks: string[] }[]}
 */
export function chunkPassage(verses) {
  return verses.map(v => ({
    reference: v.reference,
    chunks: chunkVerse(v.text),
  }));
}


/**
 * Get individual words from text (for the chunk editor UI).
 * @param {string} text
 * @returns {string[]}
 */
export function getWords(text) {
  if (!text) return [];
  return text.trim().split(/\s+/).filter(Boolean);
}

/**
 * Split text into chunks at specified word positions.
 * Positions are word indices where a new chunk begins.
 * @param {string} text - Full verse text
 * @param {number[]} positions - Word indices starting new chunks (0-based)
 * @returns {string[]}
 */
export function splitAtPositions(text, positions) {
  if (!text || !text.trim()) return [''];
  const words = getWords(text);
  if (!positions || positions.length === 0) return [words.join(' ')];

  // Deduplicate, sort, filter valid, remove 0 (first chunk always starts at 0)
  const cuts = [...new Set(positions)]
    .map(Number)
    .filter(p => p > 0 && p < words.length)
    .sort((a, b) => a - b);

  if (cuts.length === 0) return [words.join(' ')];

  const chunks = [];
  let start = 0;
  for (const cut of cuts) {
    chunks.push(words.slice(start, cut).join(' '));
    start = cut;
  }
  chunks.push(words.slice(start).join(' '));

  return chunks.filter(Boolean);
}

function splitOnPunctuation(text) {
  // Split keeping the punctuation attached to the preceding chunk
  const parts = [];
  let remaining = text;

  while (remaining) {
    const match = remaining.match(/[,;:]\s+/);
    if (!match) {
      parts.push(remaining);
      break;
    }
    const idx = match.index + match[0].length;
    // Keep punctuation with the left part (minus the trailing space)
    const left = remaining.slice(0, match.index + 1); // include punctuation char
    parts.push(left);
    remaining = remaining.slice(idx);
  }

  return parts;
}

function splitOnConjunction(text) {
  // Find conjunction positions that create balanced splits
  const words = text.split(/\s+/);
  if (words.length <= MIN_CHUNK_WORDS) return [text];

  // Look for conjunction at reasonable split point
  for (let i = MIN_CHUNK_WORDS; i < words.length - MIN_CHUNK_WORDS + 1; i++) {
    const word = words[i].toLowerCase().replace(/[^a-z]/g, '');
    if (['but', 'that', 'and', 'for', 'or', 'yet', 'so', 'nor'].includes(word)) {
      const left = words.slice(0, i).join(' ');
      const right = words.slice(i).join(' ');
      return [left, right];
    }
  }

  return [text];
}

function mergeTiny(chunks) {
  if (chunks.length <= 1) return chunks;
  const result = [];
  for (let i = 0; i < chunks.length; i++) {
    const words = chunks[i].trim().split(/\s+/);
    if (words.length < MIN_CHUNK_WORDS && result.length > 0) {
      result[result.length - 1] += ' ' + chunks[i].trim();
    } else if (words.length < MIN_CHUNK_WORDS && i < chunks.length - 1) {
      // Merge forward
      chunks[i + 1] = chunks[i].trim() + ' ' + chunks[i + 1].trim();
    } else {
      result.push(chunks[i]);
    }
  }
  return result;
}
