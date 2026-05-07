# Scripture Memorization System

## Overview

MemoryForge's Scripture module provides a complete Bible memorization system built on cognitive science principles. It combines **chunking** (phrase-level encoding), **first-letter cues** (bridging recall), **word-level diff feedback** (precision training), and **SM-2 spaced repetition** (long-term retention).

## Architecture

### Modules (`src/`)

| Module | Purpose | Exports |
|--------|---------|---------|
| `chunker.js` | Split verse text at natural phrase boundaries | `chunkVerse(text)`, `chunkPassage(verses)` |
| `first-letter.js` | Generate first-letter hints for recall scaffolding | `toFirstLetters(text)`, `fromFirstLetters(text)` |
| `diff-recall.js` | LCS-based word-level diff for exact wording feedback | `diffWords(expected, got)`, `scoreDiff(diff)`, `formatDiff(diff)` |
| `spaced-repetition.js` | SM-2 algorithm with layer promotion | `createCard(ref)`, `reviewCard(card, quality)`, `getDueCards(cards)` |
| `verse-library.js` | Verse CRUD, passage grouping, persistence | `VerseLibrary` class |

### UI (`docs/scripture.js`)

Self-contained script loaded after `app.js`. Provides:
- **Library panel**: Add/edit/remove verses, auto-chunking on add
- **Review panel**: Spaced repetition queue with diff feedback + quality rating
- **Drill panel**: First-letter, chunk-recall, and full-recall modes

### Data Persistence

All data stored in `localStorage` under key `mf_scripture_library`:
```json
{
  "verses": [
    {
      "reference": "John 3:16",
      "text": "For God so loved the world...",
      "translation": "KJV",
      "chunks": ["For God so loved the world,", "that he gave..."],
      "card": { "interval": 6, "streak": 3, "easeFactor": 2.6, "layer": 1, "nextReview": 1715200000000 },
      "storyNotes": "God reaching down from heaven...",
      "errors": []
    }
  ],
  "passages": [
    { "name": "John 3:16-18", "verses": ["John 3:16", "John 3:17", "John 3:18"] }
  ]
}
```

## Memorization Method

### The Layered Mastery Model

Each verse progresses through 6 layers:

| Layer | Name | Requirement | Drill Mode |
|-------|------|-------------|------------|
| 0 | New | Just added | Read + chunk |
| 1 | Learning | 3 consecutive quality ≥ 4 | First-letter |
| 2 | Familiar | 6 consecutive quality ≥ 4 | Chunk recall |
| 3 | Confident | 9 consecutive quality ≥ 4 | Full recall |
| 4 | Mastered | 12 consecutive quality ≥ 4 | Random access |
| 5 | Deep | 15 consecutive quality ≥ 4 | Interference training |

### Core Techniques

**1. Chunking** — Verse text is automatically split at phrase boundaries (commas, semicolons, conjunctions). Each chunk is a single thought unit that fits in working memory.

**2. First-Letter Method** — Shows `F G s l t w, t h g h o b S` as a scaffold. You see just enough to reconstruct the full text without seeing the words themselves.

**3. Word-Level Diff** — After recall, you see exactly which words were correct (green), wrong (red strikethrough), missing (yellow underline), or extra (red faded). This pinpoints your weak spots.

**4. SM-2 Spaced Repetition** — Intervals expand: 1 day → 6 days → ~15 days → ~38 days → ~95 days. A failed recall resets to 1 day. The ease factor adapts to each verse's difficulty.

### Quality Ratings

After each recall attempt:
- **5 (Perfect)** — Word-for-word correct, no hesitation
- **4 (Good)** — Correct with minor effort
- **3 (OK)** — Correct but difficult
- **2 (Hard)** — Significant errors but got the gist
- **1 (Blank)** — Could not recall

### Daily Practice Workflow

1. Open Scripture tab → Review sub-tab
2. Work through due verses (type from memory → check → rate)
3. Switch to Library → add 1-2 new verses
4. Switch to Drill → practice new verses with first-letter mode

## Chunking Algorithm

The chunker splits text at:
1. **Punctuation** — commas, semicolons, colons (keeps punctuation with preceding text)
2. **Conjunctions** — "but", "that", "and", "for", "or" (only if both halves have ≥ 3 words)
3. **Merging** — Chunks smaller than 3 words get merged with neighbors

Example:
```
Input:  "For God so loved the world, that he gave his only begotten Son, that whoever believes in him should not perish, but have everlasting life."
Output: ["For God so loved the world,", "that he gave his only begotten Son,", "that whoever believes in him should not perish,", "but have everlasting life."]
```

## Diff Algorithm

Uses Longest Common Subsequence (LCS) to produce minimal word-level diffs:

```
Expected: "For God so loved the world"
Got:      "For God so loved the earth"

Diff: [
  { type: "equal", expected: "For" },
  { type: "equal", expected: "God" },
  { type: "equal", expected: "so" },
  { type: "equal", expected: "loved" },
  { type: "equal", expected: "the" },
  { type: "replace", expected: "world", got: "earth" }
]

Score: 5/6 = 0.833
```

## Future Phases

### Phase 2: Smart Entry + More Modes
- Fetch verse text from Bible API by reference
- Fill-in-blank mode (random word deletion)
- Reference ↔ text bidirectional drill
- Rolling window drill (overlapping verse groups)

### Phase 3: Passages & Chapters
- Chain drill (verse N → verse N+1 transitions)
- Chapter outline mode
- Progress visualization (heat map)
- Confusion pair detection (similar verses drilled together)

### Phase 4: Book Memorization
- Book-level progress tracking
- Chapter transition drills
- Reverse/random-jump drill
- Export/share verse collections

## Testing

```bash
npx vitest run tests/chunker.test.js       # 11 tests
npx vitest run tests/first-letter.test.js   # 12 tests
npx vitest run tests/diff-recall.test.js    # 12 tests
npx vitest run tests/spaced-repetition.test.js  # 13 tests
npx vitest run tests/verse-library.test.js  # 12 tests
```

All 60 Scripture-specific tests + 206 existing tests = 266 total, all passing.
