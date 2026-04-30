/**
 * Tests for the scoring engine — exact match for digits/letters,
 * word-level diff for text.
 */
import { describe, it, expect } from 'vitest';
import { scoreExact, scoreText } from '../src/scoring.js';

describe('scoreExact', () => {
  it('returns 100 for perfect match', () => {
    expect(scoreExact('12345', '12345')).toBe(100);
  });

  it('returns 0 for completely wrong', () => {
    expect(scoreExact('12345', '67890')).toBe(0);
  });

  it('returns partial score for partial match', () => {
    // '12345' vs '12340' — 4 of 5 correct
    expect(scoreExact('12345', '12340')).toBe(80);
  });

  it('handles length mismatch — shorter answer', () => {
    // '12345' vs '123' — 3 correct, 2 missing
    expect(scoreExact('12345', '123')).toBe(60);
  });

  it('handles length mismatch — longer answer', () => {
    // '123' vs '12345' — 3 correct positions, scored against original length
    expect(scoreExact('123', '12345')).toBe(100);
  });

  it('returns 100 for empty original and empty answer', () => {
    expect(scoreExact('', '')).toBe(100);
  });

  it('returns 0 for empty answer on non-empty original', () => {
    expect(scoreExact('12345', '')).toBe(0);
  });
});

describe('scoreText', () => {
  it('returns 100 for perfect match', () => {
    const result = scoreText('the quick brown fox', 'the quick brown fox');
    expect(result.score).toBe(100);
    expect(result.correct).toEqual(['the', 'quick', 'brown', 'fox']);
    expect(result.missing).toEqual([]);
    expect(result.wrong).toEqual([]);
  });

  it('returns 0 for completely wrong', () => {
    const result = scoreText('hello world', 'foo bar');
    expect(result.score).toBe(0);
    expect(result.missing).toEqual(['hello', 'world']);
    expect(result.wrong).toEqual(['foo', 'bar']);
  });

  it('scores partial match correctly', () => {
    const result = scoreText('the quick brown fox', 'the slow brown fox');
    // 3 of 4 words correct
    expect(result.score).toBe(75);
    expect(result.correct).toContain('the');
    expect(result.correct).toContain('brown');
    expect(result.correct).toContain('fox');
  });

  it('handles missing words', () => {
    const result = scoreText('the quick brown fox', 'the brown fox');
    expect(result.missing).toContain('quick');
  });

  it('is case-insensitive', () => {
    const result = scoreText('Hello World', 'hello world');
    expect(result.score).toBe(100);
  });

  it('handles empty original and answer', () => {
    const result = scoreText('', '');
    expect(result.score).toBe(100);
  });

  it('handles empty answer on non-empty original', () => {
    const result = scoreText('hello world', '');
    expect(result.score).toBe(0);
  });
});
