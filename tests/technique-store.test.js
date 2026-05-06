/**
 * Tests for technique-store — persistent storage for user's mnemonic system tables.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { TechniqueStore } from '../src/technique-store.js';

describe('TechniqueStore', () => {
  let store;

  beforeEach(() => {
    store = new TechniqueStore();
  });

  it('starts with no custom tables', () => {
    expect(store.listTables()).toEqual([]);
  });

  it('saves and retrieves a custom word table', () => {
    store.saveTable('major', { '00': 'sass', '01': 'seed' });
    const table = store.getTable('major');
    expect(table['00']).toBe('sass');
    expect(table['01']).toBe('seed');
  });

  it('overwrites existing table', () => {
    store.saveTable('major', { '00': 'sass' });
    store.saveTable('major', { '00': 'zoo' });
    expect(store.getTable('major')['00']).toBe('zoo');
  });

  it('returns null for non-existent table', () => {
    expect(store.getTable('pao')).toBeNull();
  });

  it('lists all saved table names', () => {
    store.saveTable('major', {});
    store.saveTable('pao', {});
    const names = store.listTables();
    expect(names).toContain('major');
    expect(names).toContain('pao');
  });

  it('deletes a table', () => {
    store.saveTable('major', { '00': 'sass' });
    store.deleteTable('major');
    expect(store.getTable('major')).toBeNull();
  });

  it('exports all tables', () => {
    store.saveTable('major', { '00': 'sass' });
    store.saveTable('pao', { '00': { person: 'Superman' } });
    const exported = store.export();
    expect(exported.version).toBe(1);
    expect(exported.tables.major).toBeDefined();
    expect(exported.tables.pao).toBeDefined();
  });

  it('imports tables with merge', () => {
    store.saveTable('major', { '00': 'sass' });
    store.import({ version: 1, tables: { pao: { '00': { person: 'Batman' } } } }, { merge: true });
    expect(store.getTable('major')).toBeTruthy();
    expect(store.getTable('pao')).toBeTruthy();
  });

  it('imports tables with replace', () => {
    store.saveTable('major', { '00': 'sass' });
    store.import({ version: 1, tables: { pao: { '00': { person: 'Batman' } } } });
    expect(store.getTable('major')).toBeNull();
    expect(store.getTable('pao')).toBeTruthy();
  });

  it('rejects invalid import version', () => {
    expect(() => store.import({ version: 99, tables: {} })).toThrow();
  });

  // PAO table structure
  it('stores PAO entries with person/action/object', () => {
    const pao = {
      '00': { person: 'Superman', action: 'flying', object: 'cape' },
      '01': { person: 'Einstein', action: 'writing', object: 'chalkboard' },
    };
    store.saveTable('pao', pao);
    const retrieved = store.getTable('pao');
    expect(retrieved['00'].person).toBe('Superman');
    expect(retrieved['01'].action).toBe('writing');
  });

  // Update single entry
  it('updates a single entry in a table', () => {
    store.saveTable('major', { '00': 'sass', '01': 'seed' });
    store.updateEntry('major', '00', 'zoo');
    expect(store.getTable('major')['00']).toBe('zoo');
    expect(store.getTable('major')['01']).toBe('seed');
  });

  it('throws when updating non-existent table', () => {
    expect(() => store.updateEntry('nope', '00', 'test')).toThrow();
  });
});
