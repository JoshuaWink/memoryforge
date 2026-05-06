/**
 * Tests for Leitner box spaced repetition tracker.
 */
import { describe, it, expect } from 'vitest';
import { LeitnerBox } from '../src/leitner.js';

describe('LeitnerBox', () => {
  // ── Construction ──

  it('creates with all items at box 0 (unseen)', () => {
    const lb = new LeitnerBox(['a', 'b', 'c']);
    expect(lb.getBox('a')).toBe(0);
    expect(lb.getBox('b')).toBe(0);
    expect(lb.getBox('c')).toBe(0);
  });

  it('restores from saved state', () => {
    const saved = { a: { box: 3, lastSeen: 100 }, b: { box: 1, lastSeen: 200 } };
    const lb = new LeitnerBox(['a', 'b', 'c'], saved);
    expect(lb.getBox('a')).toBe(3);
    expect(lb.getBox('b')).toBe(1);
    expect(lb.getBox('c')).toBe(0); // not in saved = unseen
  });

  // ── Promote / Demote ──

  it('promotes on correct answer', () => {
    const lb = new LeitnerBox(['a']);
    lb.recordAnswer('a', true, 500);
    expect(lb.getBox('a')).toBe(1);
    lb.recordAnswer('a', true, 400);
    expect(lb.getBox('a')).toBe(2);
  });

  it('caps promotion at box 4', () => {
    const lb = new LeitnerBox(['a']);
    for (let i = 0; i < 10; i++) lb.recordAnswer('a', true, 500);
    expect(lb.getBox('a')).toBe(4);
  });

  it('demotes to box 1 on wrong answer', () => {
    const lb = new LeitnerBox(['a']);
    lb.recordAnswer('a', true, 500);
    lb.recordAnswer('a', true, 500);
    expect(lb.getBox('a')).toBe(2);
    lb.recordAnswer('a', false, 5000);
    expect(lb.getBox('a')).toBe(1);
  });

  it('demotes from box 1 stays at 1 (not 0)', () => {
    const lb = new LeitnerBox(['a']);
    lb.recordAnswer('a', true, 500);
    expect(lb.getBox('a')).toBe(1);
    lb.recordAnswer('a', false, 5000);
    expect(lb.getBox('a')).toBe(1);
  });

  // ── Speed tracking ──

  it('tracks response time per item', () => {
    const lb = new LeitnerBox(['a']);
    lb.recordAnswer('a', true, 1200);
    lb.recordAnswer('a', true, 800);
    expect(lb.getAvgTime('a')).toBe(1000);
  });

  it('returns 0 avg time for unseen item', () => {
    const lb = new LeitnerBox(['a']);
    expect(lb.getAvgTime('a')).toBe(0);
  });

  // ── Due items ──

  it('unseen items (box 0) are always due', () => {
    const lb = new LeitnerBox(['a', 'b']);
    const due = lb.getDueItems(0);
    expect(due).toContain('a');
    expect(due).toContain('b');
  });

  it('box 1 items are due next session', () => {
    const lb = new LeitnerBox(['a']);
    lb.recordAnswer('a', true, 500); // now box 1, lastSeen = session 0
    expect(lb.getDueItems(0)).not.toContain('a'); // just reviewed this session
    expect(lb.getDueItems(1)).toContain('a');     // due next session
  });

  it('box 2 items are due every 2 sessions', () => {
    const lb = new LeitnerBox(['a']);
    lb.recordAnswer('a', true, 500); // box 1
    lb.recordAnswer('a', true, 500); // box 2, last session = 0
    expect(lb.getDueItems(0)).not.toContain('a'); // just reviewed
    expect(lb.getDueItems(1)).not.toContain('a'); // not yet
    expect(lb.getDueItems(2)).toContain('a');     // due!
  });

  it('box 3 items are due every 4 sessions', () => {
    const lb = new LeitnerBox(['a']);
    for (let i = 0; i < 3; i++) lb.recordAnswer('a', true, 500); // box 3
    expect(lb.getDueItems(0)).not.toContain('a');
    expect(lb.getDueItems(3)).not.toContain('a');
    expect(lb.getDueItems(4)).toContain('a');
  });

  it('box 4 items are due every 8 sessions', () => {
    const lb = new LeitnerBox(['a']);
    for (let i = 0; i < 4; i++) lb.recordAnswer('a', true, 500); // box 4
    expect(lb.getDueItems(0)).not.toContain('a');
    expect(lb.getDueItems(7)).not.toContain('a');
    expect(lb.getDueItems(8)).toContain('a');
  });

  // ── Mastery ──

  it('reports mastery percentage', () => {
    const lb = new LeitnerBox(['a', 'b', 'c', 'd']);
    // 0 of 4 mastered
    expect(lb.masteryPct()).toBe(0);
    // Master 2 of 4
    for (let i = 0; i < 4; i++) lb.recordAnswer('a', true, 500);
    for (let i = 0; i < 4; i++) lb.recordAnswer('b', true, 500);
    expect(lb.masteryPct()).toBe(50);
  });

  it('considers box >= 3 as learned for progress', () => {
    const lb = new LeitnerBox(['a']);
    for (let i = 0; i < 3; i++) lb.recordAnswer('a', true, 500); // box 3
    expect(lb.isLearned('a')).toBe(true);
  });

  it('considers box < 3 as not learned', () => {
    const lb = new LeitnerBox(['a']);
    lb.recordAnswer('a', true, 500); // box 1
    expect(lb.isLearned('a')).toBe(false);
  });

  // ── Export / Serialization ──

  it('exports state for persistence', () => {
    const lb = new LeitnerBox(['a', 'b']);
    lb.recordAnswer('a', true, 500);
    const state = lb.export();
    expect(state.a.box).toBe(1);
    expect(state.a.lastSeen).toBeDefined();
    expect(state.b.box).toBe(0);
  });

  // ── Priority ordering ──

  it('getDueItems returns lower boxes first', () => {
    const lb = new LeitnerBox(['a', 'b', 'c']);
    lb.recordAnswer('a', true, 500); // box 1
    lb.recordAnswer('a', true, 500); // box 2
    lb.recordAnswer('b', true, 500); // box 1
    // c is box 0, b is box 1, a is box 2
    const due = lb.getDueItems(10); // all due at session 10
    expect(due[0]).toBe('c'); // box 0 first
    expect(due[1]).toBe('b'); // box 1 second
    expect(due[2]).toBe('a'); // box 2 third
  });
});
