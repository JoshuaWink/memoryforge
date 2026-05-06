/**
 * Stats calculator — aggregates drill history into useful metrics.
 */

/**
 * Compute stats from an array of drill results.
 * @param {Array<{ type: string, score: number, timestamp: number }>} drills
 * @returns {{ totalDrills: number, averageScore: number, bestScore: number, byType: object, today: object }}
 */
export function computeStats(drills) {
  if (drills.length === 0) {
    return {
      totalDrills: 0,
      averageScore: 0,
      bestScore: 0,
      byType: {},
      today: { count: 0, avgScore: 0 },
    };
  }

  const totalDrills = drills.length;
  const totalScore = drills.reduce((sum, d) => sum + d.score, 0);
  const averageScore = Math.round(totalScore / totalDrills);
  const bestScore = Math.max(...drills.map(d => d.score));

  // Group by type
  const byType = {};
  for (const d of drills) {
    if (!byType[d.type]) {
      byType[d.type] = { count: 0, totalScore: 0, bestScore: 0 };
    }
    byType[d.type].count++;
    byType[d.type].totalScore += d.score;
    if (d.score > byType[d.type].bestScore) {
      byType[d.type].bestScore = d.score;
    }
  }
  for (const type of Object.keys(byType)) {
    byType[type].avgScore = Math.round(byType[type].totalScore / byType[type].count);
    delete byType[type].totalScore;
  }

  // Group by technique
  const byTechnique = {};
  for (const d of drills) {
    const tech = d.technique || 'none';
    if (!byTechnique[tech]) {
      byTechnique[tech] = { count: 0, totalScore: 0, bestScore: 0 };
    }
    byTechnique[tech].count++;
    byTechnique[tech].totalScore += d.score;
    if (d.score > byTechnique[tech].bestScore) {
      byTechnique[tech].bestScore = d.score;
    }
  }
  for (const tech of Object.keys(byTechnique)) {
    byTechnique[tech].avgScore = Math.round(byTechnique[tech].totalScore / byTechnique[tech].count);
    delete byTechnique[tech].totalScore;
  }

  // Group by drill mode
  const byMode = {};
  for (const d of drills) {
    const mode = d.drillMode || 'recall';
    if (!byMode[mode]) {
      byMode[mode] = { count: 0, totalScore: 0, bestScore: 0 };
    }
    byMode[mode].count++;
    byMode[mode].totalScore += d.score;
    if (d.score > byMode[mode].bestScore) {
      byMode[mode].bestScore = d.score;
    }
  }
  for (const mode of Object.keys(byMode)) {
    byMode[mode].avgScore = Math.round(byMode[mode].totalScore / byMode[mode].count);
    delete byMode[mode].totalScore;
  }

  // Today's stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();
  const todayDrills = drills.filter(d => d.timestamp >= todayMs);
  const today = {
    count: todayDrills.length,
    avgScore: todayDrills.length > 0
      ? Math.round(todayDrills.reduce((s, d) => s + d.score, 0) / todayDrills.length)
      : 0,
  };

  return { totalDrills, averageScore, bestScore, byType, byTechnique, byMode, today };
}
