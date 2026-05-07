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

export class VerseLibrary {
  constructor() {
    /** @type {Map<string, object>} */
    this._verses = new Map();
    /** @type {object[]} */
    this._passages = [];
  }

  /**
   * Add a verse to the library.
   * @param {{ reference: string, text: string, translation?: string }} entry
   */
  add(entry) {
    const ref = normalizeRef(entry.reference);
    if (!ref) throw new Error('Reference is required');
    if (!entry.text || !entry.text.trim()) throw new Error('Text is required');
    if (this._verses.has(ref)) throw new Error(`Duplicate reference: ${ref}`);

    const verse = {
      reference: ref,
      text: entry.text.trim(),
      translation: entry.translation || '',
      chunks: chunkVerse(entry.text.trim()),
      card: createCard(ref),
      storyNotes: '',
      errors: [],
      addedAt: Date.now(),
    };

    this._verses.set(ref, verse);
  }

  /**
   * Get a verse by reference.
   * @param {string} reference
   * @returns {object|undefined}
   */
  get(reference) {
    return this._verses.get(normalizeRef(reference));
  }

  /**
   * Update fields of an existing verse.
   * @param {string} reference
   * @param {object} updates
   */
  update(reference, updates) {
    const ref = normalizeRef(reference);
    const verse = this._verses.get(ref);
    if (!verse) throw new Error(`Verse not found: ${ref}`);

    if (updates.text !== undefined) {
      verse.text = updates.text.trim();
      verse.chunks = chunkVerse(verse.text);
    }
    if (updates.translation !== undefined) verse.translation = updates.translation;
    if (updates.storyNotes !== undefined) verse.storyNotes = updates.storyNotes;
    if (updates.card !== undefined) verse.card = updates.card;
    if (updates.errors !== undefined) verse.errors = updates.errors;
  }

  /**
   * Remove a verse by reference.
   * @param {string} reference
   */
  remove(reference) {
    const ref = normalizeRef(reference);
    if (!this._verses.has(ref)) throw new Error(`Verse not found: ${ref}`);
    this._verses.delete(ref);
    // Remove from passages
    this._passages.forEach(p => {
      p.verses = p.verses.filter(r => r !== ref);
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
   * Create a passage (ordered group of verses).
   * @param {string} name
   * @param {string[]} references
   */
  createPassage(name, references) {
    const normalized = references.map(normalizeRef);
    for (const ref of normalized) {
      if (!this._verses.has(ref)) throw new Error(`Verse not found: ${ref}`);
    }
    this._passages.push({ name, verses: normalized });
  }

  /**
   * Get all passages.
   * @returns {object[]}
   */
  getPassages() {
    return [...this._passages];
  }

  /**
   * Set custom chunk boundaries for a verse (overrides auto-chunking).
   * @param {string} reference
   * @param {string[]} chunks
   */
  setCustomChunks(reference, chunks) {
    const ref = normalizeRef(reference);
    const verse = this._verses.get(ref);
    if (!verse) throw new Error('Verse not found: ' + ref);
    verse.customChunks = chunks;
  }

  /**
   * Get effective chunks for a verse (custom if set, else auto).
   * @param {string} reference
   * @returns {string[]}
   */
  getChunks(reference) {
    const ref = normalizeRef(reference);
    const verse = this._verses.get(ref);
    if (!verse) throw new Error('Verse not found: ' + ref);
    return verse.customChunks || verse.chunks;
  }

  /**
   * Remove custom chunk override, reverting to auto-chunking.
   * @param {string} reference
   */
  clearCustomChunks(reference) {
    const ref = normalizeRef(reference);
    const verse = this._verses.get(ref);
    if (!verse) throw new Error('Verse not found: ' + ref);
    delete verse.customChunks;
  }

  /**
   * Set custom chunks using word-index split positions.
   * @param {string} reference
   * @param {number[]} positions - Word indices where new chunks begin
   */
  setSplitPositions(reference, positions) {
    const ref = normalizeRef(reference);
    const verse = this._verses.get(ref);
    if (!verse) throw new Error('Verse not found: ' + ref);
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
      this._verses.set(v.reference, v);
    }
  }
}
