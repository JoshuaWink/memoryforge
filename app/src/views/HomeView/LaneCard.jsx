const TEASERS = {
  A: 'How fast you absorb written information without losing meaning. Trained via speed reading sessions.',
  B: "The brain's active workspace — holding and manipulating information in the short term. Trained via memory drills.",
  C: 'The ability to direct and sustain focus deliberately. Trained via focus timer sessions.',
  D: 'Building and evaluating mental models, identifying patterns, and drawing conclusions.',
  E: 'The output side of cognition — compressing and transmitting ideas clearly and precisely.',
  F: 'Cross-lane transfer — applying multiple cognitive skills simultaneously under real conditions.',
};

export default function LaneCard({ lane, label, score, rating, isOpen, onToggle, navigate }) {
  const teaser = TEASERS[lane] || '';
  // rating is an object {label, unranked, calibrating, rating, tier, games}
  const ratingLabel = rating?.label || '—';
  const ratingDetail = rating && !rating.unranked && !rating.calibrating
    ? `${rating.rating} ±${rating.rdHalf}`
    : null;

  return (
    <article
      className={`lane-card lane-card--expandable${isOpen ? ' lane-card--open' : ''}`}
      aria-expanded={isOpen}
    >
      {/* Card top — always visible */}
      <button
        className="lane-card__top"
        onClick={onToggle}
        aria-label={`${label}: ${ratingLabel}. ${isOpen ? 'Collapse' : 'Expand'}.`}
      >
        <div className="lane-card__lane-badge">{lane}</div>
        <div className="lane-card__info">
          <h3 className="lane-card__title">{label}</h3>
          <p className="lane-card__teaser">{teaser}</p>
        </div>
        <div className="lane-card__score">{ratingLabel}</div>
        <span className="lane-card__chevron" aria-hidden="true">›</span>
      </button>

      {/* Detail — visible when open */}
      {isOpen && (
        <div className="lane-card__detail" aria-hidden={!isOpen}>
          <p className="lane-card__detail-body">{teaser}</p>
          <div className="lane-card__need-score">
            <span className="lane-card__need-label">Rating</span>
            <span className="lane-card__need-value">
              {ratingDetail || ratingLabel}
              {rating?.games != null && <span className="lane-card__games"> ({rating.games} games)</span>}
            </span>
          </div>
          <div className="lane-card__actions">
            {(lane === 'A') && (
              <button className="btn btn-sm btn-primary" onClick={() => navigate('speed-reading')}>
                Go to Speed Reading
              </button>
            )}
            {(lane === 'C') && (
              <button className="btn btn-sm btn-primary" onClick={() => navigate('tools')}>
                Go to Focus Timer
              </button>
            )}
            {(lane !== 'A' && lane !== 'C') && (
              <button className="btn btn-sm btn-primary" onClick={() => navigate('drill')}>
                Go to Drill
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
