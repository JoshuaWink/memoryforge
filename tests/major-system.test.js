/**
 * Tests for the Major System — the core mnemonic encoding for digits → consonant sounds → words.
 */
import { describe, it, expect } from 'vitest';
import {
  MAJOR_TABLE,
  digitsToConsonants,
  consonantsMatchDigits,
  getDefaultWords,
  encodeMajor,
  decodeMajor,
  chunkDigits,
} from '../src/major-system.js';

describe('Major System Table', () => {
  it('has entries for digits 0-9', () => {
    for (let i = 0; i <= 9; i++) {
      expect(MAJOR_TABLE[i]).toBeDefined();
      expect(MAJOR_TABLE[i].sounds).toBeTruthy();
    }
  });

  it('maps 0 to s/z sounds', () => {
    expect(MAJOR_TABLE[0].sounds).toContain('s');
    expect(MAJOR_TABLE[0].sounds).toContain('z');
  });

  it('maps 1 to t/d sounds', () => {
    expect(MAJOR_TABLE[1].sounds).toContain('t');
    expect(MAJOR_TABLE[1].sounds).toContain('d');
  });

  it('maps 2 to n', () => {
    expect(MAJOR_TABLE[2].sounds).toContain('n');
  });

  it('maps 3 to m', () => {
    expect(MAJOR_TABLE[3].sounds).toContain('m');
  });

  it('maps 4 to r', () => {
    expect(MAJOR_TABLE[4].sounds).toContain('r');
  });

  it('maps 5 to l', () => {
    expect(MAJOR_TABLE[5].sounds).toContain('l');
  });

  it('maps 6 to j/sh/ch', () => {
    expect(MAJOR_TABLE[6].sounds).toContain('j');
    expect(MAJOR_TABLE[6].sounds).toContain('sh');
  });

  it('maps 7 to k/g', () => {
    expect(MAJOR_TABLE[7].sounds).toContain('k');
    expect(MAJOR_TABLE[7].sounds).toContain('g');
  });

  it('maps 8 to f/v', () => {
    expect(MAJOR_TABLE[8].sounds).toContain('f');
    expect(MAJOR_TABLE[8].sounds).toContain('v');
  });

  it('maps 9 to p/b', () => {
    expect(MAJOR_TABLE[9].sounds).toContain('p');
    expect(MAJOR_TABLE[9].sounds).toContain('b');
  });
});

describe('digitsToConsonants', () => {
  it('converts single digit to consonant options', () => {
    const result = digitsToConsonants('1');
    expect(result).toContain('t');
    expect(result).toContain('d');
  });

  it('converts multi-digit string', () => {
    const result = digitsToConsonants('43');
    // 4=r, 3=m
    expect(result).toContain('r');
    expect(result).toContain('m');
  });
});

describe('consonantsMatchDigits', () => {
  it('validates "ram" matches 43', () => {
    expect(consonantsMatchDigits('ram', '43')).toBe(true);
  });

  it('validates "tie" matches 1', () => {
    expect(consonantsMatchDigits('tie', '1')).toBe(true);
  });

  it('rejects "cat" for 43', () => {
    expect(consonantsMatchDigits('cat', '43')).toBe(false);
  });

  it('ignores vowels and non-consonant letters', () => {
    expect(consonantsMatchDigits('lure', '54')).toBe(true);
  });

  it('handles "Noah" for 2 (n, h is silent)', () => {
    expect(consonantsMatchDigits('Noah', '2')).toBe(true);
  });
});

describe('getDefaultWords', () => {
  it('returns words for 00-99', () => {
    const words = getDefaultWords();
    expect(Object.keys(words).length).toBe(100);
    expect(words['00']).toBeTruthy();
    expect(words['99']).toBeTruthy();
  });

  it('each default word consonant-matches its digits', () => {
    const words = getDefaultWords();
    for (const [digits, word] of Object.entries(words)) {
      expect(consonantsMatchDigits(word, digits)).toBe(true);
    }
  });
});

describe('encodeMajor', () => {
  it('encodes 2-digit pairs to words using defaults', () => {
    const words = getDefaultWords();
    const result = encodeMajor('43', words);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(words['43']);
  });

  it('encodes 4-digit string as two pairs', () => {
    const words = getDefaultWords();
    const result = encodeMajor('4321', words);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe(words['43']);
    expect(result[1]).toBe(words['21']);
  });

  it('pads odd-length with leading zero', () => {
    const words = getDefaultWords();
    const result = encodeMajor('5', words);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(words['05']);
  });
});

describe('decodeMajor', () => {
  it('decodes a word back to digits using defaults', () => {
    const words = getDefaultWords();
    const reverseMap = {};
    for (const [d, w] of Object.entries(words)) reverseMap[w.toLowerCase()] = d;

    const result = decodeMajor(words['43'], reverseMap);
    expect(result).toBe('43');
  });

  it('returns null for unknown word', () => {
    expect(decodeMajor('xylophone', {})).toBeNull();
  });
});

describe('chunkDigits', () => {
  it('chunks into pairs by default', () => {
    expect(chunkDigits('123456', 2)).toEqual(['12', '34', '56']);
  });

  it('chunks into triples', () => {
    expect(chunkDigits('123456789', 3)).toEqual(['123', '456', '789']);
  });

  it('handles remainder', () => {
    expect(chunkDigits('12345', 2)).toEqual(['1', '23', '45']);
  });

  it('handles single digit', () => {
    expect(chunkDigits('7', 2)).toEqual(['7']);
  });

  it('handles empty string', () => {
    expect(chunkDigits('', 2)).toEqual([]);
  });
});
