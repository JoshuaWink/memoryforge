import { useApp } from '../../context/AppContext.jsx';
import { computeNeedScores, getPriorityData } from '../../lib/profile.js';
import StatusStrip from './StatusStrip.jsx';
import RadarChart  from './RadarChart.jsx';
import DailyChart  from './DailyChart.jsx';
import LanesGrid   from './LanesGrid.jsx';
import TodayPlan   from './TodayPlan.jsx';

export default function HomeView({ navigate }) {
  const { drills, profile, getRating } = useApp();
  const scores       = computeNeedScores(profile);
  const priorityData = getPriorityData(profile);

  return (
    <section className="view-section view-section--home">
      <div className="view-header">
        <h2 className="view-title">Dashboard</h2>
      </div>

      <StatusStrip drills={drills} />

      <div className="home-charts-row">
        <div className="home-radar-wrap">
          <RadarChart scores={scores} />
        </div>
        <DailyChart drills={drills} />
      </div>

      <TodayPlan priorityData={priorityData} navigate={navigate} />

      <div className="lanes-section">
        <h3 className="section-title">Cognitive Lanes</h3>
        <LanesGrid scores={scores} getRating={getRating} navigate={navigate} />
      </div>
    </section>
  );
}
