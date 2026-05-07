import { describe, it, expect } from 'vitest';
import { diffWords, scoreDiff, formatDiff } from '../src/diff-recall.js';

describe('diff-recall', () => {
  describe('diffWords', () => {
    it('returns empty diff for identical strings', () => {
      const result = diffWords('For God so loved', 'For God so loved');
      expect(result.every(d => d.type === 'equal')).toBe(true);
    });

    it('detects a wrong word', () => {
      const result = diffWords('For God so loved the world', 'For God so loved the earth');
      const wrong = result.find(d => d.type === 'replace');
      expect(wrong).toBeDefined();
      expect(wrong.expected).toBe('world');
      expect(wrong.got).toBe('earth');
    });

    it('detects a missing word', () => {
      const result = diffWords('For God so loved the world', 'For God so the world');
      const missing = result.find(d => d.type === 'missing');
      expect(missing).toBeDefined();
      expect(missing.expected).toBe('loved');
    });

    it('detects an extra word', () => {
      const result = diffWords('For God so loved', 'For God really so loved');
      const extra = result.find(d => d.type === 'extra');
      expect(extra).toBeDefined();
      expect(extra.got).toBe('really');
    });

    it('handles empty expected', () => {
      const result = diffWords('', 'some words');
      expect(result.some(d => d.type === 'extra')).toBe(true);
    });

    it('handles empty got', () => {
      const result = diffWords('some words', '');
      expect(result.some(d => d.type === 'missing')).toBe(true);
    });

    it('is case-sensitive', () => {
      const result = diffWords('The Lord', 'the Lord');
      const diff = result.find(d => d.type === 'replace');
      expect(diff).toBeDefined();
      expect(diff.expected).toBe('The');
      expect(diff.got).toBe('the');
    });

    it('detects punctuation differences', () => {
      const result = diffWords('the world,', 'the world');
      const diff = result.find(d => d.type !== 'equal');
      expect(diff).toBeDefined();
    });
  });

  describe('scoreDiff', () => {
    it('returns 1.0 for perfect match', () => {
      const diff = diffWords('For God so loved', 'For God so loved');
      expect(scoreDiff(diff)).toBe(1.0);
    });

    it('returns 0 for completely wrong', () => {
      const diff = diffWords('For God so loved', 'apple banana cherry orange');
      expect(scoreDiff(diff)).toBe(0);
    });

    it('returns partial score for partial match', () => {
      const diff = diffWords('For God so loved the world', 'For God so loved the earth');
      const score = scoreDiff(diff);
      expect(score).toBeGreaterThan(0.5);
      expect(score).toBeLessThan(1.0);
    });

    it('returns 0 for empty input vs expected', () => {
      const diff = diffWords('For God so loved', '');
      expect(scoreDiff(diff)).toBe(0);
    });
  });

  describe('formatDiff', () => {
    it('returns array of {text, type} spans for rendering', () => {
      const diff = diffWords('The Lord is good', 'The Lord is great');
      const formatted = formatDiff(diff);
      expect(Array.isArray(formatted)).toBe(true);
      formatted.forEach(span => {
        expect(span).toHaveProperty('text');
        expect(span).toHaveProperty('type');
        expect(['equal', 'replace', 'missing', 'extra']).toContain(span.type);
      });
    });

    it('marks correct words as equal', () => {
      const diff = diffWords('The Lord', 'The Lord');
      const formatted = formatDiff(diff);
      expect(formatted.every(s => s.type === 'equal')).toBe(true);
    });

    it('includes expected text for missing words', () => {
      const diff = diffWords('The Lord is good', 'The Lord good');
      const formatted = formatDiff(diff);
      const missing = formatted.find(s => s.type === 'missing');
      expect(missing).toBeDefined();
      expect(missing.text).toBe('is');
    });
  });
});
