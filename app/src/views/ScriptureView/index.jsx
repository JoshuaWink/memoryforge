import { useEffect, useRef } from 'react';

const SCRIPTURE_HTML = `

      <!-- Sub-navigation -->
      <div class="scripture-tabs">
        <button class="scripture-tab active" data-stab="library">Library</button>
        <button class="scripture-tab" data-stab="review">Review</button>
        <button class="scripture-tab" data-stab="drill">Drill</button>
      </div>

      <!-- LIBRARY panel -->
      <div class="scripture-panel" id="sp-library">
        <div class="scripture-add">
          <div class="field-group">
            <label class="field-label" for="verse-ref">Reference</label>
            <input type="text" id="verse-ref" class="field-input" placeholder="e.g. John 3:16">
          </div>
          <div class="field-group">
            <label class="field-label" for="verse-translation">Translation</label>
            <select id="verse-translation" class="field-input">
              <option value="KJV">KJV</option>
              <option value="ESV">ESV</option>
              <option value="NASB">NASB</option>
              <option value="NIV">NIV</option>
              <option value="NLT">NLT</option>
              <option value="NKJV">NKJV</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="field-group">
            <label class="field-label" for="verse-text">Text</label>
            <textarea id="verse-text" class="field-input scripture-textarea" rows="3" placeholder="Type or paste the verse text..."></textarea>

          </div>
          <div class="field-group">
            <label class="field-label" for="verse-notes">Story Notes (optional)</label>
            <textarea id="verse-notes" class="field-input" rows="2" placeholder="Your imagery, scenes, memory aids..."></textarea>
          </div>
          <button id="btn-add-verse" class="btn btn-primary">Add Verse</button>
        </div>

        <!-- Import/Export Tools -->
        <div class="scripture-tools">
          <details class="import-section">
            <summary class="btn btn-sm btn-secondary">Import / Export</summary>
            <div class="import-section__body">
              <div class="field-group">
                <label class="field-label" for="bulk-paste-area">Bulk Paste (Bible app format)</label>
                <textarea id="bulk-paste-area" class="field-input scripture-textarea" rows="4" placeholder="Paste from Bible app — e.g. Romans 1:1 NLT&#10;[1] This letter is from Paul...&#10;&#10;https://bible.com/..."></textarea>
                <button id="btn-bulk-import" class="btn btn-sm btn-primary">Import Pasted Verses</button>
              </div>
              <div class="field-group" style="margin-top:var(--cup-space-sm)">
                <label class="field-label" for="bible-url-input">Bible.com URL</label>
                <div style="display:flex;gap:var(--cup-space-xs)">
                  <input type="url" id="bible-url-input" class="field-input" placeholder="https://bible.com/bible/116/rom.1.1-5.NLT" style="flex:1">
                  <button id="btn-fetch-bible-url" class="btn btn-sm btn-primary">Fetch</button>
                </div>
                <p id="bible-url-status" style="font-size:var(--cup-font-size-sm);color:var(--cup-color-text-muted);margin-top:var(--cup-space-xs)"></p>
              </div>
              <div class="import-export-row">
                <button id="btn-export-json" class="btn btn-sm btn-secondary">Export JSON</button>
                <label class="btn btn-sm btn-secondary import-file-label">
                  Import JSON
                  <input type="file" id="import-json-file" accept=".json" hidden>
                </label>
              </div>
            </div>
          </details>

          <details class="import-section" style="margin-top:var(--cup-space-sm)">
            <summary class="btn btn-sm btn-secondary">Import Chapter</summary>
            <div class="import-section__body">
              <div class="field-group">
                <label class="field-label" for="ch-import-book">Book</label>
                <input type="text" id="ch-import-book" class="field-input" placeholder="e.g. Romans, Genesis, Psalm" autocomplete="off">
              </div>
              <div style="display:flex;gap:var(--cup-space-xs);margin-top:var(--cup-space-xs)">
                <div class="field-group" style="flex:1">
                  <label class="field-label" for="ch-import-chapter">Chapter</label>
                  <input type="number" id="ch-import-chapter" class="field-input" min="1" value="1">
                </div>
                <div class="field-group" style="flex:1">
                  <label class="field-label" for="ch-import-translation">Translation</label>
                  <select id="ch-import-translation" class="field-input">
                    <option value="nlt" data-vid="116">NLT</option>
                    <option value="kjv" data-vid="1">KJV</option>
                    <option value="esv" data-vid="59">ESV</option>
                    <option value="niv" data-vid="111">NIV</option>
                    <option value="nkjv" data-vid="114">NKJV</option>
                    <option value="nasb" data-vid="100">NASB</option>
                    <option value="web" data-vid="206">WEB</option>
                    <option value="amp" data-vid="8">AMP</option>
                    <option value="msg" data-vid="97">MSG</option>
                  </select>
                </div>
              </div>
              <div style="display:flex;gap:var(--cup-space-xs);margin-top:var(--cup-space-sm)">
                <button id="btn-ch-import" class="btn btn-sm btn-primary" style="flex:1">Import Chapter</button>
                <button id="btn-book-import" class="btn btn-sm btn-secondary" style="flex:1">Import Book</button>
              </div>
              <p id="ch-import-status" style="font-size:var(--cup-font-size-sm);color:var(--cup-color-text-muted);margin-top:var(--cup-space-xs)"></p>
            </div>
          </details>
        </div>

        <!-- Passage Creation -->
        <div class="passage-create" id="passage-create-section">
          <details class="import-section">
            <summary class="btn btn-sm btn-secondary">Create Study Plan</summary>
            <div class="import-section__body">
              <div class="field-group">
                <label class="field-label" for="passage-ref">Study Plan Name</label>
                <input type="text" id="passage-ref" class="field-input" placeholder="e.g. Season of Grace &bull; Romans 8">
              </div>
              <div class="field-group" style="margin-top:var(--cup-space-xs)">
                <label class="field-label" for="study-plan-verse-search">Search verses</label>
                <input type="search" id="study-plan-verse-search" class="field-input field-input--sm" placeholder="Filter by reference or text&hellip;" autocomplete="off" autocorrect="off" spellcheck="false">
              </div>
              <p class="field-label">Select verses (in order):</p>
              <div id="passage-verse-checkboxes" class="passage-verse-list"></div>
              <button id="btn-create-passage" class="btn btn-sm btn-primary">Create Study Plan</button>
            </div>
          </details>
        </div>

        <!-- Verses Section: collapsible + searchable -->
        <details class="library-section" id="library-verses-section" open>
          <summary class="library-section__header">
            <span class="library-section__title">Verses <span class="library-section__count" id="verse-count-badge"></span></span>
            <span class="library-section__arrow">▸</span>
          </summary>
          <div class="library-section__body">
            <div class="library-search-bar">
              <input type="search" id="verse-search" class="field-input field-input--sm" placeholder="Search verses…" autocomplete="off" autocorrect="off" spellcheck="false">
            </div>
            <div class="scripture-list" id="scripture-list"></div>
          </div>
        </details>

        <!-- Study Plans Section: collapsible -->
        <details class="library-section" id="library-passages-section" open>
          <summary class="library-section__header">
            <span class="library-section__title">Study Plans <span class="library-section__count" id="passage-count-badge"></span></span>
            <span class="library-section__arrow">▸</span>
          </summary>
          <div class="library-section__body">
            <div class="passage-list" id="passage-list"></div>
          </div>
        </details>
      </div>

      <!-- REVIEW panel (spaced repetition queue) -->
      <div class="scripture-panel" id="sp-review" style="display:none;">
        <div class="review-status" id="review-status">
          <p class="review-count"><span id="review-due-count">0</span> verses due for review</p>
          <button id="btn-start-review" class="btn btn-primary">Start Review</button>
        </div>
        <div class="review-card" id="review-card" style="display:none;">
          <p class="review-reference" id="review-ref"></p>
          <p class="review-layer" id="review-layer"></p>
          <div class="review-input-area">
            <textarea id="review-input" class="field-input scripture-textarea" rows="4" placeholder="Type the verse from memory..."></textarea>
            <button id="btn-check-review" class="btn btn-primary">Check</button>
          </div>
          <div class="review-diff" id="review-diff" style="display:none;"></div>
          <div class="review-actions" id="review-actions" style="display:none;">
            <p class="review-score-label">How well did you recall it?</p>
            <div class="review-quality-btns">
              <button class="btn btn-sm review-q" data-q="1">Blank</button>
              <button class="btn btn-sm review-q" data-q="2">Hard</button>
              <button class="btn btn-sm review-q" data-q="3">OK</button>
              <button class="btn btn-sm review-q" data-q="4">Good</button>
              <button class="btn btn-sm review-q" data-q="5">Perfect</button>
            </div>
          </div>
        </div>
      </div>

      <!-- DRILL panel -->
      <div class="scripture-panel" id="sp-drill" style="display:none;">
        <details class="drill-settings" id="drill-settings" open>
          <summary class="drill-settings__toggle">Drill Settings</summary>
          <div class="drill-settings__body">
            <!-- Scale Selector -->
            <div class="drill-scale-select">
              <label class="field-label">Scale</label>
              <div class="drill-scale-btns">
                <button class="btn btn-sm drill-scale active" data-scale="verse">Verse</button>
                <button class="btn btn-sm drill-scale" data-scale="section">Plan</button>
                <button class="btn btn-sm drill-scale" data-scale="chapter">Chapter</button>
              </div>
            </div>

            <!-- Passage Picker (for section/chapter scale) -->
            <div class="drill-passage-select" id="drill-passage-select" style="display:none;">
              <label class="field-label" for="drill-passage-search">Passage</label>
              <input type="text" id="drill-passage-search" class="field-input drill-picker-search" placeholder="Type to search passages...">
              <select id="drill-passage-picker" class="field-input" style="margin-top:var(--cup-space-xs);">
                <option value="">Select a passage...</option>
              </select>
            </div>

            <div class="drill-mode-select">
              <label class="field-label">Drill Mode</label>
              <div class="drill-mode-btns">
                <button class="btn btn-sm scripture-mode active" data-mode="self-check">Self-Check</button>
                <button class="btn btn-sm scripture-mode" data-mode="chunk-order">Chunk Order</button>
                <button class="btn btn-sm scripture-mode" data-mode="fill-blank">Fill Blank</button>
                <button class="btn btn-sm scripture-mode" data-mode="fl-tap">First-Letter Tap</button>
                <button class="btn btn-sm scripture-mode" data-mode="chunk-by-chunk">Chunk by Chunk</button>
                <button class="btn btn-sm scripture-mode" data-mode="sequential">Sequential</button>
                <button class="btn btn-sm scripture-mode" data-mode="verse-order">Verse Order</button>
                <button class="btn btn-sm scripture-mode" data-mode="recite">Recite</button>
                <button class="btn btn-sm scripture-mode" data-mode="first-letter">First Letter</button>
                <button class="btn btn-sm scripture-mode" data-mode="chunk-recall">Chunk Recall</button>
                <button class="btn btn-sm scripture-mode" data-mode="full-recall">Full Recall</button>
              </div>
            </div>
            <div class="drill-verse-select">
              <label class="field-label" for="drill-verse-search">Verse</label>
              <input type="text" id="drill-verse-search" class="field-input drill-picker-search" placeholder="Type to search verses...">
              <select id="drill-verse-picker" class="field-input" style="margin-top:var(--cup-space-xs);">
                <option value="">Select a verse...</option>
              </select>
            </div>
          </div>
        </details>
        <div class="scripture-drill-area" id="scripture-drill-area" style="display:none;">
          <div style="display:flex;align-items:center;gap:var(--cup-space-sm);flex-wrap:wrap">
            <p class="drill-reference" id="sdrill-ref" style="margin:0;flex:1"></p>
            <button id="btn-drill-edit-chunks" class="btn btn-xs btn-secondary" style="display:none">Edit Chunks</button>
          </div>

          <!-- Self-Check (flashcard) -->
          <div class="drill-flashcard" id="drill-self-check" style="display:none;">
            <p class="drill-flashcard__prompt">Recite from memory, then tap Reveal to check</p>
            <div class="drill-flashcard__reveal" id="flashcard-reveal" style="display:none;">
              <p class="drill-flashcard__text" id="flashcard-text"></p>
            </div>
            <button id="btn-flashcard-reveal" class="btn btn-primary">Reveal</button>
            <div class="drill-flashcard__rating" id="flashcard-rating" style="display:none;">
              <button class="btn rate-nailed" data-q="5">Nailed it</button>
              <button class="btn rate-close" data-q="4">Close</button>
              <button class="btn rate-struggled" data-q="2">Struggled</button>
              <button class="btn rate-blank" data-q="1">Blank</button>
            </div>
          </div>

          <!-- Chunk Ordering -->
          <div class="drill-chunk-order" id="drill-chunk-order" style="display:none;">
            <p class="field-label">Tap chunks in the correct order:</p>
            <div class="drill-chunk-order__selected" id="chunk-order-selected"></div>
            <p class="field-label" style="margin-top:var(--cup-space-sm)">Available chunks:</p>
            <div class="drill-chunk-order__bank" id="chunk-order-bank"></div>
            <div id="chunk-order-result"></div>
            <button id="btn-chunk-order-reset" class="btn btn-secondary" style="display:none;margin-top:var(--cup-space-sm)">Reset</button>
          </div>

          <!-- Fill-in-the-Blank -->
          <div class="drill-fill-blank" id="drill-fill-blank" style="display:none;">
            <div class="drill-progress" id="fill-blank-progress">
              <div class="drill-progress__bar"><div class="drill-progress__fill" id="fill-blank-fill" style="width:0%"></div></div>
              <p class="drill-progress__label" id="fill-blank-label"></p>
            </div>
            <div class="drill-fill-blank__verse" id="fill-blank-verse"></div>
            <p class="field-label">Tap the correct word:</p>
            <div class="drill-fill-blank__bank" id="fill-blank-bank"></div>
            <div id="fill-blank-result"></div>
          </div>

          <!-- First-Letter Tap -->
          <div class="drill-fl-tap" id="drill-fl-tap" style="display:none;">
            <div class="drill-fl-tap__verse" id="fl-tap-verse"></div>
            <p class="field-label">Tap the next word:</p>
            <div class="drill-fl-tap__bank" id="fl-tap-bank"></div>
            <div id="fl-tap-result"></div>
          </div>

          <!-- Chunk by Chunk / Sequential -->
          <div class="drill-cbc" id="drill-cbc" style="display:none;">
            <div class="cbc-header">
              <span class="cbc-progress" id="cbc-progress"></span>
              <div class="cbc-dir-toggle" id="cbc-dir-toggle" style="display:none;">
                <button id="btn-cbc-ltr" class="btn btn-xs btn-secondary cbc-dir active" title="Left to Right">L &#8594; R</button>
                <button id="btn-cbc-rtl" class="btn btn-xs btn-secondary cbc-dir" title="Right to Left">R &#8594; L</button>
              </div>
              <div class="cbc-in-nav" id="cbc-in-nav">
                <button id="btn-cbc-prev" class="btn btn-xs btn-secondary">&#9664; Prev</button>
                <button id="btn-cbc-next" class="btn btn-xs btn-secondary">Next &#9654;</button>
              </div>
            </div>
            <div class="drill-cbc__display" id="cbc-display"></div>
            <p class="field-label" id="cbc-prompt"></p>
            <div class="drill-cbc__bank" id="cbc-bank"></div>
            <div id="cbc-result"></div>
          </div>

          <!-- Verse Order (passage scale) -->
          <div class="drill-verse-order" id="drill-verse-order" style="display:none;">
            <div class="vo-progress" id="vo-progress"></div>
            <div class="vo-slots" id="vo-slots"></div>
            <p class="field-label" style="margin-top:var(--cup-space-md)">Tap the next verse:</p>
            <div class="vo-bank" id="vo-bank"></div>
            <div id="vo-result"></div>
          </div>

          <!-- Recite (voice) -->
          <div class="drill-recite" id="drill-recite" style="display:none;">
            <p class="recite-instruction" id="recite-instruction">Speak the verse aloud from memory</p>
            <div class="recite-mic-area">
              <button id="btn-recite-mic" class="btn recite-mic" title="Start listening">
                <span class="recite-mic__icon" id="recite-mic-icon">&#127908;</span>
              </button>
              <span class="recite-mic__status" id="recite-mic-status">Tap to start</span>
            </div>
            <div class="recite-transcript" id="recite-transcript" style="display:none;"></div>
            <div class="recite-diff" id="recite-diff" style="display:none;"></div>
            <div id="recite-result"></div>
          </div>

          <!-- Bridge Drill (passage scale) -->
          <div class="drill-bridge" id="drill-bridge" style="display:none;">
            <p class="field-label">What verse comes after this?</p>
            <div class="drill-bridge__prompt" id="bridge-prompt"></div>
            <div class="drill-bridge__bank" id="bridge-bank"></div>
            <div id="bridge-result"></div>
          </div>



          <!-- Legacy typing modes -->
          <div id="drill-typing-area" style="display:none;">
            <div class="drill-hint" id="sdrill-hint"></div>
            <textarea id="sdrill-input" class="field-input scripture-textarea" rows="4" placeholder="Type the verse..."></textarea>
            <button id="btn-sdrill-check" class="btn btn-primary">Check</button>
            <div class="drill-diff" id="sdrill-diff" style="display:none;"></div>
          </div>

          <div class="drill-nav" id="drill-nav" style="display:none;">
            <button id="btn-sdrill-prev" class="btn btn-secondary drill-nav__btn">&#9664; Previous</button>
            <button id="btn-sdrill-repeat" class="btn btn-primary drill-nav__btn">&#x21bb; Repeat</button>
            <button id="btn-sdrill-next" class="btn btn-secondary drill-nav__btn">Next &#9654;</button>
          </div>
        </div>
      </div>
`;

/**
 * ScriptureView — renders the scripture.js DOM structure then loads the script.
 * scripture.js is an IIFE that wires to DOM IDs — we provide those IDs and let
 * it run once on first mount.
 */
export default function ScriptureView() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    if (document.getElementById('scripture-list')) {
      // DOM already exists — script likely already ran
      initialized.current = true;
      return;
    }

    // Dynamic load of scripture.js — it will run its IIFE against our DOM
    const script  = document.createElement('script');
    script.src    = '/scripture.js';
    script.onload = () => { initialized.current = true; };
    document.head.appendChild(script);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      id="view-scripture"
      className="view view-section view-section--scripture"
      dangerouslySetInnerHTML={{ __html: SCRIPTURE_HTML }}
    />
  );
}
