/**
 * Tests for data storage — IndexedDB persistence for drill history,
 * plus JSON export/import.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { DrillStore } from '../src/drill-store.js';

describe('DrillStore', () => {
  let store;

  beforeEach(() => {
    store = new DrillStore();
    store.clear();
  });

  it('starts empty', () => {
    expect(store.getAll()).toEqual([]);
  });

  it('saves a drill result', () => {
    const result = {
      type: 'digits',
      length: 6,
      material: '123456',
      answer: '123456',
      score: 100,
      timestamp: Date.now(),
    };
    store.save(result);
    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0]).toEqual(result);
  });

  it('saves multiple results', () => {
    store.save({ type: 'digits', score: 100, timestamp: 1 });
    store.save({ type: 'letters', score: 80, timestamp: 2 });
    store.save({ type: 'digits', score: 90, timestamp: 3 });
    expect(store.getAll()).toHaveLength(3);
  });

  it('filters by type', () => {
    store.save({ type: 'digits', score: 100, timestamp: 1 });
    store.save({ type: 'letters', score: 80, timestamp: 2 });
    store.save({ type: 'digits', score: 90, timestamp: 3 });
    const digits = store.getByType('digits');
    expect(digits).toHaveLength(2);
    expect(digits.every(d => d.type === 'digits')).toBe(true);
  });

  it('clears all data', () => {
    store.save({ type: 'digits', score: 100, timestamp: 1 });
    store.clear();
    expect(store.getAll()).toEqual([]);
  });
});

describe('DrillStore export/import', () => {
  let store;

  beforeEach(() => {
    store = new DrillStore();
    store.clear();
  });

  it('exports to a versioned JSON object', () => {
    store.save({ type: 'digits', score: 100, timestamp: 1 });
    const exported = store.export();
    expect(exported.version).toBe(1);
    expect(exported.exported).toBeTruthy();
    expect(exported.data.drills).toHaveLength(1);
  });

  it('imports from a JSON object', () => {
    const data = {
      version: 1,
      exported: '2026-04-30',
      data: {
        drills: [
          { type: 'digits', score: 90, timestamp: 1 },
          { type: 'letters', score: 85, timestamp: 2 },
        ],
      },
    };
    store.import(data);
    expect(store.getAll()).toHaveLength(2);
  });

  it('import replaces existing data by default', () => {
    store.save({ type: 'digits', score: 100, timestamp: 1 });
    store.import({
      version: 1,
      exported: '2026-04-30',
      data: { drills: [{ type: 'letters', score: 80, timestamp: 2 }] },
    });
    expect(store.getAll()).toHaveLength(1);
    expect(store.getAll()[0].type).toBe('letters');
  });

  it('import merges when merge flag is set', () => {
    store.save({ type: 'digits', score: 100, timestamp: 1 });
    store.import(
      {
        version: 1,
        exported: '2026-04-30',
        data: { drills: [{ type: 'letters', score: 80, timestamp: 2 }] },
      },
      { merge: true }
    );
    expect(store.getAll()).toHaveLength(2);
  });

  it('rejects import with wrong version', () => {
    expect(() =>
      store.import({ version: 999, data: { drills: [] } })
    ).toThrow();
  });

  it('roundtrips cleanly', () => {
    store.save({ type: 'digits', score: 100, timestamp: 1 });
    store.save({ type: 'letters', score: 80, timestamp: 2 });
    const exported = store.export();
    store.clear();
    store.import(exported);
    expect(store.getAll()).toHaveLength(2);
  });
});
