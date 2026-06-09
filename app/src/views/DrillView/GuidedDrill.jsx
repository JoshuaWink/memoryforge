import { useState } from 'react';
import { GUIDED_PLANS, getConfig, getTrainingSignal, LANE_LABELS } from './drillPlans.js';

const LEVELS = ['easy', 'steady', 'hard'];

export default function GuidedDrill({ onStart, onOpenSpeed, onOpenTools }) {
  const [plan, setPlan]   = useState('number-recall');
  const [level, setLevel] = useState('steady');
  const [customText, setCustomText] = useState('');

  const cfg    = getConfig(plan, level, customText);
  const signal = getTrainingSignal(cfg);
  const meta   = GUIDED_PLANS[plan];
  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);

  return (
    <div className="guided-drill">
      {/* Intro */}
      <div className="guided-drill__intro card">
        <h3 className="card-title">Choose the kind of practice you want</h3>
        <p className="section-desc">These presets remove the guesswork. Pick the outcome, choose the intensity, and MemoryForge fills in the drill settings for you.</p>
        <div className="guided-shortcuts">
          <span className="guided-shortcuts__label">Other lanes:</span>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onOpenSpeed}>Reading Velocity → Speed</button>
          <button type="button" className="btn btn-sm btn-ghost" onClick={onOpenTools}>Attention Control → Tools</button>
        </div>
      </div>

      {/* Plan grid */}
      <div className="guided-plan-grid">
        {Object.entries(GUIDED_PLANS).map(([key, p]) => (
          <button
            key={key}
            type="button"
            className={`guided-plan-card${plan === key ? ' active' : ''}`}
            onClick={() => setPlan(key)}
          >
            <span className="guided-plan-card__eyebrow">{p.eyebrow}</span>
            <span className="guided-plan-card__title">{p.title}</span>
            <span className="guided-plan-card__desc">{p.desc}</span>
          </button>
        ))}
      </div>

      {/* Intensity */}
      <div className="guided-level-group card">
        <h3 className="card-title">Pick the intensity</h3>
        <div className="guided-level-row" role="group" aria-label="Guided drill intensity">
          {LEVELS.map(l => (
            <button
              key={l}
              type="button"
              className={`guided-level-btn${level === l ? ' active' : ''}`}
              onClick={() => setLevel(l)}
            >
              {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Custom text for passage recall */}
      {meta.needsText && (
        <div className="field-group">
          <label className="field-label" htmlFor="guided-custom-text">Paste the exact passage you want to memorize</label>
          <textarea
            id="guided-custom-text"
            className="field-input field-textarea"
            rows={4}
            placeholder="Paste a verse, paragraph, or any text..."
            value={customText}
            onChange={e => setCustomText(e.target.value)}
          />
        </div>
      )}

      {/* Summary */}
      <div className="guided-summary card">
        <div className="guided-summary__eyebrow">What this session will do</div>
        <h3 className="card-title">{meta.title} · {levelLabel}</h3>
        <p className="section-desc">{meta.copy}</p>
        <div className="guided-summary__grid">
          <div className="guided-summary__item">
            <span className="guided-summary__label">Primary lane</span>
            <span className="guided-summary__value">{LANE_LABELS[meta.primary]}</span>
          </div>
          <div className="guided-summary__item">
            <span className="guided-summary__label">Secondary lane</span>
            <span className="guided-summary__value">{LANE_LABELS[meta.secondary]}</span>
          </div>
          <div className="guided-summary__item guided-summary__item--wide">
            <span className="guided-summary__label">Flow</span>
            <span className="guided-summary__value">{signal.flow}</span>
          </div>
        </div>
        <div className="btn-row">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onStart(cfg)}
            disabled={meta.needsText && !customText.trim()}
          >
            Start Guided Session
          </button>
        </div>
      </div>
    </div>
  );
}
