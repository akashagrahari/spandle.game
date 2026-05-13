# CLAUDE.md

## What this is

**Outlast!** is a daily browser puzzle game built on a fork of [wikitrivia](https://wikitrivia.tomjwatson.com/). Players see cards (empires, wars, monarch reigns, papal reigns, space missions, building construction projects), each with a real Wikidata-sourced duration, and drag them into an ascending-duration timeline. Wrong placement costs a life; 3 lives end the game.

Same mechanic as the original wikitrivia, but the sort key is **how long things lasted** instead of **when they happened**.

Two modes:

- **Daily** (`/daily`) — same cards for every player worldwide that UTC day. Seeded RNG. Locked to easy difficulty.
- **Free play** (`/play/...`) — pick a deck and difficulty. Ephemeral RNG, unlimited replays.

## Tech stack

- **Bun** for package management and scripts. Do NOT use npm or yarn (see `AGENTS.md`).
- **Next.js 16** (Turbopack) + **React 19**.
- **TypeScript** strict mode (`tsconfig.json:8`).
- **vanilla-extract** for CSS-in-TS (`styles/*.css.ts`).
- **motion** for layout/transition animations.
- **bun:test** for unit tests.
- **Wikidata SPARQL** + Wikimedia metadata APIs for content (build-time only, never at runtime).

## Key directories

| Path | Purpose |
|---|---|
| `pages/` | Next.js page routes: `index.tsx`, `daily.tsx`, `play/[[...slug]].tsx`. |
| `components/` | React components. `board.tsx` is the in-game orchestrator; `card-visual.tsx` renders cards; `game-route-screen.tsx` drives the daily/free-play state machine. |
| `lib/` | Game logic: `game-selection.ts` (draw, bucketing, `checkCorrect`), `game-state.ts` (state setup + daily snapshot rehydration), `daily-storage.ts` (localStorage), `seeded-random.ts` (resumable PRNG), `share.ts` (share-card text). |
| `types/` | Type definitions. `cards.ts:1` for `Card`, `game.ts:27` for `GameState`, `routes.ts:38` for `SelectionRoute`. |
| `styles/` | vanilla-extract styles. Foundation tokens in `styles/foundation.ts`. |
| `content/queries/` | One folder per SPARQL query: `query.rq`, `query.ts` (`defineQuery` config), `rows.json` (cached results). |
| `content/queries-legacy/` | Original wikitrivia year-based queries, kept for reference, NOT loaded. |
| `content/deck-tree.ts` | Static deck hierarchy. Top-level groups must have visible children (`lib/categories.ts:104`). |
| `content/scripts/build-cards.ts` | Pipeline that turns `rows.json` files into `public/decks/<id>.json`. |
| `public/decks/` | Built deck artifacts. `index.json` is the deck-tree manifest loaded at runtime. |
| `tests/` | `bun:test` unit tests. |

## Essential commands

```bash
bun install              # Install dependencies
bun run dev              # Start dev server (localhost:3000)
bun run build            # Production build
bun run typecheck        # tsc --noEmit
bun test                 # Run unit tests
bun run lint             # tsc + oxlint (lint configs may be missing — see path-to-production.md §1)
bun run sparql:list      # List registered SPARQL queries
bun run sparql:run --query <id>   # Fetch fresh rows.json (needs .env — see AGENTS.md)
bun run decks:build      # Build public/decks/*.json from rows + Wikimedia metadata
```

## Conventions worth knowing

- **Sort key is `durationYears`, not `year`.** Every place the old wikitrivia code sorted/compared on year now sorts on duration. `Card.startYear` and `Card.endYear` (nullable for ongoing items) are display-only; the sort/draw/spacing logic only uses `durationYears`.
- **IDs derive from slug paths.** A deck at slug path `["reigns", "monarchs"]` has id `all-reigns-monarchs`, JSON at `public/decks/all-reigns-monarchs.json`, route at `/play/reigns/monarchs`. Same convention round-trips through `content/deck-tree.ts:36`.
- **Daily mode is reproducible by date.** `createSeededRandom(dateKey)` plus `randomState` snapshotting in `lib/game-state.ts:158` make resume deterministic across page reloads and across players.
- **Used-sets prevent ambiguity.** `usedQids` (no entity repeats) AND `usedDurations` (no two cards with the same duration — they'd be ambiguous to place).
- **Difficulty is two orthogonal levers.** Page-view floor (`lib/free-play-difficulty-rules.ts:18`) plus a top-pool share (`lib/game-selection.ts:18`).
- **Static-export friendly.** `package.json:19` has `"start": "serve out"` — pages are designed to work without an SSR runtime.

## Additional documentation

- `AGENTS.md` — bun-only, lint/format commands, sandbox restrictions on API scripts.
- `content/README.md` — content tooling deep-dive.
- `path-to-production.md` — productionization roadmap (deployment, data refresh, polish backlog).
- `.claude/docs/architectural_patterns.md` — recurring patterns: seeded RNG snapshots, snapshot persistence, weighted draw with strictness decay, content pipeline phases, two-lever difficulty, slug-path IDs, etc.

When the task touches:

- **Card selection / drawing** → read `lib/game-selection.ts` end-to-end.
- **Daily snapshots / resume** → `lib/game-state.ts` + `lib/daily-storage.ts` + `components/game-route-screen.tsx:283-320`.
- **Adding a new deck** → write a new `content/queries/<id>/` folder, register it in `content/deck-tree.ts`, run `bun run sparql:run` then `bun run decks:build`.
- **UI of a card** → `components/card-visual.tsx` (front/back faces, duration pill).
- **Animations during play** → `lib/placement-animation.ts` + `components/{placement,deal,correction}-animation-layer.tsx`.
