/**
 * VerseLibrary — persistent verse collection with chunking, SR cards, and passages.
 */

import { chunkVerse, splitAtPositions } from './chunker.js';
import { createCard } from './spaced-repetition.js';

/**
 * Normalize a Bible reference to consistent format.
 * "john 3:16" → "John 3:16"
 * @param {string} ref
 * @returns {string}
 */
function normalizeRef(ref) {
  if (!ref) return '';
  ref = ref.trim();
  // Capitalize first letter of each word before the chapter:verse
  return ref.replace(/^\w+/, word => word[0].toUpperCase() + word.slice(1).toLowerCase());
}

/**
 * Normalize a translation code. Defaults to 'KJV' when empty.
 * @param {string} [translation]
 * @returns {string}
 */
function normalizeTranslation(translation) {
  if (!translation || !String(translation).trim()) return 'KJV';
  return String(translation).trim().toUpperCase();
}

/**
 * Build the composite storage key: "John 3:16|KJV"
 * @param {string} ref
 * @param {string} [translation]
 * @returns {string}
 */
function buildKey(ref, translation) {
  return normalizeRef(ref) + '|' + normalizeTranslation(translation);
}

export class VerseLibrary {
  constructor() {
    /** @type {Map<string, object>} */
    this._verses = new Map();
    /** @type {object[]} */
    this._passages = [];
  }

  /**
   * Add a verse to the library. Allows the same reference in multiple translations.
   * @param {{ reference: string, text: string, translation?: string }} entry
   */
  add(entry) {
    const ref = normalizeRef(entry.reference);
    if (!ref) throw new Error('Reference is required');
    if (!entry.text || !entry.text.trim()) throw new Error('Text is required');
    const key = buildKey(ref, entry.translation);
    if (this._verses.has(key)) throw new Error(`Duplicate reference: ${key}`);

    const verse = {
      key,
      reference: ref,
      text: entry.text.trim(),
      translation: normalizeTranslation(entry.translation),
      chunks: chunkVerse(entry.text.trim()),
      card: createCard(ref),
      storyNotes: '',
      errors: [],
      addedAt: Date.now(),
    };

    this._verses.set(key, verse);
  }

  /**
   * Get a verse by reference and translation.
   * Translation defaults to 'KJV' when omitted.
   * @param {string} reference
   * @param {string} [translation]
   * @returns {object|undefined}
   */
  get(reference, translation) {
    return this._verses.get(buildKey(reference, translation));
  }

  /**
   * Get all stored verses for a given reference (all translations).
   * @param {string} reference
   * @returns {object[]}
   */
  getByReference(reference) {
    const ref = normalizeRef(reference);
    return Array.from(this._verses.values()).filter(v => v.reference === ref);
  }

  /**
   * Update fields of an existing verse.
   * @param {string} reference
   * @param {object} updates
   * @param {string} [translation] - defaults to 'KJV'
   */
  update(reference, updates, translation) {
    const key = buildKey(reference, translation);
    const verse = this._verses.get(key);
    if (!verse) throw new Error(`Verse not found: ${key}`);

    if (updates.text !== undefined) {
      verse.text = updates.text.trim();
      verse.chunks = chunkVerse(verse.text);
    }
    if (updates.translation !== undefined) verse.translation = normalizeTranslation(updates.translation);
    if (updates.storyNotes !== undefined) verse.storyNotes = updates.storyNotes;
    if (updates.card !== undefined) verse.card = updates.card;
    if (updates.errors !== undefined) verse.errors = updates.errors;
  }

  /**
   * Remove a verse by reference and translation.
   * @param {string} reference
   * @param {string} [translation] - defaults to 'KJV'
   */
  remove(reference, translation) {
    const key = buildKey(reference, translation);
    if (!this._verses.has(key)) throw new Error(`Verse not found: ${key}`);
    this._verses.delete(key);
    // Remove from study plans
    this._passages.forEach(p => {
      p.verses = p.verses.filter(k => k !== key);
    });
  }

  /**
   * Get all verses.
   * @returns {object[]}
   */
  getAll() {
    return Array.from(this._verses.values());
  }

  /**
   * Get verses at a specific mastery layer.
   * @param {number} layer
   * @returns {object[]}
   */
  getByLayer(layer) {
    return this.getAll().filter(v => (v.card.layer || 0) === layer);
  }

  /**
   * Create a study plan — an ordered, named collection of verse keys.
   * Each entry should be a composite key (e.g. "John 3:16|KJV").
   * @param {string} name
   * @param {string[]} verseKeys - composite keys
   */
  createStudyPlan(name, verseKeys) {
    for (const key of verseKeys) {
      if (!this._verses.has(key)) throw new Error(`Verse not found: ${key}`);
    }
    this._passages.push({ name, verses: verseKeys });
  }

  /**
   * Alias for createStudyPlan (backward compatibility).
   * @param {string} name
   * @param {string[]} verseKeys
   */
  createPassage(name, verseKeys) {
    return this.createStudyPlan(name, verseKeys);
  }

  /**
   * Get all study plans.
   * @returns {object[]}
   */
  getStudyPlans() {
    return [...this._passages];
  }

  /**
   * Alias for getStudyPlans (backward compatibility).
   * @returns {object[]}
   */
  getPassages() {
    return this.getStudyPlans();
  }

  /**
   * Set custom chunk boundaries for a verse (overrides auto-chunking).
   * @param {string} reference
   * @param {string[]} chunks
   * @param {string} [translation] - defaults to 'KJV'
   */
  setCustomChunks(reference, chunks, translation) {
    const key = buildKey(reference, translation);
    const verse = this._verses.get(key);
    if (!verse) throw new Error('Verse not found: ' + key);
    verse.customChunks = chunks;
  }

  /**
   * Get effective chunks for a verse (custom if set, else auto).
   * @param {string} reference
   * @param {string} [translation] - defaults to 'KJV'
   * @returns {string[]}
   */
  getChunks(reference, translation) {
    const key = buildKey(reference, translation);
    const verse = this._verses.get(key);
    if (!verse) throw new Error('Verse not found: ' + key);
    return verse.customChunks || verse.chunks;
  }

  /**
   * Remove custom chunk override, reverting to auto-chunking.
   * @param {string} reference
   * @param {string} [translation] - defaults to 'KJV'
   */
  clearCustomChunks(reference, translation) {
    const key = buildKey(reference, translation);
    const verse = this._verses.get(key);
    if (!verse) throw new Error('Verse not found: ' + key);
    delete verse.customChunks;
  }

  /**
   * Set custom chunks using word-index split positions.
   * @param {string} reference
   * @param {number[]} positions - Word indices where new chunks begin
   * @param {string} [translation] - defaults to 'KJV'
   */
  setSplitPositions(reference, positions, translation) {
    const key = buildKey(reference, translation);
    const verse = this._verses.get(key);
    if (!verse) throw new Error('Verse not found: ' + key);
    verse.customChunks = splitAtPositions(verse.text, positions);
  }

    /**
   * Export library to JSON string.
   * @returns {string}
   */
  export() {
    return JSON.stringify({
      verses: this.getAll(),
      passages: this._passages,
    });
  }

  /**
   * Import from JSON string.
   * @param {string} json
   */
  import(json) {
    const data = JSON.parse(json);
    this._verses.clear();
    this._passages = data.passages || [];
    for (const v of data.verses) {
      // Support old format (no key field) and new format
      const key = v.key || buildKey(v.reference, v.translation);
      if (!v.key) v.key = key;
      this._verses.set(key, v);
    }
  }
}
