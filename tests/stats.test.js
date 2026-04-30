/**
 * Tests for stats calculator — aggregates drill history into useful stats.
 */
import { describe, it, expect } from 'vitest';
import { computeStats } from '../src/stats.js';

describe('computeStats', () => {
  it('returns zeroes for empty history', () => {
    const stats = computeStats([]);
    expect(stats.totalDrills).toBe(0);
    expect(stats.averageScore).toBe(0);
    expect(stats.bestScore).toBe(0);
    expect(stats.byType).toEqual({});
  });

  it('calculates totals correctly', () => {
    const drills = [
      { type: 'digits', score: 100, timestamp: 1 },
      { type: 'digits', score: 80, timestamp: 2 },
      { type: 'letters', score: 60, timestamp: 3 },
    ];
    const stats = computeStats(drills);
    expect(stats.totalDrills).toBe(3);
    expect(stats.averageScore).toBe(80);
    expect(stats.bestScore).toBe(100);
  });

  it('groups by type', () => {
    const drills = [
      { type: 'digits', score: 100, timestamp: 1 },
      { type: 'digits', score: 80, timestamp: 2 },
      { type: 'letters', score: 60, timestamp: 3 },
    ];
    const stats = computeStats(drills);
    expect(stats.byType.digits.count).toBe(2);
    expect(stats.byType.digits.avgScore).toBe(90);
    expect(stats.byType.digits.bestScore).toBe(100);
    expect(stats.byType.letters.count).toBe(1);
    expect(stats.byType.letters.avgScore).toBe(60);
  });

  it('calculates today stats', () => {
    const now = Date.now();
    const yesterday = now - 86400000 - 1;
    const drills = [
      { type: 'digits', score: 100, timestamp: now },
      { type: 'digits', score: 80, timestamp: now - 1000 },
      { type: 'letters', score: 60, timestamp: yesterday },
    ];
    const stats = computeStats(drills);
    expect(stats.today.count).toBe(2);
    expect(stats.today.avgScore).toBe(90);
  });
});
