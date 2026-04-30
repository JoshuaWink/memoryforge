# MemoryForge

Speed memory training app. No accounts, no servers, all local.

**Live**: [joshuawink.github.io/memoryforge](https://joshuawink.github.io/memoryforge/)

## What It Does

Presents material → you memorize → it hides → you recall → it scores you.
You bring the memory techniques (palace, pegs, story chains). This app brings the reps.

## Drill Types

- **Digits** — random number sequences (configurable length)
- **Letters** — random uppercase letter sequences
- **Words** — random word sequences from a pool
- **Custom Text** — paste anything (Bible verses, quotes, paragraphs)

## Features

- Configurable exposure time (auto-hide or "I've got it")
- Character-level and word-level scoring with visual diff
- IndexedDB storage (unlimited local data)
- JSON export/import for backup and device sync
- PWA — installable, works offline
- Dark theme (cup-ui design tokens)

## Development

```bash
npm install
npm test          # vitest — 49 tests
npx serve docs    # local dev server
```

## Data

Everything stays in your browser's IndexedDB. Export to JSON anytime. Import on any device.
