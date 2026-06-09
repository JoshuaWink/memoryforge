export default function AssessmentView({ navigate }) {
  return (
    <section className="view-section view-section--assessment">
      <div className="view-header">
        <h2 className="view-title">Cognitive Assessment</h2>
        <p className="view-desc">Run a baseline assessment to calibrate your cognitive profile across all six lanes.</p>
      </div>

      <div className="assessment-intro card">
        <p>Assessment mode guides you through a standardized set of drills for each cognitive lane and uses the results to set your Glicko-2 starting ratings and profile scores.</p>
        <p className="section-desc" style={{ marginTop: 'var(--cup-space-sm)' }}>
          This feature is coming soon. For now, start with a few guided drills to let your ratings calibrate organically.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('drill')}>
          Start Drilling Instead
        </button>
      </div>
    </section>
  );
}
