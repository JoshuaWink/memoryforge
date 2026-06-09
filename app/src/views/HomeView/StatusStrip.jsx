export default function StatusStrip({ drills }) {
  // Streak: consecutive calendar days (UTC) ending today that have at least one drill
  function computeStreak(drills) {
    if (!drills.length) return 0;
    const days = new Set(drills.map(d => new Date(d.ts).toISOString().slice(0, 10)));
    let streak = 0;
    const now = new Date();
    for (let offset = 0; ; offset++) {
      const d = new Date(now);
      d.setDate(d.getDate() - offset);
      if (days.has(d.toISOString().slice(0, 10))) streak++;
      else break;
    }
    return streak;
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayDrills  = drills.filter(d => new Date(d.ts).toISOString().slice(0, 10) === today);
  const streak       = computeStreak(drills);
  const avgScore     = drills.length ? Math.round(drills.reduce((s, d) => s + (d.score || 0), 0) / drills.length) : 0;

  // Last reading WPM from localStorage
  let wpm = null;
  try {
    const s = JSON.parse(localStorage.getItem('mf_speed_v1') || 'null');
    const sessions = s?.sessions;
    if (sessions?.length) wpm = sessions[sessions.length - 1].wpm;
  } catch (_) { /* ignore */ }

  const items = [
    { label: 'Streak',     value: streak,          unit: 'days'  },
    { label: 'Today',      value: todayDrills.length, unit: 'drills' },
    { label: 'Total',      value: drills.length,   unit: 'drills' },
    { label: 'Avg Score',  value: avgScore + '%',  unit: ''       },
    { label: 'Reading',    value: wpm ? wpm + ' wpm' : '—', unit: '' },
  ];

  return (
    <div className="status-strip" aria-label="Training stats">
      {items.map(item => (
        <div key={item.label} className="status-strip__item">
          <span className="status-strip__value">{item.value}</span>
          <span className="status-strip__label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
