// Glicko-2 per-lane cognitive skill ratings — ES module version of docs/ratings.js

const STORAGE_KEY  = 'mf_glicko';
const BACKFILL_KEY = 'mf_glicko_backfilled';
const SCALE        = 173.7178;
const TAU          = 0.5;
const PROBLEM_RD   = 50;
const MIN_GAMES    = 3;
const UNCERTAIN_RD = 180;

const INITIAL = { r: 1200, RD: 350, sigma: 0.06, games: 0 };

const TIERS = [
  { min: 0,    max: 999,  name: 'Novice'       },
  { min: 1000, max: 1199, name: 'Developing'   },
  { min: 1200, max: 1399, name: 'Practitioner' },
  { min: 1400, max: 1599, name: 'Advanced'     },
  { min: 1600, max: 1799, name: 'Expert'       },
  { min: 1800, max: 9999, name: 'Master'       },
];

// ── Problem difficulty ──────────────────────────────────────────────────────

function drillDifficulty(drill) {
  const type      = drill.type      || 'digits';
  const length    = drill.length    || 4;
  const mode      = drill.drillMode || 'recall';
  const technique = drill.technique || 'none';

  let base;

  if (type === 'digits') {
    const m = { 3:900, 4:1000, 5:1100, 6:1200, 7:1320, 8:1430, 9:1540, 10:1640 };
    base = m[length] || (length > 10 ? 1720 : 900);
  } else if (type === 'letters') {
    const m = { 3:950, 4:1050, 5:1160, 6:1270, 7:1380, 8:1470, 9:1560 };
    base = m[length] || (length > 9 ? 1600 : 950);
  } else if (type === 'words') {
    const m = { 3:900, 4:1000, 5:1100, 6:1200, 7:1300, 8:1400 };
    base = m[length] || (length > 8 ? 1500 : 900);
  } else if (type === 'text') {
    if      (length <= 8)  base = 900;
    else if (length <= 11) base = 1000;
    else if (length <= 14) base = 1100;
    else if (length <= 19) base = 1200;
    else if (length <= 25) base = 1300;
    else                   base = 1400;
  } else {
    base = 1100;
  }

  if (mode === 'encode' || mode === 'decode') base += 150;
  if (['major','linking','number-shape','number-rhyme'].includes(technique)) base += 100;

  return base;
}

function drillToLane(drill) {
  const t = drill.type || '';
  if (['digits','letters','words','text'].includes(t)) return 'B';
  return null;
}

// ── Glicko-2 Math ───────────────────────────────────────────────────────────

function gPhi(phi) {
  return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
}

function expectedScore(mu, mj, phij) {
  return 1 / (1 + Math.exp(-gPhi(phij) * (mu - mj)));
}

function updateVolatility(phi, sigma, v, delta) {
  const a = Math.log(sigma * sigma);
  function f(x) {
    const ex = Math.exp(x), d2 = delta * delta, p2 = phi * phi;
    const numer = ex * (d2 - p2 - v - ex);
    const denom = 2 * Math.pow(p2 + v + ex, 2);
    return numer / denom - (x - a) / (TAU * TAU);
  }
  let A = a, B;
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v);
  } else {
    let k = 1;
    while (f(a - k * TAU) < 0) k++;
    B = a - k * TAU;
  }
  let fA = f(A), fB = f(B);
  const eps = 0.000001;
  let iter = 0;
  while (Math.abs(B - A) > eps && iter < 200) {
    iter++;
    const C = A + (A - B) * fA / (fB - fA);
    const fC = f(C);
    if (fC * fB <= 0) { A = B; fA = fB; } else { fA /= 2; }
    B = C; fB = fC;
  }
  return Math.exp(A / 2);
}

function glicko2Period(state, games) {
  const phi   = state.RD    / SCALE;
  const mu    = (state.r - 1500) / SCALE;
  const sigma = state.sigma;

  if (!games || !games.length) {
    const newPhi = Math.sqrt(phi * phi + sigma * sigma);
    return { r: state.r, RD: Math.min(350, Math.round(newPhi * SCALE)), sigma };
  }

  const gm = games.map(g => ({
    mu:  (g.r - 1500) / SCALE,
    phi: PROBLEM_RD / SCALE,
    s:   Math.max(0, Math.min(1, g.score)),
  }));

  let vInv = 0;
  for (const g of gm) {
    const gphi = gPhi(g.phi);
    const e    = expectedScore(mu, g.mu, g.phi);
    vInv += gphi * gphi * e * (1 - e);
  }
  const v = 1 / vInv;

  let deltaSum = 0;
  for (const g of gm) {
    const gphi = gPhi(g.phi);
    const e    = expectedScore(mu, g.mu, g.phi);
    deltaSum += gphi * (g.s - e);
  }
  const delta = v * deltaSum;

  const sigmaN  = updateVolatility(phi, sigma, v, delta);
  const phiStar = Math.sqrt(phi * phi + sigmaN * sigmaN);
  const phiNew  = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  const muNew   = mu + phiNew * phiNew * deltaSum;

  return {
    r:     Math.round(SCALE * muNew + 1500),
    RD:    Math.max(10, Math.round(SCALE * phiNew)),
    sigma: parseFloat(sigmaN.toFixed(6)),
  };
}

// ── Storage ─────────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (raw && typeof raw === 'object') return raw;
  } catch (_) {}
  return {};
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
}

function laneState(state, lane) {
  return state[lane] || { ...INITIAL };
}

// ── Public API ───────────────────────────────────────────────────────────────

export function updateDrillRating(drill) {
  const lane = drillToLane(drill);
  if (!lane) return;
  const diff  = drillDifficulty(drill);
  const score = (drill.score || 0) / 100;
  const state = loadState();
  const ls    = laneState(state, lane);
  const next  = glicko2Period(ls, [{ r: diff, score }]);
  next.games  = (ls.games || 0) + 1;
  state[lane] = next;
  saveState(state);
}

export function updateReadingRating(wpm, comp) {
  const effWpm = Math.round(wpm * (comp || 0));
  const score  = Math.max(0, Math.min(1, (effWpm - 100) / 300));
  const state  = loadState();
  const ls     = laneState(state, 'A');
  const next   = glicko2Period(ls, [{ r: 1200, score }]);
  next.games   = (ls.games || 0) + 1;
  state['A']   = next;
  saveState(state);
}

export function backfillRatings(drills) {
  if (localStorage.getItem(BACKFILL_KEY)) return;
  if (!drills || !drills.length) {
    localStorage.setItem(BACKFILL_KEY, '1');
    return;
  }
  const sorted = [...drills].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  const state  = {};
  for (const drill of sorted) {
    const lane = drillToLane(drill);
    if (!lane) continue;
    const diff  = drillDifficulty(drill);
    const score = (drill.score || 0) / 100;
    const ls    = laneState(state, lane);
    const next  = glicko2Period(ls, [{ r: diff, score }]);
    next.games  = (ls.games || 0) + 1;
    state[lane] = next;
  }
  saveState(state);
  localStorage.setItem(BACKFILL_KEY, '1');
}

export function getRatingDisplay(lane) {
  const state = loadState();
  const ls    = laneState(state, lane);

  if ((ls.games || 0) < MIN_GAMES) {
    return { unranked: true, label: 'Unranked', games: ls.games || 0 };
  }

  let tier = 'Novice';
  for (const t of TIERS) {
    if (ls.r >= t.min && ls.r <= t.max) { tier = t.name; break; }
  }

  const calibrating = ls.RD >= UNCERTAIN_RD;
  const label = (calibrating ? '~' : '') + ls.r + ' · ' + tier;

  return { unranked: false, calibrating, rating: ls.r, rdHalf: Math.round(ls.RD / 2), tier, label, games: ls.games || 0 };
}
