/**
 * Major System — mnemonic encoding that maps digits to consonant sounds.
 *
 * The Major System is the backbone of competitive memory. Each digit 0-9 maps
 * to specific consonant sounds. Vowels (a, e, i, o, u) and h, w, y are ignored.
 * By converting digit pairs into words, you turn abstract numbers into vivid images.
 *
 * Table:
 *   0 = s, z, soft-c       ("zero" starts with z)
 *   1 = t, d, th           ("t" has one downstroke)
 *   2 = n                  ("n" has two downstrokes)
 *   3 = m                  ("m" has three downstrokes)
 *   4 = r                  ("four" ends with r)
 *   5 = l                  ("L" is the Roman numeral 50)
 *   6 = j, sh, ch, soft-g  ("J" is a mirror of 6)
 *   7 = k, hard-c, hard-g  ("K" is made of two 7s)
 *   8 = f, v               ("f" in script looks like 8)
 *   9 = p, b               ("p" is a mirror of 9)
 */

export const MAJOR_TABLE = {
  0: { digit: 0, sounds: ['s', 'z'], hint: '"zero" starts with z' },
  1: { digit: 1, sounds: ['t', 'd'], hint: '"t" has one downstroke' },
  2: { digit: 2, sounds: ['n'], hint: '"n" has two downstrokes' },
  3: { digit: 3, sounds: ['m'], hint: '"m" has three downstrokes' },
  4: { digit: 4, sounds: ['r'], hint: '"four" ends with r' },
  5: { digit: 5, sounds: ['l'], hint: '"L" = Roman numeral 50' },
  6: { digit: 6, sounds: ['j', 'sh', 'ch'], hint: '"J" is a mirror of 6' },
  7: { digit: 7, sounds: ['k', 'g'], hint: '"K" = two 7s back to back' },
  8: { digit: 8, sounds: ['f', 'v'], hint: 'Script "f" looks like 8' },
  9: { digit: 9, sounds: ['p', 'b'], hint: '"p" is a mirror of 9' },
};

// Consonant → digit lookup (for decoding words back to digits)
const CONSONANT_TO_DIGIT = {};
for (const [digit, entry] of Object.entries(MAJOR_TABLE)) {
  for (const sound of entry.sounds) {
    CONSONANT_TO_DIGIT[sound] = parseInt(digit);
  }
}

// Letters that are ignored in Major System (vowels + h, w, y)
const IGNORED = new Set(['a', 'e', 'i', 'o', 'u', 'h', 'w', 'y']);

/**
 * Extract the consonant sounds for a digit string.
 * @param {string} digits - e.g. "43"
 * @returns {string[]} consonant sounds for each digit
 */
export function digitsToConsonants(digits) {
  const result = [];
  for (const ch of digits) {
    const d = parseInt(ch);
    if (MAJOR_TABLE[d]) {
      result.push(...MAJOR_TABLE[d].sounds);
    }
  }
  return result;
}

/**
 * Extract Major System consonants from a word.
 * Multi-char sounds (sh, ch, th) are detected first.
 * Handles: silent k in kn-, soft c before e/i/y, hard c otherwise,
 * soft g before e/i/y, double letters collapsed, silent b after m.
 * @param {string} word
 * @returns {number[]} digit sequence
 */
function wordToDigits(word) {
  const w = word.toLowerCase();
  const digits = [];
  let i = 0;
  while (i < w.length) {
    const ch = w[i];
    const next = i + 1 < w.length ? w[i + 1] : '';

    // Skip non-alpha
    if (!/[a-z]/.test(ch)) { i++; continue; }

    // Skip vowels + h, w, y
    if (IGNORED.has(ch)) { i++; continue; }

    // Skip doubled consonants (ll, ss, tt, etc.)
    if (ch === next) { i++; continue; }

    // 2-char sounds
    if (next) {
      const pair = ch + next;
      if (pair === 'sh') { digits.push(6); i += 2; continue; }
      if (pair === 'ch') { digits.push(6); i += 2; continue; }
      if (pair === 'th') { digits.push(1); i += 2; continue; }
      // Silent k before n
      if (pair === 'kn') { digits.push(2); i += 2; continue; }
      // Silent b after m at end of word or before consonant
      if (ch === 'm' && next === 'b') {
        const afterB = i + 2 < w.length ? w[i + 2] : '';
        if (!afterB || !/[aeiou]/.test(afterB)) {
          digits.push(3); i += 2; continue;
        }
      }
    }

    // Handle 'c' — soft before e, i, y; hard otherwise
    if (ch === 'c') {
      if (next === 'e' || next === 'i' || next === 'y') {
        digits.push(0); // soft c = s sound
      } else {
        digits.push(7); // hard c = k sound
      }
      i++; continue;
    }

    // Handle 'g' — soft before e, i, y (but not always reliable, use flag words)
    // For simplicity: g before e/i/y at end or common patterns = soft (6)
    // Otherwise hard (7). This is approximate.
    if (ch === 'g') {
      if ((next === 'e' || next === 'i' || next === 'y') && isLikelySoftG(w, i)) {
        digits.push(6); // soft g = j sound
      } else {
        digits.push(7); // hard g
      }
      i++; continue;
    }

    // Handle 'x' = k+s = 7,0
    if (ch === 'x') {
      digits.push(7);
      digits.push(0);
      i++; continue;
    }

    // Single consonant lookup
    if (CONSONANT_TO_DIGIT[ch] !== undefined) {
      digits.push(CONSONANT_TO_DIGIT[ch]);
    }
    i++;
  }
  return digits;
}

/**
 * Heuristic for soft-g. Words like "cage", "sage", "judge" have soft g.
 * Words like "get", "give", "fog" have hard g.
 * We use position: g at end before 'e' is usually soft.
 */
function isLikelySoftG(word, pos) {
  // ge at end of word = soft (cage, sage, judge)
  if (pos + 2 === word.length && word[pos + 1] === 'e') return true;
  // Common soft-g patterns
  const suffix = word.slice(pos);
  if (suffix.startsWith('ge') && pos + 2 >= word.length - 1) return true;
  return false;
}

/**
 * Check if a word's consonants match a digit string.
 * @param {string} word - e.g. "ram"
 * @param {string} digits - e.g. "43"
 * @returns {boolean}
 */
export function consonantsMatchDigits(word, digits) {
  const wordDigits = wordToDigits(word);
  const expected = digits.split('').map(Number);
  if (wordDigits.length !== expected.length) return false;
  return wordDigits.every((d, i) => d === expected[i]);
}

/**
 * Default word list for 00-99. Each word's consonants match its 2-digit code.
 * These are common, vivid, easy-to-image words.
 * @returns {Object<string, string>}
 */
export function getDefaultWords() {
  return {
    '00': 'says', '01': 'seed', '02': 'sun', '03': 'sum', '04': 'sore',
    '05': 'sail', '06': 'sash', '07': 'ski', '08': 'safe', '09': 'soap',
    '10': 'toss', '11': 'tooth', '12': 'dune', '13': 'dome', '14': 'door',
    '15': 'towel', '16': 'dish', '17': 'dog', '18': 'dove', '19': 'tub',
    '20': 'nose', '21': 'net', '22': 'noun', '23': 'name', '24': 'nero',
    '25': 'nail', '26': 'nacho', '27': 'nag', '28': 'knife', '29': 'knob',
    '30': 'moose', '31': 'mat', '32': 'moon', '33': 'mom', '34': 'mower',
    '35': 'mule', '36': 'mash', '37': 'mug', '38': 'movie', '39': 'map',
    '40': 'rose', '41': 'rat', '42': 'rain', '43': 'ram', '44': 'roar',
    '45': 'rail', '46': 'rash', '47': 'rug', '48': 'roof', '49': 'rope',
    '50': 'lasso', '51': 'lid', '52': 'lion', '53': 'lime', '54': 'lure',
    '55': 'lily', '56': 'leash', '57': 'log', '58': 'leaf', '59': 'lip',
    '60': 'juice', '61': 'jet', '62': 'shin', '63': 'jam', '64': 'jar',
    '65': 'shell', '66': 'shush', '67': 'jug', '68': 'shave', '69': 'jeep',
    '70': 'gas', '71': 'kite', '72': 'gun', '73': 'gum', '74': 'gear',
    '75': 'goal', '76': 'gush', '77': 'gag', '78': 'gaffe', '79': 'gap',
    '80': 'fuzz', '81': 'foot', '82': 'fan', '83': 'foam', '84': 'fire',
    '85': 'foil', '86': 'fish', '87': 'fog', '88': 'fife', '89': 'fib',
    '90': 'bus', '91': 'bat', '92': 'bone', '93': 'beam', '94': 'bear',
    '95': 'bowl', '96': 'bash', '97': 'book', '98': 'beef', '99': 'pipe',
  };
}

/**
 * Encode a digit string into Major System words.
 * Splits into 2-digit pairs and looks up each.
 * @param {string} digits - e.g. "4321"
 * @param {Object<string, string>} wordTable - 00-99 word map
 * @returns {string[]}
 */
export function encodeMajor(digits, wordTable) {
  // Pad to even length
  const padded = digits.length % 2 === 0 ? digits : '0' + digits;
  const result = [];
  for (let i = 0; i < padded.length; i += 2) {
    const pair = padded.slice(i, i + 2);
    result.push(wordTable[pair] || `?${pair}`);
  }
  return result;
}

/**
 * Decode a word back to its digit pair using a reverse lookup.
 * @param {string} word
 * @param {Object<string, string>} reverseMap - word→digits
 * @returns {string|null}
 */
export function decodeMajor(word, reverseMap) {
  return reverseMap[word.toLowerCase()] || null;
}

/**
 * Split a digit string into chunks of a given size (right-aligned).
 * @param {string} digits
 * @param {number} size - chunk size (default 2)
 * @returns {string[]}
 */
export function chunkDigits(digits, size = 2) {
  if (!digits) return [];
  const result = [];
  // Right-align: remainder chunk goes first
  const remainder = digits.length % size;
  let pos = 0;
  if (remainder > 0) {
    result.push(digits.slice(0, remainder));
    pos = remainder;
  }
  while (pos < digits.length) {
    result.push(digits.slice(pos, pos + size));
    pos += size;
  }
  return result;
}
