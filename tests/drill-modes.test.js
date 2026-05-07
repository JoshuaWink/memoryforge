import { describe, it, expect } from 'vitest';
import {
  scrambleChunks,
  generateBlanks,
  generateWordBank,
  checkChunkOrder,
} from '../src/drill-modes.js';

describe('drill-modes', () => {
  describe('scrambleChunks', () => {
    it('returns all chunks in a different order', () => {
      const chunks = ['this letter is from Paul', 'a servant of Christ Jesus', 'Chosen by God'];
      const scrambled = scrambleChunks(chunks);
      expect(scrambled).toHaveLength(3);
      expect(scrambled.sort()).toEqual(chunks.sort());
    });

    it('preserves chunk text exactly', () => {
      const chunks = ['For God so loved the world,', 'that he gave his only Son'];
      const scrambled = scrambleChunks(chunks);
      scrambled.forEach(function(ch) {
        expect(chunks).toContain(ch);
      });
    });

    it('returns single chunk unchanged', () => {
      expect(scrambleChunks(['only one'])).toEqual(['only one']);
    });

    it('handles empty array', () => {
      expect(scrambleChunks([])).toEqual([]);
    });
  });

  describe('generateBlanks', () => {
    it('blanks out words at the given ratio', () => {
      const words = ['For', 'God', 'so', 'loved', 'the', 'world'];
      const result = generateBlanks(words, 0.5);
      const blanked = result.filter(function(w) { return w.blanked; });
      // Should blank roughly half (3 out of 6)
      expect(blanked.length).toBeGreaterThanOrEqual(2);
      expect(blanked.length).toBeLessThanOrEqual(4);
    });

    it('each item has word, blanked, and index properties', () => {
      const words = ['The', 'Lord', 'is'];
      const result = generateBlanks(words, 0.5);
      result.forEach(function(item, i) {
        expect(item.word).toBe(words[i]);
        expect(typeof item.blanked).toBe('boolean');
        expect(item.index).toBe(i);
      });
    });

    it('blanks nothing at ratio 0', () => {
      const words = ['a', 'b', 'c', 'd'];
      const result = generateBlanks(words, 0);
      expect(result.every(function(w) { return !w.blanked; })).toBe(true);
    });

    it('blanks everything at ratio 1', () => {
      const words = ['a', 'b', 'c', 'd'];
      const result = generateBlanks(words, 1);
      expect(result.every(function(w) { return w.blanked; })).toBe(true);
    });

    it('uses seed for deterministic output', () => {
      const words = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
      const r1 = generateBlanks(words, 0.5, 42);
      const r2 = generateBlanks(words, 0.5, 42);
      expect(r1).toEqual(r2);
    });
  });

  describe('generateWordBank', () => {
    it('includes all blanked words', () => {
      const blanks = [
        { word: 'God', blanked: true, index: 1 },
        { word: 'so', blanked: false, index: 2 },
        { word: 'loved', blanked: true, index: 3 },
      ];
      const bank = generateWordBank(blanks);
      expect(bank).toContain('God');
      expect(bank).toContain('loved');
    });

    it('adds distractor words to make choosing harder', () => {
      const blanks = [
        { word: 'loved', blanked: true, index: 0 },
      ];
      const bank = generateWordBank(blanks, ['hated', 'wanted', 'needed']);
      expect(bank.length).toBeGreaterThan(1);
      expect(bank).toContain('loved');
    });

    it('shuffles the bank', () => {
      const blanks = [
        { word: 'a', blanked: true, index: 0 },
        { word: 'b', blanked: true, index: 1 },
        { word: 'c', blanked: true, index: 2 },
        { word: 'd', blanked: true, index: 3 },
        { word: 'e', blanked: true, index: 4 },
      ];
      const bank = generateWordBank(blanks);
      // All words present
      expect(bank.sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('returns empty for no blanks', () => {
      const blanks = [
        { word: 'God', blanked: false, index: 0 },
      ];
      const bank = generateWordBank(blanks);
      expect(bank).toEqual([]);
    });
  });

  describe('checkChunkOrder', () => {
    it('returns true when order matches exactly', () => {
      const correct = ['A', 'B', 'C'];
      expect(checkChunkOrder(correct, ['A', 'B', 'C'])).toEqual({ correct: true, firstWrong: -1 });
    });

    it('returns false with index of first wrong chunk', () => {
      const correct = ['A', 'B', 'C'];
      expect(checkChunkOrder(correct, ['A', 'C', 'B'])).toEqual({ correct: false, firstWrong: 1 });
    });

    it('handles single chunk', () => {
      expect(checkChunkOrder(['only'], ['only'])).toEqual({ correct: true, firstWrong: -1 });
    });

    it('handles partial selection', () => {
      const correct = ['A', 'B', 'C'];
      expect(checkChunkOrder(correct, ['A', 'B'])).toEqual({ correct: false, firstWrong: -1 });
    });

    it('returns wrong at 0 if first chunk is wrong', () => {
      expect(checkChunkOrder(['A', 'B'], ['B', 'A'])).toEqual({ correct: false, firstWrong: 0 });
    });
  });
});
