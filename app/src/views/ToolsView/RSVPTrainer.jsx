import { useRef, useState, useEffect } from 'react';

// Quick RSVP trainer — flashes words from a text passage one at a time
export default function RSVPTrainer() {
  const [text,    setText]    = useState('');
  const [wpm,     setWpm]     = useState(300);
  const [running, setRunning] = useState(false);
  const [word,    setWord]    = useState('');
  const [idx,     setIdx]     = useState(0);
  const words  = useRef([]);
  const timer  = useRef(null);

  function start() {
    words.current = text.trim().split(/\s+/).filter(Boolean);
    if (!words.current.length) return;
    setIdx(0);
    setWord(words.current[0]);
    setRunning(true);
  }

  function stop() {
    clearInterval(timer.current);
    setRunning(false);
  }

  useEffect(() => {
    if (!running) return;
    const ms = Math.round(60000 / wpm);
    timer.current = setInterval(() => {
      setIdx(prev => {
        const next = prev + 1;
        if (next >= words.current.length) {
          clearInterval(timer.current);
          setRunning(false);
          setWord('');
          return 0;
        }
        setWord(words.current[next]);
        return next;
      });
    }, ms);
    return () => clearInterval(timer.current);
  }, [running, wpm]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="tool-panel card">
      <h3 className="card-title">RSVP Trainer</h3>
      <p className="section-desc">Rapid serial visual presentation. Paste text and train yourself to read faster one word at a time.</p>

      <textarea
        className="field-input field-textarea"
        rows={4}
        placeholder="Paste any text here..."
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={running}
      />

      <div className="rsvp-controls">
        <label className="field-label" htmlFor="rsvp-wpm">Speed (WPM): {wpm}</label>
        <input id="rsvp-wpm" type="range" min={60} max={1500} step={20} value={wpm}
          onChange={e => setWpm(Number(e.target.value))} />
      </div>

      {running ? (
        <>
          <div className="rsvp-display" aria-live="polite">{word}</div>
          <div className="rsvp-progress">{idx + 1} / {words.current.length}</div>
          <button className="btn btn-secondary" onClick={stop}>Stop</button>
        </>
      ) : (
        <button className="btn btn-primary" onClick={start} disabled={!text.trim()}>Start</button>
      )}
    </div>
  );
}
