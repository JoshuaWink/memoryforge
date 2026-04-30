/**
 * Drill generator — produces random sequences for memory training.
 */

const WORD_POOL = [
  'hammer', 'cloud', 'violin', 'castle', 'river', 'basket', 'lantern', 'mirror',
  'ocean', 'bridge', 'candle', 'falcon', 'garden', 'rocket', 'window', 'dragon',
  'forest', 'temple', 'anchor', 'puzzle', 'silver', 'thunder', 'crystal', 'phantom',
  'magnet', 'ribbon', 'shadow', 'beacon', 'copper', 'marble', 'glacier', 'compass',
  'feather', 'chimney', 'orchard', 'tunnel', 'volcano', 'whistle', 'blanket', 'diamond',
  'jacket', 'ladder', 'monkey', 'needle', 'orange', 'pepper', 'rabbit', 'saddle',
  'turtle', 'velvet', 'walnut', 'zipper', 'bottle', 'curtain', 'engine', 'finger',
  'guitar', 'helmet', 'insect', 'jungle', 'kettle', 'lemon', 'mushroom', 'napkin',
];

/**
 * Generate a string of random digits.
 * @param {number} length - Number of digits to generate
 * @returns {string} Random digit string
 */
export function generateDigits(length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

/**
 * Generate a string of random uppercase letters.
 * @param {number} length - Number of letters to generate
 * @returns {string} Random uppercase letter string
 */
export function generateLetters(length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += String.fromCharCode(65 + Math.floor(Math.random() * 26));
  }
  return result;
}

/**
 * Generate an array of random words from the word pool.
 * @param {number} count - Number of words to generate
 * @returns {string[]} Array of random words
 */
export function generateWords(count) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
  }
  return result;
}
