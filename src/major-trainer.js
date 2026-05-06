/**
 * MajorTrainer — progressive lesson engine for the Major System.
 *
 * 5 lessons, each covering 2 digits. Each lesson has mnemonic stories,
 * example words, and generates quizzes. Supports phases 1-4 of learning.
 */

import { MAJOR_TABLE, getDefaultWords } from './major-system.js';

/**
 * Lesson definitions — each covers 2 digits with stories and examples.
 */
const LESSONS = [
  {
    digits: [0, 1],
    stories: {
      0: 'The digit 0 maps to S and Z sounds. Think: "Zero" starts with Z. A buzzing bee (zzz) circles a big zero.',
      1: 'The digit 1 maps to T and D sounds. Think: A lowercase "t" has one downstroke, just like the number 1.',
    },
    examples: {
      0: ['sun', 'zoo', 'ice'],
      1: ['tie', 'day', 'tea'],
    },
  },
  {
    digits: [2, 3],
    stories: {
      2: 'The digit 2 maps to the N sound. Think: A lowercase "n" has two downstrokes — two humps, two legs.',
      3: 'The digit 3 maps to the M sound. Think: A lowercase "m" has three downstrokes — three humps.',
    },
    examples: {
      2: ['noah', 'knee', 'hen'],
      3: ['ma', 'ham', 'me'],
    },
  },
  {
    digits: [4, 5],
    stories: {
      4: 'The digit 4 maps to the R sound. Think: "fouR" — the last consonant sound is R.',
      5: 'The digit 5 maps to the L sound. Think: L is the Roman numeral for 50. Hold up your left hand — thumb and index finger make an L.',
    },
    examples: {
      4: ['rye', 'ore', 'row'],
      5: ['law', 'ale', 'oil'],
    },
  },
  {
    digits: [6, 7],
    stories: {
      6: 'The digit 6 maps to J, SH, and CH sounds. Think: A "J" is a mirror image of 6. "SHe" is 6.',
      7: 'The digit 7 maps to K and hard-G sounds. Think: Two 7s back-to-back form a sideways K.',
    },
    examples: {
      6: ['shoe', 'jaw', 'chai'],
      7: ['key', 'go', 'cow'],
    },
  },
  {
    digits: [8, 9],
    stories: {
      8: 'The digit 8 maps to F and V sounds. Think: A cursive lowercase "f" looks like an 8.',
      9: 'The digit 9 maps to P and B sounds. Think: "P" is a mirror image of 9. Flip 9 and you see a "b".',
    },
    examples: {
      8: ['fee', 'ivy', 'foe'],
      9: ['pie', 'boy', 'ape'],
    },
  },
];

export class MajorTrainer {
  /**
   * @param {Object} [savedState] - Previously exported state
   */
  constructor(savedState) {
    if (savedState) {
      this._lessonsComplete = [...savedState.lessonsComplete];
      this._phase = savedState.phase || 1;
    } else {
      this._lessonsComplete = [false, false, false, false, false];
      this._phase = 1;
    }
    this._defaultWords = getDefaultWords();
  }

  /** Get all 5 lesson definitions. */
  getLessons() {
    return LESSONS;
  }

  /** Get the current phase (1-4). */
  getPhase() {
    if (this._lessonsComplete.every(Boolean)) return Math.max(this._phase, 2);
    return 1;
  }

  /** Mark a lesson as complete. */
  completeLesson(index) {
    if (index >= 0 && index < 5) {
      this._lessonsComplete[index] = true;
    }
  }

  /** Check if a lesson is complete. */
  isLessonComplete(index) {
    return this._lessonsComplete[index] === true;
  }

  /** Get index of next incomplete lesson, or -1 if all done. */
  getNextLesson() {
    const idx = this._lessonsComplete.indexOf(false);
    return idx === -1 ? -1 : idx;
  }

  /**
   * Generate a multiple-choice quiz for a lesson.
   * Includes both digit→sound and sound→digit directions.
   * @param {number} lessonIndex
   * @returns {Object[]}
   */
  generateQuiz(lessonIndex) {
    const lesson = LESSONS[lessonIndex];
    if (!lesson) return [];
    const questions = [];

    for (const digit of lesson.digits) {
      const entry = MAJOR_TABLE[digit];
      const soundLabel = entry.sounds.join(', ');

      // digit → sound
      questions.push({
        direction: 'digit-to-sound',
        question: `What sounds does the digit ${digit} represent?`,
        correct: soundLabel,
        options: this._soundDistractors(soundLabel, digit),
      });

      // sound → digit
      questions.push({
        direction: 'sound-to-digit',
        question: `Which digit maps to "${soundLabel}"?`,
        correct: String(digit),
        options: this._digitDistractors(String(digit)),
      });
    }

    return questions;
  }

  /**
   * Generate sprint items — multiple-choice, timed.
   * @param {number} count
   * @returns {Object[]}
   */
  generateSprint(count) {
    const items = [];
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < count; i++) {
      const d = digits[i % digits.length];
      const entry = MAJOR_TABLE[d];
      const soundLabel = entry.sounds.join(', ');
      if (i % 2 === 0) {
        items.push({
          prompt: `Digit ${d} → ?`,
          correct: soundLabel,
          options: this._soundDistractors(soundLabel, d),
        });
      } else {
        items.push({
          prompt: `"${soundLabel}" → ?`,
          correct: String(d),
          options: this._digitDistractors(String(d)),
        });
      }
    }
    return items;
  }

  /**
   * Generate free-recall prompts (no options).
   * @param {number} count
   * @returns {Object[]}
   */
  generateFreeRecall(count) {
    const items = [];
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < count; i++) {
      const d = digits[i % digits.length];
      const entry = MAJOR_TABLE[d];
      items.push({
        prompt: `What sounds map to digit ${d}?`,
        answer: entry.sounds.join(', '),
      });
    }
    return items;
  }

  /**
   * Generate word-builder challenges — 2-digit pairs to encode.
   * @param {number} count
   * @returns {Object[]}
   */
  generateWordChallenge(count) {
    const pairs = Object.keys(this._defaultWords);
    const items = [];
    for (let i = 0; i < count; i++) {
      const pair = pairs[i % pairs.length];
      items.push({
        digits: pair,
        defaultWord: this._defaultWords[pair],
      });
    }
    return items;
  }

  /** Progress percentage (lessons only for now). */
  progressPct() {
    const done = this._lessonsComplete.filter(Boolean).length;
    return Math.round((done / 5) * 100);
  }

  /** Export state for persistence. */
  export() {
    return {
      lessonsComplete: [...this._lessonsComplete],
      phase: this.getPhase(),
    };
  }

  // ── Private helpers ──

  /** Build 3 options for a sound answer including the correct one. */
  _soundDistractors(correct, digit) {
    const all = Object.values(MAJOR_TABLE)
      .filter(e => e.digit !== digit)
      .map(e => e.sounds.join(', '));
    const distractors = this._pickRandom(all, 2);
    const opts = [correct, ...distractors];
    return this._shuffle(opts);
  }

  /** Build 3 options for a digit answer including the correct one. */
  _digitDistractors(correct) {
    const all = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
      .filter(d => d !== correct);
    const distractors = this._pickRandom(all, 2);
    const opts = [correct, ...distractors];
    return this._shuffle(opts);
  }

  _pickRandom(arr, n) {
    const copy = [...arr];
    const picked = [];
    for (let i = 0; i < n && copy.length > 0; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      picked.push(copy.splice(idx, 1)[0]);
    }
    return picked;
  }

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}
