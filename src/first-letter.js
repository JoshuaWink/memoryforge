/**
 * First-letter — generates first-letter hints for verse memorization.
 * The most proven technique for exact wording recall.
 */

/**
 * Extract first letter of each word, preserving punctuation.
 * "For God so loved the world," → "F G s l t w,"
 * @param {string} text
 * @returns {string}
 */
export function toFirstLetters(text) {
  if (!text) return '';
  const words = text.split(/\s+/).filter(Boolean);
  return words.map(word => {
    // Find the first alphanumeric character
    const firstChar = word[0];
    // Find trailing punctuation
    const trailing = word.match(/[.,;:!?'")\]]+$/);
    return firstChar + (trailing ? trailing[0] : '');
  }).join(' ');
}

/**
 * Generate hint showing first letter + underscores for remaining characters.
 * "For God so loved" → "F__ G__ s__ l____"
 * @param {string} text
 * @returns {string}
 */
export function fromFirstLetters(text) {
  if (!text) return '';
  const words = text.split(/\s+/).filter(Boolean);
  return words.map(word => {
    // Separate trailing punctuation
    const trailing = word.match(/[.,;:!?'")\]]+$/);
    const core = trailing ? word.slice(0, -trailing[0].length) : word;
    
    if (core.length <= 1) {
      return word; // Single char word, show as-is (with punctuation)
    }

    const firstChar = core[0];
    const blanks = '_'.repeat(core.length - 1);
    return firstChar + blanks + (trailing ? trailing[0] : '');
  }).join(' ');
}
