import { useRef, useEffect } from 'react';
import { drawBar, drawLine } from '../../lib/charts.js';

export default function DailyChart({ drills }) {
  const barRef  = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    // Last 14 calendar days
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (13 - i));
      return d.toISOString().slice(0, 10);
    });
    const counts = days.map(day =>
      drills.filter(d => new Date(d.ts).toISOString().slice(0, 10) === day).length
    );
    const labels = days.map(d => d.slice(5)); // MM-DD
    if (barRef.current) drawBar(barRef.current, counts, labels, '#4fc3f7');
  }, [drills]);

  useEffect(() => {
    // Last 20 drill scores
    const recent = drills.slice(-20).map(d => d.score || 0);
    if (lineRef.current && recent.length > 1) drawLine(lineRef.current, recent, 'Score %', '#66bb6a');
  }, [drills]);

  return (
    <div className="activity-charts">
      <div className="activity-chart-block">
        <div className="chart-label">Activity (last 14 days)</div>
        <canvas ref={barRef} width={340} height={80} aria-label="Daily drill count" />
      </div>
      <div className="activity-chart-block">
        <div className="chart-label">Recent scores</div>
        <canvas ref={lineRef} width={340} height={80} aria-label="Recent drill scores" />
      </div>
    </div>
  );
}
