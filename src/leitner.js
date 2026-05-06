/**
 * Leitner Box — spaced repetition tracker.
 *
 * Each item lives in a box (0-4). Higher boxes are reviewed less frequently.
 * Correct answers promote (up to 4). Wrong answers demote to box 1.
 *
 * Review intervals by box:
 *   Box 0: Unseen — always due
 *   Box 1: Every session
 *   Box 2: Every 2 sessions
 *   Box 3: Every 4 sessions
 *   Box 4: Every 8 sessions (mastered)
 */

const INTERVALS = [0, 1, 2, 4, 8];
const MAX_BOX = 4;

export class LeitnerBox {
  /**
   * @param {string[]} items - All trackable item IDs
   * @param {Object} [savedState] - Previously exported state to restore
   */
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

  /** Get the current box for an item. */
  getBox(id) {
    return this._items[id] ? this._items[id].box : 0;
  }

  /**
   * Record an answer for an item.
   * @param {string} id - Item ID
   * @param {boolean} correct - Whether the answer was correct
   * @param {number} timeMs - Response time in milliseconds
   * @param {number} [session=0] - Current session number
   */
  recordAnswer(id, correct, timeMs, session = 0) {
    const item = this._items[id];
    if (!item) return;

    item.times.push(timeMs);
    item.lastSeen = session;

    if (correct) {
      item.box = Math.min(item.box + 1, MAX_BOX);
    } else {
      // Demote to box 1 (not 0 — they've seen it before)
      item.box = Math.max(1, 1);
    }
  }

  /** Get average response time for an item. */
  getAvgTime(id) {
    const item = this._items[id];
    if (!item || item.times.length === 0) return 0;
    return Math.round(item.times.reduce((a, b) => a + b, 0) / item.times.length);
  }

  /**
   * Get items that are due for review at the given session.
   * Returns sorted by box ascending (lowest box = highest priority).
   * @param {number} session - Current session number
   * @returns {string[]}
   */
  getDueItems(session) {
    const due = [];
    for (const [id, item] of Object.entries(this._items)) {
      if (item.box === 0) {
        // Unseen — always due
        due.push({ id, box: item.box });
      } else {
        const interval = INTERVALS[item.box] || 1;
        const sessionsSinceSeen = session - item.lastSeen;
        if (sessionsSinceSeen >= interval) {
          due.push({ id, box: item.box });
        }
      }
    }
    // Sort by box ascending — lowest boxes get reviewed first
    due.sort((a, b) => a.box - b.box);
    return due.map(d => d.id);
  }

  /** Percentage of items at box >= MAX_BOX (mastered). */
  masteryPct() {
    const ids = Object.keys(this._items);
    if (ids.length === 0) return 100;
    const mastered = ids.filter(id => this._items[id].box >= MAX_BOX).length;
    return Math.round((mastered / ids.length) * 100);
  }

  /** Is this item at box >= 3 (learned but not necessarily mastered)? */
  isLearned(id) {
    return this._items[id] ? this._items[id].box >= 3 : false;
  }

  /** Export state for persistence (e.g. IndexedDB). */
  export() {
    const out = {};
    for (const [id, item] of Object.entries(this._items)) {
      out[id] = { box: item.box, lastSeen: item.lastSeen, times: item.times };
    }
    return out;
  }
}
