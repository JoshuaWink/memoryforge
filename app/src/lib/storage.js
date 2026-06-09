// localStorage helpers for tracked keys
export const TRACKED_KEYS = [
  'cg_profile', 'mf_ultra_dark', 'mf_last_config', 'mf_saved_configs',
  'mf_recall_timer', 'mf_reminders', 'mf_speed_v1', 'mf_scripture_library',
  'mf_seq_prog', 'mf_cbc_prog', 'memoryforge_flashcards', 'memoryforge_trainer',
  'mf_glicko', 'mf_glicko_backfilled',
];

export function readKey(key) {
  const raw = localStorage.getItem(key);
  if (raw == null) return null;
  try { return JSON.parse(raw); } catch (_) { return raw; }
}

export function writeKey(key, value) {
  if (value == null) { localStorage.removeItem(key); return; }
  localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
}

export function readSnapshot() {
  const snap = {};
  for (const k of TRACKED_KEYS) {
    const v = readKey(k);
    if (v != null) snap[k] = v;
  }
  return snap;
}

export function clearAll() {
  for (const k of TRACKED_KEYS) localStorage.removeItem(k);
}

export function writeSnapshot(snap, opts = {}) {
  if (!opts.merge) clearAll();
  for (const k of TRACKED_KEYS) {
    if (Object.prototype.hasOwnProperty.call(snap, k)) writeKey(k, snap[k]);
  }
}
