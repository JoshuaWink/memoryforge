/**
 * Tests for the Major System Bridge — connecting peg systems to Major sounds.
 */
import { describe, it, expect } from 'vitest';
import { BRIDGE_MAP, getBridge, getBridgeStory } from '../src/major-bridge.js';

describe('Major Bridge', () => {
  it('has a bridge entry for every digit 0-9', () => {
    for (let d = 0; d <= 9; d++) {
      expect(BRIDGE_MAP[d]).toBeDefined();
    }
  });

  it('each bridge entry has shape, rhyme, sounds, and story', () => {
    for (let d = 0; d <= 9; d++) {
      const b = BRIDGE_MAP[d];
      expect(b.shape).toBeTruthy();
      expect(b.rhyme).toBeTruthy();
      expect(b.sounds).toBeTruthy();
      expect(b.bridge).toBeTruthy();
      expect(b.bridge.length).toBeGreaterThan(20); // meaningful sentence
    }
  });

  it('getBridge returns the bridge for a digit', () => {
    const b = getBridge(1);
    expect(b.shape).toBe('candle');
    expect(b.rhyme).toBe('bun');
    expect(b.sounds).toBe('t, d');
  });

  it('getBridge returns undefined for invalid digit', () => {
    expect(getBridge(10)).toBeUndefined();
    expect(getBridge(-1)).toBeUndefined();
  });

  it('getBridgeStory returns the story string', () => {
    const story = getBridgeStory(0);
    expect(typeof story).toBe('string');
    expect(story.length).toBeGreaterThan(20);
  });

  it('bridge stories reference the Major System sound', () => {
    // Each story should contain at least one of the consonant sounds
    // in bold/uppercase or naturally embedded
    for (let d = 0; d <= 9; d++) {
      const b = BRIDGE_MAP[d];
      const story = b.bridge.toLowerCase();
      const sounds = b.sounds.split(', ');
      // At least one sound letter should appear in the story
      const hasSound = sounds.some(s => story.includes(s));
      expect(hasSound).toBe(true);
    }
  });

  it('bridge shapes match NUMBER_SHAPE primary names', () => {
    // Verify consistency with the peg system
    const expectedShapes = ['ball', 'candle', 'swan', 'handcuffs', 'sailboat',
                            'seahorse', 'elephant', 'cliff', 'snowman', 'balloon'];
    for (let d = 0; d <= 9; d++) {
      expect(BRIDGE_MAP[d].shape).toBe(expectedShapes[d]);
    }
  });

  it('bridge rhymes match NUMBER_RHYME words', () => {
    const expectedRhymes = ['hero', 'bun', 'shoe', 'tree', 'door',
                            'hive', 'sticks', 'heaven', 'gate', 'vine'];
    for (let d = 0; d <= 9; d++) {
      expect(BRIDGE_MAP[d].rhyme).toBe(expectedRhymes[d]);
    }
  });
});
