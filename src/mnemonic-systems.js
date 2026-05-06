/**
 * Mnemonic Systems — data and instructions for all memory techniques.
 *
 * Number-Shape: Each digit looks like something (2 = swan).
 * Number-Rhyme: Each number rhymes with a word (1 = bun).
 * Peg System: Pre-memorized anchor list for ordered recall.
 * Linking: Chain items into a narrative story.
 * PAO: Person-Action-Object system for compressing digits.
 */

import { getDefaultWords } from './major-system.js';

// ── Number-Shape System ─────────────────────────────────────────────

export const NUMBER_SHAPE = {
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

// ── Number-Rhyme System ─────────────────────────────────────────────

export const NUMBER_RHYME = {
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

// ── Peg System (derived from Major System) ──────────────────────────

/**
 * Build the 100-peg list from Major System default words.
 * Each peg is an anchor at a fixed position (0-99).
 * @returns {{ index: number, word: string }[]}
 */
export function getPegList() {
  const words = getDefaultWords();
  const pegs = [];
  for (let i = 0; i < 100; i++) {
    const key = i.toString().padStart(2, '0');
    pegs.push({ index: i, word: words[key] || `peg-${i}` });
  }
  return pegs;
}

// ── Technique Metadata + Instructions ───────────────────────────────

export const TECHNIQUE_INFO = {
  chunking: {
    name: 'Chunking',
    level: 0,
    description: 'Group digits into smaller chunks (like phone numbers) to reduce cognitive load.',
    instructions: `**Chunking** is the simplest memory technique — you already use it.

**How it works:**
Instead of remembering 9162020558 as ten separate digits, you chunk it: 916-202-0558. Your brain treats each chunk as one unit.

**How to practice:**
1. Start with chunk size 2 (pairs): 91 62 02 05 58
2. Move to chunk size 3 (triples): 916 202 055 8
3. Try chunk size 4: 9162 0205 58

**Tips:**
- Find patterns within chunks (91 = year? 202 = area code?)
- Say chunks rhythmically in your head
- The "recall delay" timer is your friend — use it to rehearse chunks silently`,
  },

  'number-shape': {
    name: 'Number-Shape',
    level: 0,
    description: 'Each digit 0-9 looks like a physical shape. Visualize the shapes to remember digits.',
    instructions: `**Number-Shape** turns each digit into a vivid picture based on what the number looks like.

**The System:**
| Digit | Shape | Why |
|-------|-------|-----|
| 0 | Ball/Ring | Round like a zero |
| 1 | Candle | Tall and thin |
| 2 | Swan | The curved neck |
| 3 | Handcuffs | Two bumps |
| 4 | Sailboat | The triangular sail |
| 5 | Seahorse | The curved body |
| 6 | Elephant trunk | The curling shape |
| 7 | Cliff | The angular edge |
| 8 | Snowman | Two circles stacked |
| 9 | Balloon on string | Round top, thin line |

**How to practice:**
1. First, learn the 10 shapes (use the "Learn" drill type)
2. When you see digits, instantly picture the shapes
3. Chain the shapes into a scene: 2-8-4 = a swan sitting on a snowman in a sailboat

**When to use:** Great for short sequences (4-8 digits). Not efficient for long numbers.`,
  },

  'number-rhyme': {
    name: 'Number-Rhyme',
    level: 0,
    description: 'Each digit 0-9 rhymes with a concrete word. Use these as anchors.',
    instructions: `**Number-Rhyme** pairs each digit with a word that rhymes with the number word.

**The System:**
| Digit | Rhymes With |
|-------|-------------|
| 0 | Hero |
| 1 | Bun |
| 2 | Shoe |
| 3 | Tree |
| 4 | Door |
| 5 | Hive |
| 6 | Sticks |
| 7 | Heaven |
| 8 | Gate |
| 9 | Vine |

**How to practice:**
1. Learn the 10 rhyme words (use the "Learn" drill type)
2. For a sequence like 3-1-7, picture: a tree with a bun hanging from it in heaven
3. Make the images interact — the more absurd, the more memorable

**When to use:** Alternative to Number-Shape. Pick whichever system gives you more vivid images.`,
  },

  major: {
    name: 'Major System',
    level: 1,
    description: 'Convert digits to consonant sounds, then to words. The backbone of competitive memory.',
    instructions: `**The Major System** is the single most important technique in memory athletics.

**Core idea:** Each digit 0-9 maps to consonant sounds. Vowels are free — they don't count.

| Digit | Sounds | Memory Aid |
|-------|--------|------------|
| 0 | s, z | "**z**ero" |
| 1 | t, d | "**t**" has 1 downstroke |
| 2 | n | "**n**" has 2 downstrokes |
| 3 | m | "**m**" has 3 downstrokes |
| 4 | r | "fou**r**" ends with r |
| 5 | l | **L** = Roman 50 |
| 6 | j, sh, ch | "**J**" mirrors 6 |
| 7 | k, g (hard) | **K** = two 7s |
| 8 | f, v | script **f** looks like 8 |
| 9 | p, b | **p** mirrors 9 |

**How it works:**
- 43 → r, m → "ram" 🐏
- 21 → n, t → "net" 🥅
- 95 → b, l → "bowl" 🥣

**Practice progression:**
1. **Learn the table** — drill until instant (use "Encode" mode)
2. **Encode drills** — see digits, type the word
3. **Decode drills** — see word, type the digits
4. **Full recall** — use Major words to remember long digit sequences

**Pro tip:** Build YOUR OWN word list. Default words are provided but personal associations are stronger.`,
  },

  peg: {
    name: 'Peg System',
    level: 1,
    description: 'Pre-memorized list of 100 anchor words. Attach new items to pegs for ordered recall.',
    instructions: `**The Peg System** gives you 100 permanent mental "hooks" to hang information on.

**How it works:**
Each number 00-99 has a permanent peg word (from the Major System). To memorize a list:
1. Associate item #1 with peg #1
2. Associate item #2 with peg #2
3. Continue...

**Example (memorizing a shopping list):**
- Peg 01 = "seed" → Imagine seeds growing into milk cartons (item: milk)
- Peg 02 = "sun" → The sun is made of bread (item: bread)
- Peg 03 = "sum" → Adding up a pile of eggs (item: eggs)

**Practice progression:**
1. First, learn pegs 01-20 (use "Learn Pegs" drill)
2. Expand to 01-50
3. Eventually know all 100

**When to use:** Ordered lists, speeches, sequential information. The pegs never change — only what you attach to them changes.`,
  },

  linking: {
    name: 'Linking / Story Method',
    level: 1,
    description: 'Chain items into a vivid narrative. Each item leads to the next through a story.',
    instructions: `**The Linking Method** connects items into a chain of vivid, often absurd mental images.

**How it works:**
For a list of items, create a story where each item interacts with the next:
- Items: hammer, cloud, violin, castle
- Story: A giant **hammer** smashes through a **cloud**, which rains on a **violin** playing on top of a **castle**

**Rules for strong links:**
1. **Make it vivid** — exaggerate size, color, sound
2. **Make it absurd** — the stranger, the stickier
3. **Make items interact** — they must touch, crash, transform
4. **Use your senses** — hear the crash, feel the rain, smell the wood

**Practice with MemoryForge:**
1. Use "Words" drill type
2. Set a recall delay (3-5 seconds)
3. During the delay, build your story chain
4. Recall the words in order

**When to use:** Word lists, errands, sequences where order matters.
**Limitation:** If you forget one link, the chain can break.`,
  },

  pao: {
    name: 'PAO (Person-Action-Object)',
    level: 2,
    description: 'Each 2-digit pair (00-99) gets a Person, Action, and Object. Compress 6 digits into one image.',
    instructions: `**PAO** is the most powerful digit encoding system used by memory champions.

**How it works:**
Each number 00-99 has three associations:
- **Person** — a famous or memorable character
- **Action** — what that person is doing
- **Object** — what they're using

**Example table entries:**
| # | Person | Action | Object |
|---|--------|--------|--------|
| 00 | Superman | flying | cape |
| 07 | James Bond | shooting | gun |
| 32 | Michael Jordan | dunking | basketball |

**The magic — compression:**
For 6 digits like 003207:
- 00 = Superman (Person)
- 32 = dunking (Action from #32)
- 07 = gun (Object from #07)
→ "Superman dunking a gun" — ONE image for SIX digits!

**Practice progression:**
1. Build your PAO table (00-99) — this takes time, but it's permanent
2. Drill encoding: see digits → recall your person/action/object
3. Drill decoding: see the cue → type the digits
4. Full sequences: memorize long digit strings using PAO compression

**Building your table:**
- Use people you know well (celebrities, family, characters)
- Actions should be distinctive and physical
- Objects should be concrete and visible
- Test: can you instantly picture each entry? If not, replace it.

**This is the endgame technique.** Memory champions who memorize 500+ digits use PAO.`,
  },
};
