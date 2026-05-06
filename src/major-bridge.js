/**
 * Major System Bridge — connects peg systems to Major System sounds.
 *
 * Users who already know Number-Shape (1=candle) or Number-Rhyme (1=bun)
 * struggle to make the leap to Major System consonant mappings (1=t,d).
 * The bridge provides a vivid mnemonic story for each digit that links
 * ALL THREE systems together, so the familiar image anchors the new sound.
 */

/**
 * Bridge map: for each digit, the peg image + rhyme + Major sound + bridging story.
 * Stories are designed so the Major System consonant is emphasized naturally.
 */
export const BRIDGE_MAP = {
  0: {
    shape: 'ball',
    rhyme: 'hero',
    sounds: 's, z',
    bridge: 'The hero Spins a ball so fast it goes Zoom — hear the S and Z? Zero starts with Z.',
  },
  1: {
    shape: 'candle',
    rhyme: 'bun',
    sounds: 't, d',
    bridge: 'A candle Topples onto a bun, Denting it flat. T and D — a "t" has one downstroke, just like the digit 1.',
  },
  2: {
    shape: 'swan',
    rhyme: 'shoe',
    sounds: 'n',
    bridge: 'A swan with a long Neck Nudges your shoe across the pond. N — "n" has two downstrokes like the number 2.',
  },
  3: {
    shape: 'handcuffs',
    rhyme: 'tree',
    sounds: 'm',
    bridge: 'Handcuffs claMP shut around a tree branch — that Metal clank echoes. M — "m" has three humps like the number 3.',
  },
  4: {
    shape: 'sailboat',
    rhyme: 'door',
    sounds: 'r',
    bridge: 'A sailboat Rams Right through a door — CRASH! R — "fouR" ends with R.',
  },
  5: {
    shape: 'seahorse',
    rhyme: 'hive',
    sounds: 'l',
    bridge: 'A seahorse Leaps out of a beehive, Landing gracefully. L — "L" is the Roman numeral for 50.',
  },
  6: {
    shape: 'elephant',
    rhyme: 'sticks',
    sounds: 'j, sh, ch',
    bridge: 'An elephant Shakes a bundle of sticks, they Chop and Jostle apart. J, SH, CH — a "J" is a mirror image of 6.',
  },
  7: {
    shape: 'cliff',
    rhyme: 'heaven',
    sounds: 'k, g',
    bridge: 'A Kite Gets caught on a cliff edge, soaring up toward heaven. K and hard G — two 7s back-to-back form a K.',
  },
  8: {
    shape: 'snowman',
    rhyme: 'gate',
    sounds: 'f, v',
    bridge: 'A snowman Falls through a gate and Vaults over the fence. F and V — a cursive "f" loops like an 8.',
  },
  9: {
    shape: 'balloon',
    rhyme: 'vine',
    sounds: 'p, b',
    bridge: 'A Balloon Pops on a thorny vine — Bang! P and B — "P" is a mirror image of 9.',
  },
};

/**
 * Get bridge entry for a digit.
 * @param {number} digit 0-9
 * @returns {Object|undefined}
 */
export function getBridge(digit) {
  return BRIDGE_MAP[digit];
}

/**
 * Get just the bridge story for a digit.
 * @param {number} digit 0-9
 * @returns {string|undefined}
 */
export function getBridgeStory(digit) {
  const b = BRIDGE_MAP[digit];
  return b ? b.bridge : undefined;
}
