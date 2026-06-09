---
title: MemoryForge — Current vs. Vision Gap Analysis
tags: [gap-analysis, planning, onboarding, corpus, stats, weak-spot, acoustic, athlete, roadmap]
created: 2026-06-08
summary: Side-by-side of what exists vs. what was articulated — problem severity table, 5-phase closure plan, open questions.
category: planning
---

# MemoryForge — Current vs. Vision

*Gap analysis comparing the current application to the articulated vision. Produced 2026-06-08.*

---

## Current State

### Navigation (6 flat tabs)

```
Drill | Learn | Stats | Scripture | Speed | Data
```

| Tab | What it actually does |
|-----|----------------------|
| **Drill** | Configurable memory drill — digits, letters, or words; 5 techniques |
| **Learn** | Technique guides (7) + interactive tools (flashcards, trainer, table, bridge) |
| **Stats** | Aggregate drill metrics — buried, disconnected from goals |
| **Scripture** | Full Bible corpus + 11 drill modes + spaced repetition |
| **Speed** | RSVP, Reader, Schulte (peripheral), Assess |
| **Data** | Import/export JSON + ultra-dark mode toggle |

### What's Good

- **Technique coverage** is solid. Major System, Peg, PAO, Linking, Number-Shape, Number-Rhyme represent the mainstream of memory sports training.
- **Scripture drilling** is deep and well-designed. 11 drill modes, spaced repetition, chunk editor.
- **Speed reading** is a genuine cognitive add — RSVP, paced reader, and Schulte peripheral training are real tools.
- **Accessibility** is clean — 100/100 WCAG AA SPA audit across 38 states.
- **Zero dependencies** — pure HTML/CSS/JS PWA, fast, installable, private.

### What's Missing or Wrong

| Problem | Impact | Severity |
|---------|--------|----------|
| No onboarding | Users land in a config form with no guidance | 🔴 High |
| No goal setting | App has no idea what success means for this user | 🔴 High |
| Stats are hidden | No visible reward loop; habit formation breaks | 🔴 High |
| Content locked to Scripture | Non-scripture users have no natural home | 🔴 High |
| No weak-spot detection | Training is self-directed with no coach input | 🟠 Medium |
| Acoustic/harmonic encoding absent | Entire sensory channel untrained | 🟠 Medium |
| "Learn" mixes passive + active | Guides buried with interactive tools | 🟡 Low |
| No user identity | User is not named, not tracked, not an "athlete" | 🟡 Low |
| No progression path | No suggested "next workout" | 🟠 Medium |

---

## Articulated Vision

### The Gym Metaphor — Complete

A gym has three things a feature list doesn't:
1. **Intake** — "What are you here for? What's your goal?"
2. **A plan** — "Based on your goal, here's what you should do today."
3. **Measurement** — "Here's how you've improved since you started."

MemoryForge has the equipment. The vision adds the coach.

---

### Corpus Neutrality

Scripture is **Joshua's** primary corpus. The application serves **every learner's** primary corpus. These are the same architecture — a content library with structured drilling — applied to different material.

**First-class corpora to support:**

| Corpus | Encoding Mode | Notes |
|--------|--------------|-------|
| Hebrew/Greek scripture | Semantic + rhythmic | Already present; keep first-class |
| English scripture (NIV, ESV, KJV, NLT...) | Semantic + rhythmic | Already present |
| Shakespeare / classic lit | Semantic + rhythmic | Natural extension |
| Poetry (user-added) | Rhythmic + acoustic | Needs acoustic encoding support |
| Calculus / physics equations | Visual-symbolic | New encoding mode needed |
| Periodic table / chemistry | Visual-associative | Major System maps well |
| Foreign language vocabulary | Acoustic + visual | Phonetic encoding natural fit |
| Music (lyrics + melody) | Acoustic + semantic | Requires harmonic encoding |
| Personal (names, dates, sequences) | Associative | Peg/PAO maps well |
| Custom (user-defined) | User-chosen | The long tail |

**Architecture implication**: Replace the "Scripture" tab with a "Library" or "Content" view. Scripture is a built-in pack in the library. Other packs are downloadable, user-importable, or community-contributed.

---

### Sensory Encoding — The Full Spectrum

Every current technique encodes via **visual imagery + spatial association** (the dominant paradigm of memory sports). This is powerful but incomplete.

```
CURRENT COVERAGE:
  Visual-spatial     ██████████  100%  (Major, Peg, PAO, Linking, Number-Shape)
  Visual-sequential  ████████░░   80%  (RSVP, Reader, chunking)
  Kinesthetic        ████░░░░░░   40%  (First-letter tap, chunk editor)
  Acoustic-rhythm    █░░░░░░░░░   10%  (Implied in chunk pacing; no explicit tool)
  Acoustic-pitch     ░░░░░░░░░░    0%  (Not present)
  Emotional-semantic ███░░░░░░░   30%  (Linking/story guide; no structured tool)

VISION COVERAGE:
  All of the above + pitch interval trainer, rhythm tapping, melody encoding
```

**On acoustic pitch training (Joshua's hypothesis):**

The science supports the mechanism. Hebbian synaptic plasticity — "neurons that fire together wire together" — is well-established. Repeated exposure to auditory stimuli with immediate feedback causes measurable cortical reorganization in auditory processing areas. Musicians show enlarged Heschl's gyrus (primary auditory cortex) compared to non-musicians, with the degree of enlargement correlating with years of training and age at onset.

*Absolute pitch* (identifying pitch without reference) remains debated as a fully trainable adult skill — there is a critical window hypothesis suggesting it's best acquired before age 7-9. However, **relative pitch** — the ability to identify and reproduce intervals between pitches — is absolutely trainable at any age and is the practical foundation of musical memory. More relevant to MemoryForge: encoding information as melody (as children do with the alphabet) exploits the **phonological loop** and **tonal memory** simultaneously, producing measurably higher recall rates than purely verbal encoding.

The product implication: start with rhythm + melody encoding for text (e.g., "hum the verse"), and interval ear training as a standalone tool. Full acoustic pitch training can follow.

---

### Athlete Model — What It Requires

If the user is an athlete, the product needs:

| Athlete need | Product expression |
|-------------|-------------------|
| Intake / goals | Onboarding wizard — 3-5 questions, sets primary corpus + training goals |
| Daily workout | Home dashboard — "Today's training" built from goals + weak spots |
| Performance metrics | Always-visible score/streak; per-session breakdown |
| Weak spot detection | Automatic: flag lowest-performing technique × domain combinations |
| Progressive overload | Increase drill difficulty as skill improves (longer sequences, faster RSVP) |
| Recovery tracking | Spaced repetition already exists — surface it explicitly |
| Coach voice | Contextual suggestions: "Your chunk-recall score is 40% lower than your self-check score. Try X." |

---

### Human vs. AI — The Asymmetry That Justifies This Product

Joshua articulated a distinction worth preserving carefully:

> "AI can learn things quicker… but the human brain is more efficient and more stable. The human can learn better and learn *why* better and learn *how* better… AI knows the pattern, it's been taught the pattern, so it speaks — but its speaking also reveals pattern. Whereas as a human, we know, so we speak."

This is an epistemological claim about the *nature* of understanding, not just its speed. It maps onto what philosophers call the difference between **propositional knowledge** ("knowing that") and **comprehension** ("knowing why/how"). AI demonstrably has the former at scale; whether it has the latter is genuinely open. But Joshua's intuition — that a trained human understands in a way that is qualitatively different, more stable, more transferable — aligns with what we know about the neurological substrate of human knowledge.

When a person memorizes something deeply — through repetition, multi-sensory encoding, spaced retrieval — they are not adding a fact to a database. They are building **cognitive infrastructure**: dendritic branching, synaptic strengthening, and cross-modal pathway formation that makes *all future related learning easier*. The content is the stimulus; the structural change to the brain is the product.

This reframes what MemoryForge actually is:

> **MemoryForge is not a memorization tool. It is a cognitive infrastructure builder. The content is the training stimulus. The brain change is the deliverable.**

That reframing should be felt in the onboarding, the dashboard, the stats, and eventually the product's name and positioning.

---

## The Gap — Summary Table

| Dimension | Current | Vision | Gap size |
|-----------|---------|--------|----------|
| User entry experience | Cold config form | Onboarding intake + personalized plan | 🔴 Large |
| Content scope | Scripture only | Any corpus (packs + custom) | 🔴 Large |
| Stats visibility | Hidden tab | Always-on dashboard panel | 🟠 Medium |
| Goal tracking | None | Goal-linked progress metrics | 🔴 Large |
| Weak spot coaching | None | Automatic detection + suggestions | 🔴 Large |
| Sensory encoding | Visual-spatial dominant | + Acoustic (rhythm, pitch, melody) | 🟠 Medium |
| User identity | Anonymous clicker | Named athlete with history | 🟡 Small |
| Progression system | None | Adaptive difficulty scaling | 🟠 Medium |
| Product identity | Feature app | Cognitive infrastructure builder | 🟡 Framing |

---

## Recommended Closure Path (Phases)

### Phase 1 — The Athlete's Front Door
*Lowest code change, highest user experience impact*

- [ ] Onboarding: 3-question first-launch flow (goal, corpus priority, time per session)
- [ ] Home dashboard: streak + today's workout card + quick actions based on onboarding
- [ ] Stats surfaced on dashboard (not hidden tab)
- [ ] "Scripture" → "Library" rename with Scripture as a default pack

**Unlocks**: Any new user immediately understands the app and has a reason to return tomorrow.

### Phase 2 — The Corpus System
*Moderate architectural change*

- [ ] Generic text library: user imports any text, tags it (poem, scripture, equation, vocabulary)
- [ ] Community packs: Shakespeare, Periodic Table, Calculus notation
- [ ] Drill modes apply to any corpus (not just scripture-specific modes)
- [ ] Spaced repetition applies to any content

**Unlocks**: App is relevant to everyone, not just scripture memorizers.

### Phase 3 — The Coach
*Data + logic work*

- [ ] Per-session performance breakdown (score by technique, score by domain)
- [ ] Weak spot detection heuristic (flag technique × domain combinations below threshold)
- [ ] Contextual coaching messages: "You score 40% lower on recall vs. recognition for Major System. Want to drill that specifically?"
- [ ] Adaptive difficulty: auto-increase sequence length / decrease pacing as score improves

**Unlocks**: The app starts behaving like a coach, not a tool.

### Phase 4 — Acoustic Encoding
*New capability*

- [ ] Rhythm tapping drill: speak/tap a verse to a beat, recall by tapping
- [ ] Melody encoding: assign a simple melodic contour to any memorized passage
- [ ] Interval ear trainer: standalone pitch/interval recognition tool
- [ ] Harmonic peg system: map pitches to numbers for musical memory encoding

**Unlocks**: Full sensory spectrum; unique differentiation from every other memory app.

### Phase 5 — Cloud + Social (Optional / Future)
- [ ] Optional cloud sync (account-gated)
- [ ] Shareable streaks / progress
- [ ] Community corpus packs
- [ ] Coach mode: share your training plan

---

## Open Questions

1. **Corpus import format** — plain text paste? Markdown? JSON with chapter/verse structure?
2. **Onboarding persistence** — stored in localStorage like drills? How does the user update their goals?
3. **Acoustic prototype** — what's the smallest proof-of-concept? (Rhythm tapper = 1 day. Pitch trainer = 1 week. Full melody encoding = 2-3 weeks.)
4. **Weak spot threshold** — what score delta triggers a coaching suggestion? (e.g., >20% below personal average for that technique)
5. **"Library" architecture** — does each corpus pack define its own drill modes, or do drill modes stay generic?
6. **Perfect pitch research** — is there a reputable training protocol we could adapt? (Relative Pitch Ear Training apps exist; see Functional Ear Trainer, ToneSavvy)
