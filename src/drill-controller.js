/**
 * Drill controller — manages the state machine for a single drill session.
 * States: idle → presenting → delaying → recalling → scored
 * Drill modes: recall (default), encode, decode, learn
 */
import { generateDigits, generateLetters, generateWords } from './drill-generator.js';
import { scoreExact, scoreText } from './scoring.js';
import { getDefaultWords, consonantsMatchDigits, chunkDigits, encodeMajor } from './major-system.js';
import { NUMBER_SHAPE, NUMBER_RHYME } from './mnemonic-systems.js';

export class DrillController {
  constructor() {
    this.state = 'idle';
    this.material = null;
    this.drillMode = 'recall'; // recall | encode | decode | learn
    this.learnItem = null;     // { digit, prompt, answer } for learn mode
    this._config = null;
    this._result = null;
    this._expectedAnswer = null; // for encode/decode modes
    this._majorWords = getDefaultWords();
  }

  /**
   * Start a standard recall drill.
   * @param {{ type: 'digits'|'letters'|'words', length: number, exposureMs: number, recallDelaySec?: number, technique?: string, chunkSize?: number }} config
   */
  start(config) {
    this._config = { recallDelaySec: 0, technique: 'none', chunkSize: 0, ...config };
    this.drillMode = 'recall';
    this.learnItem = null;
    this._expectedAnswer = null;

    switch (config.type) {
      case 'digits':
        this.material = config._forceMaterial || generateDigits(config.length);
        break;
      case 'letters':
        this.material = config._forceMaterial || generateLetters(config.length);
        break;
      case 'words':
        this.material = config._forceMaterial || generateWords(config.length).join(' ');
        break;
      default:
        throw new Error(`Unknown drill type: ${config.type}`);
    }

    this.state = 'presenting';
    this._result = null;
  }

  /**
   * Start an encode drill — show digits, user types the Major System word.
   * @param {{ type: 'digits', length: number, _forceMaterial?: string }} config
   */
  startEncode(config) {
    const digits = config._forceMaterial || generateDigits(config.length || 2);
    this.material = digits;
    this.drillMode = 'encode';
    this._config = { type: 'digits', length: digits.length, technique: 'major', ...config };
    this._expectedAnswer = null; // will be checked via consonantsMatchDigits
    this.learnItem = null;
    this.state = 'presenting';
    this._result = null;
  }

  /**
   * Start a decode drill — show a Major System word, user types back the digits.
   * @param {{ type: 'digits', length: number, _forceMaterial?: string }} config
   */
  startDecode(config) {
    const digits = config._forceMaterial || generateDigits(config.length || 2);
    // Pad to 2 digits for word lookup
    const padded = digits.length % 2 === 0 ? digits : '0' + digits;
    const words = encodeMajor(padded, this._majorWords);
    this.material = words.join(' '); // show the word(s)
    this.drillMode = 'decode';
    this._config = { type: 'digits', length: digits.length, technique: 'major', ...config };
    this._expectedAnswer = digits;
    this.learnItem = null;
    this.state = 'presenting';
    this._result = null;
  }

  /**
   * Start a learn drill — flash-card style for learning mnemonic associations.
   * @param {{ system: 'number-shape'|'number-rhyme'|'major', _forceDigit?: number }} config
   */
  startLearn(config) {
    const digit = config._forceDigit !== undefined
      ? config._forceDigit
      : Math.floor(Math.random() * 10);

    this.drillMode = 'learn';
    this._config = { type: 'learn', technique: config.system, ...config };
    this._result = null;

    if (config.system === 'number-shape') {
      const entry = NUMBER_SHAPE[digit];
      this.material = `${digit}`;
      this.learnItem = {
        digit,
        prompt: `What shape does ${digit} look like?`,
        answer: entry.shape.split('/')[0].trim().toLowerCase(),
        fullAnswer: entry.shape,
        hint: entry.image,
      };
    } else if (config.system === 'number-rhyme') {
      const entry = NUMBER_RHYME[digit];
      this.material = `${digit}`;
      this.learnItem = {
        digit,
        prompt: `What rhymes with "${numberWord(digit)}"?`,
        answer: entry.rhyme.toLowerCase(),
        fullAnswer: entry.rhyme,
        hint: '',
      };
    } else if (config.system === 'major') {
      const pair = digit.toString().padStart(2, '0');
      this.material = pair;
      this.learnItem = {
        digit,
        prompt: `What sounds map to ${pair}?`,
        answer: this._majorWords[pair],
        fullAnswer: this._majorWords[pair],
        hint: '',
      };
    }

    this.state = 'presenting';
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
   * @returns {object} drill result
   */
  submit(answer) {
    if (this.state !== 'recalling') {
      throw new Error(`Cannot submit in state: ${this.state}`);
    }

    let score;

    if (this.drillMode === 'encode') {
      // User typed a word — check if consonants match the digit material
      score = consonantsMatchDigits(answer.trim(), this.material) ? 100 : 0;
    } else if (this.drillMode === 'decode') {
      // User typed digits — check exact match
      score = answer.trim() === this._expectedAnswer ? 100 : 0;
    } else if (this.drillMode === 'learn') {
      // Check if answer matches the expected association (case-insensitive, partial match)
      const expected = this.learnItem.answer.toLowerCase();
      const given = answer.trim().toLowerCase();
      score = (given === expected || expected.includes(given)) && given.length > 0 ? 100 : 0;
    } else {
      // Standard recall
      if (this._config.type === 'words' || this._config.type === 'text') {
        score = scoreText(this.material, answer).score;
      } else {
        score = scoreExact(this.material, answer);
      }
    }

    this._result = {
      score,
      type: this._config.type,
      length: this._config.length || 0,
      material: this.material,
      answer,
      timestamp: Date.now(),
      technique: this._config.technique || 'none',
      drillMode: this.drillMode,
    };

    this.state = 'scored';
    return this._result;
  }

  /** Reset to idle for a new drill. */
  reset() {
    this.state = 'idle';
    this.material = null;
    this.drillMode = 'recall';
    this.learnItem = null;
    this._config = null;
    this._result = null;
    this._expectedAnswer = null;
  }

  /** Get the recommended input mode for the current drill type. */
  get inputMode() {
    if (!this._config) return 'text';
    if (this.drillMode === 'decode') return 'numeric';
    return this._config.type === 'digits' && this.drillMode === 'recall' ? 'numeric' : 'text';
  }

  /** Get the recall delay in seconds for the current config. */
  get recallDelaySec() {
    return this._config ? (this._config.recallDelaySec || 0) : 0;
  }

  /** Get material with chunk separators (for display). */
  get chunkedMaterial() {
    if (!this.material) return '';
    if (!this._config || this._config.type !== 'digits') return this.material;
    const size = this._config.chunkSize || 0;
    if (size <= 0) return this.material;
    return chunkDigits(this.material, size).join(' ');
  }
}

/** Convert digit to its English word. */
function numberWord(d) {
  return ['zero','one','two','three','four','five','six','seven','eight','nine'][d] || String(d);
}
