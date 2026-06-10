// ═════════════════════════════════════════════════════════════════════════════
//  MUSIC TRAINING — Study Studio + Quiz Challenge
// ═════════════════════════════════════════════════════════════════════════════

(function () {
  var MUSIC_KEY = 'mf_music_v3';
  var _audioCtx = null;

  var NOTE_LIBRARY = [
    {
      id: 'C4',
      short: 'C',
      hero: 'C',
      answerLabel: 'C',
      fullLabel: 'C4',
      freq: 261.63,
      staffTop: 82,
      ledgerLines: [82],
      accidental: '',
      family: 'natural',
      gem: 'Wonder & Power',
      gemColor: '#4A90E2',
      desc: 'Middle C is the home anchor. It feels settled, centered, and complete.',
      science: 'C to E is a 5:4 ratio, one of the cleanest consonances in Western harmony.',
      realWorld: 'Middle C sits near the center of an 88-key piano and is the first fixed reference most learners get.'
    },
    {
      id: 'C#4',
      short: 'C#',
      hero: 'C#',
      answerLabel: 'C#/Db',
      fullLabel: 'C#4 / Db4',
      freq: 277.18,
      staffTop: 82,
      ledgerLines: [82],
      accidental: '♯',
      family: 'accidental',
      gem: 'Mystery',
      gemColor: '#5C6BC0',
      desc: 'C sharp shades the home note. It feels darker and less settled than plain C.',
      science: 'Each equal-tempered semitone multiplies frequency by 2^(1/12), about 1.05946.',
      realWorld: 'This is the black key between C and D on a piano. In flat spelling it is D flat.'
    },
    {
      id: 'D4',
      short: 'D',
      hero: 'D',
      answerLabel: 'D',
      fullLabel: 'D4',
      freq: 293.66,
      staffTop: 76,
      ledgerLines: [],
      accidental: '',
      family: 'natural',
      gem: 'Tenderness',
      gemColor: '#F5A623',
      desc: 'D feels like motion without urgency. It keeps the melody moving forward.',
      science: 'In just intonation, C to D is 9:8, a gentle whole-step push.',
      realWorld: 'String instruments resonate naturally around D, which is why many folk melodies sit there.'
    },
    {
      id: 'D#4',
      short: 'D#',
      hero: 'D#',
      answerLabel: 'D#/Eb',
      fullLabel: 'D#4 / Eb4',
      freq: 311.13,
      staffTop: 76,
      ledgerLines: [],
      accidental: '♯',
      family: 'accidental',
      gem: 'Bittersweet',
      gemColor: '#AB47BC',
      desc: 'D sharp adds heat and instability. It feels more charged than D and less open than E.',
      science: 'D sharp is one semitone above D and one semitone below E.',
      realWorld: 'This is the black key between D and E. In flat spelling it is E flat.'
    },
    {
      id: 'E4',
      short: 'E',
      hero: 'E',
      answerLabel: 'E',
      fullLabel: 'E4',
      freq: 329.63,
      staffTop: 70,
      ledgerLines: [],
      accidental: '',
      family: 'natural',
      gem: 'Joy',
      gemColor: '#7ED321',
      desc: 'E is bright and open. It is the note that makes C-major harmony sound clearly major.',
      science: 'The major third is a core reason major chords feel bright and stable.',
      realWorld: 'The highest open string on a standard guitar is E4.'
    },
    {
      id: 'F4',
      short: 'F',
      hero: 'F',
      answerLabel: 'F',
      fullLabel: 'F4',
      freq: 349.23,
      staffTop: 64,
      ledgerLines: [],
      accidental: '',
      family: 'natural',
      gem: 'Tension',
      gemColor: '#D0021B',
      desc: 'F introduces pull. It feels like the harmony wants to move somewhere.',
      science: 'F helps create pre-dominant energy and pairs with B for the classic tritone tension.',
      realWorld: 'Film and game scores lean on F-based harmony when they want suspense without total chaos.'
    },
    {
      id: 'F#4',
      short: 'F#',
      hero: 'F#',
      answerLabel: 'F#/Gb',
      fullLabel: 'F#4 / Gb4',
      freq: 369.99,
      staffTop: 64,
      ledgerLines: [],
      accidental: '♯',
      family: 'accidental',
      gem: 'Electric Tension',
      gemColor: '#EF4444',
      desc: 'F sharp is bright but unstable. It cuts through the texture instead of blending into it.',
      science: 'Against C, F sharp forms the tritone, the most unstable basic interval in tonal music.',
      realWorld: 'This pitch shows up constantly in modern guitar-driven music because it adds immediate bite.'
    },
    {
      id: 'G4',
      short: 'G',
      hero: 'G',
      answerLabel: 'G',
      fullLabel: 'G4',
      freq: 392.00,
      staffTop: 58,
      ledgerLines: [],
      accidental: '',
      family: 'natural',
      gem: 'Nostalgia',
      gemColor: '#9013FE',
      desc: 'G is expectation. It feels like the melody is turning homeward toward C.',
      science: 'C to G is a 3:2 ratio, the perfect fifth, one of the simplest and strongest harmonic relationships.',
      realWorld: 'This dominant leap is all over children’s songs and classical cadences.'
    },
    {
      id: 'G#4',
      short: 'G#',
      hero: 'G#',
      answerLabel: 'G#/Ab',
      fullLabel: 'G#4 / Ab4',
      freq: 415.30,
      staffTop: 58,
      ledgerLines: [],
      accidental: '♯',
      family: 'accidental',
      gem: 'Shimmer',
      gemColor: '#FB8C00',
      desc: 'G sharp feels glossy and suspended, like light caught in glass before it settles.',
      science: 'G sharp sits just below A4, so it is a good test of fine-grained pitch separation.',
      realWorld: 'In flat spelling, A flat is common in lush, warm harmony.'
    },
    {
      id: 'A4',
      short: 'A',
      hero: 'A',
      answerLabel: 'A',
      fullLabel: 'A4',
      freq: 440.00,
      staffTop: 52,
      ledgerLines: [],
      accidental: '',
      family: 'natural',
      gem: 'Yearning',
      gemColor: '#F59E0B',
      desc: 'A feels lyrical and human. It is the strongest global tuning anchor.',
      science: 'A4 at 440 Hz is the international concert pitch used to tune modern instruments.',
      realWorld: 'When an orchestra tunes, the oboe gives A4.'
    },
    {
      id: 'A#4',
      short: 'A#',
      hero: 'A#',
      answerLabel: 'A#/Bb',
      fullLabel: 'A#4 / Bb4',
      freq: 466.16,
      staffTop: 52,
      ledgerLines: [],
      accidental: '♯',
      family: 'accidental',
      gem: 'Drama',
      gemColor: '#EC4899',
      desc: 'A sharp sounds bold and theatrical. It is close enough to A to feel related but still changed.',
      science: 'A sharp is one semitone above concert A, which makes it a clean test of true pitch memory.',
      realWorld: 'In flat spelling, B flat is extremely common in band and brass writing.'
    },
    {
      id: 'B4',
      short: 'B',
      hero: 'B',
      answerLabel: 'B',
      fullLabel: 'B4',
      freq: 493.88,
      staffTop: 46,
      ledgerLines: [],
      accidental: '',
      family: 'natural',
      gem: 'Anticipation',
      gemColor: '#00BFA5',
      desc: 'B feels unfinished in the best way. It is the leading tone that wants to rise into C.',
      science: 'Because B sits just one semitone below C, the ear hears strong directional tension toward resolution.',
      realWorld: 'Leading-tone motion from B to C is one of the most recognizable forces in tonal melody.'
    }
  ];

  var NOTE_SETS = [
    {
      id: 'starter',
      label: 'Starter',
      subtitle: 'C through G naturals',
      copy: 'Five-note starter set: C D E F G. Good for imprinting the first pitch anchors.',
      noteIds: ['C4', 'D4', 'E4', 'F4', 'G4']
    },
    {
      id: 'naturals',
      label: 'Naturals',
      subtitle: 'C through B naturals',
      copy: 'All seven natural notes in the 4th octave: C through B.',
      noteIds: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
    },
    {
      id: 'chromatic',
      label: 'Sharps / Flats',
      subtitle: 'All 12 notes in octave 4',
      copy: 'Full chromatic set in octave 4: naturals plus five accidentals as enharmonic answer pairs.',
      noteIds: ['C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4']
    }
  ];

  var NOTE_INDEX = {};
  var NOTE_SET_INDEX = {};
  NOTE_LIBRARY.forEach(function (note) { NOTE_INDEX[note.id] = note; });
  NOTE_SETS.forEach(function (set) { NOTE_SET_INDEX[set.id] = set; });

  function load() {
    try {
      var raw = localStorage.getItem(MUSIC_KEY);
      if (!raw) return { attempts: [], lastStudySet: 'starter', lastQuizSet: 'naturals' };
      var parsed = JSON.parse(raw);
      return {
        attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
        lastStudySet: NOTE_SET_INDEX[parsed.lastStudySet] ? parsed.lastStudySet : 'starter',
        lastQuizSet: NOTE_SET_INDEX[parsed.lastQuizSet] ? parsed.lastQuizSet : 'naturals'
      };
    } catch (e) {
      return { attempts: [], lastStudySet: 'starter', lastQuizSet: 'naturals' };
    }
  }

  function save(state) {
    try {
      localStorage.setItem(MUSIC_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function formatHz(freq) {
    return Number(freq).toFixed(2);
  }

  var _state = load();

  function setPreference(key, value) {
    _state[key] = value;
    save(_state);
  }

  function getNoteSet(setId) {
    return NOTE_SET_INDEX[setId] || NOTE_SET_INDEX.starter;
  }

  function getNotesForSet(setId) {
    return getNoteSet(setId).noteIds.map(function (id) { return NOTE_INDEX[id]; });
  }

  function ensureAudioCtx() {
    if (_audioCtx) return _audioCtx;
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    _audioCtx = new Ctx();
    return _audioCtx;
  }

  function playTone(freq, durationMs, options) {
    var opts = options || {};
    var ctx = ensureAudioCtx();
    if (!ctx) return;
    var len = durationMs || 430;

    function schedule() {
      var t = ctx.currentTime;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      var amplitude = opts.amplitude == null ? 0.18 : opts.amplitude;
      var waveform = opts.waveform || 'sine';
      var release = opts.envelope === 'flat' ? 0.06 : len / 1000;
      var sustainUntil = Math.max(t + 0.03, t + len / 1000 - release);

      osc.type = waveform;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(amplitude, t + 0.02);
      if (opts.envelope === 'flat') {
        gain.gain.setValueAtTime(amplitude, sustainUntil);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + len / 1000);
      } else {
        gain.gain.exponentialRampToValueAtTime(0.0001, t + len / 1000);
      }
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + len / 1000 + 0.02);
    }

    if (ctx.state !== 'running') {
      ctx.resume().then(schedule).catch(function () {});
    } else {
      schedule();
    }
  }

  function playExplorerTone(note) {
    playTone(note.freq, 1200, { envelope: 'flat', amplitude: 0.14, waveform: 'sine' });
  }

  function waveCycleCount(freq) {
    var minFreq = NOTE_LIBRARY[0].freq;
    var maxFreq = NOTE_LIBRARY[NOTE_LIBRARY.length - 1].freq;
    var span = Math.max(1, maxFreq - minFreq);
    var ratio = (freq - minFreq) / span;
    return 2.0 + (ratio * 2.8);
  }

  function buildWaveSvg(note) {
    var width = 320;
    var height = 124;
    var pad = 18;
    var mid = height / 2;
    var amp = 30;
    var cycles = waveCycleCount(note.freq);
    var grid = [];
    var path = [];
    var i;

    for (i = pad; i <= width - pad; i += 36) {
      grid.push('<line x1="' + i + '" y1="' + pad + '" x2="' + i + '" y2="' + (height - pad) + '"></line>');
    }
    for (i = pad; i <= height - pad; i += 22) {
      grid.push('<line x1="' + pad + '" y1="' + i + '" x2="' + (width - pad) + '" y2="' + i + '"></line>');
    }
    for (i = 0; i <= 80; i += 1) {
      var x = pad + (((width - pad * 2) * i) / 80);
      var phase = (i / 80) * Math.PI * 2 * cycles;
      var y = mid - (Math.sin(phase) * amp);
      path.push((i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1));
    }

    return '' +
      '<svg class="music-wave-svg" viewBox="0 0 ' + width + ' ' + height + '" role="img" aria-label="Sine wave model for ' + note.fullLabel + '">' +
        '<g class="music-wave-grid">' + grid.join('') + '</g>' +
        '<line class="music-wave-axis" x1="' + pad + '" y1="' + mid + '" x2="' + (width - pad) + '" y2="' + mid + '"></line>' +
        '<path class="music-wave-path" d="' + path.join(' ') + '"></path>' +
      '</svg>';
  }

  function buildStaffMarkup(note, small) {
    var cls = small ? ' music-staff--sm' : '';
    var lines =
      '<div class="music-line"></div>' +
      '<div class="music-line"></div>' +
      '<div class="music-line"></div>' +
      '<div class="music-line"></div>' +
      '<div class="music-line"></div>';
    var ledgers = (note.ledgerLines || []).map(function (top) {
      return '<div class="music-ledger" style="top:' + top + '%"></div>';
    }).join('');
    var accidental = note.accidental ? '<div class="music-accidental" style="top:' + note.staffTop + '%">' + note.accidental + '</div>' : '';

    return '' +
      '<div class="music-staff' + cls + '" role="img" aria-label="' + note.fullLabel + ' on treble clef">' +
        lines + ledgers + accidental + '<div class="music-dot" style="top:' + note.staffTop + '%"></div>' +
      '</div>';
  }

  function pickNote(noteList) {
    return noteList[Math.floor(Math.random() * noteList.length)];
  }

  function shuffleCopy(arr) {
    var out = arr.slice();
    var i;
    for (i = out.length - 1; i > 0; i -= 1) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function recordAttempt(attempt) {
    _state.attempts.push(attempt);
    if (_state.attempts.length > 1200) {
      _state.attempts = _state.attempts.slice(-1200);
    }
    save(_state);
  }

  function stats() {
    var attempts = _state.attempts || [];

    function byMode(mode) {
      var rows = attempts.filter(function (row) { return row.mode === mode; });
      if (!rows.length) return { total: 0, acc: 0, ms: 0 };
      var correct = rows.filter(function (row) { return !!row.correct; }).length;
      var meanMs = Math.round(rows.reduce(function (sum, row) { return sum + (row.latency_ms || 0); }, 0) / rows.length);
      return { total: rows.length, acc: Math.round((correct / rows.length) * 100), ms: meanMs };
    }

    var visual = byMode('visual');
    var audio = byMode('audio');
    var total = visual.total + audio.total;
    var acc = total ? Math.round(((visual.total * visual.acc) + (audio.total * audio.acc)) / total) : 0;
    var ms = total ? Math.round(((visual.total * visual.ms) + (audio.total * audio.ms)) / total) : 0;

    return { total: total, acc: acc, ms: ms, visual: visual, audio: audio };
  }

  function renderSetPills(activeSetId, groupName) {
    return NOTE_SETS.map(function (set) {
      var active = set.id === activeSetId ? ' active' : '';
      return '<button class="music-set-pill' + active + '" data-group="' + groupName + '" data-set-id="' + set.id + '">' + set.label + '</button>';
    }).join('');
  }

  function currentSetLine(setId) {
    var set = getNoteSet(setId);
    return set.label + ' · ' + set.subtitle + ' · ' + set.noteIds.length + ' notes';
  }

  function bindSetPills(root, groupName, onSelect) {
    root.querySelectorAll('.music-set-pill[data-group="' + groupName + '"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        onSelect(btn.getAttribute('data-set-id'));
      });
    });
  }

  function renderHome() {
    var root = document.getElementById('music-root');
    if (!root) return;
    var s = stats();
    var studySetId = _state.lastStudySet || 'starter';
    var quizSetId = _state.lastQuizSet || 'naturals';

    root.innerHTML = '' +
      '<div class="music-wrap">' +
        '<div class="music-shell">' +
          '<header class="music-header">' +
            '<h2 class="section-title">Music Study Lab</h2>' +
            '<p class="section-desc">Build pitch familiarity in <strong>Study Studio</strong>, then pressure-test it in <strong>Quiz Challenge</strong>.</p>' +
          '</header>' +
          '<div class="music-stat-grid">' +
            '<div class="music-stat"><span class="music-stat__val">' + s.total + '</span><span class="music-stat__lbl">Attempts</span></div>' +
            '<div class="music-stat"><span class="music-stat__val">' + s.acc + '%</span><span class="music-stat__lbl">Accuracy</span></div>' +
            '<div class="music-stat"><span class="music-stat__val">' + (s.ms ? (s.ms + 'ms') : '–') + '</span><span class="music-stat__lbl">Mean Latency</span></div>' +
          '</div>' +
          '<div class="music-card">' +
            '<div class="music-kicker">Study Studio</div>' +
            '<h3 class="card-title">Learn one note set at a time</h3>' +
            '<p class="section-desc">Start with the 5-note starter, move to full naturals, then study the complete chromatic octave with sharps and flats.</p>' +
            '<div class="music-set-pills">' + renderSetPills(studySetId, 'study-home') + '</div>' +
            '<div class="btn-row"><button class="btn btn-primary" id="music-open-study">Open Study Studio</button></div>' +
            '<p class="field-hint">Current study set: ' + currentSetLine(studySetId) + '</p>' +
          '</div>' +
          '<div class="music-card">' +
            '<div class="music-kicker">Quiz Challenge</div>' +
            '<h3 class="card-title">Challenge the ear and eye</h3>' +
            '<p class="section-desc">Visual quiz tests staff recognition. Ear quiz tests isolated pitch naming.</p>' +
            '<div class="music-set-pills">' + renderSetPills(quizSetId, 'quiz-home') + '</div>' +
            '<div class="btn-row">' +
              '<button class="btn btn-primary" id="music-start-visual">Start Visual Quiz</button>' +
              '<button class="btn btn-secondary" id="music-start-audio">Start Ear Quiz</button>' +
            '</div>' +
            '<p class="field-hint">Current challenge set: ' + currentSetLine(quizSetId) + '</p>' +
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

    bindSetPills(root, 'study-home', function (setId) {
      setPreference('lastStudySet', getNoteSet(setId).id);
      renderHome();
    });
    bindSetPills(root, 'quiz-home', function (setId) {
      setPreference('lastQuizSet', getNoteSet(setId).id);
      renderHome();
    });
    document.getElementById('music-open-study').addEventListener('click', function () {
      renderStudyStudio(studySetId);
    });
    document.getElementById('music-start-visual').addEventListener('click', function () {
      runSession('visual', quizSetId);
    });
    document.getElementById('music-start-audio').addEventListener('click', function () {
      runSession('audio', quizSetId);
    });
  }

  function wheelGeometry(count) {
    if (count > 8) return { size: 340, radius: 134, button: 42, font: '0.82rem' };
    if (count > 6) return { size: 300, radius: 112, button: 48, font: '0.94rem' };
    return { size: 280, radius: 98, button: 56, font: '1.05rem' };
  }

  function renderStudyStudio(setId) {
    var root = document.getElementById('music-root');
    if (!root) return;

    var ctx = ensureAudioCtx();
    if (ctx && ctx.state !== 'running') ctx.resume();

    var set = getNoteSet(setId);
    var notes = getNotesForSet(setId);
    var geom = wheelGeometry(notes.length);
    var centerX = geom.size / 2;
    var centerY = geom.size / 2;
    var selectedId = notes[0].id;
    setPreference('lastStudySet', set.id);

    function wheelButtons() {
      return notes.map(function (note, index) {
        var angle = -Math.PI / 2 + (index * 2 * Math.PI / notes.length);
        var left = Math.round(centerX + geom.radius * Math.cos(angle) - geom.button / 2);
        var top = Math.round(centerY + geom.radius * Math.sin(angle) - geom.button / 2);
        var active = note.id === selectedId ? ' selected' : '';
        return '<button class="music-wheel-note' + active + '" data-note-id="' + note.id + '" style="left:' + left + 'px;top:' + top + 'px;width:' + geom.button + 'px;height:' + geom.button + 'px;font-size:' + geom.font + ';" aria-label="' + note.fullLabel + '">' + note.short + '</button>';
      }).join('');
    }

    root.innerHTML = '' +
      '<div class="music-wrap">' +
        '<div class="music-shell music-shell--narrow">' +
          '<div class="music-session-head">' +
            '<h2 class="section-title">Study Studio</h2>' +
            '<button class="btn btn-ghost" id="music-study-back">&larr; Back</button>' +
          '</div>' +
          '<p class="section-desc">Tap any note to hear a steady pure sine tone and study its frequency, wave shape, and staff position.</p>' +
          '<div class="music-set-pills">' + renderSetPills(set.id, 'study-studio') + '</div>' +
          '<p class="field-hint" style="text-align:center">' + set.copy + '</p>' +
          '<div class="music-wheel-outer">' +
            '<div class="music-wheel" style="width:' + geom.size + 'px;height:' + geom.size + 'px;">' +
              wheelButtons() +
              '<div class="music-wheel-center">' +
                '<button class="music-wheel-play-btn" id="music-study-play" aria-label="Play selected note">&#9654;</button>' +
                '<div class="music-wheel-freq" id="music-study-freq">&#8212; Hz</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="music-screen" id="music-study-screen"></div>' +
        '</div>' +
      '</div>';

    bindSetPills(root, 'study-studio', function (newSetId) {
      renderStudyStudio(newSetId);
    });
    root.querySelectorAll('.music-wheel-note').forEach(function (btn) {
      btn.addEventListener('click', function () {
        selectedId = btn.getAttribute('data-note-id');
        root.querySelectorAll('.music-wheel-note').forEach(function (item) {
          item.classList.toggle('selected', item.getAttribute('data-note-id') === selectedId);
        });
        updateStudyScreen(NOTE_INDEX[selectedId], set.id);
        playExplorerTone(NOTE_INDEX[selectedId]);
      });
    });
    document.getElementById('music-study-play').addEventListener('click', function () {
      playExplorerTone(NOTE_INDEX[selectedId]);
    });
    document.getElementById('music-study-back').addEventListener('click', function () {
      renderHome();
    });

    updateStudyScreen(NOTE_INDEX[selectedId], set.id);
  }

  function updateStudyScreen(note, setId) {
    var panel = document.getElementById('music-study-screen');
    var freqEl = document.getElementById('music-study-freq');
    if (!panel) return;
    if (freqEl) freqEl.textContent = formatHz(note.freq) + ' Hz';

    var set = getNoteSet(setId);
    var wavelength = (344 / note.freq).toFixed(2);
    var periodMs = (1000 / note.freq).toFixed(2);

    panel.innerHTML = '' +
      '<div class="music-screen__header">' +
        '<div class="music-screen__note-name">' + note.hero + '</div>' +
        '<div class="music-screen__meta">' +
          '<div class="music-screen__full">' + note.fullLabel + ' &middot; ' + set.label + ' &middot; Octave 4</div>' +
          '<div class="music-screen__freq-big">' + formatHz(note.freq) + ' Hz</div>' +
          '<div class="music-screen__wl">&lambda; &asymp; ' + wavelength + ' m</div>' +
          '<div class="music-screen__tone">' + (note.family === 'natural' ? 'Natural note' : 'Sharp / flat accidental') + '</div>' +
          '<div class="music-screen__alias">Quiz answer: ' + note.answerLabel + '</div>' +
        '</div>' +
        '<div class="music-screen__staff-wrap">' + buildStaffMarkup(note, true) + '</div>' +
      '</div>' +
      '<div class="music-screen__body">' +
        '<div class="music-screen__gem-row">' +
          '<span class="music-screen__gem-dot" style="background:' + note.gemColor + '"></span>' +
          '<span class="music-screen__gem-label">GEMS: <strong>' + note.gem + '</strong></span>' +
        '</div>' +
        '<div class="music-wave-card">' +
          '<div class="music-wave-card__head">' +
            '<span class="music-wave-card__label">Pure Sine · Flat Sustain</span>' +
            '<span class="music-wave-card__hint">Scaled teaching view</span>' +
          '</div>' +
          buildWaveSvg(note) +
          '<div class="music-wave-metrics">' +
            '<div class="music-wave-metric"><span class="music-wave-metric__label">Amplitude</span><span class="music-wave-metric__value">Fixed / flat</span></div>' +
            '<div class="music-wave-metric"><span class="music-wave-metric__label">Frequency</span><span class="music-wave-metric__value">' + formatHz(note.freq) + ' Hz</span></div>' +
            '<div class="music-wave-metric"><span class="music-wave-metric__label">Period</span><span class="music-wave-metric__value">' + periodMs + ' ms</span></div>' +
          '</div>' +
          '<p class="music-wave-caption">Higher notes pack more cycles into the same time window. In Study Studio loudness stays stable so your ear can focus on pitch identity.</p>' +
        '</div>' +
        '<p class="music-screen__desc">' + note.desc + '</p>' +
        '<div class="music-screen__divider"></div>' +
        '<p class="music-screen__science"><span class="music-screen__tag">⊗ Science</span> ' + note.science + '</p>' +
        '<p class="music-screen__real"><span class="music-screen__tag">☼ Real World</span> ' + note.realWorld + '</p>' +
        '<div class="btn-row" style="margin-top:var(--cup-space-sm)">' +
          '<button class="btn btn-primary btn-sm music-study-replay">🔊 Hear ' + note.answerLabel + ' again</button>' +
        '</div>' +
      '</div>';

    panel.querySelector('.music-study-replay').addEventListener('click', function () {
      playExplorerTone(note);
    });
  }

  function runSession(mode, setId) {
    var ctx = ensureAudioCtx();
    if (ctx && ctx.state !== 'running') ctx.resume();

    setPreference('lastQuizSet', setId);
    var total = Math.max(10, getNotesForSet(setId).length);
    var state = {
      mode: mode,
      setId: setId,
      total: total,
      idx: 0,
      correct: 0,
      prompt: null,
      shownAt: 0,
      locked: false
    };
    renderPrompt(state);
  }

  function renderPrompt(state) {
    if (state.idx >= state.total) {
      renderComplete(state);
      return;
    }

    var root = document.getElementById('music-root');
    if (!root) return;
    var set = getNoteSet(state.setId);
    var notes = getNotesForSet(state.setId);
    var answers = shuffleCopy(notes);
    state.prompt = pickNote(notes);
    state.locked = false;

    var promptHtml;
    if (state.mode === 'visual') {
      promptHtml = '' +
        '<div class="music-staff-wrap">' +
          '<p class="music-octave-label">Treble clef &middot; ' + set.label + '</p>' +
          buildStaffMarkup(state.prompt, false) +
          '<p class="section-desc" style="text-align:center;margin-top:var(--cup-space-sm)">Name this pitch. Accidentals use sharp / flat answer pairs.</p>' +
        '</div>';
    } else {
      promptHtml = '' +
        '<div class="music-audio-wrap">' +
          '<p class="section-desc" style="text-align:center">Listen, then choose the correct pitch from the current challenge set.</p>' +
          '<div class="btn-row" style="justify-content:center"><button class="btn btn-secondary" id="music-replay">🔊 Replay Note</button></div>' +
        '</div>';
    }

    root.innerHTML = '' +
      '<div class="music-wrap">' +
        '<div class="music-shell music-shell--narrow">' +
          '<div class="music-session-head">' +
            '<h2 class="section-title">' + (state.mode === 'visual' ? 'Visual Quiz' : 'Ear Quiz') + '</h2>' +
            '<span class="badge lane-badge">' + (state.idx + 1) + ' / ' + state.total + '</span>' +
          '</div>' +
          '<p class="field-hint" style="text-align:center">' + set.copy + '</p>' +
          '<div class="music-card">' + promptHtml + '</div>' +
          '<div class="music-answer-grid">' + answers.map(function (note) {
            return '<button class="btn btn-ghost music-answer" data-note-id="' + note.id + '">' +
              '<span class="music-answer__label">' + note.answerLabel + '</span>' +
              '<span class="music-answer__hz">' + note.freq.toFixed(1) + ' Hz</span>' +
            '</button>';
          }).join('') + '</div>' +
          '<div id="music-feedback" class="music-feedback" aria-live="polite"></div>' +
          '<div class="btn-row"><button class="btn btn-ghost" id="music-back">&larr; Back</button></div>' +
        '</div>' +
      '</div>';

    if (state.mode === 'audio') {
      playExplorerTone(state.prompt);
    }
    state.shownAt = performance.now();

    var replayBtn = document.getElementById('music-replay');
    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        playExplorerTone(state.prompt);
      });
    }

    root.querySelectorAll('.music-answer').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (state.locked) return;
        state.locked = true;

        var guessId = btn.getAttribute('data-note-id');
        var guessed = NOTE_INDEX[guessId];
        var latency = performance.now() - state.shownAt;
        var ok = guessId === state.prompt.id;
        if (ok) {
          state.correct += 1;
        }

        recordAttempt({
          date: Date.now(),
          mode: state.mode,
          setId: state.setId,
          noteId: state.prompt.id,
          guessId: guessId,
          correct: ok,
          latency_ms: Math.round(latency)
        });

        var feedback = document.getElementById('music-feedback');
        if (ok) {
          feedback.className = 'music-feedback music-feedback--ok';
          feedback.textContent = 'Correct — ' + state.prompt.fullLabel + ' (' + Math.round(latency) + 'ms)';
          playTone(state.prompt.freq, 300);
        } else {
          feedback.className = 'music-feedback music-feedback--bad';
          feedback.textContent = 'Not quite — ' + guessed.answerLabel + ' → correct is ' + state.prompt.answerLabel + ' (' + state.prompt.fullLabel + '). Listen:';
          if (state.mode === 'audio') {
            playTone(guessed.freq, 240);
            setTimeout(function () {
              playTone(state.prompt.freq, 400);
            }, 340);
          } else {
            playTone(state.prompt.freq, 400);
          }
        }

        state.idx += 1;
        setTimeout(function () {
          renderPrompt(state);
        }, 950);
      });
    });

    document.getElementById('music-back').addEventListener('click', function () {
      renderHome();
    });
  }

  function renderComplete(state) {
    var root = document.getElementById('music-root');
    if (!root) return;
    var pct = Math.round((state.correct / state.total) * 100);
    var set = getNoteSet(state.setId);

    root.innerHTML = '' +
      '<div class="music-wrap">' +
        '<div class="music-shell music-shell--narrow">' +
          '<div class="music-card" style="text-align:center">' +
            '<div class="music-kicker">' + (state.mode === 'visual' ? 'Visual Quiz' : 'Ear Quiz') + '</div>' +
            '<h2 class="section-title">Session Complete</h2>' +
            '<p class="section-desc">' + set.label + ' challenge finished.</p>' +
            '<div class="music-stat-grid">' +
              '<div class="music-stat"><span class="music-stat__val">' + state.correct + '/' + state.total + '</span><span class="music-stat__lbl">Correct</span></div>' +
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
      runSession(state.mode, state.setId);
    });
    document.getElementById('music-done').addEventListener('click', function () {
      renderHome();
    });
  }

  function activate() {
    renderHome();
  }

  window.mfMusicActivate = activate;

  var musicView = document.getElementById('view-music');
  if ((location.hash || '').replace('#', '') === 'music' || (musicView && musicView.classList.contains('active'))) {
    activate();
  }
})();
