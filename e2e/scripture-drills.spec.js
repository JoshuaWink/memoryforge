// e2e/scripture-drills.spec.js
// Playwright UI tests for all scripture drill modes.

import { test, expect } from '@playwright/test';

const TEST_REF = 'Romans 1:1';
const TEST_TEXT = 'This letter is from Paul, a slave of Christ Jesus, chosen by God to be an apostle and sent out to preach his Good News.';
const STORAGE_KEY = 'mf_scripture_library';

function buildVerse(ref, text) {
  return {
    reference: ref,
    text: text,
    translation: 'NLT',
    notes: '',
    chunks: [
      'This letter is from Paul,',
      'a slave of Christ Jesus,',
      'chosen by God to be an apostle',
      'and sent out to preach his Good News.'
    ],
    card: { layer: 0, streak: 0, ease: 2.5, interval: 0, nextReview: 0 },
  };
}

test.describe('Scripture Drill Modes', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(({ key, verse }) => {
      const lib = { verses: [verse], passages: [] };
      localStorage.setItem(key, JSON.stringify(lib));
    }, { key: STORAGE_KEY, verse: buildVerse(TEST_REF, TEST_TEXT) });

    await page.goto('/');
    await page.click('button.nav-btn[data-view="scripture"]');
    await page.waitForSelector('#view-scripture', { state: 'visible' });
    await page.click('button.scripture-tab[data-stab="drill"]');
    await page.waitForSelector('#sp-drill', { state: 'visible' });
  });

  test.describe('Drill verse picker', () => {
    test('picker populates with seeded verse', async ({ page }) => {
      const picker = page.locator('#drill-verse-picker');
      await expect(picker).toBeVisible();
      const options = picker.locator('option');
      await expect(options).toHaveCount(2);
      await expect(options.nth(1)).toHaveText(TEST_REF);
    });

    test('selecting a verse shows drill area', async ({ page }) => {
      await page.selectOption('#drill-verse-picker', TEST_REF);
      await expect(page.locator('#scripture-drill-area')).toBeVisible();
      await expect(page.locator('#sdrill-ref')).toHaveText(TEST_REF);
    });
  });

  test.describe('Self-Check mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.selectOption('#drill-verse-picker', TEST_REF);
    });

    test('shows reference and reveal button', async ({ page }) => {
      await expect(page.locator('#drill-self-check')).toBeVisible();
      await expect(page.locator('#btn-flashcard-reveal')).toBeVisible();
      await expect(page.locator('#flashcard-reveal')).toBeHidden();
    });

    test('reveal button shows verse text', async ({ page }) => {
      await page.click('#btn-flashcard-reveal');
      await expect(page.locator('#flashcard-reveal')).toBeVisible();
      await expect(page.locator('#flashcard-text')).toHaveText(TEST_TEXT);
    });

    test('reveal shows rating buttons and hides reveal btn', async ({ page }) => {
      await page.click('#btn-flashcard-reveal');
      await expect(page.locator('#flashcard-rating')).toBeVisible();
      await expect(page.locator('#btn-flashcard-reveal')).toBeHidden();
      await expect(page.locator('#flashcard-rating .btn')).toHaveCount(4);
    });

    test('rating a card shows Next button', async ({ page }) => {
      await page.click('#btn-flashcard-reveal');
      await page.click('.rate-nailed');
      await expect(page.locator('#btn-sdrill-next')).toBeVisible();
    });
  });

  test.describe('Chunk Order mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button.scripture-mode[data-mode="chunk-order"]');
      const drillArea = page.locator('#scripture-drill-area');
      if (!await drillArea.isVisible()) {
        await page.selectOption('#drill-verse-picker', TEST_REF);
      }
    });

    test('shows scrambled chunk pills in bank', async ({ page }) => {
      await expect(page.locator('#drill-chunk-order')).toBeVisible();
      const pills = page.locator('#chunk-order-bank .chunk-pill');
      const count = await pills.count();
      expect(count).toBe(4);
    });

    test('tapping a pill moves it to selected and marks used', async ({ page }) => {
      const firstPill = page.locator('#chunk-order-bank .chunk-pill').first();
      const text = await firstPill.textContent();
      await firstPill.click();
      const selected = page.locator('#chunk-order-selected .chunk-pill');
      await expect(selected).toHaveCount(1);
      await expect(selected.first()).toHaveText(text);
      await expect(firstPill).toHaveClass(/chunk-pill--used/);
    });

    test('correct full order shows success and Next button', async ({ page }) => {
      const correctOrder = [
        'This letter is from Paul,',
        'a slave of Christ Jesus,',
        'chosen by God to be an apostle',
        'and sent out to preach his Good News.'
      ];
      for (const chunk of correctOrder) {
        const pill = page.locator('#chunk-order-bank .chunk-pill', { hasText: chunk });
        await pill.click();
      }
      await expect(page.locator('#chunk-order-result')).toContainText('Perfect');
      await expect(page.locator('#btn-sdrill-next')).toBeVisible();
    });

    test('wrong order shows error and reset button', async ({ page }) => {
      const correctOrder = [
        'This letter is from Paul,',
        'a slave of Christ Jesus,',
        'chosen by God to be an apostle',
        'and sent out to preach his Good News.'
      ];
      const lastChunk = correctOrder[correctOrder.length - 1];
      const pill = page.locator('#chunk-order-bank .chunk-pill', { hasText: lastChunk });
      await pill.click();
      await expect(page.locator('#chunk-order-result')).toContainText('Wrong');
      await expect(page.locator('#btn-chunk-order-reset')).toBeVisible();
    });

    test('reset restarts the drill', async ({ page }) => {
      const correctOrder = [
        'This letter is from Paul,',
        'a slave of Christ Jesus,',
        'chosen by God to be an apostle',
        'and sent out to preach his Good News.'
      ];
      const lastChunk = correctOrder[correctOrder.length - 1];
      await page.locator('#chunk-order-bank .chunk-pill', { hasText: lastChunk }).click();
      await page.click('#btn-chunk-order-reset');
      const newPills = page.locator('#chunk-order-bank .chunk-pill:not(.chunk-pill--used)');
      await expect(newPills).toHaveCount(4);
    });
  });

  test.describe('Fill Blank mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button.scripture-mode[data-mode="fill-blank"]');
      const drillArea = page.locator('#scripture-drill-area');
      if (!await drillArea.isVisible()) {
        await page.selectOption('#drill-verse-picker', TEST_REF);
      }
    });

    test('shows verse with blanks and word bank', async ({ page }) => {
      await expect(page.locator('#drill-fill-blank')).toBeVisible();
      const blanks = page.locator('#fill-blank-verse .blank-slot');
      const blankCount = await blanks.count();
      expect(blankCount).toBeGreaterThan(0);
      const options = page.locator('#fill-blank-bank .word-option');
      const optCount = await options.count();
      expect(optCount).toBeGreaterThan(0);
    });

    test('tapping a word fills a blank and updates progress', async ({ page }) => {
      const firstOption = page.locator('#fill-blank-bank .word-option').first();
      await firstOption.click();
      const fill = page.locator('#fill-blank-fill');
      const width = await fill.evaluate(el => el.style.width);
      expect(width).not.toBe('0%');
    });

    test('filling all blanks shows result and Next', async ({ page }) => {
      for (let i = 0; i < 30; i++) {
        const option = page.locator('#fill-blank-bank .word-option:not(.word-option--used)').first();
        if (!await option.isVisible().catch(() => false)) break;
        await option.click();
      }
      const result = page.locator('#fill-blank-result .drill-result');
      await expect(result).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#btn-sdrill-next')).toBeVisible();
    });
  });

  test.describe('First-Letter Tap mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button.scripture-mode[data-mode="fl-tap"]');
      const drillArea = page.locator('#scripture-drill-area');
      if (!await drillArea.isVisible()) {
        await page.selectOption('#drill-verse-picker', TEST_REF);
      }
    });

    test('shows verse display with first-letter hints and word options', async ({ page }) => {
      await expect(page.locator('#drill-fl-tap')).toBeVisible();
      const verse = page.locator('#fl-tap-verse');
      await expect(verse).toBeVisible();
      // Should show first-letter hints for pending words
      const pending = page.locator('.flt-word--pending');
      const pendingCount = await pending.count();
      expect(pendingCount).toBeGreaterThan(0);
      const options = page.locator('#fl-tap-bank .word-option');
      await expect(options).toHaveCount(4);
    });

    test('shows current word as first-letter blank', async ({ page }) => {
      const current = page.locator('.flt-word--current');
      await expect(current).toBeVisible();
      const text = await current.textContent();
      // Should show first letter + underscores (e.g. "T___")
      expect(text).toMatch(/^[A-Z]___$/);
    });

    test('tapping correct word fills in verse text', async ({ page }) => {
      const wordBtn = page.locator('#fl-tap-bank .word-option', { hasText: 'This' });
      await wordBtn.click();
      // First word should now show as filled
      const filled = page.locator('.flt-word--filled');
      await expect(filled).toHaveCount(1);
      await expect(filled.first()).toContainText('This');
    });

    test('tapping wrong word shows error', async ({ page }) => {
      const options = page.locator('#fl-tap-bank .word-option');
      const count = await options.count();
      for (let i = 0; i < count; i++) {
        const text = await options.nth(i).textContent();
        if (text !== 'This') {
          await options.nth(i).click();
          await expect(page.locator('#fl-tap-result')).toContainText('Not quite');
          break;
        }
      }
    });
  });

  test.describe('Mode switching', () => {
    test.beforeEach(async ({ page }) => {
      await page.selectOption('#drill-verse-picker', TEST_REF);
      // startScriptureDrill collapses drill-settings; wait for drill to start then re-open it
      await page.waitForSelector('#scripture-drill-area', { state: 'visible' });
      await page.locator('#drill-settings').evaluate(el => el.setAttribute('open', ''));
      await page.waitForSelector('button.scripture-mode[data-mode="chunk-order"]', { state: 'visible' });
    });

    test('switching from self-check to chunk-order', async ({ page }) => {
      await expect(page.locator('#drill-self-check')).toBeVisible();
      await page.click('button.scripture-mode[data-mode="chunk-order"]');
      await expect(page.locator('#drill-chunk-order')).toBeVisible();
      await expect(page.locator('#drill-self-check')).toBeHidden();
    });

    test('switching to fill-blank shows blanks', async ({ page }) => {
      await page.click('button.scripture-mode[data-mode="fill-blank"]');
      await expect(page.locator('#drill-fill-blank')).toBeVisible();
      const blanks = page.locator('#fill-blank-verse .blank-slot');
      const count = await blanks.count();
      expect(count).toBeGreaterThan(0);
    });

    test('switching to fl-tap shows word bank', async ({ page }) => {
      await page.click('button.scripture-mode[data-mode="fl-tap"]');
      await expect(page.locator('#drill-fl-tap')).toBeVisible();
      const options = page.locator('#fl-tap-bank .word-option');
      await expect(options).toHaveCount(4);
    });

    test('switching to first-letter shows typing area', async ({ page }) => {
      await page.click('button.scripture-mode[data-mode="first-letter"]');
      await expect(page.locator('#drill-typing-area')).toBeVisible();
      await expect(page.locator('#sdrill-hint')).toBeVisible();
    });
  });

  test.describe('Chunk by Chunk mode', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('button.scripture-mode[data-mode="chunk-by-chunk"]');
      const drillArea = page.locator('#scripture-drill-area');
      if (!await drillArea.isVisible()) {
        await page.selectOption('#drill-verse-picker', TEST_REF);
      }
    });

    test('shows drill container with central chunk and pool', async ({ page }) => {
      await expect(page.locator('#drill-cbc')).toBeVisible();
      await expect(page.locator('#cbc-display .cbc-slot--center')).toBeVisible();
      const options = page.locator('#cbc-bank .cbc-option');
      const count = await options.count();
      expect(count).toBeGreaterThan(0);
    });

    test('first chunk asks what comes after', async ({ page }) => {
      await expect(page.locator('#cbc-prompt')).toHaveText('What comes after this chunk?');
      // First chunk should NOT have a before slot
      await expect(page.locator('#cbc-display .cbc-slot--center')).toBeVisible();
    });

    test('tapping correct after-chunk advances to next chunk', async ({ page }) => {
      // The first chunk is "This letter is from Paul,"
      // The second chunk (correct after) is "a slave of Christ Jesus,"
      const correctAfter = 'a slave of Christ Jesus,';
      const btn = page.locator('#cbc-bank .cbc-option', { hasText: correctAfter });
      if (await btn.count() > 0) {
        await btn.click();
        // Should advance — now asking "What comes before?" for chunk index 1
        await expect(page.locator('#cbc-prompt')).toHaveText('What comes before this chunk?');
      }
    });

    test('tapping wrong option shows retry message', async ({ page }) => {
      // First chunk asks "after" — tap something that isn't the correct next chunk
      const options = page.locator('#cbc-bank .cbc-option');
      const count = await options.count();
      // Find a wrong option (not the second chunk)
      const correctAfter = 'a slave of Christ Jesus,';
      for (let i = 0; i < count; i++) {
        const text = await options.nth(i).textContent();
        if (text.trim() !== correctAfter) {
          await options.nth(i).click();
          await expect(page.locator('#cbc-result')).toContainText('Not quite');
          break;
        }
      }
    });

    test('completing all chunks shows success and drill nav', async ({ page }) => {
      // Walk through all chunks by tapping correct answers
      // Chunks: 0="This letter is from Paul," 1="a slave of Christ Jesus,"
      //         2="chosen by God to be an apostle" 3="and sent out to preach his Good News."
      const chunks = [
        'This letter is from Paul,',
        'a slave of Christ Jesus,',
        'chosen by God to be an apostle',
        'and sent out to preach his Good News.'
      ];

      for (let c = 0; c < chunks.length; c++) {
        const hasBefore = c > 0;
        const hasAfter = c < chunks.length - 1;

        if (hasBefore) {
          // Pick the before chunk
          const beforeBtn = page.locator('#cbc-bank .cbc-option', { hasText: chunks[c - 1] });
          if (await beforeBtn.count() > 0) await beforeBtn.click();
        }
        if (hasAfter) {
          // Pick the after chunk
          const afterBtn = page.locator('#cbc-bank .cbc-option', { hasText: chunks[c + 1] });
          if (await afterBtn.count() > 0) await afterBtn.click();
        }
      }

      await expect(page.locator('#cbc-result')).toContainText('All chunks connected');
      await expect(page.locator('#drill-nav')).toBeVisible();
    });
  });
});
