/**
 * Diff-recall — word-level diff between expected text and user's recall attempt.
 * Uses Longest Common Subsequence (LCS) to produce a minimal diff.
 */

/**
 * @typedef {{ type: 'equal'|'replace'|'missing'|'extra', expected?: string, got?: string }} DiffEntry
 */

/**
 * Compute word-level diff between expected and got text.
 * @param {string} expected - The correct verse text
 * @param {string} got - What the user typed
 * @returns {DiffEntry[]}
 */
export function diffWords(expected, got) {
  const expWords = tokenize(expected);
  const gotWords = tokenize(got);

  if (expWords.length === 0 && gotWords.length === 0) return [];
  if (expWords.length === 0) return gotWords.map(w => ({ type: 'extra', got: w }));
  if (gotWords.length === 0) return expWords.map(w => ({ type: 'missing', expected: w }));

  // LCS-based diff
  const lcs = computeLCS(expWords, gotWords);
  return buildDiff(expWords, gotWords, lcs);
}

/**
 * Score a diff result as a ratio (0.0 - 1.0).
 * @param {DiffEntry[]} diff
 * @returns {number}
 */
export function scoreDiff(diff) {
  if (diff.length === 0) return 1.0;
  const total = diff.filter(d => d.type !== 'extra').length || diff.length;
  const correct = diff.filter(d => d.type === 'equal').length;
  if (total === 0) return 0;
  return correct / total;
}

/**
 * Format diff for rendering (array of spans).
 * @param {DiffEntry[]} diff
 * @returns {{ text: string, type: string }[]}
 */
export function formatDiff(diff) {
  return diff.map(entry => {
    switch (entry.type) {
      case 'equal':
        return { text: entry.expected, type: 'equal' };
      case 'replace':
        return { text: entry.got, type: 'replace', expected: entry.expected };
      case 'missing':
        return { text: entry.expected, type: 'missing' };
      case 'extra':
        return { text: entry.got, type: 'extra' };
      default:
        return { text: '', type: 'equal' };
    }
  });
}

function tokenize(text) {
  if (!text || !text.trim()) return [];
  return text.trim().split(/\s+/);
}

function computeLCS(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find LCS indices
  const lcsIndices = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      lcsIndices.unshift({ ai: i - 1, bi: j - 1 });
      i--; j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return lcsIndices;
}

function buildDiff(expWords, gotWords, lcs) {
  const result = [];
  let ei = 0, gi = 0, li = 0;

  while (ei < expWords.length || gi < gotWords.length) {
    if (li < lcs.length) {
      const { ai, bi } = lcs[li];

      // Handle words before the next LCS match
      while (ei < ai && gi < bi) {
        result.push({ type: 'replace', expected: expWords[ei], got: gotWords[gi] });
        ei++; gi++;
      }
      while (ei < ai) {
        result.push({ type: 'missing', expected: expWords[ei] });
        ei++;
      }
      while (gi < bi) {
        result.push({ type: 'extra', got: gotWords[gi] });
        gi++;
      }

      // The LCS match itself
      result.push({ type: 'equal', expected: expWords[ei], got: gotWords[gi] });
      ei++; gi++; li++;
    } else {
      // After all LCS matches
      while (ei < expWords.length && gi < gotWords.length) {
        result.push({ type: 'replace', expected: expWords[ei], got: gotWords[gi] });
        ei++; gi++;
      }
      while (ei < expWords.length) {
        result.push({ type: 'missing', expected: expWords[ei] });
        ei++;
      }
      while (gi < gotWords.length) {
        result.push({ type: 'extra', got: gotWords[gi] });
        gi++;
      }
    }
  }

  return result;
}
