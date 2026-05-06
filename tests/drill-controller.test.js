/**
 * Tests for the drill controller — manages the PRESENT → MEMORIZE → HIDE → RECALL → SCORE cycle.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DrillController } from '../src/drill-controller.js';

describe('DrillController', () => {
  let ctrl;

  beforeEach(() => {
    ctrl = new DrillController();
  });

  it('starts in idle state', () => {
    expect(ctrl.state).toBe('idle');
  });

  it('transitions to presenting when a drill starts', () => {
    ctrl.start({ type: 'digits', length: 6, exposureMs: 5000 });
    expect(ctrl.state).toBe('presenting');
    expect(ctrl.material).toBeTruthy();
    expect(ctrl.material).toHaveLength(6);
  });

  it('transitions to recalling when hide is called', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000 });
    ctrl.hide();
    expect(ctrl.state).toBe('recalling');
  });

  it('transitions to scored when answer is submitted', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000 });
    ctrl.hide();
    const result = ctrl.submit(ctrl.material); // perfect recall
    expect(ctrl.state).toBe('scored');
    expect(result.score).toBe(100);
  });

  it('records the drill result with metadata', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000 });
    ctrl.hide();
    const result = ctrl.submit('0000');
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('type', 'digits');
    expect(result).toHaveProperty('length', 4);
    expect(result).toHaveProperty('material');
    expect(result).toHaveProperty('answer', '0000');
    expect(result).toHaveProperty('timestamp');
  });

  it('supports letter drills', () => {
    ctrl.start({ type: 'letters', length: 5, exposureMs: 5000 });
    expect(ctrl.material).toHaveLength(5);
    expect(ctrl.material).toMatch(/^[A-Z]+$/);
  });

  it('supports word drills', () => {
    ctrl.start({ type: 'words', length: 3, exposureMs: 5000 });
    expect(ctrl.material).toBeTruthy();
    // Words are space-separated
    const words = ctrl.material.split(' ');
    expect(words).toHaveLength(3);
  });

  it('resets cleanly for a new drill', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000 });
    ctrl.hide();
    ctrl.submit('1234');
    ctrl.reset();
    expect(ctrl.state).toBe('idle');
    expect(ctrl.material).toBeNull();
  });

  it('throws if hide is called before start', () => {
    expect(() => ctrl.hide()).toThrow();
  });

  it('throws if submit is called before hide', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000 });
    expect(() => ctrl.submit('1234')).toThrow();
  });

  // ── Recall Delay ──

  it('transitions to delaying state when recallDelaySec > 0', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000, recallDelaySec: 3 });
    ctrl.hide();
    expect(ctrl.state).toBe('delaying');
  });

  it('transitions from delaying to recalling on endDelay()', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000, recallDelaySec: 5 });
    ctrl.hide();
    ctrl.endDelay();
    expect(ctrl.state).toBe('recalling');
  });

  it('skips delaying when recallDelaySec is 0', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000, recallDelaySec: 0 });
    ctrl.hide();
    expect(ctrl.state).toBe('recalling');
  });

  it('throws if endDelay called when not delaying', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000 });
    ctrl.hide(); // goes straight to recalling (no delay)
    expect(() => ctrl.endDelay()).toThrow();
  });

  it('throws if submit called during delaying', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000, recallDelaySec: 3 });
    ctrl.hide();
    expect(ctrl.state).toBe('delaying');
    expect(() => ctrl.submit('1234')).toThrow();
  });

  // ── Input Mode ──

  it('returns numeric inputMode for digits', () => {
    ctrl.start({ type: 'digits', length: 6, exposureMs: 5000 });
    expect(ctrl.inputMode).toBe('numeric');
  });

  it('returns text inputMode for letters', () => {
    ctrl.start({ type: 'letters', length: 6, exposureMs: 5000 });
    expect(ctrl.inputMode).toBe('text');
  });

  it('returns text inputMode for words', () => {
    ctrl.start({ type: 'words', length: 3, exposureMs: 5000 });
    expect(ctrl.inputMode).toBe('text');
  });

  it('returns text inputMode when idle (no config)', () => {
    expect(ctrl.inputMode).toBe('text');
  });

  // ── Recall Delay Getter ──

  it('exposes recallDelaySec from config', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000, recallDelaySec: 7 });
    expect(ctrl.recallDelaySec).toBe(7);
  });

  it('defaults recallDelaySec to 0', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000 });
    expect(ctrl.recallDelaySec).toBe(0);
  });

  // ── Technique Tagging ──

  it('records technique in drill result', () => {
    ctrl.start({ type: 'digits', length: 6, exposureMs: 5000, technique: 'major' });
    ctrl.hide();
    const result = ctrl.submit(ctrl.material);
    expect(result.technique).toBe('major');
  });

  it('defaults technique to "none"', () => {
    ctrl.start({ type: 'digits', length: 4, exposureMs: 5000 });
    ctrl.hide();
    const result = ctrl.submit(ctrl.material);
    expect(result.technique).toBe('none');
  });

  // ── Chunked Display ──

  it('provides chunked material when chunkSize is set', () => {
    ctrl.start({ type: 'digits', length: 6, exposureMs: 5000, chunkSize: 2 });
    expect(ctrl.chunkedMaterial).toBeTruthy();
    const chunks = ctrl.chunkedMaterial.split(' ');
    expect(chunks.length).toBeGreaterThanOrEqual(2);
  });

  it('returns unchunked material when chunkSize is 0', () => {
    ctrl.start({ type: 'digits', length: 6, exposureMs: 5000, chunkSize: 0 });
    expect(ctrl.chunkedMaterial).toBe(ctrl.material);
  });

  it('returns raw material when not digits', () => {
    ctrl.start({ type: 'words', length: 3, exposureMs: 5000, chunkSize: 2 });
    expect(ctrl.chunkedMaterial).toBe(ctrl.material);
  });

  // ── Encode Mode ──

  it('supports encode drill mode', () => {
    ctrl.startEncode({ type: 'digits', length: 4 });
    expect(ctrl.state).toBe('presenting');
    expect(ctrl.drillMode).toBe('encode');
    expect(ctrl.material).toBeTruthy();
  });

  it('encode mode: submit scores word against expected encoding', () => {
    ctrl.startEncode({ type: 'digits', length: 2, _forceMaterial: '43' });
    ctrl.hide();
    const result = ctrl.submit('ram');
    expect(result.drillMode).toBe('encode');
    expect(result.score).toBe(100);
  });

  it('encode mode: wrong word scores 0', () => {
    ctrl.startEncode({ type: 'digits', length: 2, _forceMaterial: '43' });
    ctrl.hide();
    const result = ctrl.submit('cat');
    expect(result.score).toBe(0);
  });

  // ── Decode Mode ──

  it('supports decode drill mode', () => {
    ctrl.startDecode({ type: 'digits', length: 2 });
    expect(ctrl.state).toBe('presenting');
    expect(ctrl.drillMode).toBe('decode');
    // Material should be a word, not digits
    expect(ctrl.material).toBeTruthy();
  });

  it('decode mode: submit scores digits against expected', () => {
    ctrl.startDecode({ type: 'digits', length: 2, _forceMaterial: '43' });
    ctrl.hide();
    // Material shown is the word (e.g. 'ram'), user types back '43'
    const result = ctrl.submit('43');
    expect(result.score).toBe(100);
  });

  it('decode mode: wrong digits scores 0', () => {
    ctrl.startDecode({ type: 'digits', length: 2, _forceMaterial: '43' });
    ctrl.hide();
    const result = ctrl.submit('99');
    expect(result.score).toBe(0);
  });

  // ── Learn Mode ──

  it('supports learn drill mode for number-shape', () => {
    ctrl.startLearn({ system: 'number-shape' });
    expect(ctrl.state).toBe('presenting');
    expect(ctrl.drillMode).toBe('learn');
    // Should present a digit and its association
    expect(ctrl.learnItem).toBeDefined();
    expect(ctrl.learnItem.digit).toBeDefined();
  });

  it('learn mode: submit scores correctness of association recall', () => {
    ctrl.startLearn({ system: 'number-shape', _forceDigit: 2 });
    ctrl.hide();
    const result = ctrl.submit('swan');
    expect(result.score).toBe(100);
  });
});
