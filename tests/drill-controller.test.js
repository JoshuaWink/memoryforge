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
});
