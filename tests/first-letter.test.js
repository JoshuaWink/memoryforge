import { describe, it, expect } from 'vitest';
import { toFirstLetters, fromFirstLetters } from '../src/first-letter.js';

describe('first-letter', () => {
  describe('toFirstLetters', () => {
    it('extracts first letter of each word', () => {
      expect(toFirstLetters('For God so loved the world')).toBe('F G s l t w');
    });

    it('preserves capitalization', () => {
      const result = toFirstLetters('The Lord is my shepherd');
      expect(result).toBe('T L i m s');
    });

    it('handles punctuation attached to words', () => {
      const result = toFirstLetters('Jesus wept.');
      expect(result).toBe('J w.');
    });

    it('preserves trailing punctuation on last letter', () => {
      const result = toFirstLetters('I shall not want.');
      expect(result).toBe('I s n w.');
    });

    it('preserves commas after first letter', () => {
      const result = toFirstLetters('For God so loved the world, that he gave');
      expect(result).toBe('F G s l t w, t h g');
    });

    it('handles empty string', () => {
      expect(toFirstLetters('')).toBe('');
    });

    it('handles single word', () => {
      expect(toFirstLetters('Amen')).toBe('A');
    });

    it('handles numbers in text', () => {
      const result = toFirstLetters('7 days of creation');
      expect(result).toBe('7 d o c');
    });
  });

  describe('fromFirstLetters', () => {
    it('generates hint text showing first letters with blanks', () => {
      const hint = fromFirstLetters('For God so loved the world');
      expect(hint).toBe('F__ G__ s_ l____ t__ w____');
    });

    it('preserves punctuation', () => {
      const hint = fromFirstLetters('world, that');
      expect(hint).toBe('w____, t___');
    });

    it('handles empty string', () => {
      expect(fromFirstLetters('')).toBe('');
    });

    it('shows full word length via underscores', () => {
      // "God" = 3 chars, so G + 2 underscores
      const hint = fromFirstLetters('God');
      expect(hint).toBe('G__');
    });
  });
});
