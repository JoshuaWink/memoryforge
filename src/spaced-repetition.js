/**
 * Spaced-repetition — SM-2 algorithm adapted for verse memorization.
 * Each verse gets a "card" with interval, ease factor, and streak.
 */

/** @type {{ INITIAL: number, MIN: number, DAY: number }} */
export const INTERVALS = {
  INITIAL: 1,   // 1 day
  MIN: 1,       // minimum 1 day
  DAY: 86400000, // ms in a day
};

/**
 * Create a new spaced repetition card for a verse.
 * @param {string} reference - Verse reference (e.g., "John 3:16")
 * @param {number} [now] - Current timestamp
 * @returns {object} Card object
 */
export function createCard(reference, now) {
  now = now || Date.now();
  return {
    reference,
    interval: 0,          // days until next review
    streak: 0,            // consecutive correct recalls
    easeFactor: 2.5,      // SM-2 ease factor
    nextReview: now,       // immediately due
    lastReview: null,
    layer: 0,             // mastery layer (0-5)
    totalReviews: 0,
    correctReviews: 0,
  };
}

/**
 * Review a card with a quality score.
 * @param {object} card - The card to review
 * @param {number} quality - 0-5 (0=blackout, 5=perfect)
 * @param {number} [now] - Current timestamp
 * @returns {object} Updated card (new object)
 */
export function reviewCard(card, quality, now) {
  now = now || Date.now();
  const updated = { ...card };
  updated.lastReview = now;
  updated.totalReviews = (card.totalReviews || 0) + 1;

  // Quality threshold: 3+ is a pass
  if (quality >= 3) {
    updated.correctReviews = (card.correctReviews || 0) + 1;

    if (card.interval === 0) {
      updated.interval = INTERVALS.INITIAL;
    } else if (card.interval === 1) {
      updated.interval = 6;
    } else {
      updated.interval = Math.round(card.interval * card.easeFactor);
    }

    updated.streak = card.streak + 1;
  } else {
    // Failed — reset
    updated.interval = INTERVALS.MIN;
    updated.streak = 0;
  }

  // Update ease factor (SM-2 formula)
  updated.easeFactor = card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (updated.easeFactor < 1.3) updated.easeFactor = 1.3;

  // Schedule next review
  updated.nextReview = now + (updated.interval * INTERVALS.DAY);

  // Layer promotion: 3 consecutive quality >= 4 reviews
  if (quality >= 4) {
    if (updated.streak >= 3 && updated.streak % 3 === 0) {
      updated.layer = Math.min((card.layer || 0) + 1, 5);
    }
  }

  return updated;
}

/**
 * Get cards that are due for review.
 * @param {object[]} cards - All cards
 * @param {number} [now] - Current timestamp
 * @returns {object[]} Due cards, sorted by most overdue first
 */
export function getDueCards(cards, now) {
  now = now || Date.now();
  return cards
    .filter(c => c.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview);
}
