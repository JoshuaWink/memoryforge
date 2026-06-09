import { useReducer, useCallback } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { buildMaterial, scoreDrill } from './drillPlans.js';
import GuidedDrill  from './GuidedDrill.jsx';
import AdvancedDrill from './AdvancedDrill.jsx';
import DrillPresent from './DrillPresent.jsx';
import DrillRecall  from './DrillRecall.jsx';
import DrillScore   from './DrillScore.jsx';

// State machine
const PANELS = { tab: 'tab', config: 'config', present: 'present', recall: 'recall', score: 'score' };

const INIT = {
  panel:          PANELS.tab,
  tab:            'guided',   // 'guided' | 'advanced'
  config:         null,
  material:       '',
  expectedAnswer: null,
  answer:         '',
  scoreResult:    null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TAB':
      return { ...INIT, tab: action.tab };
    case 'START_DRILL': {
      const { material, expectedAnswer } = buildMaterial(action.config);
      return { ...state, panel: PANELS.present, config: action.config, material, expectedAnswer };
    }
    case 'HIDE_MATERIAL':
      return { ...state, panel: PANELS.recall };
    case 'SUBMIT_ANSWER': {
      const result = scoreDrill(state.material, action.answer, state.config, state.expectedAnswer);
      return { ...state, panel: PANELS.score, answer: action.answer, scoreResult: result };
    }
    case 'AGAIN': {
      // Same config, same material
      return { ...state, panel: PANELS.present };
    }
    case 'NEW_MATERIAL': {
      const { material, expectedAnswer } = buildMaterial(state.config);
      return { ...state, panel: PANELS.present, material, expectedAnswer };
    }
    case 'BACK_TO_CONFIG':
      return { ...state, panel: PANELS.config, config: null };
    case 'BACK_TO_TAB':
      return { ...INIT, tab: state.tab };
    default:
      return state;
  }
}

export default function DrillView({ navigate }) {
  const { saveDrill } = useApp();
  const [state, dispatch] = useReducer(reducer, INIT);

  const handleStart = useCallback((cfg) => {
    dispatch({ type: 'START_DRILL', config: cfg });
  }, []);

  const handleHide = useCallback(() => {
    dispatch({ type: 'HIDE_MATERIAL' });
  }, []);

  const handleSubmit = useCallback(async (answer) => {
    const { config, material, expectedAnswer } = state;
    const result = scoreDrill(material, answer, config, expectedAnswer);
    dispatch({ type: 'SUBMIT_ANSWER', answer });

    // Save to IDB
    await saveDrill({
      type:        config.type,
      mode:        config.mode,
      length:      config.type === 'text' ? null : config.length,
      technique:   config.technique,
      score:       result.score,
      material,
      answer,
      exposureSec: config.exposureSec,
      delaySec:    config.delaySec,
      ts:          Date.now(),
    });
  }, [state, saveDrill]);

  const handleAgain = useCallback(() => {
    dispatch({ type: 'AGAIN' });
  }, []);

  const handleNew = useCallback(() => {
    dispatch({ type: 'NEW_MATERIAL' });
  }, []);

  const handleBack = useCallback(() => {
    dispatch({ type: 'BACK_TO_TAB' });
  }, []);

  // Render
  const { panel, tab, config, material, expectedAnswer, answer, scoreResult } = state;

  if (panel === PANELS.present) {
    return (
      <section className="view-section view-section--drill">
        <button className="btn btn-ghost btn-back" onClick={handleBack}>← Back</button>
        <DrillPresent material={material} config={config} onHide={handleHide} />
      </section>
    );
  }

  if (panel === PANELS.recall) {
    return (
      <section className="view-section view-section--drill">
        <button className="btn btn-ghost btn-back" onClick={handleBack}>← Back</button>
        <DrillRecall config={config} onSubmit={handleSubmit} />
      </section>
    );
  }

  if (panel === PANELS.score) {
    return (
      <section className="view-section view-section--drill">
        <button className="btn btn-ghost btn-back" onClick={handleBack}>← Back</button>
        <DrillScore
          material={material}
          answer={answer}
          config={{ ...config, expectedAnswer }}
          scoreResult={scoreResult}
          onAgain={handleAgain}
          onNew={handleNew}
          onTimer={() => navigate('tools')}
        />
      </section>
    );
  }

  // Config / tab panel (default)
  return (
    <section className="view-section view-section--drill">
      <div className="view-header">
        <h2 className="view-title">Training Drill</h2>
        <p className="view-desc">Build working memory, recall, and encoding one rep at a time.</p>
      </div>

      <div className="tab-bar" role="tablist">
        <button
          role="tab"
          aria-selected={tab === 'guided'}
          className={`tab-btn${tab === 'guided' ? ' active' : ''}`}
          onClick={() => dispatch({ type: 'SET_TAB', tab: 'guided' })}
        >
          Guided
        </button>
        <button
          role="tab"
          aria-selected={tab === 'advanced'}
          className={`tab-btn${tab === 'advanced' ? ' active' : ''}`}
          onClick={() => dispatch({ type: 'SET_TAB', tab: 'advanced' })}
        >
          Custom
        </button>
      </div>

      {tab === 'guided'   && <GuidedDrill  onStart={handleStart} onOpenSpeed={() => navigate('speed-reading')} onOpenTools={() => navigate('tools')} />}
      {tab === 'advanced' && <AdvancedDrill onStart={handleStart} />}
    </section>
  );
}
