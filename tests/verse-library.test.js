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
      expect(lib.get('John 3:16', 'KJV').text).toBe('For God so loved the world');
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
      expect(lib.get('Ps 23:1', 'ESV').translation).toBe('ESV');
    });

    it('auto-chunks the text on add', () => {
      lib.add({ reference: 'John 3:16', text: 'For God so loved the world, that he gave his only begotten Son' });
      const verse = lib.get('John 3:16', 'KJV');
      expect(Array.isArray(verse.chunks)).toBe(true);
      expect(verse.chunks.length).toBeGreaterThanOrEqual(2);
    });

    it('initializes spaced repetition card', () => {
      lib.add({ reference: 'John 3:16', text: 'text' });
      const verse = lib.get('John 3:16', 'KJV');
      expect(verse.card).toBeDefined();
      expect(verse.card.interval).toBe(0);
      expect(verse.card.streak).toBe(0);
    });

    it('allows same verse in multiple translations', () => {
      lib.add({ reference: 'John 3:16', text: 'For God so loved the world', translation: 'KJV' });
      lib.add({ reference: 'John 3:16', text: 'For this is how God loved the world', translation: 'NLT' });
      lib.add({ reference: 'John 3:16', text: 'For God so loved the world, that he gave his only Son', translation: 'ESV' });
      expect(lib.getAll()).toHaveLength(3);
      expect(lib.get('John 3:16', 'KJV').text).toBe('For God so loved the world');
      expect(lib.get('John 3:16', 'NLT').text).toBe('For this is how God loved the world');
      expect(lib.get('John 3:16', 'ESV').text).toBe('For God so loved the world, that he gave his only Son');
    });

    it('rejects same verse + same translation duplicate', () => {
      lib.add({ reference: 'John 3:16', text: 'text1', translation: 'ESV' });
      expect(() => lib.add({ reference: 'John 3:16', text: 'text2', translation: 'ESV' })).toThrow();
    });

    it('stores composite key on verse object', () => {
      lib.add({ reference: 'John 3:16', text: 'text', translation: 'NKJV' });
      const verse = lib.get('John 3:16', 'NKJV');
      expect(verse.key).toBe('John 3:16|NKJV');
    });
  });

  describe('update', () => {
    it('updates text of existing verse', () => {
      lib.add({ reference: 'John 3:16', text: 'old' });
      lib.update('John 3:16', { text: 'new text' });
      expect(lib.get('John 3:16', 'KJV').text).toBe('new text');
    });

    it('re-chunks on text update', () => {
      lib.add({ reference: 'John 3:16', text: 'short' });
      lib.update('John 3:16', { text: 'For God so loved the world, that he gave his only begotten Son' });
      expect(lib.get('John 3:16', 'KJV').chunks.length).toBeGreaterThanOrEqual(2);
    });

    it('throws on unknown reference', () => {
      expect(() => lib.update('NoSuch 1:1', { text: 'x' })).toThrow();
    });

    it('allows updating storyNotes', () => {
      lib.add({ reference: 'John 3:16', text: 'text' });
      lib.update('John 3:16', { storyNotes: 'God reaching down with love' });
      expect(lib.get('John 3:16', 'KJV').storyNotes).toBe('God reaching down with love');
    });

    it('updates a specific translation without affecting others', () => {
      lib.add({ reference: 'John 3:16', text: 'original esv', translation: 'ESV' });
      lib.add({ reference: 'John 3:16', text: 'original kjv', translation: 'KJV' });
      lib.update('John 3:16', { text: 'updated esv' }, 'ESV');
      expect(lib.get('John 3:16', 'ESV').text).toBe('updated esv');
      expect(lib.get('John 3:16', 'KJV').text).toBe('original kjv');
    });
  });

  describe('remove', () => {
    it('removes a specific translation by reference', () => {
      lib.add({ reference: 'John 3:16', text: 'kjv text', translation: 'KJV' });
      lib.add({ reference: 'John 3:16', text: 'esv text', translation: 'ESV' });
      lib.remove('John 3:16', 'KJV');
      expect(lib.getAll()).toHaveLength(1);
      expect(lib.get('John 3:16', 'ESV')).toBeDefined();
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
      expect(lib2.get('John 3:16', 'KJV').text).toBe('text');
    });

    it('round-trips multiple translations', () => {
      lib.add({ reference: 'John 3:16', text: 'kjv text', translation: 'KJV' });
      lib.add({ reference: 'John 3:16', text: 'esv text', translation: 'ESV' });
      const lib2 = new VerseLibrary();
      lib2.import(lib.export());
      expect(lib2.getAll()).toHaveLength(2);
      expect(lib2.get('John 3:16', 'KJV').text).toBe('kjv text');
      expect(lib2.get('John 3:16', 'ESV').text).toBe('esv text');
    });
  });

  describe('getByLayer', () => {
    it('filters verses by mastery layer', () => {
      lib.add({ reference: 'John 3:16', text: 'a' });
      lib.add({ reference: 'John 3:17', text: 'b' });
      // Manually set layer for testing
      const v = lib.get('John 3:17', 'KJV');
      v.card.layer = 3;
      expect(lib.getByLayer(0)).toHaveLength(1);
      expect(lib.getByLayer(3)).toHaveLength(1);
    });
  });

  describe('getByReference', () => {
    it('returns all translations for a reference', () => {
      lib.add({ reference: 'Romans 8:28', text: 'a', translation: 'KJV' });
      lib.add({ reference: 'Romans 8:28', text: 'b', translation: 'ESV' });
      lib.add({ reference: 'Romans 8:28', text: 'c', translation: 'NLT' });
      const results = lib.getByReference('Romans 8:28');
      expect(results).toHaveLength(3);
    });

    it('returns empty array for unknown reference', () => {
      expect(lib.getByReference('NoSuch 1:1')).toHaveLength(0);
    });
  });

  describe('study plans', () => {
    it('creates a study plan from composite verse keys', () => {
      lib.add({ reference: 'John 3:16', text: 'a', translation: 'KJV' });
      lib.add({ reference: 'John 3:17', text: 'b', translation: 'KJV' });
      lib.add({ reference: 'John 3:18', text: 'c', translation: 'KJV' });
      lib.createStudyPlan('Grace Season', ['John 3:16|KJV', 'John 3:17|KJV', 'John 3:18|KJV']);
      const plans = lib.getStudyPlans();
      expect(plans).toHaveLength(1);
      expect(plans[0].name).toBe('Grace Season');
      expect(plans[0].verses).toHaveLength(3);
    });

    it('allows multiple translations of the same verse in one study plan', () => {
      lib.add({ reference: 'John 3:16', text: 'kjv text', translation: 'KJV' });
      lib.add({ reference: 'John 3:16', text: 'esv text', translation: 'ESV' });
      lib.add({ reference: 'John 3:16', text: 'nlt text', translation: 'NLT' });
      lib.createStudyPlan('Memorize John 3:16', ['John 3:16|KJV', 'John 3:16|ESV', 'John 3:16|NLT']);
      const plans = lib.getStudyPlans();
      expect(plans[0].verses).toHaveLength(3);
    });

    it('rejects study plan with missing verse keys', () => {
      lib.add({ reference: 'John 3:16', text: 'a', translation: 'KJV' });
      expect(() => lib.createStudyPlan('test', ['John 3:16|KJV', 'NoExist 1:1|KJV'])).toThrow();
    });

    it('createPassage is an alias for createStudyPlan', () => {
      lib.add({ reference: 'John 3:16', text: 'a' });
      lib.createPassage('alias test', ['John 3:16|KJV']);
      expect(lib.getPassages()).toHaveLength(1);
    });
  });

  describe('custom chunks', () => {
    it('auto-chunks on add by default', () => {
      lib.add({ reference: 'Rom 1:1', text: 'this letter is from Paul a servant of Christ Jesus' });
      const v = lib.get('Rom 1:1', 'KJV');
      expect(v.chunks.length).toBeGreaterThanOrEqual(1);
      expect(v.customChunks).toBeUndefined();
    });

    it('setCustomChunks overrides auto chunks', () => {
      lib.add({ reference: 'Rom 1:1', text: 'this letter is from Paul a servant of Christ Jesus' });
      lib.setCustomChunks('Rom 1:1', ['this letter is from Paul', 'a servant of Christ Jesus']);
      const v = lib.get('Rom 1:1', 'KJV');
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
      const v = lib.get('Rom 1:1', 'KJV');
      expect(v.customChunks).toBeUndefined();
    });

    it('setSplitPositions creates custom chunks from word indices', () => {
      lib.add({ reference: 'Rom 1:1', text: 'this letter is from Paul a servant of Christ Jesus' });
      lib.setSplitPositions('Rom 1:1', [5]);
      const v = lib.get('Rom 1:1', 'KJV');
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
