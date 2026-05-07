import { describe, it, expect } from 'vitest';
import { chunkVerse, chunkPassage } from '../src/chunker.js';

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
});
