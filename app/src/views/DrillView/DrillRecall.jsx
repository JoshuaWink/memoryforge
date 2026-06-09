import { useState, useEffect, useRef } from 'react';

const DELAY_MESSAGES = {
  none:           'Hold it. Count silently.',
  chunking:       'Hold the chunks. Count silently.',
  'number-shape': 'Hold your shape images. Count silently.',
  'number-rhyme': 'Hold your rhyme chain. Count silently.',
  major:          'Hold your Major words. Count silently.',
  linking:        'Hold your story. Count silently.',
};

export default function DrillRecall({ config, onSubmit }) {
  const [answer,    setAnswer]    = useState('');
  const [countdown, setCountdown] = useState(config.delaySec || 0);
  const [ready,     setReady]     = useState(!config.delaySec);
  const inputRef = useRef(null);

  // Delay countdown
  useEffect(() => {
    if (!config.delaySec) return;
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(id);
          setReady(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus input when ready
  useEffect(() => {
    if (ready && inputRef.current) inputRef.current.focus();
  }, [ready]);

  function handleSubmit() {
    if (!ready) return;
    onSubmit(answer.trim());
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const delayMsg = DELAY_MESSAGES[config.technique] || DELAY_MESSAGES.none;
  const isNumericInput = config.type === 'digits' || config.mode === 'decode';

  return (
    <div className="drill-recall">
      {!ready && (
        <div className="recall-delay-overlay" aria-live="polite">
          <div className="recall-delay-msg">{delayMsg}</div>
          <div className="recall-delay-count">{countdown}</div>
        </div>
      )}

      {ready && (
        <>
          <div className="recall-prompt">
            {config.mode === 'encode' && 'Type the Major word that encodes these digits:'}
            {config.mode === 'decode' && 'Type the digits you decoded from the words:'}
            {config.mode === 'recall' && 'Reproduce what you memorized:'}
          </div>

          {config.type === 'text' || config.type === 'words' ? (
            <textarea
              ref={inputRef}
              className="field-input field-textarea recall-input"
              rows={4}
              placeholder="Type your answer..."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
            />
          ) : (
            <input
              ref={inputRef}
              className="field-input recall-input"
              type="text"
              inputMode={isNumericInput ? 'numeric' : 'text'}
              placeholder="Type your answer..."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
            />
          )}

          <button className="btn btn-primary" onClick={handleSubmit}>Submit</button>
        </>
      )}
    </div>
  );
}
