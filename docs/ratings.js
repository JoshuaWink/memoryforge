/**
 * MemoryForge Ratings — Glicko-2 per-lane cognitive skill ratings
 *
 * Lanes:
 *   A = Reading Velocity  (fed by speed-reading assess + RSVP sessions)
 *   B = Working Memory    (fed by drill: digits, letters, words, text)
 *   C = Focus             (no scored games yet — Unranked)
 *   D = Reasoning         (no drill type yet — Unranked)
 *   E = Expression        (no drill type yet — Unranked)
 *   F = Integration       (composite — computed, not Glicko'd directly)
 *
 * Need scores (from assessment) remain for TRAINING PRESCRIPTION.
 * Glicko-2 ratings are the SKILL CERTIFICATE — earned by doing drills.
 */

(function () {
  'use strict';

  // ── Constants ───────────────────────────────────────────────────────────────

  var STORAGE_KEY     = 'mf_glicko';
  var BACKFILL_KEY    = 'mf_glicko_backfilled';
  var SCALE           = 173.7178;
  var TAU             = 0.5;          // system constant — controls volatility change speed
  var PROBLEM_RD      = 50;           // problems have known, stable difficulty
  var MIN_GAMES       = 3;            // minimum before displaying a rating
  var UNCERTAIN_RD    = 180;          // RD above this = "calibrating" (~±31 points displayed)

  var INITIAL = { r: 1200, RD: 350, sigma: 0.06, games: 0 };

  var TIERS = [
    { min: 0,    max: 999,  name: 'Novice'       },
    { min: 1000, max: 1199, name: 'Developing'   },
    { min: 1200, max: 1399, name: 'Practitioner' },
    { min: 1400, max: 1599, name: 'Advanced'     },
    { min: 1600, max: 1799, name: 'Expert'       },
    { min: 1800, max: 9999, name: 'Master'       },
  ];

  // ── Problem Difficulty Table ────────────────────────────────────────────────

  /**
   * Return the Glicko-2 difficulty rating for a given drill.
   * Lane B (Working Memory) — the only lane with scored drill games currently.
   */
  function drillDifficulty(drill) {
    var type      = drill.type      || 'digits';
    var length    = drill.length    || 4;
    var mode      = drill.drillMode || 'recall';
    var technique = drill.technique || 'none';

    var base;

    if (type === 'digits') {
      // Each extra digit roughly doubles memory load — difficulty table tuned to
      // produce ~1200 for an average trained adult on length-6 recall.
      var digitMap = { 3:900, 4:1000, 5:1100, 6:1200, 7:1320, 8:1430, 9:1540, 10:1640 };
      base = digitMap[length] || (length > 10 ? 1720 : 900);

    } else if (type === 'letters') {
      // Letters have no semantic grouping aid — slightly harder per length
      var letterMap = { 3:950, 4:1050, 5:1160, 6:1270, 7:1380, 8:1470, 9:1560 };
      base = letterMap[length] || (length > 9 ? 1600 : 950);

    } else if (type === 'words') {
      var wordMap = { 3:900, 4:1000, 5:1100, 6:1200, 7:1300, 8:1400 };
      base = wordMap[length] || (length > 8 ? 1500 : 900);

    } else if (type === 'text') {
      // Text passage: difficulty by word count
      if      (length <= 8)  base = 900;
      else if (length <= 11) base = 1000;
      else if (length <= 14) base = 1100;
      else if (length <= 19) base = 1200;
      else if (length <= 25) base = 1300;
      else                   base = 1400;

    } else {
      base = 1100; // unknown type — neutral difficulty
    }

    // Encode/decode mode is harder than pure recall
    if (mode === 'encode' || mode === 'decode') base += 150;

    // Using a mnemonic technique raises the stakes of the problem
    // (you're committing to a higher-difficulty encoding strategy)
    if (technique === 'major' || technique === 'linking' || technique === 'number-shape' || technique === 'number-rhyme') {
      base += 100;
    }

    return base;
  }

  /**
   * Map a drill type to a CG lane letter.
   * Only Lane B has drills today. Other lanes return null.
   */
  function drillToLane(drill) {
    var type = drill.type || '';
    if (type === 'digits' || type === 'letters' || type === 'words' || type === 'text') return 'B';
    return null;
  }

  // ── Glicko-2 Math ───────────────────────────────────────────────────────────

  function gPhi(phi) {
    return 1 / Math.sqrt(1 + (3 * phi * phi) / (Math.PI * Math.PI));
  }

  function expectedScore(mu, mj, phij) {
    return 1 / (1 + Math.exp(-gPhi(phij) * (mu - mj)));
  }

  /**
   * Update volatility using the Illinois / Regula Falsi algorithm.
   */
  function updateVolatility(phi, sigma, v, delta) {
    var a = Math.log(sigma * sigma);
    var tau = TAU;

    function f(x) {
      var ex   = Math.exp(x);
      var d2   = delta * delta;
      var p2   = phi * phi;
      var numer = ex * (d2 - p2 - v - ex);
      var denom = 2 * Math.pow(p2 + v + ex, 2);
      return numer / denom - (x - a) / (tau * tau);
    }

    var A = a;
    var B;
    if (delta * delta > phi * phi + v) {
      B = Math.log(delta * delta - phi * phi - v);
    } else {
      var k = 1;
      while (f(a - k * tau) < 0) k++;
      B = a - k * tau;
    }

    var fA = f(A);
    var fB = f(B);
    var epsilon = 0.000001;
    var iter = 0;

    while (Math.abs(B - A) > epsilon && iter < 200) {
      iter++;
      var C  = A + (A - B) * fA / (fB - fA);
      var fC = f(C);
      if (fC * fB <= 0) {
        A = B; fA = fB;
      } else {
        fA = fA / 2;
      }
      B = B; fB = fC; // keep B, update fB
      B = C; fB = fC;
    }

    return Math.exp(A / 2);
  }

  /**
   * Run one Glicko-2 rating period.
   * @param {Object} state  — { r, RD, sigma }
   * @param {Array}  games  — [{ r: problemRating, score: 0.0–1.0 }, ...]
   * @returns {Object} new state { r, RD, sigma }
   */
  function glicko2Period(state, games) {
    var phi   = state.RD    / SCALE;
    var mu    = (state.r - 1500) / SCALE;
    var sigma = state.sigma;

    // No games this period — RD drifts up (rating becomes less certain)
    if (!games || !games.length) {
      var newPhi = Math.sqrt(phi * phi + sigma * sigma);
      return { r: state.r, RD: Math.min(350, Math.round(newPhi * SCALE)), sigma: sigma };
    }

    // Convert problem ratings to Glicko-2 scale
    var gm = games.map(function (g) {
      return {
        mu:  (g.r - 1500) / SCALE,
        phi: PROBLEM_RD / SCALE,
        s:   Math.max(0, Math.min(1, g.score)),
      };
    });

    // Estimated variance v
    var vInv = 0;
    for (var i = 0; i < gm.length; i++) {
      var gphi = gPhi(gm[i].phi);
      var e    = expectedScore(mu, gm[i].mu, gm[i].phi);
      vInv += gphi * gphi * e * (1 - e);
    }
    var v = 1 / vInv;

    // Delta
    var deltaSum = 0;
    for (var i = 0; i < gm.length; i++) {
      var gphi = gPhi(gm[i].phi);
      var e    = expectedScore(mu, gm[i].mu, gm[i].phi);
      deltaSum += gphi * (gm[i].s - e);
    }
    var delta = v * deltaSum;

    // New volatility
    var sigmaN = updateVolatility(phi, sigma, v, delta);

    // phi* (pre-rating RD)
    var phiStar = Math.sqrt(phi * phi + sigmaN * sigmaN);

    // phi' (new RD)
    var phiNew = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);

    // mu' (new rating)
    var muNew = mu + phiNew * phiNew * deltaSum;

    return {
      r:     Math.round(SCALE * muNew + 1500),
      RD:    Math.max(10, Math.round(SCALE * phiNew)),
      sigma: parseFloat(sigmaN.toFixed(6)),
    };
  }

  // ── Storage ─────────────────────────────────────────────────────────────────

  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (raw && typeof raw === 'object') return raw;
    } catch (_) {}
    return {};
  }

  function saveState(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  function laneState(state, lane) {
    return state[lane] || Object.assign({}, INITIAL);
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Feed a single drill result into the appropriate lane's Glicko-2 state.
   */
  function updateDrill(drill) {
    var lane = drillToLane(drill);
    if (!lane) return;

    var diff  = drillDifficulty(drill);
    var score = (drill.score || 0) / 100;  // normalize 0-100 → 0.0-1.0

    var state = loadState();
    var ls    = laneState(state, lane);
    var next  = glicko2Period(ls, [{ r: diff, score: score }]);
    next.games = (ls.games || 0) + 1;

    state[lane] = next;
    saveState(state);
  }

  /**
   * Feed a speed-reading session result into Lane A.
   * effective_wpm = wpm * comp (quality-adjusted throughput).
   * Scores against a 1200-rated "standard reading challenge".
   * 200 effWpm → score 0.0; 400 effWpm → score 1.0 (linear in between).
   */
  function updateReading(wpm, comp) {
    var effWpm   = Math.round(wpm * (comp || 0));
    // Normalize: 400 effWpm is the "perfect" score against this problem
    var score    = Math.max(0, Math.min(1, (effWpm - 100) / 300));
    var diff     = 1200;  // standard challenge difficulty

    var state = loadState();
    var ls    = laneState(state, 'A');
    var next  = glicko2Period(ls, [{ r: diff, score: score }]);
    next.games = (ls.games || 0) + 1;

    state['A'] = next;
    saveState(state);
  }

  /**
   * Backfill ratings from existing drill history (runs once).
   * Processes drills in chronological order, one-at-a-time periods.
   */
  function backfill(drills) {
    if (localStorage.getItem(BACKFILL_KEY)) return;
    if (!drills || !drills.length) {
      localStorage.setItem(BACKFILL_KEY, '1');
      return;
    }

    var sorted = drills.slice().sort(function (a, b) {
      return (a.timestamp || 0) - (b.timestamp || 0);
    });

    var state = {};
    for (var i = 0; i < sorted.length; i++) {
      var drill = sorted[i];
      var lane  = drillToLane(drill);
      if (!lane) continue;

      var diff  = drillDifficulty(drill);
      var score = (drill.score || 0) / 100;

      var ls   = laneState(state, lane);
      var next = glicko2Period(ls, [{ r: diff, score: score }]);
      next.games = (ls.games || 0) + 1;
      state[lane] = next;
    }

    saveState(state);
    localStorage.setItem(BACKFILL_KEY, '1');
  }

  /**
   * Return a display-ready object for a lane.
   * { unranked, calibrating, rating, rdHalf, tier, label }
   */
  function getDisplay(lane) {
    var state = loadState();
    var ls    = laneState(state, lane);

    if ((ls.games || 0) < MIN_GAMES) {
      return { unranked: true, label: 'Unranked', games: ls.games || 0 };
    }

    var tier = 'Novice';
    for (var i = 0; i < TIERS.length; i++) {
      if (ls.r >= TIERS[i].min && ls.r <= TIERS[i].max) {
        tier = TIERS[i].name;
        break;
      }
    }

    var calibrating = ls.RD >= UNCERTAIN_RD;
    var rdHalf      = Math.round(ls.RD / 2);
    var prefix      = calibrating ? '~' : '';
    var label       = prefix + ls.r + ' · ' + tier;

    return {
      unranked:    false,
      calibrating: calibrating,
      rating:      ls.r,
      rdHalf:      rdHalf,
      tier:        tier,
      label:       label,
      games:       ls.games || 0,
    };
  }

  /** Return full Glicko state (for export / inspect) */
  function getState() {
    return loadState();
  }

  // ── Expose on window ────────────────────────────────────────────────────────

  window.mfGlickoUpdateDrill   = updateDrill;
  window.mfGlickoUpdateReading = updateReading;
  window.mfGlickoBackfill      = backfill;
  window.mfGlickoGetDisplay    = getDisplay;
  window.mfGlickoGetState      = getState;

})();
