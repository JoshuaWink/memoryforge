/**
 * Tests for the drill generator — produces random sequences of
 * digits, letters, and words at configurable lengths.
 */
import { describe, it, expect } from 'vitest';
import { generateDigits, generateLetters, generateWords } from '../src/drill-generator.js';

describe('generateDigits', () => {
  it('returns a string of the requested length', () => {
    const result = generateDigits(6);
    expect(result).toHaveLength(6);
  });

  it('contains only digit characters', () => {
    const result = generateDigits(20);
    expect(result).toMatch(/^\d+$/);
  });

  it('returns empty string for length 0', () => {
    expect(generateDigits(0)).toBe('');
  });

  it('produces different results on successive calls (non-deterministic)', () => {
    const results = new Set();
    for (let i = 0; i < 20; i++) results.add(generateDigits(10));
    // With 10-digit sequences, collisions in 20 tries are astronomically unlikely
    expect(results.size).toBeGreaterThan(1);
  });
});

describe('generateLetters', () => {
  it('returns a string of the requested length', () => {
    const result = generateLetters(8);
    expect(result).toHaveLength(8);
  });

  it('contains only uppercase letter characters', () => {
    const result = generateLetters(30);
    expect(result).toMatch(/^[A-Z]+$/);
  });

  it('returns empty string for length 0', () => {
    expect(generateLetters(0)).toBe('');
  });
});

describe('generateWords', () => {
  it('returns an array of the requested count', () => {
    const result = generateWords(5);
    expect(result).toHaveLength(5);
  });

  it('each element is a non-empty string', () => {
    const result = generateWords(3);
    result.forEach(w => {
      expect(typeof w).toBe('string');
      expect(w.length).toBeGreaterThan(0);
    });
  });

  it('returns empty array for count 0', () => {
    expect(generateWords(0)).toEqual([]);
  });
});
