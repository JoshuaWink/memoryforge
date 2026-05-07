// e2e/passage-drills.spec.js
// Playwright UI tests for passage (chapter-scale) features.

import { test, expect } from '@playwright/test';

const STORAGE_KEY = 'mf_scripture_library';

function buildVerse(ref, text, chunks) {
  return {
    reference: ref,
    text: text,
    translation: 'NLT',
    notes: '',
    chunks: chunks || [text],
    card: { layer: 0, streak: 0, ease: 2.5, interval: 0, nextReview: 0 },
  };
}

const VERSES = [
  buildVerse('Rom 8:1', 'There is no condemnation for those in Christ Jesus.', ['There is no condemnation', 'for those in Christ Jesus.']),
  buildVerse('Rom 8:2', 'The Spirit of life set you free from the law of sin and death.', ['The Spirit of life', 'set you free from', 'the law of sin and death.']),
  buildVerse('Rom 8:3', 'God sent his own Son in a body like ours.', ['God sent his own Son', 'in a body like ours.']),
  buildVerse('Rom 8:4', 'He did this so the requirement of the law would be fulfilled.', ['He did this so', 'the requirement of the law', 'would be fulfilled.']),
];

const PASSAGE = {
  reference: 'Romans 8:1-4',
  verseRefs: VERSES.map(v => v.reference),
  sections: [{ label: 'Rom 8:1 \u2013 Rom 8:4', range: [0, 3] }],
  seams: {
    'Rom 8:1\u2192Rom 8:2': { strength: 0, attempts: 0 },
    'Rom 8:2\u2192Rom 8:3': { strength: 0, attempts: 0 },
    'Rom 8:3\u2192Rom 8:4': { strength: 0, attempts: 0 },
  },
  card: { layer: 0, streak: 0, ease: 2.5, interval: 0, nextReview: 0 },
};

test.describe('Passage Features', () => {

  // ── Create Passage ──
  test.describe('Create Passage from Library', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(({ key, verses }) => {
        localStorage.setItem(key, JSON.stringify({ verses, passages: [] }));
      }, { key: STORAGE_KEY, verses: VERSES });
      await page.goto('/');
      await page.click('button.nav-btn[data-view="scripture"]');
      await page.waitForSelector('#view-scripture', { state: 'visible' });
    });

    test('passage create section shows checkboxes for each verse', async ({ page }) => {
      await page.click('#passage-create-section summary');
      const checkboxes = page.locator('#passage-verse-checkboxes input[type="checkbox"]');
      await expect(checkboxes).toHaveCount(4);
    });

    test('creating a passage adds it to the passage list', async ({ page }) => {
      await page.click('#passage-create-section summary');
      await page.fill('#passage-ref', 'Romans 8:1-4');
      const checkboxes = page.locator('#passage-verse-checkboxes input[type="checkbox"]');
      for (let i = 0; i < 4; i++) await checkboxes.nth(i).check();
      await page.click('#btn-create-passage');
      const card = page.locator('.passage-card');
      await expect(card).toHaveCount(1);
      await expect(card.locator('.passage-card__ref')).toHaveText('Romans 8:1-4');
    });

    test('creating passage requires at least 2 verses', async ({ page }) => {
      page.on('dialog', d => d.accept());
      await page.click('#passage-create-section summary');
      await page.fill('#passage-ref', 'Test');
      const checkboxes = page.locator('#passage-verse-checkboxes input[type="checkbox"]');
      await checkboxes.nth(0).check();
      await page.click('#btn-create-passage');
      // No passage card created
      await expect(page.locator('.passage-card')).toHaveCount(0);
    });

    test('creating passage requires a name', async ({ page }) => {
      page.on('dialog', d => d.accept());
      await page.click('#passage-create-section summary');
      const checkboxes = page.locator('#passage-verse-checkboxes input[type="checkbox"]');
      await checkboxes.nth(0).check();
      await checkboxes.nth(1).check();
      await page.click('#btn-create-passage');
      await expect(page.locator('.passage-card')).toHaveCount(0);
    });
  });

  // ── Scale Selector ──
  test.describe('Scale Selector', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(({ key, verses, passage }) => {
        localStorage.setItem(key, JSON.stringify({ verses, passages: [passage] }));
      }, { key: STORAGE_KEY, verses: VERSES, passage: PASSAGE });
      await page.goto('/');
      await page.click('button.nav-btn[data-view="scripture"]');
      await page.waitForSelector('#view-scripture', { state: 'visible' });
      await page.click('button.scripture-tab[data-stab="drill"]');
      await page.waitForSelector('#sp-drill', { state: 'visible' });
    });

    test('verse scale is active by default', async ({ page }) => {
      const verseBtn = page.locator('.drill-scale[data-scale="verse"]');
      await expect(verseBtn).toHaveClass(/active/);
    });

    test('clicking chapter shows passage picker', async ({ page }) => {
      await page.click('.drill-scale[data-scale="chapter"]');
      const passagePicker = page.locator('#drill-passage-select');
      await expect(passagePicker).toBeVisible();
    });

    test('clicking verse hides passage picker', async ({ page }) => {
      await page.click('.drill-scale[data-scale="chapter"]');
      await page.click('.drill-scale[data-scale="verse"]');
      const passagePicker = page.locator('#drill-passage-select');
      await expect(passagePicker).not.toBeVisible();
    });

    test('passage picker populates with saved passage', async ({ page }) => {
      await page.click('.drill-scale[data-scale="chapter"]');
      const picker = page.locator('#drill-passage-picker');
      const options = picker.locator('option');
      await expect(options).toHaveCount(2); // default + our passage
      await expect(options.nth(1)).toContainText('Romans 8:1-4');
    });
  });

  // ── Bridge Drill ──
  test.describe('Bridge Drill (fill-blank at chapter scale)', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(({ key, verses, passage }) => {
        localStorage.setItem(key, JSON.stringify({ verses, passages: [passage] }));
      }, { key: STORAGE_KEY, verses: VERSES, passage: PASSAGE });
      await page.goto('/');
      await page.click('button.nav-btn[data-view="scripture"]');
      await page.waitForSelector('#view-scripture', { state: 'visible' });
      await page.click('button.scripture-tab[data-stab="drill"]');
      await page.waitForSelector('#sp-drill', { state: 'visible' });
      // Switch to fill-blank mode
      await page.click('.scripture-mode[data-mode="fill-blank"]');
      // Switch to chapter scale
      await page.click('.drill-scale[data-scale="chapter"]');
      // Select the passage
      await page.selectOption('#drill-passage-picker', 'Romans 8:1-4');
    });

    test('bridge drill shows prompt and options', async ({ page }) => {
      const bridge = page.locator('#drill-bridge');
      await expect(bridge).toBeVisible();
      const prompt = page.locator('#bridge-prompt');
      await expect(prompt).not.toBeEmpty();
      const options = page.locator('.bridge-option');
      await expect(options).toHaveCount(3); // correct + 2 distractors (only 2 others in pool)
    });

    test('clicking correct answer highlights green and advances', async ({ page }) => {
      // The correct answer for first seam is Rom 8:2
      const correctBtn = page.locator('.bridge-option[data-ref="Rom 8:2"]');
      await correctBtn.click();
      await expect(correctBtn).toHaveClass(/bridge-option--correct/);
      // Wait for advance
      await page.waitForTimeout(700);
      // Next prompt should reference Rom 8:2
      const prompt = page.locator('#bridge-prompt');
      await expect(prompt).toContainText('Rom 8:2');
    });

    test('clicking wrong answer highlights red and shows correct', async ({ page }) => {
      // Click a wrong answer
      const wrongBtn = page.locator('.bridge-option[data-ref="Rom 8:3"]');
      await wrongBtn.click();
      await expect(wrongBtn).toHaveClass(/bridge-option--wrong/);
      // Correct should also be highlighted
      const correctBtn = page.locator('.bridge-option[data-ref="Rom 8:2"]');
      await expect(correctBtn).toHaveClass(/bridge-option--correct/);
    });
  });

  // ── Chapter Chunk Order ──
  test.describe('Chapter Chunk Order Drill', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(({ key, verses, passage }) => {
        localStorage.setItem(key, JSON.stringify({ verses, passages: [passage] }));
      }, { key: STORAGE_KEY, verses: VERSES, passage: PASSAGE });
      await page.goto('/');
      await page.click('button.nav-btn[data-view="scripture"]');
      await page.waitForSelector('#view-scripture', { state: 'visible' });
      await page.click('button.scripture-tab[data-stab="drill"]');
      await page.waitForSelector('#sp-drill', { state: 'visible' });
      // Switch to chunk-order mode
      await page.click('.scripture-mode[data-mode="chunk-order"]');
      // Switch to chapter scale
      await page.click('.drill-scale[data-scale="chapter"]');
      // Select the passage
      await page.selectOption('#drill-passage-picker', 'Romans 8:1-4');
    });

    test('chapter chunks drill shows scrambled chunks', async ({ page }) => {
      const chunkArea = page.locator('#drill-chapter-chunks');
      await expect(chunkArea).toBeVisible();
      const pills = page.locator('#chapter-chunks-bank .chunk-pill');
      // 2+3+2+3 = 10 total chunks
      await expect(pills).toHaveCount(10);
    });

    test('clicking a chunk moves it to selected area', async ({ page }) => {
      const pill = page.locator('#chapter-chunks-bank .chunk-pill').first();
      const text = await pill.textContent();
      await pill.click();
      await expect(pill).toHaveClass(/chunk-pill--used/);
      const selected = page.locator('#chapter-chunks-selected .chunk-pill--selected');
      await expect(selected).toHaveCount(1);
      await expect(selected.first()).toHaveText(text);
    });

    test('progress bar updates as chunks are selected', async ({ page }) => {
      const label = page.locator('#chapter-chunks-label');
      await expect(label).toHaveText('0 / 10');
      await page.locator('#chapter-chunks-bank .chunk-pill').first().click();
      await expect(label).toHaveText('1 / 10');
    });
  });

  // ── Passage Self-Check ──
  test.describe('Passage Self-Check', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(({ key, verses, passage }) => {
        localStorage.setItem(key, JSON.stringify({ verses, passages: [passage] }));
      }, { key: STORAGE_KEY, verses: VERSES, passage: PASSAGE });
      await page.goto('/');
      await page.click('button.nav-btn[data-view="scripture"]');
      await page.waitForSelector('#view-scripture', { state: 'visible' });
      await page.click('button.scripture-tab[data-stab="drill"]');
      await page.waitForSelector('#sp-drill', { state: 'visible' });
      // self-check mode (default)
      await page.click('.scripture-mode[data-mode="self-check"]');
      // Switch to chapter scale
      await page.click('.drill-scale[data-scale="chapter"]');
      await page.selectOption('#drill-passage-picker', 'Romans 8:1-4');
    });

    test('shows full passage text in self-check mode', async ({ page }) => {
      const flashcard = page.locator('#flashcard-text');
      await expect(flashcard).toContainText('There is no condemnation');
      await expect(flashcard).toContainText('would be fulfilled');
    });
  });

  // ── Passage List Actions ──
  test.describe('Passage List', () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(({ key, verses, passage }) => {
        localStorage.setItem(key, JSON.stringify({ verses, passages: [passage] }));
      }, { key: STORAGE_KEY, verses: VERSES, passage: PASSAGE });
      await page.goto('/');
      await page.click('button.nav-btn[data-view="scripture"]');
      await page.waitForSelector('#view-scripture', { state: 'visible' });
    });

    test('passage list shows saved passages', async ({ page }) => {
      const card = page.locator('.passage-card');
      await expect(card).toHaveCount(1);
      await expect(card.locator('.passage-card__ref')).toHaveText('Romans 8:1-4');
    });

    test('passage card shows verse count', async ({ page }) => {
      const meta = page.locator('.passage-card__meta');
      await expect(meta).toContainText('4 verses');
    });

    test('remove passage button works', async ({ page }) => {
      page.on('dialog', d => d.accept());
      await page.click('[data-action="remove-passage"]');
      await expect(page.locator('.passage-card')).toHaveCount(0);
    });
  });
});
