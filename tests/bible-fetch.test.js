import { describe, it, expect } from 'vitest';
import {
  BOOK_CODES,
  VERSION_IDS,
  BIBLE_API_IDS,
  getBookCode,
  getBookName,
  canUseBibleApi,
  buildBibleApiUrl,
  buildProxyUrl,
  normalizeBibleApiResponse,
  normalizeProxyResponse,
} from '../src/bible-fetch.js';

describe('BOOK_CODES', () => {
  it('has all 66 books', () => {
    const uniqueCodes = new Set(Object.values(BOOK_CODES));
    expect(uniqueCodes.size).toBe(66);
  });

  it('maps common books correctly', () => {
    expect(BOOK_CODES['genesis']).toBe('GEN');
    expect(BOOK_CODES['romans']).toBe('ROM');
    expect(BOOK_CODES['revelation']).toBe('REV');
    expect(BOOK_CODES['psalms']).toBe('PSA');
    expect(BOOK_CODES['1 corinthians']).toBe('1CO');
  });

  it('includes alternate names', () => {
    expect(BOOK_CODES['psalm']).toBe('PSA');
    expect(BOOK_CODES['song of solomon']).toBe('SNG');
    expect(BOOK_CODES['song of songs']).toBe('SNG');
  });
});

describe('getBookCode', () => {
  it('maps full book names to USFM codes', () => {
    expect(getBookCode('Genesis')).toBe('GEN');
    expect(getBookCode('Romans')).toBe('ROM');
    expect(getBookCode('Revelation')).toBe('REV');
  });

  it('is case-insensitive', () => {
    expect(getBookCode('GENESIS')).toBe('GEN');
    expect(getBookCode('genesis')).toBe('GEN');
    expect(getBookCode('Matthew')).toBe('MAT');
  });

  it('handles numbered books', () => {
    expect(getBookCode('1 Samuel')).toBe('1SA');
    expect(getBookCode('2 Kings')).toBe('2KI');
    expect(getBookCode('1 Corinthians')).toBe('1CO');
    expect(getBookCode('3 John')).toBe('3JN');
  });

  it('returns null for unknown books', () => {
    expect(getBookCode('Hezekiah')).toBeNull();
    expect(getBookCode('')).toBeNull();
  });
});

describe('getBookName', () => {
  it('maps USFM codes to human names', () => {
    expect(getBookName('GEN')).toBe('Genesis');
    expect(getBookName('ROM')).toBe('Romans');
    expect(getBookName('REV')).toBe('Revelation');
  });

  it('is case-insensitive', () => {
    expect(getBookName('gen')).toBe('Genesis');
    expect(getBookName('rom')).toBe('Romans');
  });

  it('returns the code itself for unknown codes', () => {
    expect(getBookName('XYZ')).toBe('XYZ');
  });
});

describe('VERSION_IDS', () => {
  it('has common translations', () => {
    expect(VERSION_IDS.NLT).toBe(116);
    expect(VERSION_IDS.KJV).toBe(1);
    expect(VERSION_IDS.ESV).toBe(59);
    expect(VERSION_IDS.NIV).toBe(111);
    expect(VERSION_IDS.NKJV).toBe(114);
  });
});

describe('canUseBibleApi', () => {
  it('returns true for public domain translations', () => {
    expect(canUseBibleApi('KJV')).toBe(true);
    expect(canUseBibleApi('WEB')).toBe(true);
    expect(canUseBibleApi('ASV')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(canUseBibleApi('kjv')).toBe(true);
    expect(canUseBibleApi('Kjv')).toBe(true);
  });

  it('returns false for copyrighted translations', () => {
    expect(canUseBibleApi('NLT')).toBe(false);
    expect(canUseBibleApi('ESV')).toBe(false);
    expect(canUseBibleApi('NIV')).toBe(false);
    expect(canUseBibleApi('NASB')).toBe(false);
    expect(canUseBibleApi('NKJV')).toBe(false);
  });
});

describe('buildBibleApiUrl', () => {
  it('constructs correct URL for chapter', () => {
    expect(buildBibleApiUrl('romans', 1, 'KJV'))
      .toBe('https://bible-api.com/romans+1?translation=kjv');
  });

  it('encodes book names with spaces', () => {
    expect(buildBibleApiUrl('1 corinthians', 13, 'WEB'))
      .toBe('https://bible-api.com/1%20corinthians+13?translation=web');
  });

  it('defaults to web translation', () => {
    expect(buildBibleApiUrl('john', 3, 'UNKNOWN'))
      .toBe('https://bible-api.com/john+3?translation=web');
  });
});

describe('buildProxyUrl', () => {
  it('constructs correct proxy URL', () => {
    expect(buildProxyUrl('https://my-oci.com', 116, 'ROM', 1))
      .toBe('https://my-oci.com/api/bible/116/ROM.1');
  });

  it('works with localhost', () => {
    expect(buildProxyUrl('http://localhost:8787', 1, 'GEN', 1))
      .toBe('http://localhost:8787/api/bible/1/GEN.1');
  });
});

describe('normalizeBibleApiResponse', () => {
  it('normalizes bible-api.com response', () => {
    const input = {
      reference: 'Romans 1',
      verses: [
        { book_name: 'Romans', chapter: 1, verse: 1, text: 'Paul, a servant...\n' },
        { book_name: 'Romans', chapter: 1, verse: 2, text: 'which he promised...\n' },
      ],
      translation_name: 'King James Version',
      translation_id: 'kjv',
    };
    const result = normalizeBibleApiResponse(input);
    expect(result.reference).toBe('Romans 1');
    expect(result.verses).toHaveLength(2);
    expect(result.verses[0].verse).toBe(1);
    expect(result.verses[0].text).toBe('Paul, a servant...');
    expect(result.verses[1].text).not.toContain('\n');
    expect(result.translation).toBe('King James Version');
    expect(result.next).toBeNull();
  });

  it('handles empty verses', () => {
    const result = normalizeBibleApiResponse({ reference: '', verses: [] });
    expect(result.verses).toHaveLength(0);
  });
});

describe('normalizeProxyResponse', () => {
  it('normalizes proxy response with navigation', () => {
    const input = {
      reference: 'Romans 1',
      verses: [{ verse: 1, text: 'This letter is from Paul...' }],
      next: 'ROM.2',
      nextHuman: 'Romans 2',
      previous: 'ACT.28',
      previousHuman: 'Acts 28',
    };
    const result = normalizeProxyResponse(input);
    expect(result.reference).toBe('Romans 1');
    expect(result.verses).toHaveLength(1);
    expect(result.next).toBe('ROM.2');
    expect(result.nextHuman).toBe('Romans 2');
    expect(result.previous).toBe('ACT.28');
  });

  it('handles missing navigation', () => {
    const result = normalizeProxyResponse({ reference: 'Genesis 1', verses: [] });
    expect(result.next).toBeNull();
    expect(result.previous).toBeNull();
  });
});
