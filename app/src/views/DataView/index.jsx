import { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';
import { createDemoBundle } from '../../lib/demo.js';

export default function DataView() {
  const { clearAll, exportBundle, importBundle } = useApp();
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    const bundle = await exportBundle();
    const json   = JSON.stringify(bundle, null, 2);
    const blob   = new Blob([json], { type: 'application/json' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href = url;
    a.download = `memoryforge-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Exported!');
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg('');
    try {
      const text   = await file.text();
      const bundle = JSON.parse(text);
      const result = await importBundle(bundle, { merge: false });
      setMsg(`Imported ${result.drillCount} drills.`);
    } catch (err) {
      setMsg('Import failed: ' + err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function handleLoadDemo() {
    setBusy(true);
    setMsg('');
    try {
      const demo   = createDemoBundle();
      const result = await importBundle(demo, { merge: false });
      setMsg(`Loaded demo data (${result.drillCount} drills).`);
    } catch (err) {
      setMsg('Failed: ' + err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    if (!window.confirm('Clear all data? This cannot be undone.')) return;
    await clearAll();
    setMsg('All data cleared.');
  }

  return (
    <section className="view-section view-section--data">
      <div className="view-header">
        <h2 className="view-title">Data Management</h2>
        <p className="view-desc">Import, export, or reset your training data.</p>
      </div>

      <div className="data-actions card">
        <div className="data-action-row">
          <div>
            <div className="data-action__label">Export</div>
            <div className="data-action__desc">Download all drills and settings as a JSON backup.</div>
          </div>
          <button className="btn btn-secondary" onClick={handleExport} disabled={busy}>Export</button>
        </div>

        <div className="data-action-row">
          <div>
            <div className="data-action__label">Import</div>
            <div className="data-action__desc">Restore from a JSON backup file.</div>
          </div>
          <label className={`btn btn-secondary${busy ? ' disabled' : ''}`}>
            Import
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
          </label>
        </div>

        <div className="data-action-row">
          <div>
            <div className="data-action__label">Load Demo Data</div>
            <div className="data-action__desc">Populate with sample drills and profile for testing.</div>
          </div>
          <button className="btn btn-ghost" onClick={handleLoadDemo} disabled={busy}>Load Demo</button>
        </div>

        <div className="data-action-row data-action-row--danger">
          <div>
            <div className="data-action__label">Clear All Data</div>
            <div className="data-action__desc">Permanently removes all drills, ratings, and settings.</div>
          </div>
          <button className="btn btn-danger" onClick={handleClear} disabled={busy}>Clear All</button>
        </div>
      </div>

      <section className="data-roadmap card" aria-labelledby="data-roadmap-title">
        <div className="data-roadmap__eyebrow">Roadmap</div>
        <h3 id="data-roadmap-title" className="data-roadmap__title">Reading Guide Roadmap</h3>
        <p className="data-roadmap__desc">The guide is moving toward a single, reusable reading surface that feels like a normal page and can travel with the user across the app and eventually the web.</p>
        <ul className="data-roadmap__list">
          <li>Overlay the guide on pasted articles, saved passages, and imported documents without changing the underlying typography.</li>
          <li>Fade the guide out automatically during a session so the user gradually reads without visible scaffolding.</li>
          <li>Unify Guided Reading, Free Reader, and comprehension drills around the same plain-text reading surface.</li>
          <li>Build a browser extension that places the guide directly on real news sites and study pages.</li>
        </ul>
      </section>

      {msg && <div className="status-msg" aria-live="polite">{msg}</div>}
    </section>
  );
}
