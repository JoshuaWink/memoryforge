/**
 * RecallTimer — countdown timer for delayed recall challenges.
 * Tracks a memorization challenge + duration so the user can be
 * prompted to recall after a delay (even if the app was closed).
 */
export class RecallTimer {
  constructor(state) {
    if (state) {
      this._startedAt = state.startedAt;
      this._durationMs = state.durationMs;
      this._challenge = state.challenge;
      this._cancelled = state.cancelled || false;
    } else {
      this._startedAt = null;
      this._durationMs = 0;
      this._challenge = null;
      this._cancelled = false;
    }
  }

  start(durationMs, challenge, now) {
    if (this.isActive(now)) {
      throw new Error('Timer already active');
    }
    this._startedAt = now || Date.now();
    this._durationMs = durationMs;
    this._challenge = challenge;
    this._cancelled = false;
  }

  remaining(now) {
    now = now || Date.now();
    if (!this._startedAt || this._cancelled) return 0;
    var elapsed = now - this._startedAt;
    return Math.max(0, this._durationMs - elapsed);
  }

  isActive(now) {
    return this._startedAt !== null
      && !this._cancelled
      && this.remaining(now) > 0;
  }

  isExpired(now) {
    return this._startedAt !== null
      && !this._cancelled
      && this.remaining(now) === 0;
  }

  getChallenge() {
    return this._challenge;
  }

  cancel() {
    this._cancelled = true;
  }

  formatRemaining(now) {
    var ms = this.remaining(now);
    var totalSec = Math.ceil(ms / 1000);
    var h = Math.floor(totalSec / 3600);
    var m = Math.floor((totalSec % 3600) / 60);
    var s = totalSec % 60;
    return h + ':' + String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }

  export() {
    return {
      startedAt: this._startedAt,
      durationMs: this._durationMs,
      challenge: this._challenge,
      cancelled: this._cancelled,
    };
  }
}

/** Standard delay presets in milliseconds. */
export var PRESETS = {
  '1min':  60000,
  '5min':  300000,
  '15min': 900000,
  '30min': 1800000,
  '1hr':   3600000,
};

/**
 * ReminderScheduler — schedule one-time reminders to practice.
 * Each reminder has an id, a target timestamp, and a label.
 */
export class ReminderScheduler {
  constructor(state) {
    this._reminders = state ? state.map(function(r) { return Object.assign({}, r); }) : [];
    this._nextId = this._reminders.length > 0
      ? Math.max.apply(null, this._reminders.map(function(r) { return r.id; })) + 1
      : 1;
  }

  add(timeMs, label) {
    var reminder = { id: this._nextId++, time: timeMs, label: label };
    this._reminders.push(reminder);
    return reminder;
  }

  getAll() {
    return this._reminders.map(function(r) { return Object.assign({}, r); });
  }

  remove(id) {
    this._reminders = this._reminders.filter(function(r) { return r.id !== id; });
  }

  getDue(now) {
    now = now || Date.now();
    return this._reminders.filter(function(r) { return r.time <= now; });
  }

  clearFired(now) {
    now = now || Date.now();
    this._reminders = this._reminders.filter(function(r) { return r.time > now; });
  }

  export() {
    return this._reminders.map(function(r) { return Object.assign({}, r); });
  }
}
