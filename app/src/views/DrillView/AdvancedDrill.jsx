import { useState, useEffect } from 'react';
import { getTrainingSignal, describeFlow } from './drillPlans.js';

const SAVED_KEY = 'mf_saved_configs';
const LAST_KEY  = 'mf_last_config';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '{}'); } catch (_) { return {}; }
}
function saveSaved(map) { localStorage.setItem(SAVED_KEY, JSON.stringify(map)); }

const DEFAULTS = {
  mode: 'recall', type: 'digits', length: 6, technique: 'none',
  chunkSize: 3, exposureSec: 5, delaySec: 0, customText: '',
};

export default function AdvancedDrill({ onStart, initialConfig }) {
  const [cfg, setCfg] = useState(() => {
    const last = (() => { try { return JSON.parse(localStorage.getItem(LAST_KEY) || 'null'); } catch (_) { return null; } })();
    return { ...DEFAULTS, ...(initialConfig || last || {}) };
  });
  const [savedConfigs, setSavedConfigs] = useState(loadSaved);
  const [selectedPreset, setSelectedPreset] = useState('');

  // Persist last config
  useEffect(() => {
    localStorage.setItem(LAST_KEY, JSON.stringify(cfg));
  }, [cfg]);

  // Derived signal
  const signal = getTrainingSignal(cfg);

  const set = (field, val) => setCfg(prev => ({ ...prev, [field]: val }));

  const isEncodeOrDecode = cfg.mode === 'encode' || cfg.mode === 'decode';
  const showType    = !isEncodeOrDecode;
  const showLength  = !isEncodeOrDecode && cfg.type !== 'text';
  const showText    = !isEncodeOrDecode && cfg.type === 'text';
  const showTech    = !isEncodeOrDecode;
  const showChunk   = !isEncodeOrDecode && cfg.technique === 'chunking';

  function handleSave() {
    const name = prompt('Name this config:');
    if (!name) return;
    const updated = { ...loadSaved(), [name]: cfg };
    saveSaved(updated);
    setSavedConfigs(updated);
  }

  function handleDeletePreset() {
    if (!selectedPreset) return;
    const updated = { ...savedConfigs };
    delete updated[selectedPreset];
    saveSaved(updated);
    setSavedConfigs(updated);
    setSelectedPreset('');
  }

  function handlePresetLoad(name) {
    setSelectedPreset(name);
    if (name && savedConfigs[name]) setCfg({ ...DEFAULTS, ...savedConfigs[name] });
  }

  return (
    <div className="advanced-drill">
      {/* Training signal */}
      <div className="card advanced-drill__summary">
        <h3 className="card-title">What these settings train</h3>
        <div className="guided-summary__grid">
          <div className="guided-summary__item">
            <span className="guided-summary__label">Primary lane</span>
            <span className="guided-summary__value">{signal.primary}</span>
          </div>
          <div className="guided-summary__item">
            <span className="guided-summary__label">Secondary lane</span>
            <span className="guided-summary__value">{signal.secondary}</span>
          </div>
          <div className="guided-summary__item guided-summary__item--wide">
            <span className="guided-summary__label">What will happen</span>
            <span className="guided-summary__value">{signal.flow}</span>
          </div>
        </div>
        <p className="section-desc" style={{marginTop:'var(--cup-space-sm)'}}>{signal.note}</p>
      </div>

      {/* Saved configs */}
      <div className="config-presets">
        <div className="config-presets__row">
          <select
            className="field-input config-presets__select"
            value={selectedPreset}
            onChange={e => handlePresetLoad(e.target.value)}
          >
            <option value="">Saved Configs...</option>
            {Object.keys(savedConfigs).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          <button className="btn btn-secondary config-presets__save" onClick={handleSave} title="Save current config">Save</button>
          <button className="btn config-presets__delete" onClick={handleDeletePreset} title="Delete selected">×</button>
        </div>
      </div>

      {/* Form fields */}
      <div className="field-group">
        <label className="field-label" htmlFor="adv-mode">Drill Mode</label>
        <select id="adv-mode" className="field-input" value={cfg.mode} onChange={e => set('mode', e.target.value)}>
          <option value="recall">Recall (see → remember → type)</option>
          <option value="encode">Encode (digits → type the word)</option>
          <option value="decode">Decode (word → type the digits)</option>
        </select>
      </div>

      {showType && (
        <div className="field-group">
          <label className="field-label" htmlFor="adv-type">Type</label>
          <select id="adv-type" className="field-input" value={cfg.type} onChange={e => set('type', e.target.value)}>
            <option value="digits">Digits (0-9)</option>
            <option value="letters">Letters (A-Z)</option>
            <option value="words">Words</option>
            <option value="text">Custom Text</option>
          </select>
        </div>
      )}

      {showLength && (
        <div className="field-group">
          <label className="field-label" htmlFor="adv-length">Length</label>
          <input id="adv-length" type="number" className="field-input" value={cfg.length} min={1} max={200}
            onChange={e => set('length', parseInt(e.target.value, 10) || 1)} />
        </div>
      )}

      {showText && (
        <div className="field-group">
          <label className="field-label" htmlFor="adv-custom-text">Paste Text</label>
          <textarea id="adv-custom-text" className="field-input field-textarea" rows={4}
            placeholder="Paste a verse, paragraph, or any text..."
            value={cfg.customText} onChange={e => set('customText', e.target.value)} />
        </div>
      )}

      {showTech && (
        <div className="field-group">
          <label className="field-label" htmlFor="adv-technique">Technique</label>
          <select id="adv-technique" className="field-input" value={cfg.technique} onChange={e => set('technique', e.target.value)}>
            <option value="none">None (raw recall)</option>
            <option value="chunking">Chunking</option>
            <option value="number-shape">Number-Shape</option>
            <option value="number-rhyme">Number-Rhyme</option>
            <option value="major">Major System</option>
            <option value="linking">Linking / Story</option>
          </select>
        </div>
      )}

      {showChunk && (
        <div className="field-group">
          <label className="field-label" htmlFor="adv-chunk">Chunk Size</label>
          <select id="adv-chunk" className="field-input" value={cfg.chunkSize} onChange={e => set('chunkSize', parseInt(e.target.value, 10))}>
            <option value={2}>Pairs (2)</option>
            <option value={3}>Triples (3)</option>
            <option value={4}>Quads (4)</option>
          </select>
        </div>
      )}

      <div className="field-group">
        <label className="field-label" htmlFor="adv-exposure">Exposure (seconds)</label>
        <input id="adv-exposure" type="number" className="field-input" value={cfg.exposureSec} min={0} max={120}
          onChange={e => set('exposureSec', parseInt(e.target.value, 10) || 0)} />
        <div className="field-hint">Set to 0 for unlimited (tap "I've got it")</div>
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="adv-delay">Recall Delay (seconds)</label>
        <input id="adv-delay" type="number" className="field-input" value={cfg.delaySec} min={0} max={60}
          onChange={e => set('delaySec', parseInt(e.target.value, 10) || 0)} />
        <div className="field-hint">Forces you to hold info in memory before typing.</div>
      </div>

      <button className="btn btn-primary btn-lg" onClick={() => onStart(cfg)}
        disabled={cfg.type === 'text' && !cfg.customText.trim()}>
        Start Custom Drill
      </button>
    </div>
  );
}
