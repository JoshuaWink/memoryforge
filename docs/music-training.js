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

  // Rich per-note data for the Explorer view
  var EXPLORE_DATA = [
    {
      name: 'C', full: 'C4', freq: 261.63, staffTop: 66,
      gem: 'Wonder & Power', gemColor: '#4A90E2',
      desc: 'Middle C — the center of the piano keyboard and the universal starting point of music education. When a piece ends on C there is a strong sense of arrival and rest.',
      science: 'Wavelength \u2248 1.31\u202fm. C\u2192E is a 5:4 frequency ratio (major third) \u2014 one of the most consonant intervals in Western music. Simple integer ratios sound smooth together.',
      realWorld: 'Middle C sits at the exact center of a standard 88-key piano. It is the first note most students learn and the anchor of the C major scale.',
    },
    {
      name: 'D', full: 'D4', freq: 293.66, staffTop: 58,
      gem: 'Tenderness', gemColor: '#F5A623',
      desc: 'A whole step above C. D has a gentle, forward-moving quality \u2014 present but unhurried. It neither fully resolves nor demands movement, it simply flows.',
      science: 'Wavelength \u2248 1.17\u202fm. C\u2192D is a 9:8 ratio (major second). More complex ratios produce a sense of motion without tension.',
      realWorld: 'D major is the most natural key for stringed instruments. Violin, cello, and guitar open strings all resonate with D-based harmonics.',
    },
    {
      name: 'E', full: 'E4', freq: 329.63, staffTop: 50,
      gem: 'Joy', gemColor: '#7ED321',
      desc: 'The third scale degree. E is what gives C major its bright, optimistic character. Without E a C chord is neither major nor minor \u2014 it is ambiguous.',
      science: 'Wavelength \u2248 1.04\u202fm. C\u2192E is a 5:4 ratio \u2014 pure and consonant. The major third is the building block of every major chord. When you hear "happy music" you are hearing thirds.',
      realWorld: 'The highest open string on a guitar is E4 (329.63\u202fHz). Twinkle Twinkle uses the bright C\u2192E jump as its emotional peak.',
    },
    {
      name: 'F', full: 'F4', freq: 349.23, staffTop: 42,
      gem: 'Tension', gemColor: '#D0021B',
      desc: 'The subdominant. F creates pull and unresolved tension in C major \u2014 a gravitational lean that demands movement. Film composers use F-region chords to build unease.',
      science: 'Wavelength \u2248 0.98\u202fm. F\u2192B is the tritone: it divides the 12-tone octave exactly in half. Medieval theorists called it "diabolus in musica" (the devil in music) for its sheer instability.',
      realWorld: 'The opening two notes of The Simpsons theme are a tritone (B\u2009\u2192\u2009F). Wagner and horror film composers use the tritone constantly because it sounds threatening and unresolved.',
    },
    {
      name: 'G', full: 'G4', freq: 392.0, staffTop: 34,
      gem: 'Nostalgia', gemColor: '#9013FE',
      desc: 'The dominant \u2014 the second most harmonically important note after C. Virtually every melody visits G before returning home to C. It is the sound of anticipation.',
      science: 'Wavelength \u2248 0.88\u202fm. C\u2192G is a 3:2 ratio (perfect fifth) \u2014 the simplest relationship after the octave. Pythagoras discovered this by halving a vibrating string. The circle of fifths is built entirely from stacking 3:2 ratios.',
      realWorld: 'G4 matches the open G string on violin and guitar. Twinkle Twinkle starts C-C-G-G: the leap to G is the dominant jump every ear instinctively recognizes as the moment before return.',
    },
  ];

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
    var len = durationMs || 430;

    function schedule() {
      var t = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + len / 1000);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + len / 1000 + 0.02);
    }

    // resume() is async — schedule only after the context is actually running
    if (ctx.state !== 'running') {
      ctx.resume().then(schedule).catch(function () {});
    } else {
      schedule();
    }
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

          '<div class="music-card music-explore-entry">' +
            '<h3 class="card-title">&#127926; Note Explorer</h3>' +
            '<p class="section-desc">Browse each note freely \u2014 tap the wheel to hear it, see its frequency, wavelength, emotional color, and the science behind it. No drills, no pressure.</p>' +
            '<div class="btn-row"><button class="btn btn-ghost" id="music-start-explore">Open Explorer</button></div>' +
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
    document.getElementById('music-start-explore').addEventListener('click', function () {
      renderExplore();
    });
  }

  function runSession(mode) {
    // Prime AudioContext eagerly while we're still inside a user-gesture callback.
    // This ensures the context is running before the first tone fires from a timer.
    var ctx = ensureAudioCtx();
    if (ctx && ctx.state !== 'running') ctx.resume();

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
          '<p class="music-octave-label">Treble clef &middot; 4th octave (C4–G4)</p>' +
          '<div class="music-staff" role="img" aria-label="Guess this note on treble staff">' +
            '<div class="music-line"></div>' +
            '<div class="music-line"></div>' +
            '<div class="music-line"></div>' +
            '<div class="music-line"></div>' +
            '<div class="music-line"></div>' +
            '<div class="music-dot" style="top:' + state.prompt.staffTop + '%"></div>' +
          '</div>' +
          '<p class="section-desc" style="text-align:center;margin-top:var(--cup-space-sm)">Name this note &middot; hear it after you answer</p>' +
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
          feedback.textContent = 'Not quite — ' + guess + ' → correct is ' + state.prompt.name + ' (' + state.prompt.full + '). Listen:';
          if (state.mode === 'audio') {
            // Contrast: play wrong guess then correct so the difference is heard
            var guessed = MUSIC_NOTES.find(function (n) { return n.name === guess; });
            if (guessed) {
              playTone(guessed.freq, 240);
              setTimeout(function () { playTone(state.prompt.freq, 400); }, 340);
            } else {
              playTone(state.prompt.freq, 400);
            }
          } else {
            // Visual mode: play the correct note so the sound-symbol bond still forms
            playTone(state.prompt.freq, 400);
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

  // ── Note Explorer ────────────────────────────────────────────────────────

  function renderExplore() {
    var root = document.getElementById('music-root');
    if (!root) return;

    // Prime AudioContext while still inside the gesture that triggered this call
    var ctx = ensureAudioCtx();
    if (ctx && ctx.state !== 'running') ctx.resume();

    var W = 280, R = 98, btnW = 56;
    var cx = W / 2, cy = W / 2;

    var wheelBtns = EXPLORE_DATA.map(function (n, i) {
      var angle = -Math.PI / 2 + (i * 2 * Math.PI / EXPLORE_DATA.length);
      var left  = Math.round(cx + R * Math.cos(angle) - btnW / 2);
      var top   = Math.round(cy + R * Math.sin(angle) - btnW / 2);
      var sel   = (i === 0) ? ' selected' : '';
      return '<button class="music-wheel-note' + sel + '" data-note="' + n.name +
        '" style="left:' + left + 'px;top:' + top + 'px;" aria-label="' + n.full + '">' +
        n.name + '</button>';
    }).join('');

    root.innerHTML =
      '<div class="music-wrap">' +
        '<div class="music-shell music-shell--narrow">' +
          '<div class="music-session-head">' +
            '<h2 class="section-title">Note Explorer</h2>' +
            '<button class="btn btn-ghost" id="music-explore-back">&larr; Back</button>' +
          '</div>' +
          '<p class="section-desc" style="text-align:center">Tap a note on the wheel to hear it and see the science behind it.</p>' +
          '<div class="music-wheel-outer">' +
            '<div class="music-wheel" style="width:' + W + 'px;height:' + W + 'px;">' +
              wheelBtns +
              '<div class="music-wheel-center">' +
                '<button class="music-wheel-play-btn" id="music-explore-play" aria-label="Play selected note">&#9654;</button>' +
                '<div class="music-wheel-freq" id="music-explore-freq">&#8212; Hz</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="music-screen" id="music-explore-screen"></div>' +
        '</div>' +
      '</div>';

    var _sel = EXPLORE_DATA[0];

    function selectNote(name) {
      _sel = EXPLORE_DATA.find(function (n) { return n.name === name; }) || _sel;
      root.querySelectorAll('.music-wheel-note').forEach(function (b) {
        b.classList.toggle('selected', b.getAttribute('data-note') === name);
      });
      updateExploreScreen(_sel);
    }

    root.querySelectorAll('.music-wheel-note').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectNote(btn.getAttribute('data-note'));
        playTone(_sel.freq, 700);
      });
    });

    document.getElementById('music-explore-play').addEventListener('click', function () {
      playTone(_sel.freq, 700);
    });

    document.getElementById('music-explore-back').addEventListener('click', function () {
      renderHome();
    });

    // Show first note detail without auto-playing (let the user initiate first sound)
    updateExploreScreen(_sel);
  }

  function updateExploreScreen(note) {
    var panel = document.getElementById('music-explore-screen');
    var freqEl = document.getElementById('music-explore-freq');
    if (!panel) return;
    if (freqEl) freqEl.textContent = note.freq + ' Hz';

    var wl = (344 / note.freq).toFixed(2);

    var staffHtml =
      '<div class="music-staff music-staff--sm" role="img" aria-label="' + note.full + ' on treble clef">' +
        '<div class="music-line"></div><div class="music-line"></div>' +
        '<div class="music-line"></div><div class="music-line"></div>' +
        '<div class="music-line"></div>' +
        '<div class="music-dot" style="top:' + note.staffTop + '%"></div>' +
      '</div>';

    panel.innerHTML =
      '<div class="music-screen__header">' +
        '<div class="music-screen__note-name">' + note.name + '</div>' +
        '<div class="music-screen__meta">' +
          '<div class="music-screen__full">' + note.full + ' &middot; Treble Clef &middot; Octave 4</div>' +
          '<div class="music-screen__freq-big">' + note.freq + ' Hz</div>' +
          '<div class="music-screen__wl">&lambda; &asymp; ' + wl + ' m</div>' +
        '</div>' +
        '<div class="music-screen__staff-wrap">' + staffHtml + '</div>' +
      '</div>' +
      '<div class="music-screen__body">' +
        '<div class="music-screen__gem-row">' +
          '<span class="music-screen__gem-dot" style="background:' + note.gemColor + '"></span>' +
          '<span class="music-screen__gem-label">GEMS: <strong>' + note.gem + '</strong></span>' +
        '</div>' +
        '<p class="music-screen__desc">' + note.desc + '</p>' +
        '<div class="music-screen__divider"></div>' +
        '<p class="music-screen__science"><span class="music-screen__tag">\u2297 Science</span> ' + note.science + '</p>' +
        '<p class="music-screen__real"><span class="music-screen__tag">\u263c Real World</span> ' + note.realWorld + '</p>' +
        '<div class="btn-row" style="margin-top:var(--cup-space-sm)">' +
          '<button class="btn btn-primary btn-sm music-explore-replay">&#128266; Hear ' + note.full + ' again</button>' +
        '</div>' +
      '</div>';

    panel.querySelector('.music-explore-replay').addEventListener('click', function () {
      playTone(note.freq, 700);
    });
  }

  function activate() {
    renderHome();
  }

  window.mfMusicActivate = activate;

  // If the page landed directly on #music, app.js navigation may run before this
  // script is loaded. Render immediately when the music view is already active.
  var musicView = document.getElementById('view-music');
  if ((location.hash || '').replace('#', '') === 'music' || (musicView && musicView.classList.contains('active'))) {
    activate();
  }
})();
