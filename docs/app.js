/**
 * MemoryForge — Browser app entry point.
 * Wires DOM to drill controller + IndexedDB store.
 */

// ═══ Inline modules (no build step needed for GH Pages) ═══

// ── Drill Generator ──
const WORD_POOL = [
  'hammer', 'cloud', 'violin', 'castle', 'river', 'basket', 'lantern', 'mirror',
  'ocean', 'bridge', 'candle', 'falcon', 'garden', 'rocket', 'window', 'dragon',
  'forest', 'temple', 'anchor', 'puzzle', 'silver', 'thunder', 'crystal', 'phantom',
  'magnet', 'ribbon', 'shadow', 'beacon', 'copper', 'marble', 'glacier', 'compass',
  'feather', 'chimney', 'orchard', 'tunnel', 'volcano', 'whistle', 'blanket', 'diamond',
  'jacket', 'ladder', 'monkey', 'needle', 'orange', 'pepper', 'rabbit', 'saddle',
  'turtle', 'velvet', 'walnut', 'zipper', 'bottle', 'curtain', 'engine', 'finger',
  'guitar', 'helmet', 'insect', 'jungle', 'kettle', 'lemon', 'mushroom', 'napkin',
];

function generateDigits(length) {
  let r = '';
  for (let i = 0; i < length; i++) r += Math.floor(Math.random() * 10).toString();
  return r;
}

function generateLetters(length) {
  let r = '';
  for (let i = 0; i < length; i++) r += String.fromCharCode(65 + Math.floor(Math.random() * 26));
  return r;
}

function generateWords(count) {
  const r = [];
  for (let i = 0; i < count; i++) r.push(WORD_POOL[Math.floor(Math.random() * WORD_POOL.length)]);
  return r;
}

// ── Scoring ──
function scoreExact(original, answer) {
  if (original.length === 0 && answer.length === 0) return 100;
  if (original.length === 0) return 100;
  if (answer.length === 0) return 0;
  let correct = 0;
  for (let i = 0; i < original.length; i++) {
    if (i < answer.length && answer[i] === original[i]) correct++;
  }
  return Math.round((correct / original.length) * 100);
}

function scoreText(original, answer) {
  const origWords = original.trim() === '' ? [] : original.trim().toLowerCase().split(/\s+/);
  const ansWords = answer.trim() === '' ? [] : answer.trim().toLowerCase().split(/\s+/);
  if (origWords.length === 0 && ansWords.length === 0) return { score: 100, correct: [], missing: [], wrong: [] };
  if (origWords.length === 0) return { score: 100, correct: [], missing: [], wrong: [] };
  if (ansWords.length === 0) return { score: 0, correct: [], missing: [...origWords], wrong: [] };

  const correct = [], missing = [], wrong = [];
  const ansUsed = new Array(ansWords.length).fill(false);
  for (let i = 0; i < origWords.length; i++) {
    if (i < ansWords.length && ansWords[i] === origWords[i]) {
      correct.push(origWords[i]);
      ansUsed[i] = true;
    } else {
      missing.push(origWords[i]);
    }
  }
  for (let i = 0; i < ansWords.length; i++) {
    if (!ansUsed[i]) wrong.push(ansWords[i]);
  }
  const score = origWords.length > 0 ? Math.round((correct.length / origWords.length) * 100) : 100;
  return { score, correct, missing, wrong };
}

// ── Stats ──
function computeStats(drills) {
  if (drills.length === 0) return { totalDrills: 0, averageScore: 0, bestScore: 0, byType: {}, today: { count: 0, avgScore: 0 } };
  const totalDrills = drills.length;
  const totalScore = drills.reduce((s, d) => s + d.score, 0);
  const averageScore = Math.round(totalScore / totalDrills);
  const bestScore = Math.max(...drills.map(d => d.score));

  const byType = {};
  for (const d of drills) {
    if (!byType[d.type]) byType[d.type] = { count: 0, totalScore: 0, bestScore: 0 };
    byType[d.type].count++;
    byType[d.type].totalScore += d.score;
    if (d.score > byType[d.type].bestScore) byType[d.type].bestScore = d.score;
  }
  for (const t of Object.keys(byType)) {
    byType[t].avgScore = Math.round(byType[t].totalScore / byType[t].count);
    delete byType[t].totalScore;
  }

  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayDrills = drills.filter(d => d.timestamp >= todayStart.getTime());
  const today = {
    count: todayDrills.length,
    avgScore: todayDrills.length > 0 ? Math.round(todayDrills.reduce((s, d) => s + d.score, 0) / todayDrills.length) : 0,
  };
  return { totalDrills, averageScore, bestScore, byType, today };
}

// ═══ IndexedDB Store ═══
const DB_NAME = 'memoryforge';
const DB_VERSION = 1;
const STORE_NAME = 'drills';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbSave(result) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(result);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbClear() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbExport() {
  const drills = await dbGetAll();
  return {
    version: 1,
    exported: new Date().toISOString().slice(0, 10),
    app: 'memoryforge',
    data: { drills },
  };
}

async function dbImport(blob, opts = {}) {
  if (!blob || blob.version !== 1) throw new Error('Unsupported file version');
  if (!opts.merge) await dbClear();
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const d of blob.data.drills) {
      const clean = { ...d };
      delete clean.id; // auto-increment on import
      store.add(clean);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ═══ App Controller ═══
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

let currentMaterial = null;
let currentConfig = null;
let timerInterval = null;

// ── Navigation ──
$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.view').forEach(v => v.classList.remove('active'));
    $(`#view-${btn.dataset.view}`).classList.add('active');

    if (btn.dataset.view === 'stats') refreshStats();
  });
});

// ── Drill Type Toggle ──
$('#drill-type').addEventListener('change', (e) => {
  const isText = e.target.value === 'text';
  $('#length-group').style.display = isText ? 'none' : '';
  $('#custom-text-group').style.display = isText ? '' : 'none';
});

// ── Start Drill ──
$('#btn-start').addEventListener('click', () => {
  const type = $('#drill-type').value;
  const length = parseInt($('#drill-length').value, 10);
  const exposureSec = parseInt($('#exposure-time').value, 10);

  if (type === 'text') {
    const text = $('#custom-text').value.trim();
    if (!text) { alert('Paste some text to memorize.'); return; }
    currentMaterial = text;
    currentConfig = { type: 'text', length: text.split(/\s+/).length, exposureMs: exposureSec * 1000 };
  } else {
    currentConfig = { type, length, exposureMs: exposureSec * 1000 };
    switch (type) {
      case 'digits': currentMaterial = generateDigits(length); break;
      case 'letters': currentMaterial = generateLetters(length); break;
      case 'words': currentMaterial = generateWords(length).join(' '); break;
    }
  }

  showPanel('present');
  const display = $('#material-display');
  display.textContent = currentMaterial;
  display.classList.toggle('text-mode', type === 'text' || type === 'words');

  // Timer
  if (exposureSec > 0) {
    const fill = $('#timer-fill');
    const startTime = Date.now();
    const duration = exposureSec * 1000;
    fill.style.width = '100%';
    timerInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 1 - elapsed / duration) * 100;
      fill.style.width = pct + '%';
      if (elapsed >= duration) {
        clearInterval(timerInterval);
        hideAndRecall();
      }
    }, 50);
  } else {
    $('#timer-fill').style.width = '0%';
  }
});

// ── I've Got It ──
$('#btn-hide').addEventListener('click', () => {
  clearInterval(timerInterval);
  hideAndRecall();
});

function hideAndRecall() {
  showPanel('recall');
  const input = $('#recall-input');
  input.value = '';
  input.focus();
}

// ── Submit Answer ──
$('#btn-submit').addEventListener('click', submitAnswer);
$('#recall-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitAnswer();
  }
});

async function submitAnswer() {
  const answer = $('#recall-input').value;
  let score, diffHtml;

  if (currentConfig.type === 'words' || currentConfig.type === 'text') {
    const result = scoreText(currentMaterial, answer);
    score = result.score;
    diffHtml = buildTextDiff(currentMaterial, answer);
  } else {
    score = scoreExact(currentMaterial, answer);
    diffHtml = buildCharDiff(currentMaterial, answer);
  }

  // Show score
  showPanel('score');
  const circle = $('#score-circle');
  $('#score-value').textContent = score;
  circle.className = 'score-circle ' + (score === 100 ? 'perfect' : score >= 80 ? 'good' : score >= 50 ? 'ok' : 'bad');
  $('#score-diff').innerHTML = diffHtml;

  // Save to IndexedDB
  const drillResult = {
    type: currentConfig.type,
    length: currentConfig.length,
    material: currentMaterial,
    answer,
    score,
    timestamp: Date.now(),
  };
  try { await dbSave(drillResult); } catch (e) { console.error('Failed to save:', e); }
}

function buildCharDiff(original, answer) {
  let html = '<div><strong>Expected:</strong></div><div>';
  for (let i = 0; i < original.length; i++) {
    if (i < answer.length && answer[i] === original[i]) {
      html += `<span class="diff-correct">${escapeHtml(original[i])}</span>`;
    } else {
      html += `<span class="diff-missing">${escapeHtml(original[i])}</span>`;
    }
  }
  html += '</div>';
  if (answer.length > 0) {
    html += '<div style="margin-top:8px"><strong>Your answer:</strong></div><div>';
    for (let i = 0; i < answer.length; i++) {
      if (i < original.length && answer[i] === original[i]) {
        html += `<span class="diff-correct">${escapeHtml(answer[i])}</span>`;
      } else {
        html += `<span class="diff-wrong">${escapeHtml(answer[i])}</span>`;
      }
    }
    html += '</div>';
  }
  return html;
}

function buildTextDiff(original, answer) {
  const origWords = original.trim().split(/\s+/);
  const ansWords = answer.trim() === '' ? [] : answer.trim().split(/\s+/);
  let html = '<div><strong>Expected:</strong></div><div>';
  for (let i = 0; i < origWords.length; i++) {
    if (i < ansWords.length && ansWords[i].toLowerCase() === origWords[i].toLowerCase()) {
      html += `<span class="diff-correct">${escapeHtml(origWords[i])}</span> `;
    } else {
      html += `<span class="diff-missing">${escapeHtml(origWords[i])}</span> `;
    }
  }
  html += '</div>';
  if (ansWords.length > 0) {
    html += '<div style="margin-top:8px"><strong>Your answer:</strong></div><div>';
    for (let i = 0; i < ansWords.length; i++) {
      if (i < origWords.length && ansWords[i].toLowerCase() === origWords[i].toLowerCase()) {
        html += `<span class="diff-correct">${escapeHtml(ansWords[i])}</span> `;
      } else {
        html += `<span class="diff-wrong">${escapeHtml(ansWords[i])}</span> `;
      }
    }
    html += '</div>';
  }
  return html;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ── Drill Again (same config) ──
$('#btn-again').addEventListener('click', () => {
  $('#btn-start').click();
});

// ── New Config ──
$('#btn-new').addEventListener('click', () => {
  showPanel('config');
});

function showPanel(name) {
  ['config', 'present', 'recall', 'score'].forEach(p => {
    $(`#drill-${p}`).style.display = p === name ? '' : 'none';
  });
}

// ═══ Stats ═══
async function refreshStats() {
  try {
    const drills = await dbGetAll();
    const stats = computeStats(drills);
    $('#stat-total').textContent = stats.totalDrills;
    $('#stat-avg').textContent = stats.averageScore + '%';
    $('#stat-best').textContent = stats.bestScore + '%';
    $('#stat-today').textContent = stats.today.count;

    const typesEl = $('#stats-by-type');
    typesEl.innerHTML = '';
    for (const [type, data] of Object.entries(stats.byType)) {
      typesEl.innerHTML += `
        <div class="type-stat">
          <span class="type-name">${escapeHtml(type)}</span>
          <span class="type-details">${data.count} drills · avg ${data.avgScore}% · best ${data.bestScore}%</span>
        </div>`;
    }
  } catch (e) {
    console.error('Failed to load stats:', e);
  }
}

// ═══ Data Management ═══
$('#btn-export').addEventListener('click', async () => {
  try {
    const data = await dbExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memoryforge-${data.exported}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Export failed:', e);
    alert('Export failed. See console.');
  }
});

$('#btn-import').addEventListener('click', () => {
  $('#import-file').click();
});

$('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const merge = confirm('Merge with existing data? (Cancel = replace all)');
    await dbImport(data, { merge });
    alert(`Imported ${data.data.drills.length} drills.`);
    e.target.value = '';
  } catch (err) {
    console.error('Import failed:', err);
    alert('Import failed: ' + err.message);
  }
});

$('#btn-clear').addEventListener('click', async () => {
  if (!confirm('Delete ALL training data? This cannot be undone.')) return;
  try {
    await dbClear();
    alert('All data cleared.');
    refreshStats();
  } catch (e) {
    console.error('Clear failed:', e);
  }
});

// ═══ PWA Service Worker ═══
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
