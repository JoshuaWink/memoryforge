import { useState, useEffect, useRef } from 'react';

const PRESETS = [
  { label: '5 min',  secs: 300  },
  { label: '10 min', secs: 600  },
  { label: '15 min', secs: 900  },
  { label: '25 min', secs: 1500 },
];

function fmt(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function FocusTimer() {
  const [total,   setTotal]   = useState(300);
  const [remaining, setRemaining] = useState(300);
  const [running, setRunning] = useState(false);
  const [done,    setDone]    = useState(false);
  const tid = useRef(null);

  useEffect(() => {
    if (!running) return;
    tid.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(tid.current);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(tid.current);
  }, [running]);

  function selectPreset(secs) {
    clearInterval(tid.current);
    setTotal(secs);
    setRemaining(secs);
    setRunning(false);
    setDone(false);
  }

  function toggle() {
    if (done) return;
    setRunning(r => !r);
  }

  function reset() {
    clearInterval(tid.current);
    setRemaining(total);
    setRunning(false);
    setDone(false);
  }

  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;

  return (
    <div className="tool-panel card">
      <h3 className="card-title">Focus Timer</h3>
      <p className="section-desc">Set a timer to hold deliberate attention. No distractions until the bell.</p>

      <div className="timer-presets">
        {PRESETS.map(p => (
          <button key={p.secs} className={`btn btn-sm${total === p.secs ? ' btn-primary' : ' btn-ghost'}`}
            onClick={() => selectPreset(p.secs)} disabled={running}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="focus-timer-display" aria-live="polite">
        {done ? 'Done!' : fmt(remaining)}
      </div>

      <div className="focus-timer-bar">
        <div className="focus-timer-fill" style={{ width: pct + '%' }} />
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={toggle} disabled={done}>
          {running ? 'Pause' : 'Start'}
        </button>
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}
