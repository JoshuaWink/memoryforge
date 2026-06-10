// ═════════════════════════════════════════════════════════════════════════════
//  MUSIC TRAINING — standalone MemoryForge tab
//  Purpose: train note memorization through visual and ear drills.
// ═════════════════════════════════════════════════════════════════════════════

(function () {
  var MUSIC_KEY = 'mf_music_v1';

  var MUSIC_NOTES = [
    { name: 'C', full: 'C4', freq: 261.63, staffTop: 66 },
    { name: 'D', full: 'D4', freq: 293.66, staffTop: 58 },
    { name: 'E', full: 'E4', freq: 329.63, staffTop: 50 },
    { name: 'F', full: 'F4', freq: 349.23, staffTop: 42 },
    { name: 'G', full: 'G4', freq: 392.0,  staffTop: 34 },
  ];

  var SESSION_TOTAL = 10;
  var _audioCtx = null;

  function load() {
    try {
      var raw = localStorage.getItem(MUSIC_KEY);
      if (!raw) return { attempts: [] };
      var parsed = JSON.parse(raw);
      return { attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [] };
    } catch (e) {
      return { attempts: [] };
    }
  }

  function save(state) {
    try {
      localStorage.setItem(MUSIC_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  var _state = load();

  function ensureAudioCtx() {
    if (_audioCtx) return _audioCtx;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _audioCtx = new Ctx();
    return _audioCtx;
  }

  function playTone(freq, durationMs) {
    var ctx = ensureAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    var len = durationMs || 430;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + len / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + len / 1000 + 0.02);
  }

  function pickNote() {
    return MUSIC_NOTES[Math.floor(Math.random() * MUSIC_NOTES.length)];
  }

  function recordAttempt(attempt) {
    _state.attempts.push(attempt);
    if (_state.attempts.length > 1200) _state.attempts = _state.attempts.slice(-1200);
    save(_state);
  }

  function stats() {
    var attempts = _state.attempts || [];

    function channel(mode) {
      var rows = attempts.filter(function (a) { return a.mode === mode; });
      if (!rows.length) return { total: 0, acc: 0, ms: 0 };
      var correct = rows.filter(function (r) { return !!r.correct; }).length;
      var meanMs = Math.round(rows.reduce(function (s, r) { return s + (r.latency_ms || 0); }, 0) / rows.length);
      return {
        total: rows.length,
        acc: Math.round((correct / rows.length) * 100),
        ms: meanMs,
      };
    }

    var visual = channel('visual');
    var audio = channel('audio');
    var total = visual.total + audio.total;
    var allAcc = total ? Math.round(((visual.total * visual.acc) + (audio.total * audio.acc)) / total) : 0;
    var allMs = total ? Math.round(((visual.total * visual.ms) + (audio.total * audio.ms)) / total) : 0;

    return { total: total, acc: allAcc, ms: allMs, visual: visual, audio: audio };
  }

  function renderHome() {
    var root = document.getElementById('music-root');
    if (!root) return;
    var s = stats();

    root.innerHTML =
      '<div class="music-wrap">' +
        '<div class="music-shell">' +
          '<header class="music-header">' +
            '<h2 class="section-title">Music Memory Training</h2>' +
            '<p class="section-desc">Standalone lane: train note memorization through <strong>visual</strong> and <strong>ear</strong> drills.</p>' +
          '</header>' +

          '<div class="music-stat-grid">' +
            '<div class="music-stat"><span class="music-stat__val">' + s.total + '</span><span class="music-stat__lbl">Attempts</span></div>' +
            '<div class="music-stat"><span class="music-stat__val">' + s.acc + '%</span><span class="music-stat__lbl">Accuracy</span></div>' +
            '<div class="music-stat"><span class="music-stat__val">' + (s.ms ? (s.ms + 'ms') : '–') + '</span><span class="music-stat__lbl">Mean Latency</span></div>' +
          '</div>' +

          '<div class="music-card">' +
            '<h3 class="card-title">Start Session</h3>' +
            '<p class="section-desc">Each session is ' + SESSION_TOTAL + ' prompts. We track speed and accuracy by channel.</p>' +
            '<div class="btn-row">' +
              '<button class="btn btn-primary" id="music-start-visual">Start Visual Drill</button>' +
              '<button class="btn btn-secondary" id="music-start-audio">Start Ear Drill</button>' +
            '</div>' +
            '<p class="field-hint">Ear mode plays a tone; you choose C D E F or G.</p>' +
          '</div>' +

          '<div class="music-channel-grid">' +
            '<div class="music-card">' +
              '<h3 class="card-title">Visual Channel</h3>' +
              '<p class="mono-text">Accuracy: ' + s.visual.acc + '%</p>' +
              '<p class="mono-text">Mean latency: ' + (s.visual.ms ? (s.visual.ms + 'ms') : '–') + '</p>' +
              '<p class="mono-text">Attempts: ' + s.visual.total + '</p>' +
            '</div>' +
            '<div class="music-card">' +
              '<h3 class="card-title">Ear Channel</h3>' +
              '<p class="mono-text">Accuracy: ' + s.audio.acc + '%</p>' +
              '<p class="mono-text">Mean latency: ' + (s.audio.ms ? (s.audio.ms + 'ms') : '–') + '</p>' +
              '<p class="mono-text">Attempts: ' + s.audio.total + '</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('music-start-visual').addEventListener('click', function () {
      runSession('visual');
    });
    document.getElementById('music-start-audio').addEventListener('click', function () {
      runSession('audio');
    });
  }

  function runSession(mode) {
    var state = {
      mode: mode,
      idx: 0,
      correct: 0,
      prompt: null,
      shownAt: 0,
      locked: false,
    };
    renderPrompt(state);
  }

  function renderPrompt(state) {
    if (state.idx >= SESSION_TOTAL) return renderComplete(state);

    var root = document.getElementById('music-root');
    if (!root) return;

    state.prompt = pickNote();
    state.locked = false;

    var answerButtons = MUSIC_NOTES.map(function (n) {
      return '<button class="btn btn-ghost music-answer" data-note="' + n.name + '">' + n.name + '</button>';
    }).join('');

    var promptHtml;
    if (state.mode === 'visual') {
      promptHtml =
        '<div class="music-staff-wrap">' +
          '<div class="music-staff" role="img" aria-label="Guess this note on treble staff">' +
            '<div class="music-line"></div>' +
            '<div class="music-line"></div>' +
            '<div class="music-line"></div>' +
            '<div class="music-line"></div>' +
            '<div class="music-line"></div>' +
            '<div class="music-dot" style="top:' + state.prompt.staffTop + '%"></div>' +
          '</div>' +
          '<p class="section-desc" style="text-align:center;margin-top:var(--cup-space-sm)">Name this note (C D E F or G)</p>' +
        '</div>';
    } else {
      promptHtml =
        '<div class="music-audio-wrap">' +
          '<p class="section-desc" style="text-align:center">Listen, then choose the note name.</p>' +
          '<div class="btn-row" style="justify-content:center"><button class="btn btn-secondary" id="music-replay">🔊 Replay Note</button></div>' +
        '</div>';
    }

    root.innerHTML =
      '<div class="music-wrap">' +
        '<div class="music-shell music-shell--narrow">' +
          '<div class="music-session-head">' +
            '<h2 class="section-title">' + (state.mode === 'visual' ? 'Visual Drill' : 'Ear Drill') + '</h2>' +
            '<span class="badge lane-badge">' + (state.idx + 1) + ' / ' + SESSION_TOTAL + '</span>' +
          '</div>' +
          '<div class="music-card">' + promptHtml + '</div>' +
          '<div class="music-answer-grid">' + answerButtons + '</div>' +
          '<div id="music-feedback" class="music-feedback" aria-live="polite"></div>' +
          '<div class="btn-row"><button class="btn btn-ghost" id="music-back">← Back</button></div>' +
        '</div>' +
      '</div>';

    if (state.mode === 'audio') {
      playTone(state.prompt.freq);
    }

    state.shownAt = performance.now();

    var replayBtn = document.getElementById('music-replay');
    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        playTone(state.prompt.freq);
      });
    }

    var answerEls = root.querySelectorAll('.music-answer');
    answerEls.forEach(function (el) {
      el.addEventListener('click', function () {
        if (state.locked) return;
        state.locked = true;

        var guess = el.getAttribute('data-note');
        var latency = performance.now() - state.shownAt;
        var ok = guess === state.prompt.name;
        if (ok) state.correct += 1;

        recordAttempt({
          date: Date.now(),
          mode: state.mode,
          note: state.prompt.name,
          guess: guess,
          correct: ok,
          latency_ms: Math.round(latency),
        });

        var feedback = document.getElementById('music-feedback');
        if (ok) {
          feedback.className = 'music-feedback music-feedback--ok';
          feedback.textContent = 'Correct — ' + state.prompt.full + ' (' + Math.round(latency) + 'ms)';
          playTone(state.prompt.freq, 300);
        } else {
          feedback.className = 'music-feedback music-feedback--bad';
          feedback.textContent = 'Not quite. You chose ' + guess + ', correct was ' + state.prompt.name + ' (' + state.prompt.full + ').';
          if (state.mode === 'audio') {
            var guessed = MUSIC_NOTES.find(function (n) { return n.name === guess; });
            if (guessed) {
              playTone(guessed.freq, 240);
              setTimeout(function () { playTone(state.prompt.freq, 300); }, 320);
            }
          }
        }

        state.idx += 1;
        setTimeout(function () { renderPrompt(state); }, 900);
      });
    });

    document.getElementById('music-back').addEventListener('click', function () {
      renderHome();
    });
  }

  function renderComplete(state) {
    var root = document.getElementById('music-root');
    if (!root) return;

    var pct = Math.round((state.correct / SESSION_TOTAL) * 100);

    root.innerHTML =
      '<div class="music-wrap">' +
        '<div class="music-shell music-shell--narrow">' +
          '<div class="card" style="text-align:center">' +
            '<h2 class="section-title">Session Complete</h2>' +
            '<p class="section-desc">' + (state.mode === 'visual' ? 'Visual' : 'Ear') + ' drill finished.</p>' +
            '<div class="music-stat-grid">' +
              '<div class="music-stat"><span class="music-stat__val">' + state.correct + '/' + SESSION_TOTAL + '</span><span class="music-stat__lbl">Correct</span></div>' +
              '<div class="music-stat"><span class="music-stat__val">' + pct + '%</span><span class="music-stat__lbl">Accuracy</span></div>' +
            '</div>' +
            '<div class="btn-row" style="justify-content:center">' +
              '<button class="btn btn-primary" id="music-run-again">Run Again</button>' +
              '<button class="btn btn-secondary" id="music-done">Back to Music</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('music-run-again').addEventListener('click', function () {
      runSession(state.mode);
    });
    document.getElementById('music-done').addEventListener('click', function () {
      renderHome();
    });
  }

  function activate() {
    renderHome();
  }

  window.mfMusicActivate = activate;
})();
