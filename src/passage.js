/**
 * passage.js — Data model and logic for chapter/passage-scale memorization.
 *
 * A Passage references an ordered list of verses by reference string.
 * It tracks "seams" (transition strength between consecutive verses),
 * auto-generates sections, and supports chapter-scale drill generation.
 */

/**
 * Create a new passage from an ordered array of verse objects.
 * @param {string} reference - Passage label (e.g. "Romans 8" or "Psalm 23")
 * @param {Array<{reference: string, text: string, chunks: string[]}>} verses
 * @returns {object} Passage entity
 */
export function createPassage(reference, verses) {
  if (!verses || verses.length === 0) {
    throw new Error('Cannot create passage with no verses');
  }

  var verseRefs = verses.map(function (v) { return v.reference; });

  // Build seams — one per consecutive pair
  var seams = {};
  for (var i = 0; i < verses.length - 1; i++) {
    var key = verses[i].reference + '\u2192' + verses[i + 1].reference;
    seams[key] = { strength: 0, attempts: 0 };
  }

  return {
    reference: reference,
    verseRefs: verseRefs,
    sections: autoSections(verses),
    seams: seams,
    card: { layer: 0, streak: 0, ease: 2.5, interval: 0, nextReview: 0 },
  };
}

/**
 * Auto-detect section boundaries. Groups verses into sections of ~5.
 * @param {Array<{reference: string}>} verses
 * @returns {Array<{label: string, range: [number, number]}>}
 */
export function autoSections(verses) {
  if (!verses || verses.length === 0) return [];

  var sectionSize = 5;
  var sections = [];
  for (var i = 0; i < verses.length; i += sectionSize) {
    var end = Math.min(i + sectionSize - 1, verses.length - 1);
    var label = verses[i].reference;
    if (end !== i) {
      label += ' \u2013 ' + verses[end].reference;
    }
    sections.push({ label: label, range: [i, end] });
  }
  return sections;
}

/**
 * Get all seams as an array of {from, to, strength, attempts}.
 * @param {object} passage
 * @returns {Array<{from: string, to: string, key: string, strength: number, attempts: number}>}
 */
export function getSeams(passage) {
  return Object.keys(passage.seams).map(function (key) {
    var parts = key.split('\u2192');
    return {
      from: parts[0],
      to: parts[1],
      key: key,
      strength: passage.seams[key].strength,
      attempts: passage.seams[key].attempts,
    };
  });
}

/**
 * Record a seam drill result. Adjusts strength up on success, down on failure.
 * @param {object} passage
 * @param {string} fromRef
 * @param {string} toRef
 * @param {boolean} correct
 */
export function rateSeam(passage, fromRef, toRef, correct) {
  var key = fromRef + '\u2192' + toRef;
  var seam = passage.seams[key];
  if (!seam) return;

  seam.attempts += 1;
  if (correct) {
    seam.strength = Math.min(1, seam.strength + 0.15);
  } else {
    seam.strength = Math.max(0, seam.strength - 0.2);
  }
}

/**
 * Return the N weakest seams, sorted by strength ascending.
 * @param {object} passage
 * @param {number} count
 * @returns {Array<{from: string, to: string, strength: number}>}
 */
export function getWeakestSeams(passage, count) {
  var all = getSeams(passage);
  all.sort(function (a, b) { return a.strength - b.strength; });
  return all.slice(0, count);
}

/**
 * Generate bridge drill options for a given verse index.
 * Shows the tail of verse[idx] and asks "what comes next?"
 * @param {Array<{reference: string, text: string, chunks: string[]}>} verses
 * @param {number} idx - Index of the "from" verse
 * @param {number} distractorCount - Number of wrong answers
 * @returns {{prompt: string, correct: string, options: string[]}|null}
 */
export function bridgeOptions(verses, idx, distractorCount) {
  if (idx >= verses.length - 1) return null;

  var fromVerse = verses[idx];
  var nextRef = verses[idx + 1].reference;

  // Prompt = last chunk of the from verse (or last sentence)
  var chunks = fromVerse.chunks || [fromVerse.text];
  var prompt = chunks[chunks.length - 1];

  // Build distractor pool: all refs except from and correct
  var pool = [];
  for (var i = 0; i < verses.length; i++) {
    if (i !== idx && i !== idx + 1) {
      pool.push(verses[i].reference);
    }
  }

  // Shuffle pool and pick distractors
  var distractors = [];
  var used = {};
  while (distractors.length < distractorCount && pool.length > 0) {
    var ri = Math.floor(Math.random() * pool.length);
    if (!used[pool[ri]]) {
      distractors.push(pool[ri]);
      used[pool[ri]] = true;
    }
    pool.splice(ri, 1);
  }

  // Combine correct + distractors, shuffle
  var options = [nextRef].concat(distractors);
  for (var j = options.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var tmp = options[j];
    options[j] = options[k];
    options[k] = tmp;
  }

  return {
    prompt: prompt,
    correct: nextRef,
    options: options,
  };
}

/**
 * Flatten all verse chunks into a single ordered array.
 * Used for chapter-scale chunk-order drill (hard mode).
 * @param {Array<{chunks: string[]}>} verses
 * @returns {string[]}
 */
export function passageToChunks(verses) {
  var result = [];
  for (var i = 0; i < verses.length; i++) {
    var chunks = verses[i].chunks || [];
    for (var j = 0; j < chunks.length; j++) {
      result.push(chunks[j]);
    }
  }
  return result;
}
