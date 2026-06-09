import { getPegList, TECHNIQUE_INFO } from '../../../../src/mnemonic-systems.js';
import { MAJOR_TABLE } from '../../../../src/major-system.js';

const PEG_LIST = getPegList();

export default function LearnView() {
  return (
    <section className="view-section view-section--learn">
      <div className="view-header">
        <h2 className="view-title">Memory Techniques</h2>
        <p className="view-desc">Learn the techniques used in your drills — then apply them intentionally.</p>
      </div>

      {/* Technique cards */}
      {Object.entries(TECHNIQUE_INFO).map(([key, info]) => (
        <div key={key} className="card technique-card">
          <h3 className="card-title">{info.name}</h3>
          <p className="section-desc">{info.description}</p>
          {info.instructions && (
            <div className="technique-example">
              <details>
                <summary className="btn btn-sm btn-ghost">How to Practice</summary>
                <pre className="technique-instructions">{info.instructions}</pre>
              </details>
            </div>
          )}
        </div>
      ))}

      {/* Major System reference table */}
      <div className="card technique-card">
        <h3 className="card-title">Major System Reference</h3>
        <p className="section-desc">Each digit maps to consonant sounds. Build words from those consonants.</p>
        <table className="ref-table">
          <thead><tr><th>Digit</th><th>Sounds</th><th>Hint</th></tr></thead>
          <tbody>
            {Object.entries(MAJOR_TABLE).map(([digit, row]) => (
              <tr key={digit}>
                <td>{digit}</td>
                <td>{row.sounds.join(', ')}</td>
                <td>{row.hint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Peg list */}
      <div className="card technique-card">
        <h3 className="card-title">Peg List (0–9)</h3>
        <p className="section-desc">Associate each digit with a fixed vivid image to anchor sequences.</p>
        <div className="peg-grid">
          {PEG_LIST.slice(0, 10).map((peg) => (
            <div key={peg.index} className="peg-item">
              <span className="peg-item__digit">{peg.index}</span>
              <span className="peg-item__image">{peg.word}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
