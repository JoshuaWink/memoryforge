// ══════════════════════════════════════════════════════════════════════════════
//  SCRIPTURE MEMORIZATION SYSTEM
// ══════════════════════════════════════════════════════════════════════════════

// -- Chunker (inline) --
function chunkVerse(text) {
  if (!text || !text.trim()) return [''];
  text = text.trim();
  var parts = splitOnPunctuation(text);
  var result = [];
  for (var i = 0; i < parts.length; i++) {
    var words = parts[i].trim().split(/\s+/);
    if (words.length > 8) {
      var sub = splitOnConjunction(parts[i].trim());
      result = result.concat(sub);
    } else {
      result.push(parts[i].trim());
    }
  }
  result = mergeTinyChunks(result);
  result = result.map(function(ch) { return ch.replace(/\s{2,}/g, ' ').trim(); }).filter(Boolean);
  return result.length === 0 ? [text] : result;
}

function splitOnPunctuation(text) {
  var parts = [];
  var remaining = text;
  while (remaining) {
    var m = remaining.match(/[,;:]\s+/);
    if (!m) { parts.push(remaining); break; }
    parts.push(remaining.slice(0, m.index + 1));
    remaining = remaining.slice(m.index + m[0].length);
  }
  return parts;
}

function splitOnConjunction(text) {
  var words = text.split(/\s+/);
  if (words.length <= 3) return [text];
  var conj = ['but', 'that', 'and', 'for', 'or', 'yet', 'so', 'nor'];
  for (var i = 3; i < words.length - 2; i++) {
    var w = words[i].toLowerCase().replace(/[^a-z]/g, '');
    if (conj.indexOf(w) >= 0) {
      return [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    }
  }
  return [text];
}

function mergeTinyChunks(chunks) {
  if (chunks.length <= 1) return chunks;
  var result = [];
  for (var i = 0; i < chunks.length; i++) {
    var words = chunks[i].trim().split(/\s+/);
    if (words.length < 3 && result.length > 0) {
      result[result.length - 1] += ' ' + chunks[i].trim();
    } else if (words.length < 3 && i < chunks.length - 1) {
      chunks[i + 1] = chunks[i].trim() + ' ' + chunks[i + 1].trim();
    } else {
      result.push(chunks[i]);
    }
  }
  return result;
}

// -- First Letter --
function toFirstLetters(text) {
  if (!text) return '';
  return text.split(/\s+/).filter(Boolean).map(function(word) {
    var trailing = word.match(/[.,;:!?'")\]]+$/);
    return word[0] + (trailing ? trailing[0] : '');
  }).join(' ');
}

function fromFirstLetters(text) {
  if (!text) return '';
  return text.split(/\s+/).filter(Boolean).map(function(word) {
    var trailing = word.match(/[.,;:!?'")\]]+$/);
    var core = trailing ? word.slice(0, -trailing[0].length) : word;
    if (core.length <= 1) return word;
    return core[0] + '_'.repeat(core.length - 1) + (trailing ? trailing[0] : '');
  }).join(' ');
}

// -- Diff Recall (LCS-based) --
function diffWords(expected, got) {
  var expW = (expected || '').trim().split(/\s+/).filter(Boolean);
  var gotW = (got || '').trim().split(/\s+/).filter(Boolean);
  if (!expW.length && !gotW.length) return [];
  if (!expW.length) return gotW.map(function(w) { return { type: 'extra', got: w }; });
  if (!gotW.length) return expW.map(function(w) { return { type: 'missing', expected: w }; });
  var lcs = computeLCS(expW, gotW);
  return buildDiff(expW, gotW, lcs);
}

function computeLCS(a, b) {
  var m = a.length, n = b.length;
  var dp = [];
  for (var i = 0; i <= m; i++) { dp[i] = []; for (var j = 0; j <= n; j++) dp[i][j] = 0; }
  for (var i2 = 1; i2 <= m; i2++) {
    for (var j2 = 1; j2 <= n; j2++) {
      if (a[i2-1] === b[j2-1]) dp[i2][j2] = dp[i2-1][j2-1] + 1;
      else dp[i2][j2] = Math.max(dp[i2-1][j2], dp[i2][j2-1]);
    }
  }
  var indices = [];
  var bi = m, bj = n;
  while (bi > 0 && bj > 0) {
    if (a[bi-1] === b[bj-1]) { indices.unshift({ ai: bi-1, bi: bj-1 }); bi--; bj--; }
    else if (dp[bi-1][bj] > dp[bi][bj-1]) bi--;
    else bj--;
  }
  return indices;
}

function buildDiff(expW, gotW, lcs) {
  var result = [], ei = 0, gi = 0, li = 0;
  while (ei < expW.length || gi < gotW.length) {
    if (li < lcs.length) {
      var ai = lcs[li].ai, bii = lcs[li].bi;
      while (ei < ai && gi < bii) { result.push({ type: 'replace', expected: expW[ei], got: gotW[gi] }); ei++; gi++; }
      while (ei < ai) { result.push({ type: 'missing', expected: expW[ei] }); ei++; }
      while (gi < bii) { result.push({ type: 'extra', got: gotW[gi] }); gi++; }
      result.push({ type: 'equal', expected: expW[ei], got: gotW[gi] });
      ei++; gi++; li++;
    } else {
      while (ei < expW.length && gi < gotW.length) { result.push({ type: 'replace', expected: expW[ei], got: gotW[gi] }); ei++; gi++; }
      while (ei < expW.length) { result.push({ type: 'missing', expected: expW[ei] }); ei++; }
      while (gi < gotW.length) { result.push({ type: 'extra', got: gotW[gi] }); gi++; }
    }
  }
  return result;
}

function scoreDiff(diff) {
  if (!diff.length) return 1.0;
  var total = diff.filter(function(d) { return d.type !== 'extra'; }).length || diff.length;
  var correct = diff.filter(function(d) { return d.type === 'equal'; }).length;
  return total === 0 ? 0 : correct / total;
}

function renderDiff(diff, container) {
  container.innerHTML = '';
  diff.forEach(function(d) {
    var span = document.createElement('span');
    span.className = 'diff-' + d.type;
    if (d.type === 'equal') span.textContent = d.expected + ' ';
    else if (d.type === 'replace') { span.textContent = d.got + ' '; span.setAttribute('data-expected', d.expected); span.title = 'Expected: ' + d.expected; }
    else if (d.type === 'missing') { span.textContent = '[' + d.expected + '] '; span.title = 'Missing word'; }
    else if (d.type === 'extra') { span.textContent = d.got + ' '; span.title = 'Extra word (not in original)'; }
    container.appendChild(span);
  });
}

// -- Spaced Repetition (SM-2) --
var SR_DAY = 86400000;

function srCreateCard(reference, now) {
  return { reference: reference, interval: 0, streak: 0, easeFactor: 2.5, nextReview: now || Date.now(), lastReview: null, layer: 0 };
}

function srReview(card, quality, now) {
  now = now || Date.now();
  var u = JSON.parse(JSON.stringify(card));
  u.lastReview = now;
  if (quality >= 3) {
    u.interval = card.interval === 0 ? 1 : card.interval === 1 ? 6 : Math.round(card.interval * card.easeFactor);
    u.streak = card.streak + 1;
  } else {
    u.interval = 1;
    u.streak = 0;
  }
  u.easeFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (u.easeFactor < 1.3) u.easeFactor = 1.3;
  u.nextReview = now + u.interval * SR_DAY;
  if (quality >= 4 && u.streak >= 3 && u.streak % 3 === 0) u.layer = Math.min((card.layer || 0) + 1, 5);
  return u;
}

// -- Verse Library (localStorage) --
var VERSE_STORAGE_KEY = 'mf_scripture_library';

function loadVerseLibrary() {
  try {
    var raw = localStorage.getItem(VERSE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { verses: [], passages: [] };
  } catch (e) { return { verses: [], passages: [] }; }
}

function saveVerseLibrary(lib) {
  try { localStorage.setItem(VERSE_STORAGE_KEY, JSON.stringify(lib)); } catch (e) {}
}

function normalizeRef(ref) {
  if (!ref) return '';
  ref = ref.trim();
  return ref.replace(/^\w+/, function(w) { return w[0].toUpperCase() + w.slice(1).toLowerCase(); });
}

function addVerse(lib, ref, text, translation, notes) {
  ref = normalizeRef(ref);
  if (!ref || !text || !text.trim()) return null;
  if (lib.verses.some(function(v) { return v.reference === ref; })) return null;
  var verse = {
    reference: ref,
    text: text.trim(),
    translation: translation || 'KJV',
    chunks: chunkVerse(text.trim()),
    card: srCreateCard(ref),
    storyNotes: notes || '',
    errors: []
  };
  lib.verses.push(verse);
  return verse;
}

function removeVerse(lib, ref) {
  ref = normalizeRef(ref);
  lib.verses = lib.verses.filter(function(v) { return v.reference !== ref; });
}

function getDueVerses(lib, now) {
  now = now || Date.now();
  return lib.verses.filter(function(v) { return v.card.nextReview <= now; })
    .sort(function(a, b) { return a.card.nextReview - b.card.nextReview; });
}

// -- Scripture UI Controller --
var scriptureLib = loadVerseLibrary();
var currentReviewQueue = [];
var currentReviewIdx = 0;
var currentDrillMode = 'first-letter';

function renderVerseList() {
  var container = $('#scripture-list');
  if (!container) return;
  if (scriptureLib.verses.length === 0) {
    container.innerHTML = '<p class="empty-state">No verses yet. Add your first verse above.</p>';
    return;
  }
  var layerNames = ['New', 'Learning', 'Familiar', 'Confident', 'Mastered', 'Deep'];
  container.innerHTML = scriptureLib.verses.map(function(v) {
    var layerName = layerNames[v.card.layer] || 'New';
    var dueText = v.card.nextReview <= Date.now() ? 'Due now' : 'Next: ' + new Date(v.card.nextReview).toLocaleDateString();
    return '<div class="verse-card" data-ref="' + v.reference + '">' +
      '<p class="verse-card__ref">' + v.reference + ' <small>(' + v.translation + ')</small></p>' +
      '<p class="verse-card__text">' + v.text + '</p>' +
      '<div class="verse-card__meta"><span>Layer: ' + layerName + '</span><span>' + dueText + '</span><span>Streak: ' + v.card.streak + '</span></div>' +
      '<div class="verse-card__actions">' +
      '<button class="btn btn-sm btn-secondary" data-action="drill-verse" data-ref="' + v.reference + '">Drill</button>' +
      '<button class="btn btn-sm btn-danger" data-action="remove-verse" data-ref="' + v.reference + '">Remove</button>' +
      '</div></div>';
  }).join('');

  container.querySelectorAll('[data-action="remove-verse"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (confirm('Remove ' + btn.dataset.ref + '?')) {
        removeVerse(scriptureLib, btn.dataset.ref);
        saveVerseLibrary(scriptureLib);
        renderVerseList();
      }
    });
  });
  container.querySelectorAll('[data-action="drill-verse"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      switchScriptureTab('drill');
      var picker = $('#drill-verse-picker');
      if (picker) picker.value = btn.dataset.ref;
      startScriptureDrill(btn.dataset.ref);
    });
  });
}

function populateDrillPicker() {
  var picker = $('#drill-verse-picker');
  if (!picker) return;
  var opts = '<option value="">Select a verse...</option>';
  scriptureLib.verses.forEach(function(v) {
    opts += '<option value="' + v.reference + '">' + v.reference + '</option>';
  });
  picker.innerHTML = opts;
}

function switchScriptureTab(tab) {
  $$('.scripture-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.stab === tab); });
  $$('.scripture-panel').forEach(function(p) { p.style.display = 'none'; });
  var panel = $('#sp-' + tab);
  if (panel) panel.style.display = '';
  if (tab === 'review') updateReviewStatus();
  if (tab === 'drill') populateDrillPicker();
  if (tab === 'library') renderVerseList();
}

// -- Add Verse --
function handleAddVerse() {
  var ref = ($('#verse-ref') || {}).value || '';
  var text = ($('#verse-text') || {}).value || '';
  var translation = ($('#verse-translation') || {}).value || 'KJV';
  var notes = ($('#verse-notes') || {}).value || '';
  if (!ref.trim() || !text.trim()) { alert('Reference and text are required.'); return; }
  var result = addVerse(scriptureLib, ref, text, translation, notes);
  if (!result) { alert('Verse already exists or invalid input.'); return; }
  saveVerseLibrary(scriptureLib);
  $('#verse-ref').value = '';
  $('#verse-text').value = '';
  $('#verse-notes').value = '';
  renderVerseList();
}

// -- Review System --
function updateReviewStatus() {
  var due = getDueVerses(scriptureLib);
  var countEl = $('#review-due-count');
  if (countEl) countEl.textContent = due.length;
  var startBtn = $('#btn-start-review');
  if (startBtn) startBtn.disabled = due.length === 0;
}

function startReview() {
  currentReviewQueue = getDueVerses(scriptureLib);
  currentReviewIdx = 0;
  if (currentReviewQueue.length === 0) return;
  showReviewCard();
}

function showReviewCard() {
  if (currentReviewIdx >= currentReviewQueue.length) {
    $('#review-card').style.display = 'none';
    $('#review-status').style.display = '';
    updateReviewStatus();
    alert('Review complete! ' + currentReviewQueue.length + ' verses reviewed.');
    return;
  }
  var verse = currentReviewQueue[currentReviewIdx];
  $('#review-status').style.display = 'none';
  $('#review-card').style.display = '';
  $('#review-ref').textContent = verse.reference;
  var layerNames = ['New', 'Learning', 'Familiar', 'Confident', 'Mastered', 'Deep'];
  $('#review-layer').textContent = 'Layer: ' + (layerNames[verse.card.layer] || 'New') + ' | Streak: ' + verse.card.streak;
  $('#review-input').value = '';
  $('#review-diff').style.display = 'none';
  $('#review-actions').style.display = 'none';
  $('#review-input').focus();
}

function checkReview() {
  var verse = currentReviewQueue[currentReviewIdx];
  var input = ($('#review-input') || {}).value || '';
  var diff = diffWords(verse.text, input);
  var diffContainer = $('#review-diff');
  diffContainer.style.display = '';
  renderDiff(diff, diffContainer);
  $('#review-actions').style.display = '';
}

function rateReview(quality) {
  var verse = currentReviewQueue[currentReviewIdx];
  var libVerse = scriptureLib.verses.find(function(v) { return v.reference === verse.reference; });
  if (libVerse) {
    libVerse.card = srReview(libVerse.card, quality);
    saveVerseLibrary(scriptureLib);
  }
  currentReviewIdx++;
  showReviewCard();
}

// -- Drill System --
function startScriptureDrill(ref) {
  var verse = scriptureLib.verses.find(function(v) { return v.reference === ref; });
  if (!verse) { $('#scripture-drill-area').style.display = 'none'; return; }
  $('#scripture-drill-area').style.display = '';
  $('#sdrill-ref').textContent = verse.reference;
  $('#sdrill-input').value = '';
  $('#sdrill-diff').style.display = 'none';
  $('#btn-sdrill-next').style.display = 'none';

  var hintEl = $('#sdrill-hint');
  if (currentDrillMode === 'first-letter') {
    hintEl.textContent = fromFirstLetters(verse.text);
    hintEl.style.display = '';
  } else if (currentDrillMode === 'chunk-recall') {
    hintEl.innerHTML = verse.chunks.map(function(ch, i) {
      return i === 0 ? '<strong>' + ch + '</strong>' : '<span style="opacity:0.3">[chunk ' + (i+1) + ']</span>';
    }).join(' ');
    hintEl.style.display = '';
  } else {
    hintEl.textContent = '';
    hintEl.style.display = 'none';
  }
  $('#sdrill-input').focus();
}

function checkScriptureDrill() {
  var ref = ($('#sdrill-ref') || {}).textContent || '';
  var verse = scriptureLib.verses.find(function(v) { return v.reference === ref; });
  if (!verse) return;
  var input = ($('#sdrill-input') || {}).value || '';
  var diff = diffWords(verse.text, input);
  var diffContainer = $('#sdrill-diff');
  diffContainer.style.display = '';
  renderDiff(diff, diffContainer);
  $('#btn-sdrill-next').style.display = '';
  var score = scoreDiff(diff);
  var quality = score >= 1.0 ? 5 : score >= 0.8 ? 4 : score >= 0.5 ? 3 : 2;
  var libVerse = scriptureLib.verses.find(function(v) { return v.reference === ref; });
  if (libVerse) {
    libVerse.card = srReview(libVerse.card, quality);
    saveVerseLibrary(scriptureLib);
  }
}

// -- Wire up Scripture events --
(function initScripture() {
  $$('.scripture-tab').forEach(function(tab) {
    tab.addEventListener('click', function() { switchScriptureTab(tab.dataset.stab); });
  });

  var addBtn = $('#btn-add-verse');
  if (addBtn) addBtn.addEventListener('click', handleAddVerse);

  var startBtn = $('#btn-start-review');
  if (startBtn) startBtn.addEventListener('click', startReview);
  var checkBtn = $('#btn-check-review');
  if (checkBtn) checkBtn.addEventListener('click', checkReview);

  $$('.review-q').forEach(function(btn) {
    btn.addEventListener('click', function() { rateReview(parseInt(btn.dataset.q)); });
  });

  $$('.scripture-mode').forEach(function(btn) {
    btn.addEventListener('click', function() {
      $$('.scripture-mode').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentDrillMode = btn.dataset.mode;
    });
  });

  var picker = $('#drill-verse-picker');
  if (picker) picker.addEventListener('change', function() {
    if (picker.value) startScriptureDrill(picker.value);
    else $('#scripture-drill-area').style.display = 'none';
  });

  var drillCheckBtn = $('#btn-sdrill-check');
  if (drillCheckBtn) drillCheckBtn.addEventListener('click', checkScriptureDrill);

  var nextBtn = $('#btn-sdrill-next');
  if (nextBtn) nextBtn.addEventListener('click', function() {
    var p = $('#drill-verse-picker');
    var idx = p.selectedIndex;
    if (idx < p.options.length - 1) { p.selectedIndex = idx + 1; startScriptureDrill(p.value); }
    else { p.selectedIndex = 0; $('#scripture-drill-area').style.display = 'none'; }
  });

  renderVerseList();
})();
