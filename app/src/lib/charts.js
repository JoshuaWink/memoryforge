// Canvas chart utilities — radar, bar, and line charts using cup-ui color tokens
const BG      = '#16213e';
const GRID    = '#2a2a45';
const MUTED   = '#888';
const PRIMARY = '#4fc3f7';
const SUCCESS = '#66bb6a';
const WARN    = '#ffa726';

function setup(canvas) {
  const rect = canvas.getBoundingClientRect();
  const r    = window.devicePixelRatio || 1;
  canvas.width  = rect.width  * r;
  canvas.height = rect.height * r;
  const ctx = canvas.getContext('2d');
  ctx.scale(r, r);
  return { ctx, W: rect.width, H: rect.height };
}

function noData(canvas, msg) {
  const { ctx, W, H } = setup(canvas);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = MUTED; ctx.font = '13px system-ui';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(msg || 'No data yet.', W / 2, H / 2);
}

/** 6-axis radar for cognitive lane need scores (values 0–100) */
export function drawRadar(canvas, scores) {
  const labels = ['Reading','Recall','Focus','Reason','Express','Integrate'];
  const vals   = [scores.A, scores.B, scores.C, scores.D, scores.E, scores.F];
  const { ctx, W, H } = setup(canvas);
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  const cx = W / 2, cy = H / 2;
  const maxR = Math.min(cx, cy) - 36;
  const n = 6, rings = 4;

  const angle = i => (Math.PI * 2 * i / n) - Math.PI / 2;
  const point = (i, r) => ({ x: cx + r * Math.cos(angle(i)), y: cy + r * Math.sin(angle(i)) });

  for (let ring = 1; ring <= rings; ring++) {
    const rr = maxR * ring / rings;
    ctx.beginPath();
    for (let k = 0; k < n; k++) {
      const p = point(k, rr);
      k === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.strokeStyle = GRID; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = MUTED; ctx.font = '9px system-ui';
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.round(100 * ring / rings)), cx + rr + 3, cy);
  }

  for (let i = 0; i < n; i++) {
    const p = point(i, maxR);
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = GRID; ctx.lineWidth = 1; ctx.stroke();
  }

  ctx.font = '11px system-ui'; ctx.fillStyle = MUTED;
  for (let i = 0; i < n; i++) {
    const p = point(i, maxR + 18);
    ctx.textAlign    = p.x < cx - 2 ? 'right' : p.x > cx + 2 ? 'left' : 'center';
    ctx.textBaseline = p.y < cy - 2 ? 'bottom' : p.y > cy + 2 ? 'top' : 'middle';
    ctx.fillText(labels[i], p.x, p.y);
  }

  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const r = maxR * (vals[i] / 100);
    const p = point(i, r);
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(79,195,247,.18)'; ctx.fill();
  ctx.strokeStyle = PRIMARY; ctx.lineWidth = 2; ctx.stroke();

  for (let i = 0; i < n; i++) {
    const r = maxR * (vals[i] / 100);
    const p = point(i, r);
    ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    const v = vals[i];
    ctx.fillStyle = v >= 70 ? WARN : v >= 40 ? PRIMARY : SUCCESS;
    ctx.fill();
  }
}

/** Bar chart */
export function drawBar(canvas, data, labels, color = PRIMARY) {
  const slotW        = canvas.getBoundingClientRect().width / (data.length || 1);
  const maxLabelLen  = labels.reduce((m, l) => Math.max(m, l.length), 0);
  const rotate       = maxLabelLen * 6.5 > slotW;
  const { ctx, W, H } = setup(canvas);
  const p = { t: 14, r: 12, b: rotate ? 58 : 34, l: 38 };
  const w = W - p.l - p.r, h = H - p.t - p.b;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  if (!data.length) { noData(canvas); return; }
  const max  = Math.max(...data) || 1;
  const barW = (w / data.length) * 0.65;
  const gap  = (w / data.length) * 0.35;

  for (let i = 0; i <= 3; i++) {
    const y = p.t + h * (1 - i / 3);
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.l, y); ctx.lineTo(p.l + w, y); ctx.stroke();
    ctx.fillStyle = MUTED; ctx.font = '10px system-ui';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(max * i / 3), p.l - 4, y);
  }

  data.forEach((v, i) => {
    const x = p.l + (w / data.length) * i + gap / 2;
    const bh = h * (v / max), y2 = p.t + h - bh;
    ctx.fillStyle = v > 0 ? color : GRID;
    ctx.beginPath();
    const rad = 2;
    ctx.moveTo(x + rad, y2);
    ctx.lineTo(x + barW - rad, y2);
    ctx.quadraticCurveTo(x + barW, y2, x + barW, y2 + rad);
    ctx.lineTo(x + barW, y2 + bh); ctx.lineTo(x, y2 + bh);
    ctx.lineTo(x, y2 + rad);
    ctx.quadraticCurveTo(x, y2, x + rad, y2);
    ctx.fill();
  });

  ctx.fillStyle = MUTED; ctx.font = '10px system-ui';
  const step = Math.max(1, Math.ceil(labels.length / 8));
  if (rotate) {
    labels.forEach((l, i) => {
      if (i % step !== 0) return;
      const x = p.l + (w / data.length) * i + (w / data.length) / 2;
      ctx.save(); ctx.translate(x, p.t + h + 6); ctx.rotate(-Math.PI / 4);
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(l, 0, 0); ctx.restore();
    });
  } else {
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    labels.forEach((l, i) => {
      if (i % step === 0) {
        const x = p.l + (w / data.length) * i + (w / data.length) / 2;
        ctx.fillText(l, x, H - 22);
      }
    });
  }
}

/** Line chart */
export function drawLine(canvas, data, _yLabel, color = SUCCESS) {
  const { ctx, W, H } = setup(canvas);
  const p = { t: 14, r: 16, b: 30, l: 38 };
  const w = W - p.l - p.r, h = H - p.t - p.b;
  ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
  if (!data.length) { noData(canvas); return; }
  const max = Math.max(...data) * 1.1 || 1;
  const min = Math.min(0, ...data);
  const range = max - min || 1;

  for (let i = 0; i <= 3; i++) {
    const val = min + range * i / 3;
    const y   = p.t + h * (1 - i / 3);
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(p.l, y); ctx.lineTo(p.l + w, y); ctx.stroke();
    ctx.fillStyle = MUTED; ctx.font = '10px system-ui';
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(val) + '%', p.l - 4, y);
  }

  const grad = ctx.createLinearGradient(0, p.t, 0, p.t + h);
  grad.addColorStop(0, 'rgba(79,195,247,.3)');
  grad.addColorStop(1, 'rgba(79,195,247,.02)');
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = p.l + w * (i / Math.max(1, data.length - 1));
    const y = p.t + h * (1 - (v - min) / range);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(p.l + w, p.t + h); ctx.lineTo(p.l, p.t + h);
  ctx.closePath(); ctx.fillStyle = grad; ctx.fill();

  ctx.beginPath(); ctx.lineJoin = 'round'; ctx.lineWidth = 2; ctx.strokeStyle = color;
  data.forEach((v, i) => {
    const x = p.l + w * (i / Math.max(1, data.length - 1));
    const y = p.t + h * (1 - (v - min) / range);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  data.forEach((v, i) => {
    const x = p.l + w * (i / Math.max(1, data.length - 1));
    const y = p.t + h * (1 - (v - min) / range);
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  });
}
