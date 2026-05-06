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

  // ── Technique Stats ──

  it('groups by technique', () => {
    const drills = [
      { type: 'digits', score: 60, timestamp: 1, technique: 'none' },
      { type: 'digits', score: 90, timestamp: 2, technique: 'major' },
      { type: 'digits', score: 85, timestamp: 3, technique: 'major' },
      { type: 'digits', score: 70, timestamp: 4, technique: 'chunking' },
    ];
    const stats = computeStats(drills);
    expect(stats.byTechnique).toBeDefined();
    expect(stats.byTechnique['major'].count).toBe(2);
    expect(stats.byTechnique['major'].avgScore).toBe(88);
    expect(stats.byTechnique['none'].count).toBe(1);
    expect(stats.byTechnique['chunking'].count).toBe(1);
  });

  it('handles drills without technique field', () => {
    const drills = [
      { type: 'digits', score: 80, timestamp: 1 },
    ];
    const stats = computeStats(drills);
    expect(stats.byTechnique['none'].count).toBe(1);
  });

  it('groups by drill mode', () => {
    const drills = [
      { type: 'digits', score: 80, timestamp: 1, drillMode: 'recall' },
      { type: 'digits', score: 90, timestamp: 2, drillMode: 'encode' },
      { type: 'digits', score: 100, timestamp: 3, drillMode: 'decode' },
    ];
    const stats = computeStats(drills);
    expect(stats.byMode).toBeDefined();
    expect(stats.byMode['recall'].count).toBe(1);
    expect(stats.byMode['encode'].count).toBe(1);
    expect(stats.byMode['decode'].count).toBe(1);
  });
});
