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
  // Third pass: split still-long chunks at phrase boundaries
  var refined = [];
  for (var r = 0; r < result.length; r++) {
    var rw = result[r].trim().split(/\s+/);
    if (rw.length > 8) {
      var sub2 = splitOnPhraseBoundary(result[r].trim());
      refined = refined.concat(sub2);
    } else {
      refined.push(result[r].trim());
    }
  }
  result = refined;
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

var PHRASE_BOUNDARY_WORDS = ['in', 'of', 'to', 'from', 'with', 'by', 'through', 'upon', 'into', 'unto', 'before', 'after', 'against', 'among', 'between', 'within', 'without', 'above', 'below', 'over', 'under', 'around', 'beyond', 'the', 'a', 'an', 'who', 'whom', 'whose', 'which', 'where', 'when'];

function splitOnPhraseBoundary(text) {
  var words = text.split(/\s+/);
  if (words.length <= 8) return [text];
  var mid = words.length / 2;
  var bestIdx = -1;
  var bestScore = Infinity;
  for (var i = 3; i < words.length - 2; i++) {
    var w = words[i].toLowerCase().replace(/[^a-z]/g, '');
    if (PHRASE_BOUNDARY_WORDS.indexOf(w) >= 0) {
      var dist = Math.abs(i - mid);
      if (dist < bestScore) {
        bestScore = dist;
        bestIdx = i;
      }
    }
  }
  if (bestIdx < 0) bestIdx = Math.round(mid);
  return [words.slice(0, bestIdx).join(' '), words.slice(bestIdx).join(' ')];
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


// -- Chunk Editor: manual split-point placement --
function getWordsFromText(text) {
  if (!text) return [];
  return text.trim().split(/\s+/).filter(Boolean);
}

function splitTextAtPositions(text, positions) {
  var words = getWordsFromText(text);
  if (!positions || positions.length === 0) return [words.join(' ')];
  var cuts = positions.slice().filter(function(p) { return p > 0 && p < words.length; });
  // deduplicate and sort
  cuts = cuts.filter(function(v, i, a) { return a.indexOf(v) === i; }).sort(function(a, b) { return a - b; });
  if (cuts.length === 0) return [words.join(' ')];
  var chunks = [];
  var start = 0;
  for (var i = 0; i < cuts.length; i++) {
    chunks.push(words.slice(start, cuts[i]).join(' '));
    start = cuts[i];
  }
  chunks.push(words.slice(start).join(' '));
  return chunks.filter(Boolean);
}

var chunkEditorSplits = []; // current split positions (word indices)
var verseSearchQuery = '';  // library search filter
var chunkEditorText = '';   // current text being edited

function showChunkEditor(text) {
  chunkEditorText = (text || '').trim();
  var editor = document.getElementById('chunk-editor');
  if (!chunkEditorText) { hideChunkEditor(); return; }
  editor.style.display = '';
  editor.classList.add('chunk-editor--modal');
  var backdrop = document.getElementById('chunk-editor-backdrop');
  if (backdrop) backdrop.classList.add('active');
  // Update label for add-verse context
  var label = editor.querySelector('.chunk-editor__label');
  if (label) label.textContent = 'Tap between words to set chunk boundaries';
  // Remove any leftover save/cancel buttons from edit mode
  var oldSave = document.getElementById('btn-chunk-save');
  var oldCancel = document.getElementById('btn-chunk-cancel');
  if (oldSave) oldSave.remove();
  if (oldCancel) oldCancel.remove();
  // Default splits from auto-chunker
  chunkEditorSplits = getAutoSplitPositions(chunkEditorText);
  renderChunkEditor();
}

function hideChunkEditor() {
  var editor = document.getElementById('chunk-editor');
  editor.style.display = 'none';
  editor.classList.remove('chunk-editor--modal');
  var backdrop = document.getElementById('chunk-editor-backdrop');
  if (backdrop) backdrop.classList.remove('active');
  chunkEditorSplits = [];
  chunkEditorText = '';
}

function getAutoSplitPositions(text) {
  var autoChunks = chunkVerse(text);
  if (autoChunks.length <= 1) return [];
  // Convert chunks back to word-index positions
  var positions = [];
  var wordIdx = 0;
  for (var i = 0; i < autoChunks.length; i++) {
    if (i > 0) positions.push(wordIdx);
    var chunkWords = autoChunks[i].trim().split(/\s+/).filter(Boolean);
    wordIdx += chunkWords.length;
  }
  return positions;
}

function renderChunkEditor() {
  var words = getWordsFromText(chunkEditorText);
  var container = document.getElementById('chunk-editor-words');
  container.innerHTML = '';

  // Compute which chunk index each word belongs to
  var chunkMap = [];
  var chunkIdx = 0;
  for (var i = 0; i < words.length; i++) {
    if (chunkEditorSplits.indexOf(i) >= 0 && i > 0) chunkIdx++;
    chunkMap.push(chunkIdx);
  }

  for (var w = 0; w < words.length; w++) {
    // Splitter BEFORE each word (except the first)
    if (w > 0) {
      var splitter = document.createElement('span');
      splitter.className = 'chunk-splitter';
      if (chunkEditorSplits.indexOf(w) >= 0) splitter.classList.add('active');
      splitter.dataset.idx = w;
      splitter.setAttribute('role', 'button');
      splitter.setAttribute('tabindex', '0');
      splitter.setAttribute('aria-label', 'Split before word ' + (w + 1));
      splitter.addEventListener('click', toggleSplit);
      splitter.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleSplit.call(this); }
      });
      container.appendChild(splitter);
    }

    var wordEl = document.createElement('span');
    wordEl.className = 'chunk-word';
    wordEl.textContent = words[w];
    wordEl.dataset.chunkIdx = chunkMap[w];
    wordEl.dataset.chunkEven = (chunkMap[w] % 2 === 0) ? 'true' : 'false';
    container.appendChild(wordEl);
  }

  renderChunkPreview();
}

function toggleSplit() {
  var idx = parseInt(this.dataset.idx);
  var pos = chunkEditorSplits.indexOf(idx);
  if (pos >= 0) {
    chunkEditorSplits.splice(pos, 1);
  } else {
    chunkEditorSplits.push(idx);
    chunkEditorSplits.sort(function(a, b) { return a - b; });
  }
  renderChunkEditor();
}

function renderChunkPreview() {
  var preview = document.getElementById('chunk-editor-preview');
  var chunks = splitTextAtPositions(chunkEditorText, chunkEditorSplits);
  preview.innerHTML = chunks.map(function(ch) {
    return '<span class="chunk-preview-pill">' + ch + '</span>';
  }).join('');
}

function getChunkEditorResult() {
  if (!chunkEditorText) return null;
  return {
    splits: chunkEditorSplits.slice(),
    chunks: splitTextAtPositions(chunkEditorText, chunkEditorSplits)
  };
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

// -- Bible App Paste Parser --
var BIBLE_REF_LINE_RE = /^(\d?\s?[A-Za-z][A-Za-z\s]+?)\s+(\d+:\d+(?:-\d+)?)\s*([A-Z]{2,5})?\s*$/;
var BIBLE_URL_RE = /^https?:\/\//;
var PLAIN_REF_RE = /^(\d?\s?[A-Za-z][A-Za-z\s]+?\s+\d+:\d+)\s*[-\u2013\u2014]\s*(.+)$/;

function parseBiblePaste(input) {
  if (!input || typeof input !== 'string') return [];
  input = input.trim();
  if (!input) return [];
  var result = tryBibleAppFormat(input);
  if (result.length > 0) return result;
  result = tryRefLastFormat(input);
  if (result.length > 0) return result;
  result = tryPlainFormat(input);
  return result;
}

function tryBibleAppFormat(input) {
  var lines = input.split('\n');
  var firstLine = lines[0].trim();
  var refMatch = firstLine.match(BIBLE_REF_LINE_RE);
  if (!refMatch) return [];
  var book = refMatch[1].trim();
  var chapterVerse = refMatch[2];
  var translation = refMatch[3] || '';
  var bodyLines = [];
  for (var i = 1; i < lines.length; i++) {
    var line = lines[i].trim();
    if (BIBLE_URL_RE.test(line)) continue;
    if (line) bodyLines.push(line);
  }
  var body = bodyLines.join(' ').replace(/\s{2,}/g, ' ').trim();
  if (!body) return [];
  if (/\[\d+\]/.test(body)) {
    return parseMultiVersePaste(book, chapterVerse, translation, body);
  }
  var text = body.replace(/^\[\d+\]\s*/, '').trim();
  var cv = chapterVerse.indexOf('-') >= 0 ? chapterVerse.split('-')[0] : chapterVerse;
  return [{ reference: book + ' ' + cv, text: text, translation: translation }];
}

function parseMultiVersePaste(book, chapterVerse, translation, body) {
  var parts = body.split(/\[(\d+)\]\s*/);
  var verses = [];
  var chapterNum = chapterVerse.split(':')[0];
  for (var i = 1; i < parts.length; i += 2) {
    var verseNum = parts[i];
    var text = (parts[i + 1] || '').trim();
    if (!text) continue;
    verses.push({ reference: book + ' ' + chapterNum + ':' + verseNum, text: text, translation: translation });
  }
  return verses;
}

function tryPlainFormat(input) {
  var lines = input.split('\n').map(function(l) { return l.trim(); }).filter(Boolean);
  var results = [];
  for (var i = 0; i < lines.length; i++) {
    var match = lines[i].match(PLAIN_REF_RE);
    if (match) {
      results.push({ reference: match[1].trim(), text: match[2].trim(), translation: '' });
    }
  }
  return results;
}


function tryRefLastFormat(input) {
  var lines = input.split('\n');
  var cleanLines = [];
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i].trim();
    if (l) cleanLines.push(l);
  }
  if (cleanLines.length < 2) return [];

  var refLineIdx = -1;
  var refMatch = null;
  for (var i = cleanLines.length - 1; i >= 1; i--) {
    if (BIBLE_URL_RE.test(cleanLines[i])) continue;
    var normalized = cleanLines[i].replace(/[\u2013\u2014\u2012]/g, '-');
    var m = normalized.match(BIBLE_REF_LINE_RE);
    if (m) { refLineIdx = i; refMatch = m; break; }
  }
  if (!refMatch || refLineIdx < 1) return [];

  var book = refMatch[1].trim();
  var chapterVerse = refMatch[2];
  var translation = refMatch[3] || '';

  var bodyLines = [];
  for (var j = 0; j < refLineIdx; j++) {
    if (!BIBLE_URL_RE.test(cleanLines[j])) bodyLines.push(cleanLines[j]);
  }
  var body = bodyLines.join(' ').replace(/\s{2,}/g, ' ').trim();
  if (!body) return [];

  if (/\[\d+\]/.test(body)) {
    return parseMultiVersePaste(book, chapterVerse, translation, body);
  }

  var text = body.replace(/^\[\d+\]\s*/, '').trim();
  var cv = chapterVerse.indexOf('-') >= 0 ? chapterVerse.split('-')[0] : chapterVerse;
  return [{ reference: book + ' ' + cv, text: text, translation: translation }];
}

function extractVersesFromHtml(html, urlInfo) {
  // Bible.com pages embed verse content. Try to find it.
  // The page has verse text in data attributes or in the page body.
  // Strategy: find text between content markers, split by verse numbers.
  var results = [];

  // Try to extract from page content - look for verse text patterns
  // Bible.com uses spans with class containing "verse" or data-usfm
  // Fallback: extract raw text content between known markers

  // Method 1: Look for ChapterContent or verse spans
  var versePattern = /data-usfm="[^"]*\.(\d+)"[^>]*>([^<]+)/gi;
  var m;
  while ((m = versePattern.exec(html)) !== null) {
    var vnum = parseInt(m[1], 10);
    var text = m[2].trim();
    if (text && (!urlInfo.startVerse || (vnum >= urlInfo.startVerse && vnum <= (urlInfo.endVerse || vnum)))) {
      // Accumulate text for same verse number
      var existingIdx = results.findIndex(function(r) { return r.verseNum === vnum; });
      if (existingIdx >= 0) {
        results[existingIdx].text += ' ' + text;
      } else {
        results.push({ verseNum: vnum, text: text });
      }
    }
  }

  // Method 2: Try plain text extraction if method 1 found nothing
  if (results.length === 0) {
    // Look for verse content in class="content" or similar
    var contentMatch = html.match(/<div[^>]*class="[^"]*ChapterContent[^"]*"[^>]*>(.*?)<\/div>/si);
    if (contentMatch) {
      var inner = contentMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      if (inner && urlInfo.startVerse) {
        // Single verse or range without markers - treat as one block per verse
        if (!urlInfo.endVerse || urlInfo.endVerse === urlInfo.startVerse) {
          results.push({ verseNum: urlInfo.startVerse, text: inner });
        }
      }
    }
  }

  // Build book name from URL info (approximate)
  var bookMap = {gen:'Genesis',exo:'Exodus',lev:'Leviticus',num:'Numbers',deu:'Deuteronomy',jos:'Joshua',jdg:'Judges',rut:'Ruth','1sa':'1 Samuel','2sa':'2 Samuel','1ki':'1 Kings','2ki':'2 Kings','1ch':'1 Chronicles','2ch':'2 Chronicles',ezr:'Ezra',neh:'Nehemiah',est:'Esther',job:'Job',psa:'Psalms',pro:'Proverbs',ecc:'Ecclesiastes',sng:'Song of Solomon',isa:'Isaiah',jer:'Jeremiah',lam:'Lamentations',ezk:'Ezekiel',dan:'Daniel',hos:'Hosea',jol:'Joel',amo:'Amos',oba:'Obadiah',jon:'Jonah',mic:'Micah',nam:'Nahum',hab:'Habakkuk',zep:'Zephaniah',hag:'Haggai',zec:'Zechariah',mal:'Malachi',mat:'Matthew',mrk:'Mark',luk:'Luke',jhn:'John',act:'Acts',rom:'Romans','1co':'1 Corinthians','2co':'2 Corinthians',gal:'Galatians',eph:'Ephesians',php:'Philippians',col:'Colossians','1th':'1 Thessalonians','2th':'2 Thessalonians','1ti':'1 Timothy','2ti':'2 Timothy',tit:'Titus',phm:'Philemon',heb:'Hebrews',jas:'James','1pe':'1 Peter','2pe':'2 Peter','1jn':'1 John','2jn':'2 John','3jn':'3 John',jud:'Jude',rev:'Revelation'};
  var bookName = bookMap[urlInfo.book] || urlInfo.book;

  return results.map(function(r) {
    return {
      reference: bookName + ' ' + urlInfo.chapter + ':' + r.verseNum,
      text: r.text.replace(/\s+/g, ' ').trim(),
      translation: urlInfo.translation
    };
  });
}

function parseBibleUrl(url) {
  if (!url || typeof url !== 'string') return null;
  url = url.trim();
  var m = url.match(/^https?:\/\/(?:www\.)?bible\.com\/bible\/(\d+)\/([\w]+)\.(\d+)(?:\.(\d+)(?:-(\d+))?)?\.([A-Z]+)$/i);
  if (!m) return null;
  return {
    book: m[2].toLowerCase(),
    chapter: parseInt(m[3], 10),
    startVerse: m[4] ? parseInt(m[4], 10) : null,
    endVerse: m[5] ? parseInt(m[5], 10) : (m[4] ? parseInt(m[4], 10) : null),
    translation: m[6].toUpperCase(),
    versionId: m[1],
    url: url
  };
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
var scriptureDrillMode = 'self-check';

function renderVerseList() {
  var container = $('#scripture-list');
  if (!container) return;
  // Update count badge
  var badge = document.getElementById('verse-count-badge');
  if (badge) badge.textContent = scriptureLib.verses.length ? '(' + scriptureLib.verses.length + ')' : '';
  if (scriptureLib.verses.length === 0) {
    container.innerHTML = '<p class="empty-state">No verses yet. Add your first verse above.</p>';
    return;
  }
  var q = verseSearchQuery.toLowerCase().trim();
  var filtered = q
    ? scriptureLib.verses.filter(function(v) {
        return v.reference.toLowerCase().indexOf(q) >= 0 ||
               v.text.toLowerCase().indexOf(q) >= 0 ||
               (v.translation || '').toLowerCase().indexOf(q) >= 0;
      })
    : scriptureLib.verses;
  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-state">No verses match "' + q + '".</p>';
    return;
  }
  var layerNames = ['New', 'Learning', 'Familiar', 'Confident', 'Mastered', 'Deep'];
  container.innerHTML = filtered.map(function(v) {
    var layerName = layerNames[v.card.layer] || 'New';
    var dueText = v.card.nextReview <= Date.now() ? 'Due now' : 'Next: ' + new Date(v.card.nextReview).toLocaleDateString();
    return '<div class="verse-card" data-ref="' + v.reference + '">' +
      '<p class="verse-card__ref">' + v.reference + ' <small>(' + v.translation + ')</small></p>' +
      '<p class="verse-card__text">' + v.text + '</p>' +
      '<div class="verse-card__chunks">' + (v.customChunks || v.chunks).map(function(ch) { return '<span class="chunk-preview-pill">' + ch + '</span>'; }).join('') + '</div>' +
      '<div class="verse-card__meta"><span>Layer: ' + layerName + '</span><span>' + dueText + '</span><span>Streak: ' + v.card.streak + '</span>' + (v.customChunks ? '<span class="custom-tag">Custom</span>' : '') + '</div>' +
      '<div class="verse-card__actions">' +
      '<button class="btn btn-sm btn-secondary" data-action="edit-chunks" data-ref="' + v.reference + '">Edit Chunks</button>' +
      '<button class="btn btn-sm btn-secondary" data-action="drill-verse" data-ref="' + v.reference + '">Drill</button>' +
      '<button class="btn btn-sm btn-danger" data-action="remove-verse" data-ref="' + v.reference + '">Remove</button>' +
      '</div></div>';
  }).join('');

  container.querySelectorAll('[data-action="edit-chunks"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      openChunkEditorForVerse(btn.dataset.ref);
    });
  });
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
  if (tab === 'drill') { populateDrillPicker(); populatePassagePicker(); }
  if (tab === 'library') { renderVerseList(); renderPassageList(); populatePassageCheckboxes(); }
}

// -- Add Verse --
function handleAddVerse() {
  var ref = ($('#verse-ref') || {}).value || '';
  var text = ($('#verse-text') || {}).value || '';
  var translation = ($('#verse-translation') || {}).value || 'KJV';
  var notes = ($('#verse-notes') || {}).value || '';

  // If text looks like a Bible app paste, try parsing it
  if (text && !ref.trim()) {
    var parsed = parseBiblePaste(text);
    if (parsed.length > 0) {
      // Bulk-add all parsed verses
      var added = 0;
      var addedRefs = [];
      for (var p = 0; p < parsed.length; p++) {
        var r = addVerse(scriptureLib, parsed[p].reference, parsed[p].text, parsed[p].translation || translation, notes);
        if (r) { added++; addedRefs.push(r.reference); }
      }
      if (added > 0) {
        // Auto-create passage if 2+ consecutive verses
        if (addedRefs.length >= 2) {
          var passageName = addedRefs[0] + ' \u2013 ' + addedRefs[addedRefs.length - 1];
          var existing = (scriptureLib.passages || []).find(function(p) { return p.reference === passageName; });
          if (!existing) {
            var passage = createPassageFromVerses(passageName, addedRefs);
            if (passage) savePassage(passage);
          }
        }
        saveVerseLibrary(scriptureLib);
        $('#verse-ref').value = '';
        $('#verse-text').value = '';
        $('#verse-notes').value = '';
        hideChunkEditor();
        renderVerseList();
        renderPassageList();
        populatePassageCheckboxes();
        return;
      }
      alert('Verses already exist or could not be parsed.');
      return;
    }
  }

  if (!ref.trim() || !text.trim()) { alert('Reference and text are required.'); return; }
  var result = addVerse(scriptureLib, ref, text, translation, notes);
  if (!result) { alert('Verse already exists or invalid input.'); return; }
  // Apply custom chunks from the chunk editor if any
  var editorResult = getChunkEditorResult();
  if (editorResult && editorResult.chunks.length > 0) {
    result.customChunks = editorResult.chunks;
  }
  saveVerseLibrary(scriptureLib);
  $('#verse-ref').value = '';
  $('#verse-text').value = '';
  $('#verse-notes').value = '';
  hideChunkEditor();
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

// Inline drill-modes utilities
function drillSeededRandom(seed) {
  var s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function drillShuffle(arr, rng) {
  var rand = rng || Math.random;
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(rand() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function scrambleChunks(chunks) {
  if (chunks.length <= 1) return chunks.slice();
  var scrambled = drillShuffle(chunks);
  var same = scrambled.every(function(c, i) { return c === chunks[i]; });
  if (same) { var tmp = scrambled[0]; scrambled[0] = scrambled[1]; scrambled[1] = tmp; }
  return scrambled;
}

function generateBlanks(words, ratio, seed) {
  if (ratio <= 0) return words.map(function(w, i) { return { word: w, blanked: false, index: i }; });
  if (ratio >= 1) return words.map(function(w, i) { return { word: w, blanked: true, index: i }; });
  var count = Math.round(words.length * ratio);
  var indices = words.map(function(_, i) { return i; });
  var rng = seed !== undefined ? drillSeededRandom(seed) : undefined;
  var shuffled = drillShuffle(indices, rng);
  var blankedSet = {};
  for (var k = 0; k < count; k++) blankedSet[shuffled[k]] = true;
  return words.map(function(w, i) { return { word: w, blanked: !!blankedSet[i], index: i }; });
}

function generateWordBank(blanks, distractors) {
  var correct = blanks.filter(function(b) { return b.blanked; }).map(function(b) { return b.word; });
  if (correct.length === 0) return [];
  var bank = correct.slice();
  if (distractors && distractors.length > 0) distractors.forEach(function(d) { bank.push(d); });
  return drillShuffle(bank);
}

// Drill state
var drillCurrentVerse = null;
var chunkOrderCorrect = [];
var chunkOrderSelected = [];
var fillBlankItems = [];
var fillBlankBankWords = [];
var fillBlankCurrentIdx = 0;
var flTapWords = [];
var flTapCurrentIdx = 0;

// Intelligent word pools for FL-tap distractors — thematically grouped by biblical concepts
// Each pool contains semantically similar words that could be confused in scripture context
var flTapWordPools = {
  // Faith & Worship
  'F': ['faith', 'fear', 'flesh', 'flock', 'fruit', 'favor'],
  'P': ['pray', 'praise', 'peace', 'power', 'pure', 'proud'],
  'W': ['worship', 'word', 'world', 'wise', 'walk', 'work'],
  
  // Sin & Redemption  
  'S': ['sin', 'save', 'soul', 'saint', 'serve', 'share'],
  'R': ['repent', 'redeem', 'right', 'rise', 'rule', 'rest'],
  'B': ['blood', 'bless', 'born', 'bond', 'break', 'bind'],
  
  // Life & Death
  'L': ['life', 'live', 'love', 'lord', 'last', 'lose'],
  'D': ['die', 'dead', 'day', 'dark', 'deep', 'doom'],
  'E': ['eternal', 'end', 'earth', 'evil', 'enter', 'exit'],
  
  // Action & Service
  'G': ['give', 'go', 'good', 'grace', 'grow', 'guard'],
  'H': ['help', 'hear', 'hold', 'holy', 'hope', 'humble'],
  'C': ['come', 'call', 'care', 'clean', 'cross', 'cure'],
  
  // Knowledge & Truth
  'K': ['know', 'keep', 'kind', 'king', 'kill', 'kiss'],
  'T': ['truth', 'teach', 'tell', 'thank', 'think', 'turn'],
  'U': ['understand', 'uphold', 'unite', 'urge', 'use'],
  
  // People & Relationships
  'M': ['man', 'mother', 'make', 'meet', 'mend', 'mind'],
  'O': ['other', 'one', 'old', 'open', 'own', 'obey'],
  'N': ['name', 'near', 'need', 'new', 'next', 'none'],
  
  // Nature & Creation
  'A': ['all', 'above', 'after', 'air', 'angel', 'animal'],
  'I': ['in', 'is', 'it', 'into', 'image', 'inner'],
  'Y': ['you', 'your', 'yes', 'year', 'yoke', 'yield']
};
var scriptureDrillScale = 'verse';
var drillCurrentPassage = null;
var bridgeCurrentIdx = 0;


function hideAllDrillSubs() {
  var ids = ['drill-self-check', 'drill-chunk-order', 'drill-fill-blank', 'drill-fl-tap', 'drill-typing-area', 'drill-bridge'];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}

function drillUpdateSR(ref, quality) {
  var v = scriptureLib.verses.find(function(x) { return x.reference === ref; });
  if (v) { v.card = srReview(v.card, quality); saveVerseLibrary(scriptureLib); return; }
  // Passage-level SR: ref might be a passage reference
  var p = (scriptureLib.passages || []).find(function(x) { return x.reference === ref; });
  if (p) { p.card = srReview(p.card, quality); savePassage(p); }
}

function startScriptureDrill(ref) {
  var verse = scriptureLib.verses.find(function(v) { return v.reference === ref; });
  if (!verse) { $('#scripture-drill-area').style.display = 'none'; return; }
  drillCurrentVerse = verse;
  $('#scripture-drill-area').style.display = '';
  var ds = document.getElementById('drill-settings');
  if (ds) ds.removeAttribute('open');
  $('#sdrill-ref').textContent = verse.reference;
  $('#btn-sdrill-next').style.display = 'none';
  var drillEditBtn = document.getElementById('btn-drill-edit-chunks');
  if (drillEditBtn) drillEditBtn.style.display = '';
  hideAllDrillSubs();

  if (scriptureDrillMode === 'self-check') {
    startSelfCheck(verse);
  } else if (scriptureDrillMode === 'chunk-order') {
    startChunkOrder(verse);
  } else if (scriptureDrillMode === 'fill-blank') {
    startFillBlank(verse);
  } else if (scriptureDrillMode === 'fl-tap') {
    startFlTap(verse);
  } else {
    // Legacy typing modes
    document.getElementById('drill-typing-area').style.display = '';
    var hintEl = $('#sdrill-hint');
    $('#sdrill-input').value = '';
    $('#sdrill-diff').style.display = 'none';
    if (scriptureDrillMode === 'first-letter') {
      hintEl.textContent = fromFirstLetters(verse.text);
      hintEl.style.display = '';
    } else if (scriptureDrillMode === 'chunk-recall') {
      var drillChunks = verse.customChunks || verse.chunks;
      hintEl.innerHTML = drillChunks.map(function(ch, i) {
        return i === 0 ? '<strong>' + ch + '</strong>' : '<span style="opacity:0.3">[chunk ' + (i+1) + ']</span>';
      }).join(' ');
      hintEl.style.display = '';
    } else {
      hintEl.textContent = '';
      hintEl.style.display = 'none';
    }
    $('#sdrill-input').focus();
  }
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
  drillUpdateSR(ref, quality);
}

// == Mode 1: Self-Check (flashcard) ==
function startSelfCheck(verse) {
  var el = document.getElementById('drill-self-check');
  el.style.display = '';
  document.getElementById('flashcard-reveal').style.display = 'none';
  document.getElementById('flashcard-rating').style.display = 'none';
  document.getElementById('btn-flashcard-reveal').style.display = '';
  document.getElementById('flashcard-text').textContent = verse.text;
}

function revealFlashcard() {
  document.getElementById('flashcard-reveal').style.display = '';
  document.getElementById('flashcard-rating').style.display = '';
  document.getElementById('btn-flashcard-reveal').style.display = 'none';
}

function rateFlashcard(quality) {
  var ref = drillCurrentVerse ? drillCurrentVerse.reference : '';
  drillUpdateSR(ref, quality);
  $('#btn-sdrill-next').style.display = '';
}

// == Mode 2: Chunk Ordering ==
function startChunkOrder(verse) {
  var el = document.getElementById('drill-chunk-order');
  el.style.display = '';
  chunkOrderCorrect = verse.customChunks || verse.chunks;
  chunkOrderSelected = [];
  var scrambled = scrambleChunks(chunkOrderCorrect);

  var bankEl = document.getElementById('chunk-order-bank');
  var selectedEl = document.getElementById('chunk-order-selected');
  var resultEl = document.getElementById('chunk-order-result');
  document.getElementById('btn-chunk-order-reset').style.display = 'none';
  resultEl.innerHTML = '';
  selectedEl.innerHTML = '<span style="color:var(--cup-color-text-muted);font-style:italic">Tap chunks in order\u2026</span>';

  bankEl.innerHTML = scrambled.map(function(ch, i) {
    return '<button class="chunk-pill" data-chunk-idx="' + i + '" data-chunk-text="' + escapeHtmlScripture(ch) + '">' + escapeHtmlScripture(ch) + '</button>';
  }).join('');

  bankEl.querySelectorAll('.chunk-pill').forEach(function(pill) {
    pill.addEventListener('click', function() { tapChunkPill(pill); });
  });
}

function escapeHtmlScripture(s) {
  var div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function tapChunkPill(pill) {
  if (pill.classList.contains('chunk-pill--used')) return;
  var text = pill.dataset.chunkText;
  chunkOrderSelected.push(text);
  pill.classList.add('chunk-pill--used');

  var selectedEl = document.getElementById('chunk-order-selected');
  if (chunkOrderSelected.length === 1) selectedEl.innerHTML = '';

  var idx = chunkOrderSelected.length - 1;
  var isCorrect = chunkOrderCorrect[idx] === text;
  var selPill = document.createElement('span');
  selPill.className = 'chunk-pill ' + (isCorrect ? 'chunk-pill--correct' : 'chunk-pill--wrong');
  selPill.textContent = text;
  selectedEl.appendChild(selPill);

  if (!isCorrect) {
    var resultEl = document.getElementById('chunk-order-result');
    resultEl.innerHTML = '<div class="drill-result drill-result--retry">Wrong — expected: <strong>' + escapeHtmlScripture(chunkOrderCorrect[idx]) + '</strong>. Tap the red chip to undo, or reset.</div>';
    document.getElementById('btn-chunk-order-reset').style.display = '';
    drillUpdateSR(drillCurrentVerse.reference, 2);
    // Let user tap the wrong chip in selected area to undo it
    selPill.style.cursor = 'pointer';
    selPill.addEventListener('click', function undoWrong() {
      selPill.removeEventListener('click', undoWrong);
      chunkOrderSelected.pop();
      selPill.remove();
      pill.classList.remove('chunk-pill--used');
      resultEl.innerHTML = '';
      if (chunkOrderSelected.length === 0) {
        selectedEl.innerHTML = '<span style="color:var(--cup-color-text-muted);font-style:italic">Tap chunks in order…</span>';
      }
      document.getElementById('btn-chunk-order-reset').style.display = 'none';
    });
    return;
  }

  pill.remove();

  if (chunkOrderSelected.length === chunkOrderCorrect.length) {
    var resultEl = document.getElementById('chunk-order-result');
    resultEl.innerHTML = '<div class="drill-result drill-result--perfect">Perfect! All chunks in order.</div>';
    drillUpdateSR(drillCurrentVerse.reference, 5);
    $('#btn-sdrill-next').style.display = '';
  }
}

function resetChunkOrder() {
  if (drillCurrentVerse) startChunkOrder(drillCurrentVerse);
}

// == Mode 3: Fill-in-the-Blank ==
function startFillBlank(verse) {
  var el = document.getElementById('drill-fill-blank');
  el.style.display = '';
  var words = verse.text.split(/\s+/);
  var ratio = 0.4;
  fillBlankItems = generateBlanks(words, ratio);
  fillBlankCurrentIdx = 0;

  while (fillBlankCurrentIdx < fillBlankItems.length && !fillBlankItems[fillBlankCurrentIdx].blanked) {
    fillBlankCurrentIdx++;
  }

  var distractors = getDistractorWords(verse, 4);
  fillBlankBankWords = generateWordBank(fillBlankItems, distractors);

  renderFillBlank();
}

function getDistractorWords(excludeVerse, count) {
  var allWords = [];
  scriptureLib.verses.forEach(function(v) {
    if (v.reference !== excludeVerse.reference) {
      var w = v.text.split(/\s+/);
      for (var i = 0; i < w.length; i++) allWords.push(w[i]);
    }
  });
  if (allWords.length === 0) return [];
  var shuffled = drillShuffle(allWords);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function renderFillBlank() {
  var verseEl = document.getElementById('fill-blank-verse');
  var bankEl = document.getElementById('fill-blank-bank');
  var resultEl = document.getElementById('fill-blank-result');
  resultEl.innerHTML = '';

  var totalBlanks = fillBlankItems.filter(function(it) { return it.blanked; }).length;
  var filledBlanks = fillBlankItems.filter(function(it) { return it.blanked && it.filled; }).length;
  var pct = totalBlanks > 0 ? Math.round((filledBlanks / totalBlanks) * 100) : 0;
  document.getElementById('fill-blank-fill').style.width = pct + '%';
  document.getElementById('fill-blank-label').textContent = filledBlanks + '/' + totalBlanks + ' filled';

  var html = '';
  for (var i = 0; i < fillBlankItems.length; i++) {
    var it = fillBlankItems[i];
    if (!it.blanked) {
      html += escapeHtmlScripture(it.word) + ' ';
    } else if (it.filled) {
      if (it.correct) {
        html += '<span class="blank-slot blank-slot--filled blank-slot--correct">' + escapeHtmlScripture(it.filledWord || '') + '</span> ';
      } else {
        html += '<span class="blank-slot blank-slot--filled blank-slot--wrong" data-undo-idx="' + i + '">' + escapeHtmlScripture(it.filledWord || '') + '</span> ';
      }
    } else if (i === fillBlankCurrentIdx) {
      html += '<span class="blank-slot" id="current-blank">___</span> ';
    } else {
      html += '<span class="blank-slot">___</span> ';
    }
  }
  verseEl.innerHTML = html;

  var usedWords = {};
  fillBlankItems.forEach(function(it) { if (it.filled && it.bankUsed !== undefined) usedWords[it.bankUsed] = true; });
  bankEl.innerHTML = fillBlankBankWords.map(function(w, idx) {
    var usedClass = usedWords[idx] ? ' word-option--used' : '';
    return '<button class="word-option' + usedClass + '" data-bank-idx="' + idx + '">' + escapeHtmlScripture(w) + '</button>';
  }).join('');

  bankEl.querySelectorAll('.word-option').forEach(function(btn) {
    btn.addEventListener('click', function() { tapFillBlankWord(btn); });
  });

  // Tap wrong-filled blanks to undo
  verseEl.querySelectorAll('[data-undo-idx]').forEach(function(slot) {
    slot.addEventListener('click', function() {
      var idx = parseInt(slot.dataset.undoIdx);
      var it = fillBlankItems[idx];
      if (!it || !it.filled || it.correct) return;
      it.filled = false;
      it.filledWord = null;
      it.correct = false;
      delete it.bankUsed;
      // Reset current index to the earliest unfilled blank
      fillBlankCurrentIdx = 0;
      while (fillBlankCurrentIdx < fillBlankItems.length &&
             (!fillBlankItems[fillBlankCurrentIdx].blanked || fillBlankItems[fillBlankCurrentIdx].filled)) {
        fillBlankCurrentIdx++;
      }
      renderFillBlank();
    });
  });
}

function tapFillBlankWord(btn) {
  if (btn.classList.contains('word-option--used')) return;
  var word = btn.textContent;
  var bankIdx = parseInt(btn.dataset.bankIdx);
  var it = fillBlankItems[fillBlankCurrentIdx];
  if (!it || !it.blanked) return;

  it.filled = true;
  it.filledWord = word;
  it.correct = word === it.word;
  it.bankUsed = bankIdx;

  fillBlankCurrentIdx++;
  while (fillBlankCurrentIdx < fillBlankItems.length && !fillBlankItems[fillBlankCurrentIdx].blanked) {
    fillBlankCurrentIdx++;
  }

  renderFillBlank();

  var totalBlanks = fillBlankItems.filter(function(it) { return it.blanked; }).length;
  var filledBlanks = fillBlankItems.filter(function(it) { return it.blanked && it.filled; }).length;
  if (filledBlanks === totalBlanks) {
    var correctCount = fillBlankItems.filter(function(it) { return it.blanked && it.correct; }).length;
    var resultEl = document.getElementById('fill-blank-result');
    var scorePct = Math.round((correctCount / totalBlanks) * 100);
    if (scorePct === 100) {
      resultEl.innerHTML = '<div class="drill-result drill-result--perfect">Perfect! ' + correctCount + '/' + totalBlanks + ' correct.</div>';
      drillUpdateSR(drillCurrentVerse.reference, 5);
    } else if (scorePct >= 70) {
      resultEl.innerHTML = '<div class="drill-result drill-result--good">Good! ' + correctCount + '/' + totalBlanks + ' correct (' + scorePct + '%)</div>';
      drillUpdateSR(drillCurrentVerse.reference, 4);
    } else {
      resultEl.innerHTML = '<div class="drill-result drill-result--retry">' + correctCount + '/' + totalBlanks + ' correct (' + scorePct + '%). Keep practicing!</div>';
      drillUpdateSR(drillCurrentVerse.reference, 2);
    }
    $('#btn-sdrill-next').style.display = '';
  }
}

// == Mode 4: First-Letter Tap ==
function startFlTap(verse) {
  var el = document.getElementById('drill-fl-tap');
  el.style.display = '';
  flTapWords = verse.text.split(/\s+/);
  flTapCurrentIdx = 0;

  renderFlTap();
}

function getFirstLetter(word) {
  // Return first letter (uppercase) — skip leading punctuation
  var clean = word.replace(/^[^a-zA-Z0-9]*/, '');
  return clean.length > 0 ? clean[0].toUpperCase() : word[0];
}

function renderFlTap() {
  var verseEl = document.getElementById('fl-tap-verse');
  var bankEl = document.getElementById('fl-tap-bank');
  var resultEl = document.getElementById('fl-tap-result');
  resultEl.innerHTML = '';

  // Build flowing verse text — filled words + current blank + future first-letter hints
  var html = '';
  for (var i = 0; i < flTapWords.length; i++) {
    if (i < flTapCurrentIdx) {
      // Already tapped — show full word
      html += '<span class="flt-word flt-word--filled">' + escapeHtmlScripture(flTapWords[i]) + '</span> ';
    } else if (i === flTapCurrentIdx) {
      // Current — show as active blank with first-letter hint
      html += '<span class="flt-word flt-word--current">' + getFirstLetter(flTapWords[i]) + '___</span> ';
    } else {
      // Future — show first letter only (dimmed)
      html += '<span class="flt-word flt-word--pending">' + getFirstLetter(flTapWords[i]) + '</span> ';
    }
  }
  verseEl.innerHTML = html;

  if (flTapCurrentIdx >= flTapWords.length) {
    bankEl.innerHTML = '';
    resultEl.innerHTML = '<div class="drill-result drill-result--perfect">Perfect! Every word recalled.</div>';
    drillUpdateSR(drillCurrentVerse.reference, 5);
    $('#btn-sdrill-next').style.display = '';
    return;
  }

  var correctWord = flTapWords[flTapCurrentIdx];
  var options = [correctWord];
  
  // Get distractors from word pool with same starting letter
  var firstLetter = getFirstLetter(correctWord).toUpperCase();
  var pool = flTapWordPools[firstLetter] || [];
  
  // Filter out the correct word if it's in the pool
  var targetLength = correctWord.length;
  pool = pool.filter(function(w) { 
    return w !== correctWord.toLowerCase() && 
           Math.abs(w.length - targetLength) <= 2; // Length similarity
  });
  
  // If pool is too small, add from other thematic pools (same first letter)
  if (pool.length < 3) {
    // Add some length-flexible options from the same letter pool
    var extendedPool = flTapWordPools[firstLetter] || [];
    extendedPool = extendedPool.filter(function(w) { return w !== correctWord.toLowerCase(); });
    pool = pool.concat(drillShuffle(extendedPool).slice(0, 3 - pool.length));
  }
  
  // Shuffle and take up to 3 distractors
  var distractors = drillShuffle(pool).slice(0, 3);
  options = options.concat(distractors);
  options = drillShuffle(options);

  bankEl.innerHTML = options.map(function(w) {
    return '<button class="word-option" data-fl-word="' + escapeHtmlScripture(w) + '">' + escapeHtmlScripture(w) + '</button>';
  }).join('');

  bankEl.querySelectorAll('.word-option').forEach(function(btn) {
    btn.addEventListener('click', function() { tapFlWord(btn); });
  });
}

function tapFlWord(btn) {
  var word = btn.dataset.flWord;
  var correct = flTapWords[flTapCurrentIdx];

  if (word === correct) {
    flTapCurrentIdx++;
    renderFlTap();
  } else {
    btn.classList.add('chunk-pill--wrong');
    setTimeout(function() { btn.classList.remove('chunk-pill--wrong'); }, 400);
    var resultEl = document.getElementById('fl-tap-result');
    resultEl.innerHTML = '<div class="drill-result drill-result--retry">Not quite \u2014 try again!</div>';
    drillUpdateSR(drillCurrentVerse.reference, 2);
  }
}

// -- Chunk Editor: open for existing verse --
var chunkEditingRef = null; // reference of verse being chunk-edited

function openChunkEditorForVerse(ref) {
  var verse = scriptureLib.verses.find(function(v) { return v.reference === ref; });
  if (!verse) return;
  chunkEditingRef = ref;

  // Show editor as modal overlay so user keeps their scroll position
  var editor = document.getElementById('chunk-editor');
  chunkEditorText = verse.text;
  editor.style.display = '';
  editor.classList.add('chunk-editor--modal');
  var backdrop = document.getElementById('chunk-editor-backdrop');
  if (backdrop) backdrop.classList.add('active');

  // If verse has custom chunks, reconstruct the split positions
  if (verse.customChunks) {
    chunkEditorSplits = chunksToSplitPositions(verse.text, verse.customChunks);
  } else {
    chunkEditorSplits = getAutoSplitPositions(verse.text);
  }
  renderChunkEditor();

  // Show save/cancel buttons for edit mode
  var header = editor.querySelector('.chunk-editor__header');
  // Remove any existing save/cancel buttons
  var oldSave = document.getElementById('btn-chunk-save');
  var oldCancel = document.getElementById('btn-chunk-cancel');
  if (oldSave) oldSave.remove();
  if (oldCancel) oldCancel.remove();

  var saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.id = 'btn-chunk-save';
  saveBtn.className = 'btn btn-xs btn-primary';
  saveBtn.textContent = 'Save Chunks';
  saveBtn.addEventListener('click', saveChunkEditorForVerse);
  header.appendChild(saveBtn);

  var cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.id = 'btn-chunk-cancel';
  cancelBtn.className = 'btn btn-xs btn-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', function() {
    chunkEditingRef = null;
    hideChunkEditor();
  });
  header.appendChild(cancelBtn);

  // Update label
  editor.querySelector('.chunk-editor__label').textContent = 'Editing chunks for ' + ref;

}

function chunksToSplitPositions(text, chunks) {
  var positions = [];
  var wordIdx = 0;
  for (var i = 0; i < chunks.length; i++) {
    if (i > 0) positions.push(wordIdx);
    var chunkWords = chunks[i].trim().split(/\s+/).filter(Boolean);
    wordIdx += chunkWords.length;
  }
  return positions;
}

function saveChunkEditorForVerse() {
  if (!chunkEditingRef) return;
  var savedRef = chunkEditingRef;
  var verse = scriptureLib.verses.find(function(v) { return v.reference === savedRef; });
  if (!verse) return;
  var result = getChunkEditorResult();
  if (result && result.chunks.length > 0) {
    verse.customChunks = result.chunks;
  } else {
    delete verse.customChunks;
  }
  saveVerseLibrary(scriptureLib);
  chunkEditingRef = null;
  hideChunkEditor();
  renderVerseList();
  // Restart the active drill so new chunks take effect immediately
  if (drillCurrentVerse && drillCurrentVerse.reference === savedRef) {
    startScriptureDrill(savedRef);
  } else if (drillCurrentPassage && scriptureDrillScale !== 'verse') {
    startPassageDrill(drillCurrentPassage.reference);
  }
}

// -- Import/Export --
function handleExportLibrary() {
  var data = JSON.stringify(scriptureLib, null, 2);
  var blob = new Blob([data], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'memoryforge-scripture-' + new Date().toISOString().slice(0,10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function handleImportJSON(e) {
  var file = e.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(ev) {
    try {
      var data = JSON.parse(ev.target.result);
      if (data.verses && Array.isArray(data.verses)) {
        var addedVerses = 0;
        for (var i = 0; i < data.verses.length; i++) {
          var v = data.verses[i];
          if (!scriptureLib.verses.some(function(x) { return x.reference === v.reference; })) {
            scriptureLib.verses.push(v);
            addedVerses++;
          }
        }
        var addedPassages = 0;
        if (data.passages && Array.isArray(data.passages)) {
          if (!scriptureLib.passages) scriptureLib.passages = [];
          for (var j = 0; j < data.passages.length; j++) {
            var p = data.passages[j];
            if (!scriptureLib.passages.some(function(x) { return x.reference === p.reference; })) {
              scriptureLib.passages.push(p);
              addedPassages++;
            }
          }
        }
        saveVerseLibrary(scriptureLib);
        renderVerseList();
        renderPassageList();
        populatePassagePicker();
        populatePassageCheckboxes();
        var msg = 'Imported ' + addedVerses + ' verse(s)';
        if (data.verses.length - addedVerses > 0) msg += ' (' + (data.verses.length - addedVerses) + ' duplicate verses skipped)';
        if (addedPassages > 0) msg += ', ' + addedPassages + ' passage(s)';
        alert(msg + '.');
      } else {
        alert('Invalid file format.');
      }
    } catch (err) {
      alert('Error reading file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function handleBulkPaste() {
  var textarea = $('#bulk-paste-area');
  if (!textarea) return;
  var text = textarea.value.trim();
  if (!text) { alert('Paste verse text first.'); return; }
  var parsed = parseBiblePaste(text);
  if (parsed.length === 0) { alert('Could not parse any verses from the pasted text.'); return; }
  var added = 0;
  var addedRefs = [];
  for (var i = 0; i < parsed.length; i++) {
    var r = addVerse(scriptureLib, parsed[i].reference, parsed[i].text, parsed[i].translation || 'KJV', '');
    if (r) { added++; addedRefs.push(r.reference); }
  }
  // Auto-create passage if 2+ consecutive verses imported
  if (addedRefs.length >= 2) {
    var passageName = addedRefs[0] + ' \u2013 ' + addedRefs[addedRefs.length - 1];
    var existing = (scriptureLib.passages || []).find(function(p) { return p.reference === passageName; });
    if (!existing) {
      var passage = createPassageFromVerses(passageName, addedRefs);
      if (passage) savePassage(passage);
    }
  }
  saveVerseLibrary(scriptureLib);
  renderVerseList();
  renderPassageList();
  populatePassageCheckboxes();
  textarea.value = '';
  var msg = 'Added ' + added + ' verse(s)';
  if (parsed.length - added > 0) msg += ' (' + (parsed.length - added) + ' duplicates skipped)';
  if (addedRefs.length >= 2) msg += '. Passage created automatically!';
  alert(msg);
}

// -- Wire up Scripture events --

// ======================================================================
//  PASSAGE / CHAPTER SCALE LOGIC
// ======================================================================

function createPassageFromVerses(name, refs) {
  var verses = refs.map(function(ref) {
    return scriptureLib.verses.find(function(v) { return v.reference === ref; });
  }).filter(Boolean);
  if (verses.length === 0) return null;
  var verseRefs = verses.map(function(v) { return v.reference; });
  var seams = {};
  for (var i = 0; i < verses.length - 1; i++) {
    var key = verses[i].reference + '\u2192' + verses[i + 1].reference;
    seams[key] = { strength: 0, attempts: 0 };
  }
  var sections = [];
  var sz = 5;
  for (var s = 0; s < verses.length; s += sz) {
    var end = Math.min(s + sz - 1, verses.length - 1);
    var label = verses[s].reference;
    if (end !== s) label += ' \u2013 ' + verses[end].reference;
    sections.push({ label: label, range: [s, end] });
  }
  return {
    reference: name,
    verseRefs: verseRefs,
    sections: sections,
    seams: seams,
    card: { layer: 0, streak: 0, ease: 2.5, interval: 0, nextReview: 0 }
  };
}

function savePassage(passage) {
  if (!passage) return;
  if (!scriptureLib.passages) scriptureLib.passages = [];
  var idx = scriptureLib.passages.findIndex(function(p) { return p.reference === passage.reference; });
  if (idx >= 0) scriptureLib.passages[idx] = passage;
  else scriptureLib.passages.push(passage);
  saveVerseLibrary(scriptureLib);
}

function removePassage(ref) {
  if (!scriptureLib.passages) return;
  scriptureLib.passages = scriptureLib.passages.filter(function(p) { return p.reference !== ref; });
  saveVerseLibrary(scriptureLib);
}

function getPassageVerses(passage) {
  return passage.verseRefs.map(function(ref) {
    return scriptureLib.verses.find(function(v) { return v.reference === ref; });
  }).filter(Boolean);
}

function populatePassagePicker() {
  var picker = document.getElementById('drill-passage-picker');
  if (!picker) return;
  var opts = '<option value="">Select a passage...</option>';
  (scriptureLib.passages || []).forEach(function(p) {
    opts += '<option value="' + escapeHtmlScripture(p.reference) + '">' + escapeHtmlScripture(p.reference) + ' (' + p.verseRefs.length + ' verses)</option>';
  });
  picker.innerHTML = opts;
}

function populatePassageCheckboxes() {
  var container = document.getElementById('passage-verse-checkboxes');
  if (!container) return;
  if (scriptureLib.verses.length === 0) {
    container.innerHTML = '<p class="empty-state" style="padding:var(--cup-space-sm)">Add verses first</p>';
    return;
  }
  container.innerHTML = scriptureLib.verses.map(function(v) {
    return '<label><input type="checkbox" value="' + escapeHtmlScripture(v.reference) + '"> ' + escapeHtmlScripture(v.reference) + '</label>';
  }).join('');
}

function renderPassageList() {
  var container = document.getElementById('passage-list');
  if (!container) return;
  var passages = scriptureLib.passages || [];
  // Update count badge
  var pbadge = document.getElementById('passage-count-badge');
  if (pbadge) pbadge.textContent = passages.length ? '(' + passages.length + ')' : '';
  // Hide section if empty
  var psec = document.getElementById('library-passages-section');
  if (psec) psec.style.display = passages.length ? '' : 'none';
  if (passages.length === 0) { container.innerHTML = ''; return; }
  container.innerHTML = passages.map(function(p) {
      var seamKeys = Object.keys(p.seams);
      var seamBars = seamKeys.map(function(k) {
        var s = p.seams[k].strength;
        var cls = s < 0.4 ? 'seam-bar--weak' : s < 0.7 ? 'seam-bar--medium' : 'seam-bar--strong';
        return '<div class="seam-bar ' + cls + '" title="' + escapeHtmlScripture(k) + ': ' + Math.round(s * 100) + '%"></div>';
      }).join('');
      return '<div class="passage-card">' +
        '<p class="passage-card__ref">' + escapeHtmlScripture(p.reference) + '</p>' +
        '<p class="passage-card__meta">' + p.verseRefs.length + ' verses \u00b7 ' + p.sections.length + ' section' + (p.sections.length !== 1 ? 's' : '') + '</p>' +
        (seamBars ? '<div class="passage-card__seams">' + seamBars + '</div>' : '') +
        '<div class="passage-card__actions">' +
        '<button class="btn btn-sm btn-secondary" data-action="drill-passage" data-ref="' + escapeHtmlScripture(p.reference) + '">Drill</button>' +
        '<button class="btn btn-sm btn-danger" data-action="remove-passage" data-ref="' + escapeHtmlScripture(p.reference) + '">Remove</button>' +
        '</div></div>';
    }).join('');

  container.querySelectorAll('[data-action="drill-passage"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      switchScriptureTab('drill');
      setDrillScale('chapter');
      var ppicker = document.getElementById('drill-passage-picker');
      if (ppicker) ppicker.value = btn.dataset.ref;
      startPassageDrill(btn.dataset.ref);
    });
  });
  container.querySelectorAll('[data-action="remove-passage"]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (confirm('Remove passage ' + btn.dataset.ref + '?')) {
        removePassage(btn.dataset.ref);
        renderPassageList();
      }
    });
  });
}

function setDrillScale(scale) {
  scriptureDrillScale = scale;
  $$('.drill-scale').forEach(function(b) { b.classList.toggle('active', b.dataset.scale === scale); });
  var versePicker = document.querySelector('.drill-verse-select');
  var passagePickerDiv = document.getElementById('drill-passage-select');
  if (scale === 'verse') {
    if (versePicker) versePicker.style.display = '';
    if (passagePickerDiv) passagePickerDiv.style.display = 'none';
  } else {
    if (versePicker) versePicker.style.display = 'none';
    if (passagePickerDiv) passagePickerDiv.style.display = '';
    populatePassagePicker();
  }
  document.getElementById('scripture-drill-area').style.display = 'none';
}

function startPassageDrill(ref) {
  var passage = (scriptureLib.passages || []).find(function(p) { return p.reference === ref; });
  if (!passage) { document.getElementById('scripture-drill-area').style.display = 'none'; return; }
  drillCurrentPassage = passage;
  var verses = getPassageVerses(passage);
  if (verses.length === 0) return;
  document.getElementById('scripture-drill-area').style.display = '';
  var ds = document.getElementById('drill-settings');
  if (ds) ds.removeAttribute('open');
  document.getElementById('sdrill-ref').textContent = passage.reference + ' (' + verses.length + ' verses)';
  document.getElementById('btn-sdrill-next').style.display = 'none';
  var drillEditBtnP = document.getElementById('btn-drill-edit-chunks');
  if (drillEditBtnP) drillEditBtnP.style.display = 'none';
  hideAllDrillSubs();

  if (scriptureDrillMode === 'self-check') {
    startPassageSelfCheck(passage, verses);
  } else if (scriptureDrillMode === 'chunk-order') {
    var allChunks = [];
    verses.forEach(function(v) {
      (v.customChunks || v.chunks || [v.text]).forEach(function(ch) { allChunks.push(ch); });
    });
    drillCurrentVerse = { reference: passage.reference, chunks: allChunks, text: verses.map(function(v) { return v.text; }).join(' ') };
    startChunkOrder(drillCurrentVerse);
  } else if (scriptureDrillMode === 'fill-blank') {
    startBridgeDrill(passage, verses);
  } else if (scriptureDrillMode === 'fl-tap') {
    startPassageFlTap(passage, verses);
  } else {
    startBridgeDrill(passage, verses);
  }
}

function startPassageSelfCheck(passage, verses) {
  document.getElementById('drill-self-check').style.display = '';
  var fullText = verses.map(function(v) { return v.text; }).join(' ');
  document.getElementById('flashcard-text').textContent = fullText;
  document.getElementById('flashcard-reveal').style.display = 'none';
  document.getElementById('btn-flashcard-reveal').style.display = '';
  document.getElementById('flashcard-rating').style.display = 'none';
}

function startBridgeDrill(passage, verses) {
  document.getElementById('drill-bridge').style.display = '';
  bridgeCurrentIdx = 0;
  showBridgeQuestion(passage, verses, 0);
}

function showBridgeQuestion(passage, verses, idx) {
  if (idx >= verses.length - 1) {
    document.getElementById('bridge-prompt').innerHTML = '';
    document.getElementById('bridge-bank').innerHTML = '';
    document.getElementById('bridge-result').innerHTML = '<div class="drill-result drill-result--perfect"><p>All transitions drilled!</p></div>';
    document.getElementById('btn-sdrill-next').style.display = '';
    return;
  }
  bridgeCurrentIdx = idx;
  var fromVerse = verses[idx];
  var chunks = fromVerse.chunks || [fromVerse.text];
  var prompt = chunks[chunks.length - 1];
  document.getElementById('bridge-prompt').innerHTML = '<p>\u201c...' + escapeHtmlScripture(prompt) + '\u201d</p><p style="color:var(--cup-color-text-muted);font-size:var(--cup-font-size-sm);margin-top:var(--cup-space-xs)">' + escapeHtmlScripture(fromVerse.reference) + '</p>';
  document.getElementById('bridge-result').innerHTML = '';

  var nextRef = verses[idx + 1].reference;
  var pool = [];
  for (var i = 0; i < verses.length; i++) {
    if (i !== idx && i !== idx + 1) pool.push(verses[i].reference);
  }
  for (var j = pool.length - 1; j > 0; j--) {
    var k = Math.floor(Math.random() * (j + 1));
    var tmp = pool[j]; pool[j] = pool[k]; pool[k] = tmp;
  }
  var distractors = pool.slice(0, 3);
  var options = [nextRef].concat(distractors);
  for (var m = options.length - 1; m > 0; m--) {
    var n = Math.floor(Math.random() * (m + 1));
    var t = options[m]; options[m] = options[n]; options[n] = t;
  }

  document.getElementById('bridge-bank').innerHTML = options.map(function(ref) {
    return '<button class="bridge-option" data-ref="' + escapeHtmlScripture(ref) + '">' + escapeHtmlScripture(ref) + '</button>';
  }).join('');

  document.getElementById('bridge-bank').querySelectorAll('.bridge-option').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var picked = btn.dataset.ref;
      var seamKey = fromVerse.reference + '\u2192' + nextRef;
      if (picked === nextRef) {
        btn.classList.add('bridge-option--correct');
        if (passage.seams[seamKey]) {
          passage.seams[seamKey].attempts++;
          passage.seams[seamKey].strength = Math.min(1, passage.seams[seamKey].strength + 0.15);
        }
        savePassage(passage);
        setTimeout(function() { showBridgeQuestion(passage, verses, idx + 1); }, 600);
      } else {
        btn.classList.add('bridge-option--wrong');
        if (passage.seams[seamKey]) {
          passage.seams[seamKey].attempts++;
          passage.seams[seamKey].strength = Math.max(0, passage.seams[seamKey].strength - 0.2);
        }
        savePassage(passage);
        document.getElementById('bridge-bank').querySelectorAll('.bridge-option').forEach(function(b) {
          if (b.dataset.ref === nextRef) b.classList.add('bridge-option--correct');
        });
        setTimeout(function() { showBridgeQuestion(passage, verses, idx + 1); }, 1200);
      }
      document.getElementById('bridge-bank').querySelectorAll('.bridge-option').forEach(function(b) {
        b.style.pointerEvents = 'none';
      });
    });
  });
}



function startPassageFlTap(passage, verses) {
  var allText = verses.map(function(v) { return v.text; }).join(' ');
  var words = allText.split(/\s+/).filter(Boolean);
  flTapWords = words;
  flTapCurrentIdx = 0;
  document.getElementById('drill-fl-tap').style.display = '';
  renderFlTapStep();
}

(function initScripture() {
  $$('.scripture-tab').forEach(function(tab) {
    tab.addEventListener('click', function() { switchScriptureTab(tab.dataset.stab); });
  });

  // Smart paste: detect Bible app format and auto-fill fields
  var verseTextArea = $('#verse-text');
  if (verseTextArea) {
    verseTextArea.addEventListener('paste', function(e) {
      setTimeout(function() {
        var pasted = verseTextArea.value.trim();
        var parsed = parseBiblePaste(pasted);
        if (parsed.length === 1) {
          // Auto-fill reference and translation from parsed data
          var refEl = $('#verse-ref');
          var transEl = $('#verse-translation');
          if (refEl && !refEl.value.trim()) refEl.value = parsed[0].reference;
          if (transEl && parsed[0].translation) {
            // Set translation if option exists, else select Other
            var opts = Array.from(transEl.options).map(function(o) { return o.value; });
            if (opts.indexOf(parsed[0].translation) >= 0) {
              transEl.value = parsed[0].translation;
            } else {
              transEl.value = 'Other';
            }
          }
          // Replace textarea with just the verse text
          verseTextArea.value = parsed[0].text;
          // Trigger chunk editor
          chunkEditingRef = null;
          showChunkEditor(parsed[0].text);
        } else if (parsed.length > 1) {
          // Multi-verse paste: show a toast/hint
          verseTextArea.setAttribute('placeholder', parsed.length + ' verses detected. Click Add to import all.');
        }
      }, 50);
    });
  }
  if (verseTextArea) {
    var debounceTimer = null;
    verseTextArea.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        var text = verseTextArea.value.trim();
        if (text.length > 5) {
          chunkEditingRef = null; // new verse mode
          showChunkEditor(text);
        } else {
          hideChunkEditor();
        }
      }, 400);
    });
  }

  // Auto/Clear buttons for chunk editor
  var autoBtn = $('#btn-chunk-auto');
  if (autoBtn) autoBtn.addEventListener('click', function() {
    chunkEditorSplits = getAutoSplitPositions(chunkEditorText);
    renderChunkEditor();
  });
  var clearBtn = $('#btn-chunk-clear');
  if (clearBtn) clearBtn.addEventListener('click', function() {
    chunkEditorSplits = [];
    renderChunkEditor();
  });

  // Backdrop click cancels chunk editing
  var chunkBackdrop = $('#chunk-editor-backdrop');
  if (chunkBackdrop) chunkBackdrop.addEventListener('click', function() {
    if (chunkEditingRef) {
      chunkEditingRef = null;
      hideChunkEditor();
    }
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
      scriptureDrillMode = btn.dataset.mode;
      // Auto-restart drill for current scale
      if (scriptureDrillScale === 'verse') {
        var p = $('#drill-verse-picker');
        if (p && p.value) startScriptureDrill(p.value);
      } else {
        var pp = document.getElementById('drill-passage-picker');
        if (pp && pp.value) startPassageDrill(pp.value);
      }
    });
  });

  var picker = $('#drill-verse-picker');
  if (picker) picker.addEventListener('change', function() {
    if (picker.value) startScriptureDrill(picker.value);
    else $('#scripture-drill-area').style.display = 'none';
  });

  var drillCheckBtn = $('#btn-sdrill-check');
  if (drillCheckBtn) drillCheckBtn.addEventListener('click', checkScriptureDrill);

  // Self-Check (flashcard) listeners
  var revealBtn = document.getElementById('btn-flashcard-reveal');
  if (revealBtn) revealBtn.addEventListener('click', revealFlashcard);
  var ratingDiv = document.getElementById('flashcard-rating');
  if (ratingDiv) {
    ratingDiv.querySelectorAll('.btn').forEach(function(btn) {
      btn.addEventListener('click', function() { rateFlashcard(parseInt(btn.dataset.q)); });
    });
  }

  // Chunk-order reset listener
  var chunkResetBtn = document.getElementById('btn-chunk-order-reset');
  if (chunkResetBtn) chunkResetBtn.addEventListener('click', resetChunkOrder);

  var verseSearchInput = document.getElementById('verse-search');
  if (verseSearchInput) {
    verseSearchInput.addEventListener('input', function() {
      verseSearchQuery = verseSearchInput.value;
      renderVerseList();
    });
  }

  var drillEditChunksBtn = document.getElementById('btn-drill-edit-chunks');
  if (drillEditChunksBtn) drillEditChunksBtn.addEventListener('click', function() {
    if (drillCurrentVerse && scriptureDrillScale === 'verse') {
      openChunkEditorForVerse(drillCurrentVerse.reference);
    }
  });

  var nextBtn = $('#btn-sdrill-next');
  if (nextBtn) nextBtn.addEventListener('click', function() {
    var p = $('#drill-verse-picker');
    var idx = p.selectedIndex;
    if (idx < p.options.length - 1) { p.selectedIndex = idx + 1; startScriptureDrill(p.value); }
    else { p.selectedIndex = 0; $('#scripture-drill-area').style.display = 'none'; }
  });

  // Import/Export listeners
  var exportBtn = $('#btn-export-json');
  if (exportBtn) exportBtn.addEventListener('click', handleExportLibrary);
  var importFile = $('#import-json-file');
  if (importFile) importFile.addEventListener('change', handleImportJSON);
  var bulkBtn = $('#btn-bulk-import');
  if (bulkBtn) bulkBtn.addEventListener('click', handleBulkPaste);

  // -- Bible.com URL fetch --
  var fetchUrlBtn = document.getElementById('btn-fetch-bible-url');
  if (fetchUrlBtn) fetchUrlBtn.addEventListener('click', function() {
    var urlInput = document.getElementById('bible-url-input');
    var statusEl = document.getElementById('bible-url-status');
    if (!urlInput || !urlInput.value.trim()) { if (statusEl) statusEl.textContent = 'Enter a Bible.com URL'; return; }
    var parsed = parseBibleUrl(urlInput.value.trim());
    if (!parsed) { if (statusEl) statusEl.textContent = 'Invalid Bible.com URL. Use format: bible.com/bible/116/rom.1.1-5.NLT'; return; }
    if (statusEl) statusEl.textContent = 'Fetching ' + parsed.translation + ' ' + parsed.book + ' ' + parsed.chapter + ':' + (parsed.startVerse || 1) + (parsed.endVerse && parsed.endVerse !== parsed.startVerse ? '-' + parsed.endVerse : '') + '...';
    fetchUrlBtn.disabled = true;
    fetch(parsed.url)
      .then(function(resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.text();
      })
      .then(function(html) {
        var verseData = extractVersesFromHtml(html, parsed);
        if (verseData.length === 0) {
          if (statusEl) statusEl.textContent = 'Could not extract verses from page. Try pasting text instead.';
          fetchUrlBtn.disabled = false;
          return;
        }
        var added = 0;
        var addedRefs = [];
        for (var i = 0; i < verseData.length; i++) {
          var r = addVerse(scriptureLib, verseData[i].reference, verseData[i].text, verseData[i].translation || parsed.translation, '');
          if (r) { added++; addedRefs.push(r.reference); }
        }
        if (addedRefs.length >= 2) {
          var passageName = addedRefs[0] + ' \u2013 ' + addedRefs[addedRefs.length - 1];
          var existing = (scriptureLib.passages || []).find(function(p) { return p.reference === passageName; });
          if (!existing) {
            var passage = createPassageFromVerses(passageName, addedRefs);
            if (passage) savePassage(passage);
          }
        }
        saveVerseLibrary(scriptureLib);
        renderVerseList();
        renderPassageList();
        populatePassageCheckboxes();
        urlInput.value = '';
        var msg = added + ' verse(s) added';
        if (verseData.length - added > 0) msg += ' (' + (verseData.length - added) + ' duplicates skipped)';
        if (addedRefs.length >= 2) msg += '. Passage created!';
        if (statusEl) statusEl.textContent = msg;
        fetchUrlBtn.disabled = false;
      })
      .catch(function(err) {
        if (statusEl) statusEl.textContent = 'Fetch failed: ' + err.message + '. CORS may block this \u2014 try pasting text instead.';
        fetchUrlBtn.disabled = false;
      });
  });

  // -- Chapter Import (proxy-based) --
  var CHAPTER_BOOK_CODES = {
    'genesis':'GEN','exodus':'EXO','leviticus':'LEV','numbers':'NUM','deuteronomy':'DEU',
    'joshua':'JOS','judges':'JDG','ruth':'RUT',
    '1 samuel':'1SA','2 samuel':'2SA','1 kings':'1KI','2 kings':'2KI',
    '1 chronicles':'1CH','2 chronicles':'2CH',
    'ezra':'EZR','nehemiah':'NEH','esther':'EST',
    'job':'JOB','psalms':'PSA','psalm':'PSA','proverbs':'PRO','ecclesiastes':'ECC',
    'song of solomon':'SNG','song of songs':'SNG',
    'isaiah':'ISA','jeremiah':'JER','lamentations':'LAM',
    'ezekiel':'EZK','daniel':'DAN','hosea':'HOS','joel':'JOL','amos':'AMO',
    'obadiah':'OBA','jonah':'JON','micah':'MIC','nahum':'NAM','habakkuk':'HAB',
    'zephaniah':'ZEP','haggai':'HAG','zechariah':'ZEC','malachi':'MAL',
    'matthew':'MAT','mark':'MRK','luke':'LUK','john':'JHN',
    'acts':'ACT','romans':'ROM',
    '1 corinthians':'1CO','2 corinthians':'2CO',
    'galatians':'GAL','ephesians':'EPH','philippians':'PHP','colossians':'COL',
    '1 thessalonians':'1TH','2 thessalonians':'2TH',
    '1 timothy':'1TI','2 timothy':'2TI','titus':'TIT','philemon':'PHM',
    'hebrews':'HEB','james':'JAS',
    '1 peter':'1PE','2 peter':'2PE',
    '1 john':'1JN','2 john':'2JN','3 john':'3JN',
    'jude':'JUD','revelation':'REV'
  };
  var CHAPTER_CODE_TO_NAME = {};
  Object.keys(CHAPTER_BOOK_CODES).forEach(function(name) {
    var code = CHAPTER_BOOK_CODES[name];
    if (!CHAPTER_CODE_TO_NAME[code]) {
      CHAPTER_CODE_TO_NAME[code] = name.replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    }
  });

  var PROXY_BASE = localStorage.getItem('mf_proxy_url') || 'https://bible.orchestrate.solutions';

  var chImportBtn = document.getElementById('btn-ch-import');
  if (chImportBtn) chImportBtn.addEventListener('click', function() {
    var bookInput = document.getElementById('ch-import-book');
    var chapterInput = document.getElementById('ch-import-chapter');
    var translationSelect = document.getElementById('ch-import-translation');
    var statusEl = document.getElementById('ch-import-status');

    var bookName = (bookInput ? bookInput.value.trim() : '');
    var chapter = parseInt(chapterInput ? chapterInput.value : '1', 10);
    var selOpt = translationSelect ? translationSelect.options[translationSelect.selectedIndex] : null;
    var translation = selOpt ? selOpt.value.toUpperCase() : 'NLT';
    var versionId = selOpt ? selOpt.getAttribute('data-vid') : '116';

    if (!bookName) { if (statusEl) statusEl.textContent = 'Enter a book name'; return; }
    var bookCode = CHAPTER_BOOK_CODES[bookName.toLowerCase()];
    if (!bookCode) { if (statusEl) statusEl.textContent = 'Unknown book: ' + bookName + '. Try full name (e.g. "Romans")'; return; }
    if (!chapter || chapter < 1) { if (statusEl) statusEl.textContent = 'Enter a valid chapter number'; return; }

    var humanBook = CHAPTER_CODE_TO_NAME[bookCode] || bookName;
    if (statusEl) statusEl.textContent = 'Fetching ' + humanBook + ' ' + chapter + ' ' + translation + '...';
    chImportBtn.disabled = true;

    var url = PROXY_BASE + '/api/bible/' + versionId + '/' + bookCode + '.' + chapter;
    fetch(url)
      .then(function(resp) {
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        return resp.json();
      })
      .then(function(data) {
        if (!data.verses || data.verses.length === 0) {
          if (statusEl) statusEl.textContent = 'No verses found. Check book/chapter or proxy server.';
          chImportBtn.disabled = false;
          return;
        }
        var added = 0;
        var addedRefs = [];
        for (var i = 0; i < data.verses.length; i++) {
          var v = data.verses[i];
          var ref = humanBook + ' ' + chapter + ':' + v.verse;
          var r = addVerse(scriptureLib, ref, v.text, translation, '');
          if (r) { added++; addedRefs.push(r.reference); }
        }
        // Auto-create passage for the chapter
        if (addedRefs.length >= 2) {
          var passageName = humanBook + ' ' + chapter;
          var existing = (scriptureLib.passages || []).find(function(p) { return p.reference === passageName; });
          if (!existing) {
            var passage = createPassageFromVerses(passageName, addedRefs);
            if (passage) savePassage(passage);
          }
        }
        saveVerseLibrary(scriptureLib);
        renderVerseList();
        renderPassageList();
        populatePassageCheckboxes();
        // Keep book name — advance chapter for rapid multi-chapter workflow
        if (chapterInput) chapterInput.value = chapter + 1;
        var msg = added + '/' + data.verses.length + ' verses imported for ' + humanBook + ' ' + chapter + ' ' + translation;
        if (data.verses.length - added > 0) msg += ' (' + (data.verses.length - added) + ' duplicates skipped)';
        if (addedRefs.length >= 2) msg += '. Passage created!';
        if (statusEl) statusEl.textContent = msg;
        chImportBtn.disabled = false;
      })
      .catch(function(err) {
        if (statusEl) statusEl.textContent = 'Import failed: ' + err.message + '. Is the proxy running?';
        chImportBtn.disabled = false;
      });
  });

  // -- Book Import (all chapters) --
  var BOOK_CHAPTER_COUNTS = {
    'GEN':50,'EXO':40,'LEV':27,'NUM':36,'DEU':34,'JOS':24,'JDG':21,'RUT':4,
    '1SA':31,'2SA':24,'1KI':22,'2KI':25,'1CH':29,'2CH':36,'EZR':10,'NEH':13,'EST':10,
    'JOB':42,'PSA':150,'PRO':31,'ECC':12,'SNG':8,
    'ISA':66,'JER':52,'LAM':5,'EZK':48,'DAN':12,'HOS':14,'JOL':3,'AMO':9,
    'OBA':1,'JON':4,'MIC':7,'NAM':3,'HAB':3,'ZEP':3,'HAG':2,'ZEC':14,'MAL':4,
    'MAT':28,'MRK':16,'LUK':24,'JHN':21,'ACT':28,'ROM':16,
    '1CO':16,'2CO':13,'GAL':6,'EPH':6,'PHP':4,'COL':4,
    '1TH':5,'2TH':3,'1TI':6,'2TI':4,'TIT':3,'PHM':1,
    'HEB':13,'JAS':5,'1PE':5,'2PE':3,'1JN':5,'2JN':1,'3JN':1,'JUD':1,'REV':22
  };

  var bookImportBtn = document.getElementById('btn-book-import');
  if (bookImportBtn) bookImportBtn.addEventListener('click', function() {
    var bookInput = document.getElementById('ch-import-book');
    var translationSelect = document.getElementById('ch-import-translation');
    var statusEl = document.getElementById('ch-import-status');
    var chImportBtnEl = document.getElementById('btn-ch-import');

    var bookName = (bookInput ? bookInput.value.trim() : '');
    var selOpt = translationSelect ? translationSelect.options[translationSelect.selectedIndex] : null;
    var translation = selOpt ? selOpt.value.toUpperCase() : 'NLT';
    var versionId = selOpt ? selOpt.getAttribute('data-vid') : '116';

    if (!bookName) { if (statusEl) statusEl.textContent = 'Enter a book name'; return; }
    var bookCode = CHAPTER_BOOK_CODES[bookName.toLowerCase()];
    if (!bookCode) { if (statusEl) statusEl.textContent = 'Unknown book: ' + bookName; return; }

    var totalChapters = BOOK_CHAPTER_COUNTS[bookCode];
    if (!totalChapters) { if (statusEl) statusEl.textContent = 'Chapter count unknown for ' + bookName; return; }

    var humanBook = CHAPTER_CODE_TO_NAME[bookCode] || bookName;
    bookImportBtn.disabled = true;
    if (chImportBtnEl) chImportBtnEl.disabled = true;
    if (statusEl) statusEl.textContent = 'Importing ' + humanBook + ' (' + totalChapters + ' chapters)...';

    var chapterNum = 1;
    var totalAdded = 0;

    function importNextChapter() {
      if (chapterNum > totalChapters) {
        if (statusEl) statusEl.textContent = 'Imported ' + totalAdded + ' verses across ' + totalChapters + ' chapters of ' + humanBook + ' ' + translation + '.';
        bookImportBtn.disabled = false;
        if (chImportBtnEl) chImportBtnEl.disabled = false;
        renderVerseList();
        renderPassageList();
        populatePassageCheckboxes();
        return;
      }
      var ch = chapterNum;
      if (statusEl) statusEl.textContent = 'Importing ' + humanBook + ' ' + ch + '/' + totalChapters + '...';
      var url = PROXY_BASE + '/api/bible/' + versionId + '/' + bookCode + '.' + ch;
      fetch(url)
        .then(function(resp) {
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          return resp.json();
        })
        .then(function(data) {
          if (data.verses && data.verses.length > 0) {
            var addedRefs = [];
            for (var i = 0; i < data.verses.length; i++) {
              var v = data.verses[i];
              var ref = humanBook + ' ' + ch + ':' + v.verse;
              var r = addVerse(scriptureLib, ref, v.text, translation, '');
              if (r) { totalAdded++; addedRefs.push(r.reference); }
            }
            if (addedRefs.length >= 2) {
              var passageName = humanBook + ' ' + ch;
              var existing = (scriptureLib.passages || []).find(function(p) { return p.reference === passageName; });
              if (!existing) {
                var passage = createPassageFromVerses(passageName, addedRefs);
                if (passage) savePassage(passage);
              }
            }
            saveVerseLibrary(scriptureLib);
          }
          chapterNum++;
          // Small delay to avoid hammering the proxy
          setTimeout(importNextChapter, 150);
        })
        .catch(function(err) {
          if (statusEl) statusEl.textContent = 'Failed at chapter ' + ch + ': ' + err.message;
          bookImportBtn.disabled = false;
          if (chImportBtnEl) chImportBtnEl.disabled = false;
        });
    }

    importNextChapter();
  });

  // -- Scale selector --
  $$('.drill-scale').forEach(function(btn) {
    btn.addEventListener('click', function() {
      setDrillScale(btn.dataset.scale);
    });
  });

  // -- Passage picker --
  var passagePickerEl = document.getElementById('drill-passage-picker');
  if (passagePickerEl) passagePickerEl.addEventListener('change', function() {
    if (passagePickerEl.value) startPassageDrill(passagePickerEl.value);
    else document.getElementById('scripture-drill-area').style.display = 'none';
  });

  // -- Create passage --
  var createPassageBtn = document.getElementById('btn-create-passage');
  if (createPassageBtn) createPassageBtn.addEventListener('click', function() {
    var nameEl = document.getElementById('passage-ref');
    var name = (nameEl ? nameEl.value : '').trim();
    if (!name) { alert('Enter a passage name'); return; }
    var checkboxes = document.querySelectorAll('#passage-verse-checkboxes input[type="checkbox"]:checked');
    var refs = [];
    checkboxes.forEach(function(cb) { refs.push(cb.value); });
    if (refs.length < 2) { alert('Select at least 2 verses'); return; }
    var passage = createPassageFromVerses(name, refs);
    if (!passage) { alert('Could not create passage'); return; }
    savePassage(passage);
    if (nameEl) nameEl.value = '';
    checkboxes.forEach(function(cb) { cb.checked = false; });
    renderPassageList();
  });

  // -- Chapter chunks reset --


  renderVerseList();
  renderPassageList();
  populatePassageCheckboxes();
})();
