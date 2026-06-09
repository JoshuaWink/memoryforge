import RSVPTrainer from './RSVPTrainer.jsx';
import FocusTimer  from './FocusTimer.jsx';

export default function ToolsView() {
  return (
    <section className="view-section view-section--tools">
      <div className="view-header">
        <h2 className="view-title">Training Tools</h2>
        <p className="view-desc">Supplemental tools for focused practice sessions.</p>
      </div>
      <div className="tools-grid">
        <FocusTimer />
        <RSVPTrainer />
      </div>
    </section>
  );
}
