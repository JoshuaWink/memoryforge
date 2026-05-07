import { describe, it, expect } from 'vitest';
import { RecallTimer, PRESETS, ReminderScheduler } from '../src/recall-timer.js';

// ═══ RecallTimer ═══

describe('RecallTimer', () => {
  it('starts inactive with no state', () => {
    const t = new RecallTimer();
    expect(t.isActive()).toBe(false);
    expect(t.isExpired()).toBe(false);
    expect(t.remaining()).toBe(0);
    expect(t.getChallenge()).toBe(null);
  });

  it('start sets active with challenge data', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(60000, { type: 'digits', prompt: '7392' }, now);
    expect(t.isActive(now)).toBe(true);
    expect(t.isExpired(now)).toBe(false);
    expect(t.getChallenge()).toEqual({ type: 'digits', prompt: '7392' });
  });

  it('remaining returns correct time left', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(60000, { type: 'digits', prompt: '42' }, now);
    expect(t.remaining(now + 10000)).toBe(50000);
    expect(t.remaining(now + 30000)).toBe(30000);
    expect(t.remaining(now + 59999)).toBe(1);
  });

  it('remaining returns 0 when expired', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(60000, { type: 'digits', prompt: '42' }, now);
    expect(t.remaining(now + 60000)).toBe(0);
    expect(t.remaining(now + 99999)).toBe(0);
  });

  it('isExpired is true after duration elapses', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(5000, { type: 'words', prompt: 'apple' }, now);
    expect(t.isExpired(now + 4999)).toBe(false);
    expect(t.isExpired(now + 5000)).toBe(true);
    expect(t.isExpired(now + 9000)).toBe(true);
  });

  it('cancel makes inactive and not expired', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(60000, { type: 'digits', prompt: '55' }, now);
    t.cancel();
    expect(t.isActive(now)).toBe(false);
    expect(t.isExpired(now)).toBe(false);
    expect(t.remaining(now)).toBe(0);
  });

  it('throws if started while already active', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(60000, { type: 'digits', prompt: '1' }, now);
    expect(() => t.start(30000, { type: 'digits', prompt: '2' }, now))
      .toThrow('already active');
  });

  it('can restart after cancel', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(60000, { type: 'digits', prompt: '1' }, now);
    t.cancel();
    t.start(30000, { type: 'digits', prompt: '2' }, now + 1000);
    expect(t.isActive(now + 1000)).toBe(true);
    expect(t.getChallenge().prompt).toBe('2');
  });

  it('can restart after expiry', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(1000, { type: 'digits', prompt: '1' }, now);
    expect(t.isExpired(now + 2000)).toBe(true);
    // expired timer is not "active", so start should work
    t.start(5000, { type: 'digits', prompt: '2' }, now + 3000);
    expect(t.isActive(now + 3000)).toBe(true);
  });

  it('export/restore roundtrip preserves state', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(60000, { type: 'major', prompt: '73', answer: 'came' }, now);

    const saved = t.export();
    const t2 = new RecallTimer(saved);

    expect(t2.isActive(now + 10000)).toBe(true);
    expect(t2.remaining(now + 10000)).toBe(50000);
    expect(t2.getChallenge()).toEqual({ type: 'major', prompt: '73', answer: 'came' });
  });

  it('restored expired timer shows expired', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(5000, { type: 'digits', prompt: '9' }, now);

    const saved = t.export();
    const t2 = new RecallTimer(saved);

    expect(t2.isExpired(now + 10000)).toBe(true);
    expect(t2.isActive(now + 10000)).toBe(false);
    expect(t2.getChallenge()).toEqual({ type: 'digits', prompt: '9' });
  });

  it('formatRemaining returns human-readable string', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(3661000, { type: 'digits', prompt: '1' }, now); // 1h 1m 1s
    expect(t.formatRemaining(now)).toBe('1:01:01');
    expect(t.formatRemaining(now + 3600000)).toBe('0:01:01');
    expect(t.formatRemaining(now + 3660000)).toBe('0:00:01');
    expect(t.formatRemaining(now + 3661000)).toBe('0:00:00');
  });

  it('formatRemaining works for sub-minute durations', () => {
    const t = new RecallTimer();
    const now = 1000000;
    t.start(45000, { type: 'digits', prompt: '1' }, now);
    expect(t.formatRemaining(now)).toBe('0:00:45');
    expect(t.formatRemaining(now + 44000)).toBe('0:00:01');
  });
});

// ═══ PRESETS ═══

describe('PRESETS', () => {
  it('has standard duration presets', () => {
    expect(PRESETS['1min']).toBe(60000);
    expect(PRESETS['5min']).toBe(300000);
    expect(PRESETS['15min']).toBe(900000);
    expect(PRESETS['30min']).toBe(1800000);
    expect(PRESETS['1hr']).toBe(3600000);
  });

  it('all values are positive numbers', () => {
    for (const [key, val] of Object.entries(PRESETS)) {
      expect(val).toBeGreaterThan(0);
      expect(typeof val).toBe('number');
    }
  });
});

// ═══ ReminderScheduler ═══

describe('ReminderScheduler', () => {
  it('starts empty', () => {
    const s = new ReminderScheduler();
    expect(s.getAll()).toEqual([]);
  });

  it('add returns reminder with id', () => {
    const s = new ReminderScheduler();
    const r = s.add(1700000000000, 'Practice Major System');
    expect(r.id).toBe(1);
    expect(r.time).toBe(1700000000000);
    expect(r.label).toBe('Practice Major System');
  });

  it('assigns incrementing ids', () => {
    const s = new ReminderScheduler();
    const r1 = s.add(1000, 'A');
    const r2 = s.add(2000, 'B');
    expect(r1.id).toBe(1);
    expect(r2.id).toBe(2);
  });

  it('getAll returns all reminders', () => {
    const s = new ReminderScheduler();
    s.add(1000, 'A');
    s.add(2000, 'B');
    expect(s.getAll()).toHaveLength(2);
  });

  it('getAll returns a copy, not the internal array', () => {
    const s = new ReminderScheduler();
    s.add(1000, 'A');
    const all = s.getAll();
    all.push({ id: 99, time: 0, label: 'hack' });
    expect(s.getAll()).toHaveLength(1);
  });

  it('remove deletes by id', () => {
    const s = new ReminderScheduler();
    s.add(1000, 'A');
    const r2 = s.add(2000, 'B');
    s.remove(1);
    expect(s.getAll()).toHaveLength(1);
    expect(s.getAll()[0].id).toBe(2);
  });

  it('getDue returns reminders at or past their time', () => {
    const s = new ReminderScheduler();
    s.add(1000, 'Past');
    s.add(5000, 'Future');
    s.add(3000, 'Now');
    const due = s.getDue(3000);
    expect(due).toHaveLength(2);
    expect(due.map(r => r.label).sort()).toEqual(['Now', 'Past']);
  });

  it('export/restore roundtrip', () => {
    const s = new ReminderScheduler();
    s.add(1000, 'A');
    s.add(2000, 'B');
    const saved = s.export();

    const s2 = new ReminderScheduler(saved);
    expect(s2.getAll()).toHaveLength(2);
    // New ids continue from max
    const r3 = s2.add(3000, 'C');
    expect(r3.id).toBe(3);
  });

  it('clearFired removes due reminders', () => {
    const s = new ReminderScheduler();
    s.add(1000, 'Past');
    s.add(5000, 'Future');
    s.clearFired(3000);
    expect(s.getAll()).toHaveLength(1);
    expect(s.getAll()[0].label).toBe('Future');
  });
});
