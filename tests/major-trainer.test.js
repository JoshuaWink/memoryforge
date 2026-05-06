/**
 * Tests for Major System trainer — progressive learning engine.
 */
import { describe, it, expect } from 'vitest';
import { MajorTrainer } from '../src/major-trainer.js';

describe('MajorTrainer', () => {
  // ── Lessons ──

  it('has 5 lessons covering all 10 digits', () => {
    const t = new MajorTrainer();
    const lessons = t.getLessons();
    expect(lessons.length).toBe(5);
    // All digits 0-9 covered
    const allDigits = lessons.flatMap(l => l.digits);
    expect(allDigits.sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('each lesson has 2 digits', () => {
    const t = new MajorTrainer();
    for (const lesson of t.getLessons()) {
      expect(lesson.digits.length).toBe(2);
    }
  });

  it('each lesson has a mnemonic story for each digit', () => {
    const t = new MajorTrainer();
    for (const lesson of t.getLessons()) {
      for (const digit of lesson.digits) {
        expect(lesson.stories[digit]).toBeDefined();
        expect(lesson.stories[digit].length).toBeGreaterThan(10);
      }
    }
  });

  it('each lesson has example words for each digit', () => {
    const t = new MajorTrainer();
    for (const lesson of t.getLessons()) {
      for (const digit of lesson.digits) {
        expect(lesson.examples[digit]).toBeDefined();
        expect(lesson.examples[digit].length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  // ── Quiz Generation ──

  it('generates a multiple-choice quiz for a lesson', () => {
    const t = new MajorTrainer();
    const quiz = t.generateQuiz(0); // lesson 0 = digits 0, 1
    expect(quiz.length).toBeGreaterThanOrEqual(4);
    for (const q of quiz) {
      expect(q.question).toBeDefined();
      expect(q.options.length).toBe(3);
      expect(q.options).toContain(q.correct);
    }
  });

  it('quiz includes both directions: digit→sounds and sound→digit', () => {
    const t = new MajorTrainer();
    const quiz = t.generateQuiz(0);
    const hasDigitToSound = quiz.some(q => q.direction === 'digit-to-sound');
    const hasSoundToDigit = quiz.some(q => q.direction === 'sound-to-digit');
    expect(hasDigitToSound).toBe(true);
    expect(hasSoundToDigit).toBe(true);
  });

  // ── Phase Progression ──

  it('starts at phase 1 (lessons)', () => {
    const t = new MajorTrainer();
    expect(t.getPhase()).toBe(1);
  });

  it('tracks lesson completion', () => {
    const t = new MajorTrainer();
    expect(t.isLessonComplete(0)).toBe(false);
    t.completeLesson(0);
    expect(t.isLessonComplete(0)).toBe(true);
  });

  it('advances to phase 2 when all lessons done', () => {
    const t = new MajorTrainer();
    for (let i = 0; i < 5; i++) t.completeLesson(i);
    expect(t.getPhase()).toBe(2);
  });

  it('getNextLesson returns first incomplete lesson', () => {
    const t = new MajorTrainer();
    expect(t.getNextLesson()).toBe(0);
    t.completeLesson(0);
    expect(t.getNextLesson()).toBe(1);
    t.completeLesson(1);
    t.completeLesson(2);
    expect(t.getNextLesson()).toBe(3);
  });

  it('getNextLesson returns -1 when all complete', () => {
    const t = new MajorTrainer();
    for (let i = 0; i < 5; i++) t.completeLesson(i);
    expect(t.getNextLesson()).toBe(-1);
  });

  // ── Sound Sprint (Phase 2) ──

  it('generateSprint returns multiple-choice items with a time target', () => {
    const t = new MajorTrainer();
    for (let i = 0; i < 5; i++) t.completeLesson(i); // unlock phase 2
    const sprint = t.generateSprint(10);
    expect(sprint.length).toBe(10);
    for (const item of sprint) {
      expect(item.prompt).toBeDefined();
      expect(item.options.length).toBe(3);
      expect(item.options).toContain(item.correct);
    }
  });

  // ── Free Recall (Phase 3) ──

  it('generateFreeRecall returns digit or sound prompts without options', () => {
    const t = new MajorTrainer();
    const items = t.generateFreeRecall(5);
    expect(items.length).toBe(5);
    for (const item of items) {
      expect(item.prompt).toBeDefined();
      expect(item.answer).toBeDefined();
      expect(item.options).toBeUndefined();
    }
  });

  // ── Word Builder (Phase 4) ──

  it('generateWordChallenge returns 2-digit pairs to encode', () => {
    const t = new MajorTrainer();
    const items = t.generateWordChallenge(5);
    expect(items.length).toBe(5);
    for (const item of items) {
      expect(item.digits).toBeDefined();
      expect(item.digits.length).toBe(2);
      expect(item.defaultWord).toBeDefined();
    }
  });

  // ── Progress / Export ──

  it('exports and restores progress', () => {
    const t = new MajorTrainer();
    t.completeLesson(0);
    t.completeLesson(1);
    const state = t.export();

    const t2 = new MajorTrainer(state);
    expect(t2.isLessonComplete(0)).toBe(true);
    expect(t2.isLessonComplete(1)).toBe(true);
    expect(t2.isLessonComplete(2)).toBe(false);
    expect(t2.getNextLesson()).toBe(2);
  });

  // ── Overall progress ──

  it('reports overall progress percentage', () => {
    const t = new MajorTrainer();
    expect(t.progressPct()).toBe(0);
    t.completeLesson(0);
    expect(t.progressPct()).toBe(20); // 1 of 5 lessons
    for (let i = 1; i < 5; i++) t.completeLesson(i);
    expect(t.progressPct()).toBe(100);
  });
});
