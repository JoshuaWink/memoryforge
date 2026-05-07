import { describe, it, expect } from 'vitest';
import {
  createPassage,
  autoSections,
  getSeams,
  rateSeam,
  getWeakestSeams,
  bridgeOptions,
  passageToChunks,
} from '../src/passage.js';

// ── Helpers ──
function fakeVerse(ref, text) {
  return {
    reference: ref,
    text: text,
    chunks: [text], // simplified
    card: { layer: 0, streak: 0, ease: 2.5, interval: 0, nextReview: 0 },
  };
}

const ROM8 = [
  fakeVerse('Romans 8:1', 'Therefore, there is now no condemnation for those who are in Christ Jesus.'),
  fakeVerse('Romans 8:2', 'Because through Christ Jesus the law of the Spirit who gives life has set you free from the law of sin and death.'),
  fakeVerse('Romans 8:3', 'For what the law was powerless to do because it was weakened by the flesh, God did by sending his own Son.'),
  fakeVerse('Romans 8:4', 'In order that the righteous requirement of the law might be fully met in us, who do not live according to the flesh but according to the Spirit.'),
  fakeVerse('Romans 8:5', 'Those who live according to the flesh have their minds set on what the flesh desires; but those who live in accordance with the Spirit have their minds set on what the Spirit desires.'),
  fakeVerse('Romans 8:6', 'The mind governed by the flesh is death, but the mind governed by the Spirit is life and peace.'),
];

// ══════════════════════════════════════════════════════════════════════
//  createPassage
// ══════════════════════════════════════════════════════════════════════

describe('createPassage', () => {
  it('creates a passage from an ordered array of verses', () => {
    const p = createPassage('Romans 8', ROM8);
    expect(p.reference).toBe('Romans 8');
    expect(p.verseRefs).toEqual(ROM8.map(v => v.reference));
    expect(p.sections).toBeInstanceOf(Array);
    expect(p.seams).toBeInstanceOf(Object);
    expect(p.card).toBeDefined();
  });

  it('rejects empty verse list', () => {
    expect(() => createPassage('Empty', [])).toThrow();
  });

  it('stores verse references, not copies', () => {
    const p = createPassage('Romans 8', ROM8);
    expect(p.verseRefs.length).toBe(6);
    expect(p.verses).toBeUndefined(); // no full copies
  });

  it('initialises seams for consecutive verse pairs', () => {
    const p = createPassage('Romans 8', ROM8);
    const seamKeys = Object.keys(p.seams);
    expect(seamKeys.length).toBe(5); // 6 verses = 5 transitions
    expect(seamKeys).toContain('Romans 8:1→Romans 8:2');
    expect(seamKeys).toContain('Romans 8:5→Romans 8:6');
  });

  it('initialises all seam strengths to 0', () => {
    const p = createPassage('Romans 8', ROM8);
    Object.values(p.seams).forEach(s => {
      expect(s.strength).toBe(0);
      expect(s.attempts).toBe(0);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
//  autoSections
// ══════════════════════════════════════════════════════════════════════

describe('autoSections', () => {
  it('groups small sets into a single section', () => {
    const sections = autoSections(ROM8.slice(0, 3));
    expect(sections.length).toBe(1);
    expect(sections[0].range).toEqual([0, 2]);
  });

  it('splits larger sets into sections of ~5 verses', () => {
    const bigList = Array.from({ length: 20 }, (_, i) =>
      fakeVerse(`Test ${i + 1}:1`, `Verse ${i + 1} text.`)
    );
    const sections = autoSections(bigList);
    expect(sections.length).toBeGreaterThan(1);
    sections.forEach(s => {
      const size = s.range[1] - s.range[0] + 1;
      expect(size).toBeLessThanOrEqual(7); // max chunk
      expect(size).toBeGreaterThanOrEqual(1);
    });
  });

  it('labels sections with first and last verse refs', () => {
    const sections = autoSections(ROM8);
    sections.forEach(s => {
      expect(s.label).toBeDefined();
      expect(typeof s.label).toBe('string');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════
//  getSeams / rateSeam
// ══════════════════════════════════════════════════════════════════════

describe('seam tracking', () => {
  it('getSeams returns all seam entries', () => {
    const p = createPassage('Romans 8', ROM8);
    const seams = getSeams(p);
    expect(seams.length).toBe(5);
    expect(seams[0].from).toBe('Romans 8:1');
    expect(seams[0].to).toBe('Romans 8:2');
  });

  it('rateSeam updates strength and attempts', () => {
    const p = createPassage('Romans 8', ROM8);
    rateSeam(p, 'Romans 8:1', 'Romans 8:2', true);
    const key = 'Romans 8:1→Romans 8:2';
    expect(p.seams[key].strength).toBeGreaterThan(0);
    expect(p.seams[key].attempts).toBe(1);
  });

  it('rateSeam decreases strength on failure', () => {
    const p = createPassage('Romans 8', ROM8);
    rateSeam(p, 'Romans 8:1', 'Romans 8:2', true);
    rateSeam(p, 'Romans 8:1', 'Romans 8:2', true);
    const before = p.seams['Romans 8:1→Romans 8:2'].strength;
    rateSeam(p, 'Romans 8:1', 'Romans 8:2', false);
    expect(p.seams['Romans 8:1→Romans 8:2'].strength).toBeLessThan(before);
  });

  it('strength clamps between 0 and 1', () => {
    const p = createPassage('Romans 8', ROM8);
    for (let i = 0; i < 20; i++) rateSeam(p, 'Romans 8:1', 'Romans 8:2', true);
    expect(p.seams['Romans 8:1→Romans 8:2'].strength).toBeLessThanOrEqual(1);
    for (let i = 0; i < 30; i++) rateSeam(p, 'Romans 8:1', 'Romans 8:2', false);
    expect(p.seams['Romans 8:1→Romans 8:2'].strength).toBeGreaterThanOrEqual(0);
  });
});

// ══════════════════════════════════════════════════════════════════════
//  getWeakestSeams
// ══════════════════════════════════════════════════════════════════════

describe('getWeakestSeams', () => {
  it('returns seams sorted by strength ascending', () => {
    const p = createPassage('Romans 8', ROM8);
    rateSeam(p, 'Romans 8:1', 'Romans 8:2', true);
    rateSeam(p, 'Romans 8:1', 'Romans 8:2', true);
    rateSeam(p, 'Romans 8:1', 'Romans 8:2', true);
    const weak = getWeakestSeams(p, 3);
    expect(weak.length).toBe(3);
    // First returned seam should be weakest (strength 0)
    expect(weak[0].strength).toBe(0);
    // Last should be strongest
    expect(weak[weak.length - 1].strength).toBeGreaterThanOrEqual(weak[0].strength);
  });

  it('limits count', () => {
    const p = createPassage('Romans 8', ROM8);
    const weak = getWeakestSeams(p, 2);
    expect(weak.length).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════════
//  bridgeOptions
// ══════════════════════════════════════════════════════════════════════

describe('bridgeOptions', () => {
  it('returns correct answer plus distractors', () => {
    const opts = bridgeOptions(ROM8, 0, 3);
    expect(opts.correct).toBe('Romans 8:2');
    expect(opts.options.length).toBe(4); // correct + 3 distractors
    expect(opts.options).toContain('Romans 8:2');
  });

  it('prompt is the last line/chunk of the from verse', () => {
    const opts = bridgeOptions(ROM8, 0, 3);
    expect(typeof opts.prompt).toBe('string');
    expect(opts.prompt.length).toBeGreaterThan(0);
  });

  it('distractors are other verse refs from the passage', () => {
    const opts = bridgeOptions(ROM8, 0, 3);
    opts.options.forEach(opt => {
      expect(ROM8.some(v => v.reference === opt)).toBe(true);
    });
  });

  it('handles last verse (no next)', () => {
    const opts = bridgeOptions(ROM8, ROM8.length - 1, 3);
    expect(opts).toBeNull(); // can't bridge from last verse
  });
});

// ══════════════════════════════════════════════════════════════════════
//  passageToChunks — chapter-scale chunk order (hard mode)
// ══════════════════════════════════════════════════════════════════════

describe('passageToChunks', () => {
  it('flattens all verse chunks into a single ordered array', () => {
    const multiChunkVerses = [
      fakeVerse('Test 1:1', 'First part.'),
      { ...fakeVerse('Test 1:2', 'Second part. And more.'), chunks: ['Second part.', 'And more.'] },
    ];
    const chunks = passageToChunks(multiChunkVerses);
    expect(chunks).toEqual(['First part.', 'Second part.', 'And more.']);
  });

  it('returns empty array for empty input', () => {
    expect(passageToChunks([])).toEqual([]);
  });

  it('preserves verse order', () => {
    const chunks = passageToChunks(ROM8);
    // First chunk should come from first verse
    expect(chunks[0]).toBe(ROM8[0].chunks[0]);
    // Last chunk from last verse
    expect(chunks[chunks.length - 1]).toBe(ROM8[ROM8.length - 1].chunks[ROM8[ROM8.length - 1].chunks.length - 1]);
  });
});
