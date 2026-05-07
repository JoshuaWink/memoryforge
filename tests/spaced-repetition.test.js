import { describe, it, expect } from 'vitest';
import { createCard, reviewCard, getDueCards, INTERVALS } from '../src/spaced-repetition.js';

describe('spaced-repetition', () => {
  const NOW = new Date('2026-05-06T12:00:00Z').getTime();

  describe('createCard', () => {
    it('creates a card with default values', () => {
      const card = createCard('John 3:16');
      expect(card.reference).toBe('John 3:16');
      expect(card.interval).toBe(0);
      expect(card.streak).toBe(0);
      expect(card.easeFactor).toBe(2.5);
      expect(card.nextReview).toBeDefined();
      expect(card.layer).toBe(0);
    });

    it('sets nextReview to now (immediately due)', () => {
      const card = createCard('Rom 8:28', NOW);
      expect(card.nextReview).toBeLessThanOrEqual(NOW);
    });
  });

  describe('reviewCard', () => {
    it('increases interval on perfect recall (quality=5)', () => {
      const card = createCard('John 3:16', NOW);
      const updated = reviewCard(card, 5, NOW);
      expect(updated.interval).toBeGreaterThan(0);
      expect(updated.streak).toBe(1);
      expect(updated.nextReview).toBeGreaterThan(NOW);
    });

    it('resets streak on poor recall (quality=1)', () => {
      let card = createCard('John 3:16', NOW);
      card = reviewCard(card, 5, NOW); // first good
      card = reviewCard(card, 5, NOW); // second good
      expect(card.streak).toBe(2);
      card = reviewCard(card, 1, NOW); // bad
      expect(card.streak).toBe(0);
      expect(card.interval).toBeLessThanOrEqual(1);
    });

    it('promotes layer after 3 consecutive perfect recalls', () => {
      let card = createCard('John 3:16', NOW);
      card = reviewCard(card, 5, NOW);
      card = reviewCard(card, 5, NOW);
      card = reviewCard(card, 5, NOW);
      expect(card.layer).toBe(1);
    });

    it('does not promote on quality < 4', () => {
      let card = createCard('John 3:16', NOW);
      card = reviewCard(card, 3, NOW);
      card = reviewCard(card, 3, NOW);
      card = reviewCard(card, 3, NOW);
      expect(card.layer).toBe(0);
    });

    it('decreases ease factor on low quality', () => {
      const card = createCard('John 3:16', NOW);
      const updated = reviewCard(card, 2, NOW);
      expect(updated.easeFactor).toBeLessThan(2.5);
    });

    it('increases ease factor on high quality', () => {
      const card = createCard('John 3:16', NOW);
      const updated = reviewCard(card, 5, NOW);
      expect(updated.easeFactor).toBeGreaterThanOrEqual(2.5);
    });

    it('never drops ease below 1.3', () => {
      let card = createCard('John 3:16', NOW);
      for (let i = 0; i < 20; i++) {
        card = reviewCard(card, 0, NOW);
      }
      expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('records lastReview timestamp', () => {
      const card = createCard('John 3:16', NOW);
      const updated = reviewCard(card, 4, NOW);
      expect(updated.lastReview).toBe(NOW);
    });
  });

  describe('getDueCards', () => {
    it('returns cards whose nextReview <= now', () => {
      const cards = [
        { ...createCard('John 3:16', NOW), nextReview: NOW - 1000 },
        { ...createCard('Rom 8:28', NOW), nextReview: NOW + 86400000 },
      ];
      const due = getDueCards(cards, NOW);
      expect(due).toHaveLength(1);
      expect(due[0].reference).toBe('John 3:16');
    });

    it('returns empty for no due cards', () => {
      const cards = [
        { ...createCard('John 3:16', NOW), nextReview: NOW + 86400000 },
      ];
      expect(getDueCards(cards, NOW)).toHaveLength(0);
    });

    it('sorts by nextReview ascending (most overdue first)', () => {
      const cards = [
        { ...createCard('B', NOW), nextReview: NOW - 1000 },
        { ...createCard('A', NOW), nextReview: NOW - 5000 },
      ];
      const due = getDueCards(cards, NOW);
      expect(due[0].reference).toBe('A');
    });
  });

  describe('INTERVALS', () => {
    it('exports interval constants', () => {
      expect(INTERVALS.INITIAL).toBe(1);
      expect(INTERVALS.MIN).toBe(1);
    });
  });
});
