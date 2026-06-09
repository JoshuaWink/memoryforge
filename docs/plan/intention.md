---
title: Intention — MemoryForge
tags: [intention, north-star, vision, mental-athletics, cognitive-infrastructure, planning]
created: 2026-06-08
summary: North Star document — MemoryForge as the cognitive gym for every human athlete. Constraints, success criteria, and phase map.
category: planning
---

# Intention — MemoryForge

> Build the cognitive gym that every human athlete needs — one that meets them where they are, trains what they're called to master, and tracks whether they're actually getting stronger.

---

## North Star

Every person was made with a purpose. That purpose requires knowledge. Not the passive consumption of knowledge — the *embodied ownership* of it. The kind of knowing that changes how you see, speak, and act.

MemoryForge is the training ground for that kind of knowing. It doesn't care what you're memorizing — scripture, Shakespeare, equations, music. It cares that you are becoming the kind of person who can memorize anything. And it will show you the data to prove it.

A new user arrives not knowing what to train. MemoryForge asks them what they're here for, builds them a plan, watches how they perform, finds their weak spots, and tells them what to do next. Like a coach. Not a tool — a coach.

The user is an athlete. We treat them like one.

---

## Why This Matters

The application in its current state is a **gymnasium without a coach**. The equipment is real. The techniques are sound. But:

- There is no intake process. Users land in a drill configuration form with no context.
- There is no goal. The app doesn't know what the user wants to achieve.
- There is no progress feedback tied to goals. Stats are a hidden tab.
- Content is locked to Scripture. Users with other memorization goals have no home.
- The full spectrum of sensory encoding (acoustic, rhythmic, kinesthetic) is not represented.
- The user has no identity in the app. They're not an athlete — they're someone clicking buttons.

The gap between what exists and what it could be is the gap between a storage unit and a training facility.

---

## What Success Feels Like

- A student opens the app, tells it they're memorizing chemistry equations for finals, and the app immediately builds them a relevant drill set with technique suggestions.
- A pastor opens the app every morning, sees their streak, sees that this week's weak spot is Psalm 119 chunk-recall, and gets a 10-minute focused workout built around that.
- A musician opens the app and trains both the words and the melodic contour of a worship song simultaneously — acoustic + verbal encoding working together.
- Six months in, a user can see a chart of their encoding speed, recall accuracy, and technique mastery — and knows exactly which cognitive pathway still needs work.
- Someone who "can't memorize anything" opens the app and within one session proves to themselves they can.

---

## Constraints

- **Platform**: PWA — runs in browser, installable, local data first. No server dependency for core features.
- **Dependencies**: JS/HTML/CSS only. No framework.
- **Privacy**: Data stays on device. No telemetry without explicit opt-in.
- **Faith integration**: Hebrew/Greek scripture remains first-class. Other corpora are equal citizens — not lesser, not hidden.
- **Accessibility**: WCAG AA — already at 100/100 audit score; maintain it.

---

## Phases of Understanding

| Phase | Description | Status |
|-------|-------------|--------|
| Explore | Mapped current features, identified structural gaps | ✅ Done |
| Prototype | Onboarding flow, corpus system, acoustic prototype | 🔲 Next |
| Crystallize | Define data model for corpora, goals, training plans | 🔲 Pending |
| Roadmap | Milestone plan with shippable increments | 🔲 Pending |
| Build | Execute milestones, TDD, maintain audit score | 🔲 Pending |
| Reflect | Is the user actually becoming a better learner? | 🔲 Ongoing |
