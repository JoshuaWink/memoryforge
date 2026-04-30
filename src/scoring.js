/**
 * Scoring engine — evaluates recall accuracy.
 */

/**
 * Score an exact character-by-character match.
 * @param {string} original - The presented material
 * @param {string} answer - The user's recall
 * @returns {number} Score 0–100
 */
export function scoreExact(original, answer) {
  if (original.length === 0 && answer.length === 0) return 100;
  if (original.length === 0) return 100;
  if (answer.length === 0) return 0;

  let correct = 0;
  for (let i = 0; i < original.length; i++) {
    if (i < answer.length && answer[i] === original[i]) {
      correct++;
    }
  }
  return Math.round((correct / original.length) * 100);
}

/**
 * Score a word-level text comparison with diff info.
 * @param {string} original - The presented text
 * @param {string} answer - The user's recall
 * @returns {{ score: number, correct: string[], missing: string[], wrong: string[] }}
 */
export function scoreText(original, answer) {
  const origWords = original.trim() === '' ? [] : original.trim().toLowerCase().split(/\s+/);
  const ansWords = answer.trim() === '' ? [] : answer.trim().toLowerCase().split(/\s+/);

  if (origWords.length === 0 && ansWords.length === 0) {
    return { score: 100, correct: [], missing: [], wrong: [] };
  }
  if (origWords.length === 0) {
    return { score: 100, correct: [], missing: [], wrong: [] };
  }
  if (ansWords.length === 0) {
    return { score: 0, correct: [], missing: [...origWords], wrong: [] };
  }

  const correct = [];
  const missing = [];
  const wrong = [];

  // Walk through original words — check if they appear at same position in answer
  const ansUsed = new Array(ansWords.length).fill(false);

  for (let i = 0; i < origWords.length; i++) {
    if (i < ansWords.length && ansWords[i] === origWords[i]) {
      correct.push(origWords[i]);
      ansUsed[i] = true;
    } else {
      missing.push(origWords[i]);
    }
  }

  // Any answer words not matched are wrong
  for (let i = 0; i < ansWords.length; i++) {
    if (!ansUsed[i]) {
      wrong.push(ansWords[i]);
    }
  }

  const score = origWords.length > 0
    ? Math.round((correct.length / origWords.length) * 100)
    : 100;

  return { score, correct, missing, wrong };
}
