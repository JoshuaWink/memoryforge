// Bible chapter fetching — routes to bible-api.com (public domain) or proxy (copyrighted)

// USFM book codes — canonical 66 + common aliases
export const BOOK_CODES = {
  'genesis': 'GEN', 'exodus': 'EXO', 'leviticus': 'LEV', 'numbers': 'NUM', 'deuteronomy': 'DEU',
  'joshua': 'JOS', 'judges': 'JDG', 'ruth': 'RUT',
  '1 samuel': '1SA', '2 samuel': '2SA', '1 kings': '1KI', '2 kings': '2KI',
  '1 chronicles': '1CH', '2 chronicles': '2CH',
  'ezra': 'EZR', 'nehemiah': 'NEH', 'esther': 'EST',
  'job': 'JOB', 'psalms': 'PSA', 'proverbs': 'PRO', 'ecclesiastes': 'ECC',
  'song of solomon': 'SNG', 'isaiah': 'ISA', 'jeremiah': 'JER', 'lamentations': 'LAM',
  'ezekiel': 'EZK', 'daniel': 'DAN', 'hosea': 'HOS', 'joel': 'JOL', 'amos': 'AMO',
  'obadiah': 'OBA', 'jonah': 'JON', 'micah': 'MIC', 'nahum': 'NAM', 'habakkuk': 'HAB',
  'zephaniah': 'ZEP', 'haggai': 'HAG', 'zechariah': 'ZEC', 'malachi': 'MAL',
  'matthew': 'MAT', 'mark': 'MRK', 'luke': 'LUK', 'john': 'JHN',
  'acts': 'ACT', 'romans': 'ROM',
  '1 corinthians': '1CO', '2 corinthians': '2CO',
  'galatians': 'GAL', 'ephesians': 'EPH', 'philippians': 'PHP', 'colossians': 'COL',
  '1 thessalonians': '1TH', '2 thessalonians': '2TH',
  '1 timothy': '1TI', '2 timothy': '2TI', 'titus': 'TIT', 'philemon': 'PHM',
  'hebrews': 'HEB', 'james': 'JAS',
  '1 peter': '1PE', '2 peter': '2PE',
  '1 john': '1JN', '2 john': '2JN', '3 john': '3JN',
  'jude': 'JUD', 'revelation': 'REV',
  // aliases
  'psalm': 'PSA',
  'song of songs': 'SNG',
};

// Reverse: USFM code → human name (first canonical entry wins)
const CODE_TO_NAME = {};
for (const [name, code] of Object.entries(BOOK_CODES)) {
  if (!(code in CODE_TO_NAME)) {
    CODE_TO_NAME[code] = name.replace(/\b\w/g, c => c.toUpperCase());
  }
}

// Bible.com version IDs
export const VERSION_IDS = {
  NLT: 116, KJV: 1, ESV: 59, NIV: 111, NKJV: 114,
  NASB: 100, AMP: 8, MSG: 97, CSB: 1713, WEB: 206, ASV: 12,
};

// bible-api.com translation IDs (public domain, CORS-friendly)
export const BIBLE_API_IDS = {
  KJV: 'kjv', WEB: 'web', ASV: 'asv', BBE: 'bbe', DARBY: 'darby', YLT: 'ylt',
};

export function getBookCode(bookName) {
  if (!bookName) return null;
  const key = bookName.toLowerCase().trim();
  return BOOK_CODES[key] || null;
}

export function getBookName(code) {
  if (!code) return code;
  return CODE_TO_NAME[code.toUpperCase()] || code;
}

export function canUseBibleApi(translation) {
  return translation.toUpperCase() in BIBLE_API_IDS;
}

export function buildBibleApiUrl(book, chapter, translation) {
  const id = BIBLE_API_IDS[translation.toUpperCase()] || 'web';
  return `https://bible-api.com/${encodeURIComponent(book)}+${chapter}?translation=${id}`;
}

export function buildProxyUrl(proxyBase, versionId, bookCode, chapter) {
  return `${proxyBase}/api/bible/${versionId}/${bookCode}.${chapter}`;
}

export function normalizeBibleApiResponse(data) {
  return {
    reference: data.reference || '',
    verses: (data.verses || []).map(v => ({
      verse: v.verse,
      text: (v.text || '').replace(/\n/g, ' ').trim(),
    })),
    translation: data.translation_name || data.translation_id || '',
    next: null,
    nextHuman: null,
    previous: null,
    previousHuman: null,
  };
}

export function normalizeProxyResponse(data) {
  return {
    reference: data.reference || '',
    verses: data.verses || [],
    translation: data.translation || '',
    next: data.next || null,
    nextHuman: data.nextHuman || null,
    previous: data.previous || null,
    previousHuman: data.previousHuman || null,
  };
}

/**
 * Fetch a full chapter. Tries bible-api.com for public domain translations,
 * falls back to proxy for copyrighted ones.
 * @param {string} book - Book name (e.g. "Romans")
 * @param {number} chapter - Chapter number
 * @param {string} translation - Translation code (e.g. "NLT", "KJV")
 * @param {object} options - { proxyUrl: string }
 * @returns {Promise<{reference, verses, translation, next, previous, ...}>}
 */
export async function fetchChapter(book, chapter, translation, options = {}) {
  const proxyUrl = options.proxyUrl || null;
  const upperTrans = translation.toUpperCase();

  // Try bible-api.com for public domain translations
  if (canUseBibleApi(upperTrans)) {
    const url = buildBibleApiUrl(book, chapter, upperTrans);
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      return normalizeBibleApiResponse(data);
    }
  }

  // Try proxy for copyrighted translations
  if (proxyUrl) {
    const versionId = VERSION_IDS[upperTrans];
    const bookCode = getBookCode(book);
    if (!versionId || !bookCode) {
      throw new Error(`Unknown translation "${translation}" or book "${book}"`);
    }
    const url = buildProxyUrl(proxyUrl, versionId, bookCode, chapter);
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      return normalizeProxyResponse(data);
    }
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Proxy returned ${resp.status}`);
  }

  throw new Error(
    `No source for ${translation}. KJV/WEB work without a proxy. ` +
    `For ${translation}, configure a proxy server or paste text directly.`
  );
}
