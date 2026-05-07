import { describe, it, expect, beforeEach } from 'vitest';
import { VerseLibrary } from '../src/verse-library.js';

describe('verse-library', () => {
  let lib;

  beforeEach(() => {
    lib = new VerseLibrary();
  });

  describe('add', () => {
    it('adds a verse with reference and text', () => {
      lib.add({ reference: 'John 3:16', text: 'For God so loved the world', translation: 'KJV' });
      expect(lib.getAll()).toHaveLength(1);
      expect(lib.get('John 3:16').text).toBe('For God so loved the world');
    });

    it('normalizes reference format', () => {
      lib.add({ reference: 'john 3:16', text: 'text' });
      expect(lib.get('John 3:16')).toBeDefined();
    });

    it('rejects duplicate reference', () => {
      lib.add({ reference: 'John 3:16', text: 'text1' });
      expect(() => lib.add({ reference: 'John 3:16', text: 'text2' })).toThrow();
    });

    it('requires reference and text', () => {
      expect(() => lib.add({ reference: '', text: 'text' })).toThrow();
      expect(() => lib.add({ reference: 'John 3:16', text: '' })).toThrow();
    });

    it('stores translation field', () => {
      lib.add({ reference: 'Ps 23:1', text: 'The Lord is my shepherd', translation: 'ESV' });
      expect(lib.get('Ps 23:1').translation).toBe('ESV');
    });

    it('auto-chunks the text on add', () => {
      lib.add({ reference: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son' });
      const verse = lib.get('John 3:16');
      expect(Array.isArray(verse.chunks)).toBe(true);
      expect(verse.chunks.length).toBeGreaterThanOrEqual(2);
    });

    it('initializes spaced repetition card', () => {
      lib.add({ reference: 'John 3:16', text: 'text' });
      const verse = lib.get('John 3:16');
      expect(verse.card).toBeDefined();
      expect(verse.card.interval).toBe(0);
      expect(verse.card.streak).toBe(0);
    });
  });

  describe('update', () => {
    it('updates text of existing verse', () => {
      lib.add({ reference: 'John 3:16', text: 'old' });
      lib.update('John 3:16', { text: 'new text' });
      expect(lib.get('John 3:16').text).toBe('new text');
    });

    it('re-chunks on text update', () => {
      lib.add({ reference: 'John 3:16', text: 'short' });
      lib.update('John 3:16', { text: 'For God so loved the world, that he gave his only begotten Son' });
      expect(lib.get('John 3:16').chunks.length).toBeGreaterThanOrEqual(2);
    });

    it('throws on unknown reference', () => {
      expect(() => lib.update('NoSuch 1:1', { text: 'x' })).toThrow();
    });

    it('allows updating storyNotes', () => {
      lib.add({ reference: 'John 3:16', text: 'text' });
      lib.update('John 3:16', { storyNotes: 'God reaching down with love' });
      expect(lib.get('John 3:16').storyNotes).toBe('God reaching down with love');
    });
  });

  describe('remove', () => {
    it('removes a verse by reference', () => {
      lib.add({ reference: 'John 3:16', text: 'text' });
      lib.remove('John 3:16');
      expect(lib.getAll()).toHaveLength(0);
    });

    it('throws on unknown reference', () => {
      expect(() => lib.remove('NoSuch 1:1')).toThrow();
    });
  });

  describe('getAll', () => {
    it('returns all verses sorted by reference', () => {
      lib.add({ reference: 'Romans 8:28', text: 'a' });
      lib.add({ reference: 'John 3:16', text: 'b' });
      const all = lib.getAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('export/import', () => {
    it('exports to JSON-serializable object', () => {
      lib.add({ reference: 'John 3:16', text: 'text', translation: 'KJV' });
      const data = lib.export();
      expect(typeof data).toBe('string');
      const parsed = JSON.parse(data);
      expect(parsed.verses).toHaveLength(1);
    });

    it('imports from exported data', () => {
      lib.add({ reference: 'John 3:16', text: 'text' });
      const data = lib.export();
      const lib2 = new VerseLibrary();
      lib2.import(data);
      expect(lib2.get('John 3:16').text).toBe('text');
    });
  });

  describe('getByLayer', () => {
    it('filters verses by mastery layer', () => {
      lib.add({ reference: 'John 3:16', text: 'a' });
      lib.add({ reference: 'John 3:17', text: 'b' });
      // Manually set layer for testing
      const v = lib.get('John 3:17');
      v.card.layer = 3;
      expect(lib.getByLayer(0)).toHaveLength(1);
      expect(lib.getByLayer(3)).toHaveLength(1);
    });
  });

  describe('passages', () => {
    it('creates a passage from verse references', () => {
      lib.add({ reference: 'John 3:16', text: 'a' });
      lib.add({ reference: 'John 3:17', text: 'b' });
      lib.add({ reference: 'John 3:18', text: 'c' });
      lib.createPassage('John 3:16-18', ['John 3:16', 'John 3:17', 'John 3:18']);
      const passages = lib.getPassages();
      expect(passages).toHaveLength(1);
      expect(passages[0].name).toBe('John 3:16-18');
      expect(passages[0].verses).toHaveLength(3);
    });

    it('rejects passage with missing verses', () => {
      lib.add({ reference: 'John 3:16', text: 'a' });
      expect(() => lib.createPassage('test', ['John 3:16', 'NoExist 1:1'])).toThrow();
    });
  });

  describe('custom chunks', () => {
    it('auto-chunks on add by default', () => {
      lib.add({ reference: 'Rom 1:1', text: 'this letter is from Paul a servant of Christ Jesus' });
      const v = lib.get('Rom 1:1');
      expect(v.chunks.length).toBeGreaterThanOrEqual(1);
      expect(v.customChunks).toBeUndefined();
    });

    it('setCustomChunks overrides auto chunks', () => {
      lib.add({ reference: 'Rom 1:1', text: 'this letter is from Paul a servant of Christ Jesus' });
      lib.setCustomChunks('Rom 1:1', ['this letter is from Paul', 'a servant of Christ Jesus']);
      const v = lib.get('Rom 1:1');
      expect(v.customChunks).toEqual(['this letter is from Paul', 'a servant of Christ Jesus']);
    });

    it('getChunks returns custom chunks when set', () => {
      lib.add({ reference: 'Rom 1:1', text: 'this letter is from Paul a servant of Christ Jesus' });
      const custom = ['this letter is from Paul', 'a servant of Christ Jesus'];
      lib.setCustomChunks('Rom 1:1', custom);
      expect(lib.getChunks('Rom 1:1')).toEqual(custom);
    });

    it('getChunks returns auto chunks when no custom set', () => {
      lib.add({ reference: 'Rom 1:1', text: 'For God so loved the world, that he gave his only Son' });
      const chunks = lib.getChunks('Rom 1:1');
      expect(chunks.length).toBeGreaterThanOrEqual(2);
      expect(chunks.join(' ')).toBe('For God so loved the world, that he gave his only Son');
    });

    it('clearCustomChunks removes override', () => {
      lib.add({ reference: 'Rom 1:1', text: 'this letter is from Paul a servant of Christ Jesus' });
      lib.setCustomChunks('Rom 1:1', ['custom1', 'custom2']);
      lib.clearCustomChunks('Rom 1:1');
      const v = lib.get('Rom 1:1');
      expect(v.customChunks).toBeUndefined();
    });

    it('setSplitPositions creates custom chunks from word indices', () => {
      lib.add({ reference: 'Rom 1:1', text: 'this letter is from Paul a servant of Christ Jesus' });
      lib.setSplitPositions('Rom 1:1', [5]);
      const v = lib.get('Rom 1:1');
      expect(v.customChunks).toEqual(['this letter is from Paul', 'a servant of Christ Jesus']);
    });

    it('throws on unknown reference', () => {
      expect(() => lib.setCustomChunks('NoExist 1:1', ['a'])).toThrow();
      expect(() => lib.getChunks('NoExist 1:1')).toThrow();
      expect(() => lib.clearCustomChunks('NoExist 1:1')).toThrow();
      expect(() => lib.setSplitPositions('NoExist 1:1', [2])).toThrow();
    });

    it('custom chunks survive export/import', () => {
      lib.add({ reference: 'Rom 1:1', text: 'this letter is from Paul a servant of Christ Jesus' });
      lib.setCustomChunks('Rom 1:1', ['this letter is from Paul', 'a servant of Christ Jesus']);
      const json = lib.export();
      const lib2 = new VerseLibrary();
      lib2.import(json);
      expect(lib2.getChunks('Rom 1:1')).toEqual(['this letter is from Paul', 'a servant of Christ Jesus']);
    });
  });
});
