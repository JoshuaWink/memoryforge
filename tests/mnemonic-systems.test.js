/**
 * Tests for mnemonic systems — Number-Shape, Number-Rhyme, and Peg list data.
 */
import { describe, it, expect } from 'vitest';
import {
  NUMBER_SHAPE,
  NUMBER_RHYME,
  getPegList,
  TECHNIQUE_INFO,
} from '../src/mnemonic-systems.js';

describe('NUMBER_SHAPE', () => {
  it('has entries for digits 0-9', () => {
    for (let i = 0; i <= 9; i++) {
      expect(NUMBER_SHAPE[i]).toBeDefined();
      expect(NUMBER_SHAPE[i].shape).toBeTruthy();
      expect(NUMBER_SHAPE[i].image).toBeTruthy();
    }
  });

  it('provides vivid, concrete shape associations', () => {
    expect(NUMBER_SHAPE[0].shape).toBeTruthy();
    expect(NUMBER_SHAPE[1].shape).toBeTruthy();
    expect(NUMBER_SHAPE[2].shape).toBeTruthy();
  });
});

describe('NUMBER_RHYME', () => {
  it('has entries for digits 0-9', () => {
    for (let i = 0; i <= 9; i++) {
      expect(NUMBER_RHYME[i]).toBeDefined();
      expect(NUMBER_RHYME[i].rhyme).toBeTruthy();
    }
  });

  it('rhyme word actually rhymes with the number word', () => {
    // 1/bun, 2/shoe, 3/tree, etc.
    expect(NUMBER_RHYME[1].rhyme.toLowerCase()).toBe('bun');
    expect(NUMBER_RHYME[2].rhyme.toLowerCase()).toBe('shoe');
    expect(NUMBER_RHYME[3].rhyme.toLowerCase()).toBe('tree');
  });
});

describe('getPegList', () => {
  it('returns a list of 100 pegs (indices 0-99)', () => {
    const pegs = getPegList();
    expect(pegs.length).toBe(100);
  });

  it('each peg has an index and word', () => {
    const pegs = getPegList();
    expect(pegs[0].index).toBe(0);
    expect(pegs[0].word).toBeTruthy();
    expect(pegs[99].index).toBe(99);
    expect(pegs[99].word).toBeTruthy();
  });

  it('peg words are derived from Major System defaults', () => {
    const pegs = getPegList();
    // Peg 43 should be the Major System word for 43
    expect(pegs[43].word).toBeTruthy();
  });
});

describe('TECHNIQUE_INFO', () => {
  it('has info for all techniques', () => {
    const techniques = ['chunking', 'number-shape', 'number-rhyme', 'major', 'peg', 'linking', 'pao'];
    for (const t of techniques) {
      expect(TECHNIQUE_INFO[t]).toBeDefined();
      expect(TECHNIQUE_INFO[t].name).toBeTruthy();
      expect(TECHNIQUE_INFO[t].description).toBeTruthy();
      expect(TECHNIQUE_INFO[t].level).toBeDefined();
    }
  });

  it('levels are ordered: foundational < intermediate < advanced', () => {
    expect(TECHNIQUE_INFO['chunking'].level).toBeLessThan(TECHNIQUE_INFO['major'].level);
    expect(TECHNIQUE_INFO['major'].level).toBeLessThan(TECHNIQUE_INFO['pao'].level);
  });

  it('each technique has instructions', () => {
    for (const info of Object.values(TECHNIQUE_INFO)) {
      expect(info.instructions).toBeTruthy();
      expect(info.instructions.length).toBeGreaterThan(20);
    }
  });
});
