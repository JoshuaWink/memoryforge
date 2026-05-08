import { describe, it, expect } from 'vitest';
import { chunkVerse, chunkPassage, getWords, splitAtPositions } from '../src/chunker.js';

describe('chunker', () => {
  describe('chunkVerse', () => {
    it('splits on commas', () => {
      const text = 'For God so loved the world, that he gave his only begotten Son';
      const chunks = chunkVerse(text);
      expect(chunks[0]).toBe('For God so loved the world,');
      expect(chunks[1]).toBe('that he gave his only begotten Son');
    });

    it('splits on semicolons', () => {
      const text = 'The Lord is my shepherd; I shall not want';
      const chunks = chunkVerse(text);
      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toBe('The Lord is my shepherd;');
      expect(chunks[1]).toBe('I shall not want');
    });

    it('splits on colons mid-sentence', () => {
      const text = 'Trust in the Lord with all your heart: and lean not on your own understanding';
      const chunks = chunkVerse(text);
      expect(chunks).toHaveLength(2);
    });

    it('does not split very short text', () => {
      const text = 'Jesus wept.';
      const chunks = chunkVerse(text);
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe('Jesus wept.');
    });

    it('splits on conjunctions when clause is long enough', () => {
      const text = 'that whoever believes in him should not perish but have everlasting life';
      const chunks = chunkVerse(text);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      // "but" should trigger a split
      expect(chunks.some(c => c.startsWith('but '))).toBe(true);
    });

    it('preserves all original text when chunks are joined', () => {
      const text = 'For God so loved the world, that he gave his only begotten Son, that whoever believes in him should not perish, but have everlasting life.';
      const chunks = chunkVerse(text);
      expect(chunks.join(' ')).toBe(text);
    });

    it('handles multiple commas', () => {
      const text = 'And we know that all things work together for good, to them that love God, to them who are the called according to his purpose.';
      const chunks = chunkVerse(text);
      expect(chunks.length).toBeGreaterThanOrEqual(3);
    });

    it('returns array of strings', () => {
      const chunks = chunkVerse('In the beginning was the Word');
      expect(Array.isArray(chunks)).toBe(true);
      chunks.forEach(c => expect(typeof c).toBe('string'));
    });

    it('trims whitespace from chunks', () => {
      const text = 'Be still,  and know that I am God';
      const chunks = chunkVerse(text);
      chunks.forEach(c => {
        expect(c).toBe(c.trim());
        expect(c).not.toMatch(/\s{2,}/);
      });
    });

    it('splits long text with no punctuation at phrase boundaries', () => {
      const text = 'For God sent not his Son into the world to condemn the world';
      const chunks = chunkVerse(text);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks.join(' ')).toBe(text);
    });

    it('splits at prepositions as phrase boundaries', () => {
      const text = 'He has delivered us from the domain of darkness';
      const chunks = chunkVerse(text);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks.some(c => /^from /i.test(c))).toBe(true);
    });

    it('does not over-split short text without punctuation', () => {
      const text = 'In the beginning was the Word';
      const chunks = chunkVerse(text);
      expect(chunks).toHaveLength(1);
    });

    it('splits 12 plus word text into at least 2 chunks', () => {
      const text = 'the heavens declare the glory of God the skies proclaim the work of his hands';
      const chunks = chunkVerse(text);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks.join(' ')).toBe(text);
    });

    it('produces balanced chunks when splitting long text', () => {
      const text = 'Grace and peace to you from God our Father through the Lord Jesus Christ';
      const chunks = chunkVerse(text);
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      chunks.forEach(c => {
        expect(c.split(/\s+/).length).toBeGreaterThanOrEqual(3);
      });
      expect(chunks.join(' ')).toBe(text);
    });
  });

  describe('chunkPassage', () => {
    it('chunks multiple verses maintaining verse boundaries', () => {
      const verses = [
        { reference: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son' },
        { reference: 'John 3:17', text: 'For God sent not his Son into the world to condemn the world' },
      ];
      const result = chunkPassage(verses);
      expect(result).toHaveLength(2);
      expect(result[0].reference).toBe('John 3:16');
      expect(Array.isArray(result[0].chunks)).toBe(true);
      expect(result[0].chunks.length).toBeGreaterThanOrEqual(2);
    });

    it('preserves full text per verse', () => {
      const verses = [
        { reference: 'Ps 23:1', text: 'The Lord is my shepherd; I shall not want.' },
      ];
      const result = chunkPassage(verses);
      expect(result[0].chunks.join(' ')).toBe(verses[0].text);
    });
  });

  describe('getWords', () => {
    it('splits text into individual word tokens', () => {
      const words = getWords('For God so loved the world');
      expect(words).toEqual(['For', 'God', 'so', 'loved', 'the', 'world']);
    });

    it('returns empty array for empty input', () => {
      expect(getWords('')).toEqual([]);
      expect(getWords(null)).toEqual([]);
      expect(getWords(undefined)).toEqual([]);
    });

    it('handles punctuation attached to words', () => {
      const words = getWords('this letter is from Paul,');
      expect(words).toEqual(['this', 'letter', 'is', 'from', 'Paul,']);
    });

    it('collapses extra whitespace', () => {
      const words = getWords('  God   so   loved  ');
      expect(words).toEqual(['God', 'so', 'loved']);
    });
  });

  describe('splitAtPositions', () => {
    it('splits text at given word indices', () => {
      const text = 'this letter is from Paul a servant of Christ Jesus Chosen by God';
      // positions = indices where NEW chunks start
      const chunks = splitAtPositions(text, [5, 10, 12]);
      expect(chunks).toEqual([
        'this letter is from Paul',
        'a servant of Christ Jesus',
        'Chosen by',
        'God',
      ]);
    });

    it('returns full text as single chunk when no positions given', () => {
      const text = 'For God so loved the world';
      expect(splitAtPositions(text, [])).toEqual(['For God so loved the world']);
    });

    it('handles position at word 0 (no leading empty chunk)', () => {
      const text = 'Hello world of grace';
      const chunks = splitAtPositions(text, [0, 2]);
      expect(chunks).toEqual(['Hello world', 'of grace']);
    });

    it('handles single word chunks', () => {
      const text = 'Alpha Bravo Charlie Delta';
      const chunks = splitAtPositions(text, [1, 2, 3]);
      expect(chunks).toEqual(['Alpha', 'Bravo', 'Charlie', 'Delta']);
    });

    it('preserves punctuation on words', () => {
      const text = 'For God so loved the world, that he gave';
      const chunks = splitAtPositions(text, [6]);
      expect(chunks).toEqual(['For God so loved the world,', 'that he gave']);
    });

    it('returns full text when positions is undefined', () => {
      const text = 'Be still and know';
      expect(splitAtPositions(text, undefined)).toEqual(['Be still and know']);
    });

    it('ignores positions beyond word count', () => {
      const text = 'short text';
      expect(splitAtPositions(text, [5, 10])).toEqual(['short text']);
    });

    it('sorts positions and deduplicates', () => {
      const text = 'Alpha Bravo Charlie Delta Echo';
      const chunks = splitAtPositions(text, [3, 1, 3, 1]);
      expect(chunks).toEqual(['Alpha', 'Bravo Charlie', 'Delta Echo']);
    });

    it('joins back to original text', () => {
      const text = 'this letter is from Paul a servant of Christ Jesus';
      const chunks = splitAtPositions(text, [5]);
      expect(chunks.join(' ')).toBe(text);
    });
  });
});
