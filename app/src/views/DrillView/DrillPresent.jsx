import { useEffect, useRef, useState } from 'react';
import { getDefaultWords, encodeMajor, chunkDigits } from '../../../../src/major-system.js';
import { NUMBER_SHAPE, NUMBER_RHYME } from '../../../../src/mnemonic-systems.js';

const HINTS = {
  none:           '',
  chunking:       '💡 Read the chunks rhythmically. Group them in your mind.',
  'number-shape': '💡 Picture the shape of each digit. Build a visual scene.',
  'number-rhyme': '💡 Think of the rhyme word for each digit. Chain them together.',
  major:          '💡 Convert digit pairs to consonants, then to words. Visualize each word.',
  linking:        '💡 Create a vivid, absurd story connecting each item.',
};

function buildMajorRefHtml() {
  const majorWords = getDefaultWords();
  let rows = '';
  for (let i = 0; i < 100; i++) {
    const key = i.toString().padStart(2, '0');
    rows += `<tr><td>${key}</td><td>${majorWords[key]}</td></tr>`;
  }
  return `<table class="ref-table"><tr><th>#</th><th>Word</th></tr>${rows}</table>`;
}

function buildShapeRefHtml() {
  let rows = '';
  for (let d = 0; d <= 9; d++) rows += `<tr><td>${d}</td><td>${NUMBER_SHAPE[d].shape}</td></tr>`;
  return `<table class="ref-table"><tr><th>Digit</th><th>Shape</th></tr>${rows}</table>`;
}

function buildRhymeRefHtml() {
  let rows = '';
  for (let d = 0; d <= 9; d++) rows += `<tr><td>${d}</td><td>${NUMBER_RHYME[d].rhyme}</td></tr>`;
  return `<table class="ref-table"><tr><th>Digit</th><th>Rhyme</th></tr>${rows}</table>`;
}

function getRefHtml(technique, type) {
  if (technique === 'major'        && type === 'digits') return buildMajorRefHtml();
  if (technique === 'number-shape') return buildShapeRefHtml();
  if (technique === 'number-rhyme') return buildRhymeRefHtml();
  return null;
}

function formatMaterial(material, cfg) {
  const { type, technique, chunkSize } = cfg;
  if (type === 'digits' && technique === 'chunking' && chunkSize > 0) {
    const chunks = chunkDigits(material, chunkSize);
    return chunks.join(' ');
  }
  return material;
}

export default function DrillPresent({ material, config, onHide }) {
  const fillRef = useRef(null);
  const [refOpen, setRefOpen] = useState(false);
  const refHtml = getRefHtml(config.technique, config.type);
  const hint    = HINTS[config.technique] || '';

  // Countdown timer
  useEffect(() => {
    if (config.exposureSec <= 0) return;
    const start    = Date.now();
    const duration = config.exposureSec * 1000;
    if (fillRef.current) fillRef.current.style.width = '100%';

    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct     = Math.max(0, 1 - elapsed / duration) * 100;
      if (fillRef.current) fillRef.current.style.width = pct + '%';
      if (elapsed >= duration) {
        clearInterval(id);
        onHide();
      }
    }, 50);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isTextMode = config.type === 'text' || config.type === 'words';
  const display    = formatMaterial(material, config);

  return (
    <div className="drill-present">
      <div className="timer-bar" id="timer-bar-fill-wrap">
        <div className="timer-fill" ref={fillRef} />
      </div>

      {hint && <div className="technique-hint">{hint}</div>}

      <div className={`material-display${isTextMode ? ' text-mode' : ''}`}>
        {display}
      </div>

      {refHtml && (
        <div className="ref-card-container">
          <button className="btn btn-sm btn-ghost" onClick={() => setRefOpen(o => !o)}>
            {refOpen ? 'Hide Reference Card' : 'Show Reference Card'}
          </button>
          {refOpen && (
            <div className="ref-card" dangerouslySetInnerHTML={{ __html: refHtml }} />
          )}
        </div>
      )}

      <button className="btn btn-secondary" onClick={() => { onHide(); }}>I've got it</button>
    </div>
  );
}
