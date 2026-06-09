function CharDiff({ original, answer }) {
  const chars = original.split('');
  return (
    <div className="diff-chars">
      {chars.map((ch, i) => {
        const got = answer[i];
        const cls = got === undefined ? 'diff-char diff-char--missing' :
                    got === ch        ? 'diff-char diff-char--correct' :
                                        'diff-char diff-char--wrong';
        return (
          <span key={i} className={cls} data-expected={ch} data-got={got || '_'}>
            {got !== undefined ? got : '_'}
          </span>
        );
      })}
    </div>
  );
}

function WordDiff({ textResult }) {
  if (!textResult) return null;
  // scoreText returns { score, correct, missing, wrong }
  // Rebuild a token list: correct words stay, missing ones are marked wrong
  const correctSet = new Set(textResult.correct || []);
  const allWords   = [
    ...(textResult.correct || []).map(w => ({ word: w, correct: true })),
    ...(textResult.missing  || []).map(w => ({ word: w, correct: false })),
  ];
  if (!allWords.length) return null;
  return (
    <div className="diff-words">
      {allWords.map((tok, i) => (
        <span
          key={i}
          className={`diff-word${tok.correct ? ' diff-word--correct' : ' diff-word--wrong'}`}
        >
          {tok.word}
        </span>
      ))}
    </div>
  );
}

function ScoreCircle({ score }) {
  const cls =
    score === 100 ? 'score-circle score-circle--perfect' :
    score >= 80   ? 'score-circle score-circle--good'    :
    score >= 50   ? 'score-circle score-circle--ok'      :
                    'score-circle score-circle--bad';
  return <div className={cls}>{score}%</div>;
}

export default function DrillScore({ material, answer, config, scoreResult, onAgain, onNew, onTimer }) {
  const { score, textResult } = scoreResult;
  const showCharDiff = (config.type === 'digits' || config.type === 'letters') && config.mode === 'recall';
  const showWordDiff = (config.type === 'words' || config.type === 'text') && textResult;

  return (
    <div className="drill-score">
      <ScoreCircle score={score} />

      {config.mode === 'encode' && (
        <div className="score-verdict">
          {score === 100 ? '✅ Valid encoding!' : '❌ Invalid encoding — consonants don\'t match the digits.'}
        </div>
      )}

      {config.mode === 'decode' && (
        <div className="score-verdict">
          {score === 100 ? '✅ Correct digits!' : `❌ You typed: ${answer} | Expected: ${config.expectedAnswer || ''}`}
        </div>
      )}

      {showCharDiff && (
        <div className="score-diff">
          <div className="score-diff__label">Char-by-char</div>
          <div className="score-diff__row">
            <span className="score-diff__orig">{material}</span>
          </div>
          <CharDiff original={material} answer={answer} />
        </div>
      )}

      {showWordDiff && (
        <div className="score-diff">
          <div className="score-diff__label">Word-by-word</div>
          <div className="score-diff__row">
            <span className="score-diff__orig">{material}</span>
          </div>
          <WordDiff textResult={textResult} />
        </div>
      )}

      <div className="score-answer">
        <span className="score-answer__label">Your answer:</span>
        <span className="score-answer__value">{answer}</span>
      </div>

      <div className="btn-row">
        <button className="btn btn-primary" onClick={onAgain}>Again</button>
        <button className="btn btn-secondary" onClick={onNew}>New Material</button>
        {onTimer && (
          <button className="btn btn-ghost" onClick={onTimer}>Set a Timer</button>
        )}
      </div>
    </div>
  );
}
