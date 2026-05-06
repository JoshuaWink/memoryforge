/**
 * Drill controller — manages the state machine for a single drill session.
 * States: idle → presenting → delaying → recalling → scored
 */
import { generateDigits, generateLetters, generateWords } from './drill-generator.js';
import { scoreExact, scoreText } from './scoring.js';

export class DrillController {
  constructor() {
    this.state = 'idle';
    this.material = null;
    this._config = null;
    this._result = null;
  }

  /**
   * Start a new drill.
   * @param {{ type: 'digits'|'letters'|'words', length: number, exposureMs: number, recallDelaySec?: number }} config
   */
  start(config) {
    this._config = { recallDelaySec: 0, ...config };

    switch (config.type) {
      case 'digits':
        this.material = generateDigits(config.length);
        break;
      case 'letters':
        this.material = generateLetters(config.length);
        break;
      case 'words':
        this.material = generateWords(config.length).join(' ');
        break;
      default:
        throw new Error(`Unknown drill type: ${config.type}`);
    }

    this.state = 'presenting';
    this._result = null;
  }

  /** Hide the material — transition to delay or recall phase. */
  hide() {
    if (this.state !== 'presenting') {
      throw new Error(`Cannot hide in state: ${this.state}`);
    }
    if (this._config.recallDelaySec > 0) {
      this.state = 'delaying';
    } else {
      this.state = 'recalling';
    }
  }

  /** End the delay period — transition to recalling. */
  endDelay() {
    if (this.state !== 'delaying') {
      throw new Error(`Cannot endDelay in state: ${this.state}`);
    }
    this.state = 'recalling';
  }

  /**
   * Submit the user's answer and score it.
   * @param {string} answer
   * @returns {{ score: number, type: string, length: number, material: string, answer: string, timestamp: number }}
   */
  submit(answer) {
    if (this.state !== 'recalling') {
      throw new Error(`Cannot submit in state: ${this.state}`);
    }

    let score;
    if (this._config.type === 'words') {
      score = scoreText(this.material, answer).score;
    } else {
      score = scoreExact(this.material, answer);
    }

    this._result = {
      score,
      type: this._config.type,
      length: this._config.length,
      material: this.material,
      answer,
      timestamp: Date.now(),
    };

    this.state = 'scored';
    return this._result;
  }

  /** Reset to idle for a new drill. */
  reset() {
    this.state = 'idle';
    this.material = null;
    this._config = null;
    this._result = null;
  }

  /** Get the recommended input mode for the current drill type. */
  get inputMode() {
    if (!this._config) return 'text';
    return this._config.type === 'digits' ? 'numeric' : 'text';
  }

  /** Get the recall delay in seconds for the current config. */
  get recallDelaySec() {
    return this._config ? this._config.recallDelaySec : 0;
  }
}
