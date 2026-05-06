/**
 * MemoryForge — Browser app entry point.
 * All modules inlined (no build step) for GitHub Pages.
 */

// ═══════════════════════════════════════════════════════════════════
//  INLINE: drill-generator
// ═══════════════════════════════════════════════════════════════════
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

function generateDigits(length) {
  let r = '';
  for (let i = 0; i < length; i++) r += Math.floor(Math.random() * 10).toString();
  return r;
}

function generateLetters(length) {
  let r = '';
  for (let i = 0; i < length; i++) r += String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return r;
}

function generateWords(count) {
  const r = [];
  for (let i = 0; i < count; i++) r.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
  return r;
}

// ═══════════════════════════════════════════════════════════════════
//  INLINE: scoring
// ═══════════════════════════════════════════════════════════════════
function scoreExact(original, answer) {
  if (original.length === 0 && answer.length === 0) return 100;
  if (original.length === 0) return 100;
  if (answer.length === 0) return 0;
  let correct = 0;
  for (let i = 0; i < original.length; i++) {
    if (i < answer.length && answer[i] === original[i]) correct++;
  }
  return Math.round((correct / original.length) * 100);
}

function scoreText(original, answer) {
  const origWords = original.trim() === '' ? [] : original.trim().toLowerCase().split(/\s+/);
  const ansWords = answer.trim() === '' ? [] : answer.trim().toLowerCase().split(/\s+/);
  if (origWords.length === 0 && ansWords.length === 0) return { score: 100, correct: [], missing: [], wrong: [] };
  if (origWords.length === 0) return { score: 100, correct: [], missing: [], wrong: [] };
  if (ansWords.length === 0) return { score: 0, correct: [], missing: [...origWords], wrong: [] };

  const correct = [], missing = [], wrong = [];
  const ansUsed = new Array(ansWords.length).fill(false);
  for (let i = 0; i < origWords.length; i++) {
    if (i < ansWords.length && ansWords[i] === origWords[i]) {
      correct.push(origWords[i]);
      ansUsed[i] = true;
    } else {
      missing.push(origWords[i]);
    }
  }
  for (let i = 0; i < ansWords.length; i++) {
    if (!ansUsed[i]) wrong.push(ansWords[i]);
  }
  const score = origWords.length > 0 ? Math.round((correct.length / origWords.length) * 100) : 100;
  return { score, correct, missing, wrong };
}

// ═══════════════════════════════════════════════════════════════════
//  INLINE: major-system
// ═══════════════════════════════════════════════════════════════════
const MAJOR_TABLE = {
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

const CONSONANT_TO_DIGIT = {};
for (const [digit, entry] of Object.entries(MAJOR_TABLE)) {
  for (const sound of entry.sounds) {
    CONSONANT_TO_DIGIT[sound] = parseInt(digit);
  }
}

const IGNORED_LETTERS = new Set(['a', 'e', 'i', 'o', 'u', 'h', 'w', 'y']);

function wordToDigits(word) {
  const w = word.toLowerCase();
  const digits = [];
  let i = 0;
  while (i < w.length) {
    const ch = w[i];
    const next = i + 1 < w.length ? w[i + 1] : '';
    if (!/[a-z]/.test(ch)) { i++; continue; }
    if (IGNORED_LETTERS.has(ch)) { i++; continue; }
    if (ch === next) { i++; continue; }
    if (next) {
      const pair = ch + next;
      if (pair === 'sh') { digits.push(6); i += 2; continue; }
      if (pair === 'ch') { digits.push(6); i += 2; continue; }
      if (pair === 'th') { digits.push(1); i += 2; continue; }
      if (pair === 'kn') { digits.push(2); i += 2; continue; }
      if (ch === 'm' && next === 'b') {
        const afterB = i + 2 < w.length ? w[i + 2] : '';
        if (!afterB || !/[aeiou]/.test(afterB)) {
          digits.push(3); i += 2; continue;
        }
      }
    }
    if (ch === 'c') {
      if (next === 'e' || next === 'i' || next === 'y') {
        digits.push(0);
      } else {
        digits.push(7);
      }
      i++; continue;
    }
    if (ch === 'g') {
      if ((next === 'e' || next === 'i' || next === 'y') && isLikelySoftG(w, i)) {
        digits.push(6);
      } else {
        digits.push(7);
      }
      i++; continue;
    }
    if (ch === 'x') { digits.push(7); digits.push(0); i++; continue; }
    if (CONSONANT_TO_DIGIT[ch] !== undefined) {
      digits.push(CONSONANT_TO_DIGIT[ch]);
    }
    i++;
  }
  return digits;
}

function isLikelySoftG(word, pos) {
  if (pos + 2 === word.length && word[pos + 1] === 'e') return true;
  const suffix = word.slice(pos);
  if (suffix.startsWith('ge') && pos + 2 >= word.length - 1) return true;
  return false;
}

function consonantsMatchDigits(word, digits) {
  const wd = wordToDigits(word);
  const expected = digits.split('').map(Number);
  if (wd.length !== expected.length) return false;
  return wd.every((d, i) => d === expected[i]);
}

function getDefaultWords() {
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

function encodeMajor(digits, wordTable) {
  const padded = digits.length % 2 === 0 ? digits : '0' + digits;
  const result = [];
  for (let i = 0; i < padded.length; i += 2) {
    const pair = padded.slice(i, i + 2);
    result.push(wordTable[pair] || `?${pair}`);
  }
  return result;
}

function chunkDigits(digits, size) {
  if (!digits) return [];
  const result = [];
  const remainder = digits.length % size;
  let pos = 0;
  if (remainder > 0) { result.push(digits.slice(0, remainder)); pos = remainder; }
  while (pos < digits.length) { result.push(digits.slice(pos, pos + size)); pos += size; }
  return result;
}

// ═══════════════════════════════════════════════════════════════════
//  INLINE: mnemonic-systems
// ═══════════════════════════════════════════════════════════════════
const NUMBER_SHAPE = {
  0: { shape: 'ball/ring', image: 'A round ball or hoop', digit: 0 },
  1: { shape: 'candle/pole', image: 'A tall candle with a flame', digit: 1 },
  2: { shape: 'swan', image: 'A graceful swan on water', digit: 2 },
  3: { shape: 'handcuffs/heart', image: 'A pair of handcuffs or a sideways heart', digit: 3 },
  4: { shape: 'sailboat', image: 'A sailboat on the ocean', digit: 4 },
  5: { shape: 'hook/seahorse', image: 'A fishing hook or seahorse', digit: 5 },
  6: { shape: 'elephant trunk/cherry', image: 'An elephant trunk curling down, or a cherry', digit: 6 },
  7: { shape: 'cliff/boomerang', image: 'A cliff edge or a boomerang', digit: 7 },
  8: { shape: 'snowman/hourglass', image: 'A snowman with two round sections', digit: 8 },
  9: { shape: 'balloon on string/tadpole', image: 'A balloon floating on a string', digit: 9 },
};

const NUMBER_RHYME = {
  0: { rhyme: 'hero', digit: 0 },
  1: { rhyme: 'bun', digit: 1 },
  2: { rhyme: 'shoe', digit: 2 },
  3: { rhyme: 'tree', digit: 3 },
  4: { rhyme: 'door', digit: 4 },
  5: { rhyme: 'hive', digit: 5 },
  6: { rhyme: 'sticks', digit: 6 },
  7: { rhyme: 'heaven', digit: 7 },
  8: { rhyme: 'gate', digit: 8 },
  9: { rhyme: 'vine', digit: 9 },
};

function getPegList() {
  const words = getDefaultWords();
  const pegs = [];
  for (let i = 0; i < 100; i++) {
    const key = i.toString().padStart(2, '0');
    pegs.push({ index: i, word: words[key] || `peg-${i}` });
  }
  return pegs;
}

const TECHNIQUE_INSTRUCTIONS = {
  chunking: {
    name: 'Chunking', level: 0,
    description: 'Group digits into smaller chunks (like phone numbers) to reduce cognitive load.',
    instructions: `<h3>Chunking</h3>
<p>The simplest memory technique — you already use it for phone numbers.</p>
<p><strong>How it works:</strong> Instead of remembering 9162020558 as ten separate digits, you chunk it: 916-202-0558. Your brain treats each chunk as one unit.</p>
<h4>Practice Progression</h4>
<ol>
<li>Start with chunk size 2 (pairs): 91 62 02 05 58</li>
<li>Move to chunk size 3 (triples): 916 202 055 8</li>
<li>Try chunk size 4: 9162 0205 58</li>
</ol>
<h4>Tips</h4>
<ul>
<li>Find patterns within chunks (91 = year? 202 = area code?)</li>
<li>Say chunks rhythmically in your head</li>
<li>The "recall delay" timer is your friend — use it to rehearse chunks silently</li>
</ul>`,
  },
  'number-shape': {
    name: 'Number-Shape', level: 0,
    description: 'Each digit 0-9 looks like a physical shape. Visualize to remember.',
    instructions: `<h3>Number-Shape System</h3>
<p>Each digit looks like something physical. Visualize the shapes to remember digits.</p>
<table class="ref-table">
<tr><th>Digit</th><th>Shape</th><th>Why</th></tr>
<tr><td>0</td><td>Ball/Ring</td><td>Round like a zero</td></tr>
<tr><td>1</td><td>Candle</td><td>Tall and thin</td></tr>
<tr><td>2</td><td>Swan</td><td>The curved neck</td></tr>
<tr><td>3</td><td>Handcuffs</td><td>Two bumps</td></tr>
<tr><td>4</td><td>Sailboat</td><td>The triangular sail</td></tr>
<tr><td>5</td><td>Seahorse</td><td>The curved body</td></tr>
<tr><td>6</td><td>Elephant trunk</td><td>The curling shape</td></tr>
<tr><td>7</td><td>Cliff</td><td>The angular edge</td></tr>
<tr><td>8</td><td>Snowman</td><td>Two circles stacked</td></tr>
<tr><td>9</td><td>Balloon on string</td><td>Round top, thin line</td></tr>
</table>
<h4>Practice</h4>
<ol>
<li>Learn the 10 shapes (use the "Learn" drill)</li>
<li>When you see digits, instantly picture the shapes</li>
<li>Chain shapes into a scene: 2-8-4 = a swan on a snowman in a sailboat</li>
</ol>`,
  },
  'number-rhyme': {
    name: 'Number-Rhyme', level: 0,
    description: 'Each digit rhymes with a word. An alternative peg system.',
    instructions: `<h3>Number-Rhyme System</h3>
<p>Each number word rhymes with a concrete, vivid word.</p>
<table class="ref-table">
<tr><th>Digit</th><th>Rhymes With</th></tr>
<tr><td>0 (zero)</td><td>Hero</td></tr>
<tr><td>1 (one)</td><td>Bun</td></tr>
<tr><td>2 (two)</td><td>Shoe</td></tr>
<tr><td>3 (three)</td><td>Tree</td></tr>
<tr><td>4 (four)</td><td>Door</td></tr>
<tr><td>5 (five)</td><td>Hive</td></tr>
<tr><td>6 (six)</td><td>Sticks</td></tr>
<tr><td>7 (seven)</td><td>Heaven</td></tr>
<tr><td>8 (eight)</td><td>Gate</td></tr>
<tr><td>9 (nine)</td><td>Vine</td></tr>
</table>
<h4>Practice</h4>
<ol>
<li>Learn the 10 rhyme words (use the "Learn" drill)</li>
<li>For 3-1-7, picture: a tree with a bun hanging from it in heaven</li>
<li>Make images interact — the more absurd, the more memorable</li>
</ol>`,
  },
  major: {
    name: 'Major System', level: 1,
    description: 'The backbone of competitive memory. Digits → consonant sounds → words.',
    instructions: `<h3>The Major System</h3>
<p>The single most important technique in memory athletics. Each digit maps to consonant sounds. Vowels are free.</p>
<table class="ref-table">
<tr><th>Digit</th><th>Sounds</th><th>Memory Aid</th></tr>
<tr><td>0</td><td>s, z</td><td>"<strong>z</strong>ero"</td></tr>
<tr><td>1</td><td>t, d</td><td>"<strong>t</strong>" has 1 downstroke</td></tr>
<tr><td>2</td><td>n</td><td>"<strong>n</strong>" has 2 downstrokes</td></tr>
<tr><td>3</td><td>m</td><td>"<strong>m</strong>" has 3 downstrokes</td></tr>
<tr><td>4</td><td>r</td><td>"fou<strong>r</strong>"</td></tr>
<tr><td>5</td><td>l</td><td><strong>L</strong> = Roman 50</td></tr>
<tr><td>6</td><td>j, sh, ch</td><td>"<strong>J</strong>" mirrors 6</td></tr>
<tr><td>7</td><td>k, g (hard)</td><td><strong>K</strong> = two 7s</td></tr>
<tr><td>8</td><td>f, v</td><td>script <strong>f</strong> looks like 8</td></tr>
<tr><td>9</td><td>p, b</td><td>"<strong>p</strong>" mirrors 9</td></tr>
</table>
<h4>Examples</h4>
<ul>
<li>43 → r, m → "ram" 🐏</li>
<li>21 → n, t → "net" 🥅</li>
<li>95 → b, l → "bowl" 🥣</li>
</ul>
<h4>Practice Progression</h4>
<ol>
<li><strong>Learn the table</strong> — drill until instant</li>
<li><strong>Encode drills</strong> — see digits, type the word</li>
<li><strong>Decode drills</strong> — see word, type the digits</li>
<li><strong>Full recall</strong> — use Major words to remember long sequences</li>
</ol>`,
  },
  linking: {
    name: 'Linking / Story', level: 1,
    description: 'Chain items into a vivid narrative for ordered recall.',
    instructions: `<h3>The Linking Method</h3>
<p>Connect items into a chain of vivid, often absurd mental images.</p>
<h4>Example</h4>
<p>Items: hammer, cloud, violin, castle</p>
<p>Story: A giant <strong>hammer</strong> smashes through a <strong>cloud</strong>, which rains on a <strong>violin</strong> playing on top of a <strong>castle</strong>.</p>
<h4>Rules for Strong Links</h4>
<ol>
<li><strong>Make it vivid</strong> — exaggerate size, color, sound</li>
<li><strong>Make it absurd</strong> — the stranger, the stickier</li>
<li><strong>Make items interact</strong> — they must touch, crash, transform</li>
<li><strong>Use your senses</strong> — hear the crash, feel the rain</li>
</ol>
<h4>Practice in MemoryForge</h4>
<ol>
<li>Use "Words" drill type</li>
<li>Set a recall delay (3-5 seconds)</li>
<li>During the delay, build your story chain</li>
<li>Recall the words in order</li>
</ol>`,
  },
  peg: {
    name: 'Peg System', level: 1,
    description: '100 permanent anchor words for ordered recall.',
    instructions: `<h3>The Peg System</h3>
<p>100 permanent mental "hooks" to hang information on (from the Major System).</p>
<h4>How It Works</h4>
<ol>
<li>Each number 00-99 has a permanent peg word</li>
<li>To memorize a list: associate item #1 with peg #1, item #2 with peg #2, etc.</li>
</ol>
<h4>Example (shopping list)</h4>
<ul>
<li>Peg 01 = "seed" → Imagine seeds growing into milk cartons (item: milk)</li>
<li>Peg 02 = "sun" → The sun is made of bread (item: bread)</li>
<li>Peg 03 = "sum" → Adding up a pile of eggs (item: eggs)</li>
</ul>
<h4>Practice Progression</h4>
<ol>
<li>Learn pegs 01-20 first</li>
<li>Expand to 01-50</li>
<li>Eventually know all 100</li>
</ol>`,
  },
  pao: {
    name: 'PAO System', level: 2,
    description: 'Person-Action-Object — compress 6 digits into one vivid image.',
    instructions: `<h3>PAO (Person-Action-Object)</h3>
<p>The most powerful digit encoding system used by memory champions.</p>
<h4>How It Works</h4>
<p>Each number 00-99 has three associations:</p>
<ul>
<li><strong>Person</strong> — a famous or memorable character</li>
<li><strong>Action</strong> — what that person is doing</li>
<li><strong>Object</strong> — what they're using</li>
</ul>
<h4>The Magic: Compression</h4>
<p>For 6 digits like 003207:</p>
<ul>
<li>00 = Superman (Person)</li>
<li>32 = dunking (Action from #32)</li>
<li>07 = gun (Object from #07)</li>
</ul>
<p>→ "Superman dunking a gun" — ONE image for SIX digits!</p>
<h4>Building Your Table</h4>
<ul>
<li>Use people you know well (celebrities, family, characters)</li>
<li>Actions should be distinctive and physical</li>
<li>Objects should be concrete and visible</li>
</ul>
<p><strong>This is the endgame technique.</strong> Memory champions who memorize 500+ digits use PAO.</p>`,
  },
};

// ═══════════════════════════════════════════════════════════════════
//  INLINE: stats
// ═══════════════════════════════════════════════════════════════════
function computeStats(drills) {
  if (drills.length === 0) return {
    totalDrills: 0, averageScore: 0, bestScore: 0,
    byType: {}, byTechnique: {}, byMode: {},
    today: { count: 0, avgScore: 0 },
  };
  const totalDrills = drills.length;
  const totalScore = drills.reduce((s, d) => s + d.score, 0);
  const averageScore = Math.round(totalScore / totalDrills);
  const bestScore = Math.max(...drills.map(d => d.score));

  function groupBy(field, fallback) {
    const map = {};
    for (const d of drills) {
      const key = d[field] || fallback;
      if (!map[key]) map[key] = { count: 0, totalScore: 0, bestScore: 0 };
      map[key].count++;
      map[key].totalScore += d.score;
      if (d.score > map[key].bestScore) map[key].bestScore = d.score;
    }
    for (const k of Object.keys(map)) {
      map[k].avgScore = Math.round(map[k].totalScore / map[k].count);
      delete map[k].totalScore;
    }
    return map;
  }

  const byType = groupBy('type', 'unknown');
  const byTechnique = groupBy('technique', 'none');
  const byMode = groupBy('drillMode', 'recall');

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayDrills = drills.filter(d => d.timestamp >= todayStart.getTime());
  const today = {
    count: todayDrills.length,
    avgScore: todayDrills.length > 0
      ? Math.round(todayDrills.reduce((s, d) => s + d.score, 0) / todayDrills.length) : 0,
  };
  return { totalDrills, averageScore, bestScore, byType, byTechnique, byMode, today };
}

// ═══════════════════════════════════════════════════════════════════
//  IndexedDB Store
// ═══════════════════════════════════════════════════════════════════
const DB_NAME = 'memoryforge';
const DB_VERSION = 1;
const STORE_NAME = 'drills';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbSave(result) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(result);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbExport() {
  const drills = await dbGetAll();
  return {
    version: 1,
    exported: new Date().toISOString().slice(0, 10),
    app: 'memoryforge',
    data: { drills },
  };
}

async function dbImport(blob, opts = {}) {
  if (!blob || blob.version !== 1) throw new Error('Unsupported file version');
  if (!opts.merge) await dbClear();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const d of blob.data.drills) {
      const clean = { ...d };
      delete clean.id;
      store.add(clean);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ═══════════════════════════════════════════════════════════════════
//  App Controller
// ═══════════════════════════════════════════════════════════════════
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let currentMaterial = null;
let currentConfig = null;
let currentDrillMode = 'recall';
let currentExpectedAnswer = null; // for decode mode
let timerInterval = null;
const majorWords = getDefaultWords();

// ── Navigation (with history for Android back button) ──
let currentView = 'drill';
let currentPanel = 'config'; // drill sub-panel: config|present|recall|score

function navigateTo(view, { pushState = true } = {}) {
  $$('.nav-btn').forEach(b => b.classList.remove('active'));
  $$('.nav-btn').forEach(b => { if (b.dataset.view === view) b.classList.add('active'); });
  $$('.view').forEach(v => v.classList.remove('active'));
  $(`#view-${view}`).classList.add('active');
  currentView = view;
  if (pushState) history.pushState({ view, panel: 'config' }, '', `#${view}`);
  if (view === 'stats') refreshStats();
}

$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.view));
});

// Handle Android back button / browser back
window.addEventListener('popstate', (e) => {
  if (e.state && e.state.view) {
    navigateTo(e.state.view, { pushState: false });
    if (e.state.view === 'drill' && e.state.panel) {
      showPanel(e.state.panel);
    }
    if (e.state.view === 'learn') {
      // If popping back to a state without a learn sub-panel, reset to grid
      const learnPanels = ['detail', 'major-table', 'peg-list', 'trainer'];
      if (!learnPanels.includes(e.state.panel)) {
        returnToLearnGrid();
      }
    }
  } else {
    // No more history — go to drill config (prevents app close on first back)
    navigateTo('drill', { pushState: false });
    showPanel('config');
  }
});

// Replace initial state so first back doesn't exit
history.replaceState({ view: 'drill', panel: 'config' }, '', '#drill');

// ── Config toggles ──
$('#drill-mode').addEventListener('change', updateConfigVisibility);
$('#drill-type').addEventListener('change', updateConfigVisibility);
$('#drill-technique').addEventListener('change', updateConfigVisibility);

function updateConfigVisibility() {
  const mode = $('#drill-mode').value;
  const type = $('#drill-type').value;
  const technique = $('#drill-technique').value;

  // Encode/decode force digits type
  if (mode === 'encode' || mode === 'decode') {
    $('#type-group').style.display = 'none';
    $('#drill-type').value = 'digits';
    $('#custom-text-group').style.display = 'none';
    $('#length-group').style.display = '';
    $('#technique-group').style.display = 'none';
    $('#chunk-group').style.display = 'none';
    $('#exposure-group').style.display = mode === 'encode' ? '' : '';
    return;
  }

  // Recall mode
  $('#type-group').style.display = '';
  $('#technique-group').style.display = '';
  $('#exposure-group').style.display = '';

  const isText = type === 'text';
  $('#length-group').style.display = isText ? 'none' : '';
  $('#custom-text-group').style.display = isText ? '' : 'none';

  // Show chunk size only when technique is chunking
  $('#chunk-group').style.display = technique === 'chunking' ? '' : 'none';
}

// ── Start Drill ──
$('#btn-start').addEventListener('click', () => {
  const mode = $('#drill-mode').value;
  currentDrillMode = mode;

  if (mode === 'encode') return startEncodeDrill();
  if (mode === 'decode') return startDecodeDrill();
  startRecallDrill();
});

function startRecallDrill() {
  const type = $('#drill-type').value;
  const length = parseInt($('#drill-length').value, 10);
  const exposureSec = parseInt($('#exposure-time').value, 10);
  const technique = $('#drill-technique').value;
  const chunkSize = technique === 'chunking' ? parseInt($('#chunk-size').value, 10) : 0;

  if (type === 'text') {
    const text = $('#custom-text').value.trim();
    if (!text) { alert('Paste some text to memorize.'); return; }
    currentMaterial = text;
    currentConfig = { type: 'text', length: text.split(/\s+/).length, exposureMs: exposureSec * 1000, technique, chunkSize };
  } else {
    currentConfig = { type, length, exposureMs: exposureSec * 1000, technique, chunkSize };
    switch (type) {
      case 'digits': currentMaterial = generateDigits(length); break;
      case 'letters': currentMaterial = generateLetters(length); break;
      case 'words': currentMaterial = generateWords(length).join(' '); break;
    }
  }

  currentExpectedAnswer = null;
  showPanel('present');
  displayMaterial(currentMaterial, type, technique, chunkSize);
  showTechniqueHint(technique);
  showRefCard(technique, type);
  startTimer(exposureSec);
}

function startEncodeDrill() {
  const length = parseInt($('#drill-length').value, 10) || 2;
  const exposureSec = parseInt($('#exposure-time').value, 10);
  const digits = generateDigits(length);
  currentMaterial = digits;
  currentConfig = { type: 'digits', length, exposureMs: exposureSec * 1000, technique: 'major', chunkSize: 0 };
  currentExpectedAnswer = null; // checked via consonantsMatchDigits

  showPanel('present');
  displayMaterial(digits, 'digits', 'major', 2); // show in pairs for major
  showTechniqueHint('major');
  showRefCard('major', 'digits');
  startTimer(exposureSec);
}

function startDecodeDrill() {
  const length = parseInt($('#drill-length').value, 10) || 2;
  const exposureSec = parseInt($('#exposure-time').value, 10);
  const digits = generateDigits(length);
  const padded = digits.length % 2 === 0 ? digits : '0' + digits;
  const words = encodeMajor(padded, majorWords);

  currentMaterial = words.join(' '); // display words
  currentConfig = { type: 'digits', length, exposureMs: exposureSec * 1000, technique: 'major', chunkSize: 0 };
  currentExpectedAnswer = digits;

  showPanel('present');
  displayMaterial(currentMaterial, 'words', 'major', 0);
  showTechniqueHint('major');
  showRefCard('major', 'digits');
  startTimer(exposureSec);
}

function displayMaterial(material, type, technique, chunkSize) {
  const display = $('#material-display');
  const isText = type === 'text' || type === 'words';

  // Chunked display for digits
  if (type === 'digits' && chunkSize > 0) {
    const chunks = chunkDigits(material, chunkSize);
    display.innerHTML = chunks.map(c => `<span class="digit-chunk">${escapeHtml(c)}</span>`).join(' ');
  } else {
    display.textContent = material;
  }

  display.classList.toggle('text-mode', isText);
}

function showTechniqueHint(technique) {
  const hintEl = $('#technique-hint');
  const hints = {
    'none': '',
    'chunking': '💡 Read the chunks rhythmically. Group them in your mind.',
    'number-shape': '💡 Picture the shape of each digit. Build a visual scene.',
    'number-rhyme': '💡 Think of the rhyme word for each digit. Chain them together.',
    'major': '💡 Convert digit pairs to consonants, then to words. Visualize each word.',
    'linking': '💡 Create a vivid, absurd story connecting each item.',
  };

  if (hints[technique]) {
    hintEl.textContent = hints[technique];
    hintEl.style.display = '';
  } else {
    hintEl.style.display = 'none';
  }
}

function showRefCard(technique, type) {
  const container = $('#ref-card-container');
  const card = $('#ref-card');

  if (technique === 'major' && type === 'digits') {
    container.style.display = '';
    card.innerHTML = buildMajorRefCard();
    card.style.display = 'none'; // collapsed by default
  } else if (technique === 'number-shape') {
    container.style.display = '';
    card.innerHTML = buildNumberShapeRefCard();
    card.style.display = 'none';
  } else if (technique === 'number-rhyme') {
    container.style.display = '';
    card.innerHTML = buildNumberRhymeRefCard();
    card.style.display = 'none';
  } else {
    container.style.display = 'none';
  }
}

function buildMajorRefCard() {
  let html = '<table class="ref-table"><tr><th>Digit</th><th>Sounds</th><th>Hint</th></tr>';
  for (let d = 0; d <= 9; d++) {
    const e = MAJOR_TABLE[d];
    html += `<tr><td>${d}</td><td>${e.sounds.join(', ')}</td><td>${e.hint}</td></tr>`;
  }
  return html + '</table>';
}

function buildNumberShapeRefCard() {
  let html = '<table class="ref-table"><tr><th>Digit</th><th>Shape</th></tr>';
  for (let d = 0; d <= 9; d++) {
    html += `<tr><td>${d}</td><td>${NUMBER_SHAPE[d].shape}</td></tr>`;
  }
  return html + '</table>';
}

function buildNumberRhymeRefCard() {
  let html = '<table class="ref-table"><tr><th>Digit</th><th>Rhyme</th></tr>';
  for (let d = 0; d <= 9; d++) {
    html += `<tr><td>${d}</td><td>${NUMBER_RHYME[d].rhyme}</td></tr>`;
  }
  return html + '</table>';
}

// Reference card toggle
$('#btn-ref-toggle').addEventListener('click', () => {
  const card = $('#ref-card');
  const btn = $('#btn-ref-toggle');
  if (card.style.display === 'none') {
    card.style.display = '';
    btn.textContent = 'Hide Reference Card';
  } else {
    card.style.display = 'none';
    btn.textContent = 'Show Reference Card';
  }
});

function startTimer(exposureSec) {
  if (exposureSec > 0) {
    const fill = $('#timer-fill');
    const startTime = Date.now();
    const duration = exposureSec * 1000;
    fill.style.width = '100%';
    timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 1 - elapsed / duration) * 100;
      fill.style.width = pct + '%';
      if (elapsed >= duration) {
        clearInterval(timerInterval);
        hideAndRecall();
      }
    }, 50);
  } else {
    $('#timer-fill').style.width = '0%';
  }
}

// ── I've Got It ──
$('#btn-hide').addEventListener('click', () => {
  clearInterval(timerInterval);
  hideAndRecall();
});

function hideAndRecall() {
  showPanel('recall');
  const input = $('#recall-input');
  input.value = '';

  // Set input mode and placeholder
  if (currentDrillMode === 'encode') {
    input.setAttribute('inputmode', 'text');
    input.removeAttribute('pattern');
    input.placeholder = 'Type the Major System word(s)...';
    $('#recall-title').textContent = 'Encode — Type the Word';
  } else if (currentDrillMode === 'decode') {
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('pattern', '[0-9]*');
    input.placeholder = 'Type the digits...';
    $('#recall-title').textContent = 'Decode — Type the Digits';
  } else {
    // recall
    if (currentConfig.type === 'digits') {
      input.setAttribute('inputmode', 'numeric');
      input.setAttribute('pattern', '[0-9]*');
    } else {
      input.setAttribute('inputmode', 'text');
      input.removeAttribute('pattern');
    }
    input.placeholder = 'Type what you remember...';
    $('#recall-title').textContent = 'Recall';
  }

  const delaySec = parseInt($('#recall-delay').value, 10) || 0;

  if (delaySec > 0) {
    const overlay = $('#recall-delay-overlay');
    const countEl = $('#recall-delay-count');
    const msgEl = $('#recall-delay-msg');
    input.disabled = true;
    overlay.style.display = '';
    countEl.textContent = delaySec;

    // Show technique-specific delay message
    const tech = currentConfig.technique || 'none';
    const msgs = {
      'none': 'Hold it in memory...',
      'chunking': 'Rehearse the chunks silently...',
      'number-shape': 'Visualize the shapes in your scene...',
      'number-rhyme': 'Picture the rhyme images interacting...',
      'major': 'Lock in your Major System images...',
      'linking': 'Play through your story one more time...',
    };
    msgEl.textContent = msgs[tech] || 'Hold it in memory...';

    let remaining = delaySec;
    const delayTimer = setInterval(() => {
      remaining--;
      countEl.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(delayTimer);
        overlay.style.display = 'none';
        input.disabled = false;
        input.focus();
      }
    }, 1000);
  } else {
    $('#recall-delay-overlay').style.display = 'none';
    input.disabled = false;
    input.focus();
  }
}

// ── Submit Answer ──
$('#btn-submit').addEventListener('click', submitAnswer);
$('#recall-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitAnswer();
  }
});

async function submitAnswer() {
  const answer = $('#recall-input').value;
  let score, diffHtml;

  if (currentDrillMode === 'encode') {
    // Check if the word's consonants match the digits
    score = consonantsMatchDigits(answer.trim(), currentMaterial) ? 100 : 0;
    const expected = encodeMajor(currentMaterial, majorWords).join(' ');
    diffHtml = `<div><strong>Digits:</strong> ${escapeHtml(currentMaterial)}</div>
      <div><strong>Default word:</strong> ${escapeHtml(expected)}</div>
      <div><strong>Your word:</strong> <span class="${score === 100 ? 'diff-correct' : 'diff-wrong'}">${escapeHtml(answer)}</span></div>
      <div>${score === 100 ? '✅ Consonants match!' : '❌ Consonants don\'t match the digits.'}</div>`;
  } else if (currentDrillMode === 'decode') {
    score = answer.trim() === currentExpectedAnswer ? 100 : 0;
    diffHtml = `<div><strong>Word:</strong> ${escapeHtml(currentMaterial)}</div>
      <div><strong>Expected digits:</strong> ${escapeHtml(currentExpectedAnswer)}</div>
      <div><strong>Your digits:</strong> <span class="${score === 100 ? 'diff-correct' : 'diff-wrong'}">${escapeHtml(answer)}</span></div>`;
  } else {
    // Standard recall
    if (currentConfig.type === 'words' || currentConfig.type === 'text') {
      const result = scoreText(currentMaterial, answer);
      score = result.score;
      diffHtml = buildTextDiff(currentMaterial, answer);
    } else {
      score = scoreExact(currentMaterial, answer);
      diffHtml = buildCharDiff(currentMaterial, answer);
    }
  }

  showPanel('score');
  const circle = $('#score-circle');
  $('#score-value').textContent = score;
  circle.className = 'score-circle ' + (score === 100 ? 'perfect' : score >= 80 ? 'good' : score >= 50 ? 'ok' : 'bad');
  $('#score-diff').innerHTML = diffHtml;

  const drillResult = {
    type: currentConfig.type,
    length: currentConfig.length,
    material: currentMaterial,
    answer,
    score,
    timestamp: Date.now(),
    technique: currentConfig.technique || 'none',
    drillMode: currentDrillMode,
  };
  try { await dbSave(drillResult); } catch (e) { console.error('Failed to save:', e); }
}

function buildCharDiff(original, answer) {
  let html = '<div><strong>Expected:</strong></div><div>';
  for (let i = 0; i < original.length; i++) {
    if (i < answer.length && answer[i] === original[i]) {
      html += `<span class="diff-correct">${escapeHtml(original[i])}</span>`;
    } else {
      html += `<span class="diff-missing">${escapeHtml(original[i])}</span>`;
    }
  }
  html += '</div>';
  if (answer.length > 0) {
    html += '<div style="margin-top:8px"><strong>Your answer:</strong></div><div>';
    for (let i = 0; i < answer.length; i++) {
      if (i < original.length && answer[i] === original[i]) {
        html += `<span class="diff-correct">${escapeHtml(answer[i])}</span>`;
      } else {
        html += `<span class="diff-wrong">${escapeHtml(answer[i])}</span>`;
      }
    }
    html += '</div>';
  }
  return html;
}

function buildTextDiff(original, answer) {
  const origWords = original.trim().split(/\s+/);
  const ansWords = answer.trim() === '' ? [] : answer.trim().split(/\s+/);
  let html = '<div><strong>Expected:</strong></div><div>';
  for (let i = 0; i < origWords.length; i++) {
    if (i < ansWords.length && ansWords[i].toLowerCase() === origWords[i].toLowerCase()) {
      html += `<span class="diff-correct">${escapeHtml(origWords[i])}</span> `;
    } else {
      html += `<span class="diff-missing">${escapeHtml(origWords[i])}</span> `;
    }
  }
  html += '</div>';
  if (ansWords.length > 0) {
    html += '<div style="margin-top:8px"><strong>Your answer:</strong></div><div>';
    for (let i = 0; i < ansWords.length; i++) {
      if (i < origWords.length && ansWords[i].toLowerCase() === origWords[i].toLowerCase()) {
        html += `<span class="diff-correct">${escapeHtml(ansWords[i])}</span> `;
      } else {
        html += `<span class="diff-wrong">${escapeHtml(ansWords[i])}</span> `;
      }
    }
    html += '</div>';
  }
  return html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Drill Again / New Config ──
$('#btn-again').addEventListener('click', () => {
  $('#btn-start').click();
});

$('#btn-new').addEventListener('click', () => {
  showPanel('config');
});

function showPanel(name) {
  ['config', 'present', 'recall', 'score'].forEach(p => {
    $(`#drill-${p}`).style.display = p === name ? '' : 'none';
  });
  // Push drill panel state so Android back navigates within the drill
  if (currentView === 'drill' && name !== currentPanel) {
    currentPanel = name;
    if (name !== 'config') {
      history.pushState({ view: 'drill', panel: name }, '', '#drill');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  Learn View
// ═══════════════════════════════════════════════════════════════════
// Technique guide readers
$$('[data-action]').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action.startsWith('read-')) {
      const tech = action.slice(5);
      showTechniqueGuide(tech);
    } else if (action === 'drill-number-shape') {
      startLearnDrill('number-shape');
    } else if (action === 'drill-number-rhyme') {
      startLearnDrill('number-rhyme');
    } else if (action === 'drill-major-table') {
      showMajorTable();
    } else if (action === 'show-pegs') {
      showPegList();
    } else if (action === 'train-major') {
      openMajorTrainer();
    }
  });
});

function showTechniqueGuide(tech) {
  const info = TECHNIQUE_INSTRUCTIONS[tech];
  if (!info) return;
  $('#learn-grid').style.display = 'none';
  $('#technique-detail').style.display = '';
  $('#technique-content').innerHTML = info.instructions;
  history.pushState({ view: 'learn', panel: 'detail' }, '', '#learn');
}

$('#btn-back-learn').addEventListener('click', () => {
  returnToLearnGrid();
});

function returnToLearnGrid() {
  $('#technique-detail').style.display = 'none';
  $('#major-table-panel').style.display = 'none';
  $('#peg-list-panel').style.display = 'none';
  $('#trainer-panel').style.display = 'none';
  $('#learn-grid').style.display = '';
}

function showMajorTable() {
  $('#learn-grid').style.display = 'none';
  const panel = $('#major-table-panel');
  panel.style.display = '';
  history.pushState({ view: 'learn', panel: 'major-table' }, '', '#learn');
  const table = $('#major-table');

  let html = '<table class="ref-table"><tr><th>#</th><th>Word</th><th>Sounds</th></tr>';
  for (let i = 0; i < 100; i++) {
    const key = i.toString().padStart(2, '0');
    const word = majorWords[key];
    const d0 = MAJOR_TABLE[Math.floor(i / 10)];
    const d1 = MAJOR_TABLE[i % 10];
    const sounds = d0.sounds.join('/') + ', ' + d1.sounds.join('/');
    html += `<tr><td>${key}</td><td>${word}</td><td>${sounds}</td></tr>`;
  }
  html += '</table>';
  table.innerHTML = html;
}

$('#btn-back-major').addEventListener('click', () => {
  returnToLearnGrid();
});

function showPegList() {
  $('#learn-grid').style.display = 'none';
  const panel = $('#peg-list-panel');
  panel.style.display = '';
  history.pushState({ view: 'learn', panel: 'peg-list' }, '', '#learn');
  const pegs = getPegList();

  let html = '<table class="ref-table"><tr><th>#</th><th>Peg Word</th></tr>';
  for (const peg of pegs) {
    html += `<tr><td>${peg.index.toString().padStart(2, '0')}</td><td>${peg.word}</td></tr>`;
  }
  html += '</table>';
  $('#peg-list').innerHTML = html;
}

$('#btn-back-pegs').addEventListener('click', () => {
  returnToLearnGrid();
});

// ── Learn Drill (flash-card) ──
function startLearnDrill(system) {
  // Switch to drill view and start a learn-mode drill
  $$('.nav-btn').forEach(b => b.classList.remove('active'));
  $$('.nav-btn').forEach(b => { if (b.dataset.view === 'drill') b.classList.add('active'); });
  $$('.view').forEach(v => v.classList.remove('active'));
  $('#view-drill').classList.add('active');

  currentDrillMode = 'recall'; // uses standard recall flow
  const digit = Math.floor(Math.random() * 10);

  let material, expected;
  if (system === 'number-shape') {
    material = `${digit} = ?`;
    expected = NUMBER_SHAPE[digit].shape.split('/')[0].trim().toLowerCase();
    currentConfig = { type: 'text', length: 1, exposureMs: 0, technique: 'number-shape', chunkSize: 0 };
  } else if (system === 'number-rhyme') {
    const numWord = ['zero','one','two','three','four','five','six','seven','eight','nine'][digit];
    material = `${digit} (${numWord}) = ?`;
    expected = NUMBER_RHYME[digit].rhyme.toLowerCase();
    currentConfig = { type: 'text', length: 1, exposureMs: 0, technique: 'number-rhyme', chunkSize: 0 };
  }

  currentMaterial = expected; // what they need to type
  showPanel('present');
  const display = $('#material-display');
  display.textContent = material;
  display.classList.add('text-mode');
  $('#technique-hint').textContent = `💡 Type the ${system === 'number-shape' ? 'shape' : 'rhyme word'} for digit ${digit}`;
  $('#technique-hint').style.display = '';
  $('#ref-card-container').style.display = 'none';
  $('#timer-fill').style.width = '0%'; // no timer
}

// ═══════════════════════════════════════════════════════════════════
//  INLINE: LeitnerBox (spaced repetition)
// ═══════════════════════════════════════════════════════════════════
const LEITNER_INTERVALS = [0, 1, 2, 4, 8];
const LEITNER_MAX = 4;

class LeitnerBox {
  constructor(items, savedState = {}) {
    this._items = {};
    for (const id of items) {
      if (savedState[id]) {
        this._items[id] = { ...savedState[id], times: savedState[id].times || [] };
      } else {
        this._items[id] = { box: 0, lastSeen: 0, times: [] };
      }
    }
  }
  getBox(id) { return this._items[id] ? this._items[id].box : 0; }
  recordAnswer(id, correct, timeMs, session = 0) {
    const item = this._items[id];
    if (!item) return;
    item.times.push(timeMs);
    item.lastSeen = session;
    item.box = correct ? Math.min(item.box + 1, LEITNER_MAX) : 1;
  }
  getAvgTime(id) {
    const item = this._items[id];
    if (!item || item.times.length === 0) return 0;
    return Math.round(item.times.reduce((a, b) => a + b, 0) / item.times.length);
  }
  getDueItems(session) {
    const due = [];
    for (const [id, item] of Object.entries(this._items)) {
      if (item.box === 0) { due.push({ id, box: item.box }); continue; }
      const interval = LEITNER_INTERVALS[item.box] || 1;
      if (session - item.lastSeen >= interval) due.push({ id, box: item.box });
    }
    due.sort((a, b) => a.box - b.box);
    return due.map(d => d.id);
  }
  masteryPct() {
    const ids = Object.keys(this._items);
    if (ids.length === 0) return 100;
    return Math.round((ids.filter(id => this._items[id].box >= LEITNER_MAX).length / ids.length) * 100);
  }
  isLearned(id) { return this._items[id] ? this._items[id].box >= 3 : false; }
  export() {
    const out = {};
    for (const [id, item] of Object.entries(this._items)) {
      out[id] = { box: item.box, lastSeen: item.lastSeen, times: item.times };
    }
    return out;
  }
}

// ═══════════════════════════════════════════════════════════════════
//  INLINE: MajorTrainer (lesson + quiz engine)
// ═══════════════════════════════════════════════════════════════════
const TRAINER_LESSONS = [
  { digits: [0, 1],
    stories: { 0: 'The digit 0 maps to <strong>S</strong> and <strong>Z</strong> sounds. Think: "Zero" starts with Z. A buzzing bee (zzz) circles a big zero.',
               1: 'The digit 1 maps to <strong>T</strong> and <strong>D</strong> sounds. Think: A lowercase "t" has one downstroke, just like the number 1.' },
    examples: { 0: ['sun', 'zoo', 'ice'], 1: ['tie', 'day', 'tea'] } },
  { digits: [2, 3],
    stories: { 2: 'The digit 2 maps to the <strong>N</strong> sound. A lowercase "n" has two downstrokes — two humps.',
               3: 'The digit 3 maps to the <strong>M</strong> sound. A lowercase "m" has three downstrokes — three humps.' },
    examples: { 2: ['noah', 'knee', 'hen'], 3: ['ma', 'ham', 'me'] } },
  { digits: [4, 5],
    stories: { 4: 'The digit 4 maps to the <strong>R</strong> sound. "fouR" — the last consonant sound is R.',
               5: 'The digit 5 maps to the <strong>L</strong> sound. L is the Roman numeral for 50. Hold up your left hand — thumb and index make an L.' },
    examples: { 4: ['rye', 'ore', 'row'], 5: ['law', 'ale', 'oil'] } },
  { digits: [6, 7],
    stories: { 6: 'The digit 6 maps to <strong>J</strong>, <strong>SH</strong>, and <strong>CH</strong> sounds. A "J" is a mirror image of 6.',
               7: 'The digit 7 maps to <strong>K</strong> and hard-<strong>G</strong> sounds. Two 7s back-to-back form a sideways K.' },
    examples: { 6: ['shoe', 'jaw', 'chai'], 7: ['key', 'go', 'cow'] } },
  { digits: [8, 9],
    stories: { 8: 'The digit 8 maps to <strong>F</strong> and <strong>V</strong> sounds. A cursive lowercase "f" looks like an 8.',
               9: 'The digit 9 maps to <strong>P</strong> and <strong>B</strong> sounds. "P" is a mirror image of 9. Flip 9 and you see a "b".' },
    examples: { 8: ['fee', 'ivy', 'foe'], 9: ['pie', 'boy', 'ape'] } },
];

function trainerPickRandom(arr, n) {
  const copy = [...arr];
  const picked = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    picked.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return picked;
}
function trainerShuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function trainerSoundDistractors(correct, digit) {
  const all = Object.values(MAJOR_TABLE).filter(e => e.digit !== digit).map(e => e.sounds.join(', '));
  return trainerShuffle([correct, ...trainerPickRandom(all, 2)]);
}
function trainerDigitDistractors(correct) {
  const all = ['0','1','2','3','4','5','6','7','8','9'].filter(d => d !== correct);
  return trainerShuffle([correct, ...trainerPickRandom(all, 2)]);
}

function generateLessonQuiz(lessonIndex) {
  const lesson = TRAINER_LESSONS[lessonIndex];
  if (!lesson) return [];
  const questions = [];
  for (const digit of lesson.digits) {
    const entry = MAJOR_TABLE[digit];
    const soundLabel = entry.sounds.join(', ');
    questions.push({ direction: 'digit-to-sound', question: `What sounds does digit ${digit} make?`, correct: soundLabel, options: trainerSoundDistractors(soundLabel, digit) });
    questions.push({ direction: 'sound-to-digit', question: `Which digit maps to "${soundLabel}"?`, correct: String(digit), options: trainerDigitDistractors(String(digit)) });
  }
  return questions;
}

function generateSprint(count) {
  const items = [];
  const digits = [0,1,2,3,4,5,6,7,8,9];
  for (let i = 0; i < count; i++) {
    const d = digits[i % digits.length];
    const entry = MAJOR_TABLE[d];
    const soundLabel = entry.sounds.join(', ');
    if (i % 2 === 0) {
      items.push({ prompt: `Digit ${d} → ?`, correct: soundLabel, options: trainerSoundDistractors(soundLabel, d) });
    } else {
      items.push({ prompt: `"${soundLabel}" → ?`, correct: String(d), options: trainerDigitDistractors(String(d)) });
    }
  }
  return items;
}

function generateFreeRecall(count) {
  const items = [];
  const digits = [0,1,2,3,4,5,6,7,8,9];
  for (let i = 0; i < count; i++) {
    const d = digits[i % digits.length];
    items.push({ prompt: `Digit ${d} → sounds?`, answer: MAJOR_TABLE[d].sounds.join(', ') });
  }
  return items;
}

function generateWordChallenge(count) {
  const pairs = Object.keys(majorWords);
  const items = [];
  for (let i = 0; i < count; i++) {
    const pair = pairs[i % pairs.length];
    items.push({ digits: pair, defaultWord: majorWords[pair] });
  }
  return items;
}

// ═══════════════════════════════════════════════════════════════════
//  Major Trainer UI Controller
// ═══════════════════════════════════════════════════════════════════
const TRAINER_STATE_KEY = 'memoryforge_trainer';
let trainerState = null;
let trainerQuizItems = [];
let trainerQuizIndex = 0;
let trainerQuizCorrect = 0;
let trainerPhase = 'lessons'; // lessons | quiz | sprint | free | word | result

function loadTrainerState() {
  try {
    const raw = localStorage.getItem(TRAINER_STATE_KEY);
    if (raw) {
      trainerState = JSON.parse(raw);
    } else {
      trainerState = { lessonsComplete: [false, false, false, false, false] };
    }
  } catch {
    trainerState = { lessonsComplete: [false, false, false, false, false] };
  }
}

function saveTrainerState() {
  try {
    localStorage.setItem(TRAINER_STATE_KEY, JSON.stringify(trainerState));
  } catch { /* storage full — ignore */ }
}

function trainerProgressPct() {
  const done = trainerState.lessonsComplete.filter(Boolean).length;
  return Math.round((done / 5) * 100);
}

function trainerNextLesson() {
  return trainerState.lessonsComplete.indexOf(false);
}

function updateTrainerProgress() {
  const pct = trainerProgressPct();
  $('#trainer-progress-fill').style.width = pct + '%';
  $('#trainer-progress-text').textContent = pct + '% Complete';
}

function hideAllTrainerPanels() {
  ['trainer-lesson', 'trainer-quiz', 'trainer-free', 'trainer-word', 'trainer-result'].forEach(id => {
    $('#' + id).style.display = 'none';
  });
}

function openMajorTrainer() {
  loadTrainerState();
  $('#learn-grid').style.display = 'none';
  $('#trainer-panel').style.display = '';
  history.pushState({ view: 'learn', panel: 'trainer' }, '', '#learn');
  updateTrainerProgress();

  const next = trainerNextLesson();
  if (next === -1) {
    // All lessons done — go to sprint
    startTrainerSprint();
  } else {
    showTrainerLesson(next);
  }
}

function showTrainerLesson(index) {
  hideAllTrainerPanels();
  trainerPhase = 'lessons';
  const lesson = TRAINER_LESSONS[index];
  if (!lesson) return;
  $('#trainer-title').textContent = `Lesson ${index + 1} of 5: Digits ${lesson.digits.join(' & ')}`;

  let storyHtml = '';
  let examplesHtml = '';
  for (const digit of lesson.digits) {
    storyHtml += `<h4>Digit ${digit}</h4><p>${lesson.stories[digit]}</p>`;
    examplesHtml += `<p><strong>Example words for ${digit}:</strong></p><div class="example-list">`;
    for (const w of lesson.examples[digit]) {
      examplesHtml += `<span class="example-chip">${escapeHtml(w)}</span>`;
    }
    examplesHtml += '</div>';
  }
  $('#lesson-story').innerHTML = storyHtml;
  $('#lesson-examples').innerHTML = examplesHtml;
  $('#trainer-lesson').style.display = '';

  // Store current lesson index for quiz
  trainerQuizIndex = 0;
  trainerQuizCorrect = 0;
  trainerQuizItems = generateLessonQuiz(index);
  // Tag so we know which lesson this quiz is for
  trainerQuizItems._lessonIndex = index;
}

function startTrainerQuiz() {
  hideAllTrainerPanels();
  trainerPhase = 'quiz';
  trainerQuizIndex = 0;
  trainerQuizCorrect = 0;
  $('#trainer-quiz').style.display = '';
  showTrainerQuizItem();
}

function showTrainerQuizItem() {
  if (trainerQuizIndex >= trainerQuizItems.length) {
    showTrainerResult();
    return;
  }
  const item = trainerQuizItems[trainerQuizIndex];
  const prompt = item.question || item.prompt;
  $('#quiz-prompt').textContent = prompt;
  $('#quiz-feedback').style.display = 'none';

  const optionsEl = $('#quiz-options');
  optionsEl.innerHTML = '';
  for (const opt of item.options) {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleQuizAnswer(btn, opt, item.correct));
    optionsEl.appendChild(btn);
  }
}

function handleQuizAnswer(btn, chosen, correct) {
  // Disable all options
  const buttons = $$('.quiz-option');
  buttons.forEach(b => { b.style.pointerEvents = 'none'; });

  if (chosen === correct) {
    btn.classList.add('correct');
    trainerQuizCorrect++;
    $('#quiz-feedback').textContent = 'Correct!';
    $('#quiz-feedback').style.color = 'var(--cup-color-success)';
  } else {
    btn.classList.add('wrong');
    // Highlight correct
    buttons.forEach(b => { if (b.textContent === correct) b.classList.add('correct'); });
    $('#quiz-feedback').textContent = `The answer was: ${correct}`;
    $('#quiz-feedback').style.color = 'var(--cup-color-error)';
  }
  $('#quiz-feedback').style.display = '';

  setTimeout(() => {
    trainerQuizIndex++;
    showTrainerQuizItem();
  }, 1200);
}

function showTrainerResult() {
  hideAllTrainerPanels();
  trainerPhase = 'result';
  const total = trainerQuizItems.length;
  const pct = total > 0 ? Math.round((trainerQuizCorrect / total) * 100) : 0;
  $('#trainer-score').textContent = `${pct}% (${trainerQuizCorrect}/${total})`;
  $('#trainer-result').style.display = '';

  // If this was a lesson quiz and they got 100%, mark lesson complete
  if (trainerQuizItems._lessonIndex !== undefined && pct === 100) {
    trainerState.lessonsComplete[trainerQuizItems._lessonIndex] = true;
    saveTrainerState();
    updateTrainerProgress();
  }
}

function trainerContinue() {
  const next = trainerNextLesson();
  if (next === -1) {
    startTrainerSprint();
  } else {
    // If last quiz wasn't 100%, retry same lesson
    if (trainerQuizItems._lessonIndex !== undefined && !trainerState.lessonsComplete[trainerQuizItems._lessonIndex]) {
      showTrainerLesson(trainerQuizItems._lessonIndex);
    } else {
      showTrainerLesson(next);
    }
  }
}

function startTrainerSprint() {
  hideAllTrainerPanels();
  trainerPhase = 'sprint';
  $('#trainer-title').textContent = 'Sound Sprint — All 10 Digits';
  trainerQuizItems = generateSprint(10);
  trainerQuizIndex = 0;
  trainerQuizCorrect = 0;
  $('#trainer-quiz').style.display = '';
  showTrainerQuizItem();
}

function startTrainerFreeRecall() {
  hideAllTrainerPanels();
  trainerPhase = 'free';
  $('#trainer-title').textContent = 'Free Recall — Type the Sounds';
  const items = generateFreeRecall(10);
  trainerQuizItems = items;
  trainerQuizIndex = 0;
  trainerQuizCorrect = 0;
  showFreeRecallItem();
}

function showFreeRecallItem() {
  if (trainerQuizIndex >= trainerQuizItems.length) {
    showTrainerResult();
    return;
  }
  $('#trainer-free').style.display = '';
  const item = trainerQuizItems[trainerQuizIndex];
  $('#free-prompt').textContent = item.prompt;
  $('#free-input').value = '';
  $('#free-feedback').style.display = 'none';
  $('#free-input').focus();
}

function checkFreeRecall() {
  const item = trainerQuizItems[trainerQuizIndex];
  const answer = $('#free-input').value.trim().toLowerCase();
  const correct = item.answer.toLowerCase();
  if (answer === correct) {
    trainerQuizCorrect++;
    $('#free-feedback').textContent = 'Correct!';
    $('#free-feedback').style.color = 'var(--cup-color-success)';
  } else {
    $('#free-feedback').textContent = `Answer: ${item.answer}`;
    $('#free-feedback').style.color = 'var(--cup-color-error)';
  }
  $('#free-feedback').style.display = '';
  setTimeout(() => {
    trainerQuizIndex++;
    $('#trainer-free').style.display = 'none';
    showFreeRecallItem();
  }, 1200);
}

function startTrainerWordBuilder() {
  hideAllTrainerPanels();
  trainerPhase = 'word';
  $('#trainer-title').textContent = 'Word Builder — Encode Digit Pairs';
  trainerQuizItems = generateWordChallenge(10);
  trainerQuizIndex = 0;
  trainerQuizCorrect = 0;
  showWordBuilderItem();
}

function showWordBuilderItem() {
  if (trainerQuizIndex >= trainerQuizItems.length) {
    showTrainerResult();
    return;
  }
  $('#trainer-word').style.display = '';
  const item = trainerQuizItems[trainerQuizIndex];
  $('#word-prompt').textContent = `Digits: ${item.digits}`;
  $('#word-input').value = '';
  $('#word-feedback').style.display = 'none';
  $('#word-input').focus();
}

function checkWordBuilder() {
  const item = trainerQuizItems[trainerQuizIndex];
  const answer = $('#word-input').value.trim();
  if (answer && consonantsMatchDigits(answer, item.digits)) {
    trainerQuizCorrect++;
    $('#word-feedback').textContent = `"${escapeHtml(answer)}" is valid! Default: ${item.defaultWord}`;
    $('#word-feedback').style.color = 'var(--cup-color-success)';
  } else {
    $('#word-feedback').textContent = `Not a match. Try: ${item.defaultWord}`;
    $('#word-feedback').style.color = 'var(--cup-color-error)';
  }
  $('#word-feedback').style.display = '';
  setTimeout(() => {
    trainerQuizIndex++;
    $('#trainer-word').style.display = 'none';
    showWordBuilderItem();
  }, 1500);
}

// ── Trainer event listeners ──
$('#btn-start-quiz').addEventListener('click', startTrainerQuiz);
$('#btn-trainer-next').addEventListener('click', trainerContinue);
$('#btn-back-trainer').addEventListener('click', returnToLearnGrid);
$('#btn-free-submit').addEventListener('click', checkFreeRecall);
$('#btn-word-submit').addEventListener('click', checkWordBuilder);

// Enter key for free recall and word builder
$('#free-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkFreeRecall(); });
$('#word-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkWordBuilder(); });

// ═══════════════════════════════════════════════════════════════════
//  Stats
// ═══════════════════════════════════════════════════════════════════
async function refreshStats() {
  try {
    const drills = await dbGetAll();
    const stats = computeStats(drills);
    $('#stat-total').textContent = stats.totalDrills;
    $('#stat-avg').textContent = stats.averageScore + '%';
    $('#stat-best').textContent = stats.bestScore + '%';
    $('#stat-today').textContent = stats.today.count;

    renderStatsGroup('#stats-by-type', stats.byType);
    renderStatsGroup('#stats-by-technique', stats.byTechnique);
    renderStatsGroup('#stats-by-mode', stats.byMode);
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

function renderStatsGroup(selector, data) {
  const el = $(selector);
  el.innerHTML = '';
  for (const [key, d] of Object.entries(data)) {
    el.innerHTML += `
      <div class="type-stat">
        <span class="type-name">${escapeHtml(key)}</span>
        <span class="type-details">${d.count} drills · avg ${d.avgScore}% · best ${d.bestScore}%</span>
      </div>`;
  }
  if (Object.keys(data).length === 0) {
    el.innerHTML = '<div class="type-stat"><span class="type-details">No data yet</span></div>';
  }
}

// ═══════════════════════════════════════════════════════════════════
//  Data Management
// ═══════════════════════════════════════════════════════════════════
$('#btn-export').addEventListener('click', async () => {
  try {
    const data = await dbExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoryforge-${data.exported}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Export failed:', e);
    alert('Export failed. See console.');
  }
});

$('#btn-import').addEventListener('click', () => {
  $('#import-file').click();
});

$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const merge = confirm('Merge with existing data? (Cancel = replace all)');
    await dbImport(data, { merge });
    alert(`Imported ${data.data.drills.length} drills.`);
    e.target.value = '';
  } catch (err) {
    console.error('Import failed:', err);
    alert('Import failed: ' + err.message);
  }
});

$('#btn-clear').addEventListener('click', async () => {
  if (!confirm('Delete ALL training data? This cannot be undone.')) return;
  try {
    await dbClear();
    alert('All data cleared.');
    refreshStats();
  } catch (e) {
    console.error('Clear failed:', e);
  }
});

// ═══════════════════════════════════════════════════════════════════
//  PWA Service Worker
// ═══════════════════════════════════════════════════════════════════
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
