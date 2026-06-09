import { useState } from 'react';
import { LANE_NAMES } from '../../lib/profile.js';
import LaneCard from './LaneCard.jsx';

const LANES = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function LanesGrid({ scores, getRating, navigate }) {
  const [openLane, setOpenLane] = useState(null);

  return (
    <div className="lanes-grid">
      {LANES.map(lane => (
        <LaneCard
          key={lane}
          lane={lane}
          label={LANE_NAMES[lane]}
          score={scores[lane]}
          rating={getRating(lane)}
          isOpen={openLane === lane}
          onToggle={() => setOpenLane(openLane === lane ? null : lane)}
          navigate={navigate}
        />
      ))}
    </div>
  );
}
