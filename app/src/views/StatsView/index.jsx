import { useApp } from '../../context/AppContext.jsx';
import { computeStats } from '../../../../src/stats.js';

function StatRow({ label, value }) {
  return (
    <div className="stat-row">
      <span className="stat-row__label">{label}</span>
      <span className="stat-row__value">{value}</span>
    </div>
  );
}

function DrillList({ drills }) {
  const recent = [...drills].reverse().slice(0, 40);
  if (!recent.length) return <p className="empty-msg">No drills yet — complete a drill to see history.</p>;
  return (
    <div className="drill-history">
      {recent.map((d, i) => (
        <div key={d.ts || i} className="drill-history__item">
          <span className="drill-history__type">{d.mode || 'recall'} · {d.type || '—'}</span>
          <span className="drill-history__score">{d.score}%</span>
          <span className="drill-history__date">{new Date(d.ts).toLocaleDateString()}</span>
        </div>
      ))}
    </div>
  );
}

export default function StatsView() {
  const { drills } = useApp();
  const stats = computeStats(drills);

  return (
    <section className="view-section view-section--stats">
      <div className="view-header">
        <h2 className="view-title">Statistics</h2>
      </div>
      <div className="stats-grid">
        <div className="card">
          <h3 className="card-title">Summary</h3>
          <StatRow label="Total Drills"  value={stats.totalDrills}      />
          <StatRow label="Average Score" value={(stats.averageScore || 0) + '%'}  />
          <StatRow label="Best Score"    value={(stats.bestScore || 0) + '%'} />
          <StatRow label="Today"         value={(stats.today?.count || 0) + ' drills'} />
        </div>
        <div className="card">
          <h3 className="card-title">Recent Activity</h3>
          <DrillList drills={drills} />
        </div>
      </div>
    </section>
  );
}
