import { LANE_NAMES } from '../../lib/profile.js';

const DESTINATION = {
  A: 'speed-reading',
  C: 'tools',
};

export default function TodayPlan({ priorityData, navigate }) {
  // priorityData = { scores, priorityKey, secondaryKey, strengthKey }
  if (!priorityData) return null;

  const top = [
    priorityData.priorityKey,
    priorityData.secondaryKey,
  ].filter(Boolean);

  if (!top.length) return null;

  return (
    <div className="today-plan card">
      <h3 className="card-title">Today's Focus</h3>
      <p className="section-desc">Based on your profile, here's where to spend your next session.</p>
      <div className="today-plan__list">
        {top.map((lane, i) => (
          <div key={lane} className="today-plan__item">
            <div className="today-plan__rank">{i + 1}</div>
            <div className="today-plan__info">
              <div className="today-plan__lane">{LANE_NAMES[lane] || lane}</div>
              <div className="today-plan__score">Need: {Math.round(priorityData.scores[lane])}%</div>
            </div>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => navigate(DESTINATION[lane] || 'drill')}
            >
              Go
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
