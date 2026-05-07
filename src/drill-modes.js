/**
 * drill-modes.js — Logic for tap-based drill modes
 * Exports pure functions for chunk ordering, fill-in-blank, and word bank generation.
 */

/**
 * Seeded PRNG (simple LCG) for deterministic shuffles.
 * Returns a function that produces 0..1 floats.
 */
function seededRandom(seed) {
  var s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

/**
 * Fisher-Yates shuffle (in-place). Uses seeded RNG if provided, else Math.random.
 */
function shuffle(arr, rng) {
  var rand = rng || Math.random;
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(rand() * (i + 1));
    var tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

/**
 * Scramble chunk order for the chunk-ordering drill.
 * Returns a new array with chunks in shuffled order.
 * Guarantees: all chunks present, order differs from original when possible.
 */
export function scrambleChunks(chunks) {
  if (chunks.length <= 1) return chunks.slice();
  var scrambled = shuffle(chunks);
  // If by chance the shuffle matches original, swap first two
  var same = scrambled.every(function (c, i) { return c === chunks[i]; });
  if (same) {
    var tmp = scrambled[0];
    scrambled[0] = scrambled[1];
    scrambled[1] = tmp;
  }
  return scrambled;
}

/**
 * Generate blank markers for fill-in-the-blank drill.
 * @param {string[]} words - Array of words in the verse
 * @param {number} ratio - 0..1, fraction of words to blank
 * @param {number} [seed] - Optional seed for deterministic output
 * @returns {Array<{word: string, blanked: boolean, index: number}>}
 */
export function generateBlanks(words, ratio, seed) {
  if (ratio <= 0) {
    return words.map(function (w, i) { return { word: w, blanked: false, index: i }; });
  }
  if (ratio >= 1) {
    return words.map(function (w, i) { return { word: w, blanked: true, index: i }; });
  }
  var count = Math.round(words.length * ratio);
  var indices = words.map(function (_, i) { return i; });
  var rng = seed !== undefined ? seededRandom(seed) : undefined;
  var shuffled = shuffle(indices, rng);
  var blankedSet = {};
  for (var k = 0; k < count; k++) {
    blankedSet[shuffled[k]] = true;
  }
  return words.map(function (w, i) {
    return { word: w, blanked: !!blankedSet[i], index: i };
  });
}

/**
 * Generate a word bank containing all blanked words plus optional distractors.
 * @param {Array<{word: string, blanked: boolean}>} blanks - Output from generateBlanks
 * @param {string[]} [distractors] - Extra wrong-answer words
 * @returns {string[]} Shuffled word bank
 */
export function generateWordBank(blanks, distractors) {
  var correct = blanks
    .filter(function (b) { return b.blanked; })
    .map(function (b) { return b.word; });
  if (correct.length === 0) return [];
  var bank = correct.slice();
  if (distractors && distractors.length > 0) {
    distractors.forEach(function (d) { bank.push(d); });
  }
  return shuffle(bank);
}

/**
 * Check whether the user's chunk ordering matches the correct order.
 * @param {string[]} correct - Correct chunk order
 * @param {string[]} attempt - User's selected order
 * @returns {{correct: boolean, firstWrong: number}} firstWrong is -1 if order is right or attempt is incomplete
 */
export function checkChunkOrder(correct, attempt) {
  if (attempt.length !== correct.length) {
    return { correct: false, firstWrong: -1 };
  }
  for (var i = 0; i < correct.length; i++) {
    if (attempt[i] !== correct[i]) {
      return { correct: false, firstWrong: i };
    }
  }
  return { correct: true, firstWrong: -1 };
}
