// CG cognitive profile — assessment inputs → training need scores
import { readKey, writeKey } from './storage.js';

const KEY = 'cg_profile';

export const LANE_NAMES = {
  A: 'Reading Velocity', B: 'Working Memory', C: 'Attention Control',
  D: 'Reasoning',        E: 'Expression',     F: 'Integration',
};

export const LANE_VIEWS = {
  A: 'speed-reading', B: 'drill', C: 'tools', D: 'drill', E: 'drill', F: 'drill',
};

function defaults() {
  return { reading: 220, recall: 72, focus: 14, reasoning: 6, expression: 6 };
}

export function loadProfile() {
  try {
    const raw = readKey(KEY);
    if (raw && typeof raw === 'object') return { ...defaults(), ...raw };
  } catch (_) {}
  return defaults();
}

export function saveProfile(profile) {
  writeKey(KEY, profile);
}

export function computeNeedScores(profile) {
  const A = Math.max(10, 100 - Math.round(profile.reading / 6));
  const B = Math.max(10, 100 - profile.recall);
  const C = Math.max(10, 100 - Math.round(profile.focus * 4));
  const D = Math.max(10, 100 - profile.reasoning * 10);
  const E = Math.max(10, 100 - profile.expression * 10);
  const F = Math.round((A + B + C + D + E) / 5);
  return { A, B, C, D, E, F };
}

export function getPriorityData(profile) {
  const scores = computeNeedScores(profile);
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return {
    scores,
    priorityKey:  ranked[0][0],
    secondaryKey: ranked[1][0],
    strengthKey:  ranked[ranked.length - 1][0],
  };
}

export function needOrdinal(n) {
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function formatNeed(score) {
  return needOrdinal(score) + ' percentile';
}
