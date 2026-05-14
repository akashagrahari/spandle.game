# Architectural Patterns

Recurring patterns that appear across multiple files. Documented so future changes follow the same shape rather than reinvent.

## 1. Sort-by-key, then check index for validity

The placement mechanic: append the new card to the played list, sort by a single numeric key, look up the new card's index in the sorted result, compare to the player's chosen slot.

- `lib/game-selection.ts:580` `checkCorrect` — sorts by `durationYears`, returns `{ correct, delta }` where `delta = correctIndex - playerIndex`.

Works for any timeline-placement game; only the comparator changes. The original wikitrivia used `year`; SPANDLE! uses `durationYears`.

## 2. Seeded RNG with resumable state

`lib/seeded-random.ts:14` returns a callable that also exposes `getState()` and `setState(state)`, so the PRNG cursor can be snapshotted mid-game and resumed deterministically.

Full daily-mode loop:

1. `createSeededRandom(dateKey)` at game start — `lib/game-state.ts:181`.
2. Every state change saves `random.getState()` into the snapshot — `lib/game-state.ts:170`.
3. On resume, `createSeededRandom(dateKey, snapshot.randomState)` restores the cursor — `lib/game-state.ts:181`.

Same date key → same starting seed → same card sequence worldwide.

## 3. Snapshot persistence (extract → save → rehydrate)

Three-function pattern for serializable game state:

- **Extract**: `createDailyGameSnapshot` (`lib/game-state.ts:156`) takes a live `GameState`, returns a plain JSON-safe `DailyGameSnapshot`.
- **Save**: `saveDailyGameSnapshot` (`lib/daily-storage.ts:51`) writes to localStorage under a versioned key.
- **Rehydrate**: `createDailyGameStateFromSnapshot` (`lib/game-state.ts:175`) reconstructs `GameState`, including a re-seeded PRNG and recomputed `usedQids` / `usedDurations` sets.

Storage key is suffixed `:v1` (`lib/daily-storage.ts:3`). Bump the suffix when the snapshot shape changes — stale snapshots are silently discarded by the new key.

## 4. Two-layer used-set deduplication

`GameState` (`types/game.ts:43`) carries two `Set`s:

- `usedQids: Set<string>` — prevents the same entity from being drawn twice.
- `usedDurations: Set<number>` — prevents two cards with identical durations from co-existing on the timeline (they'd be ambiguous to place).

`isCardUsed` (`lib/game-selection.ts:122`) checks both. `markCardUsed` (`lib/game-selection.ts:174`) adds to both. Any new draw constraint that creates ambiguity should follow this two-layer pattern.

## 5. Weighted random with strictness decay

When tight constraints might leave zero candidates, retry with progressively looser constraints rather than failing.

- `lib/game-selection.ts:598` `drawNextCard` → `chooseCard(state, [1, 0.75, 0.5, 0])`.
- `lib/game-selection.ts:545` `pickOpeningCards` → `chooseCard(state, [1, 0.5, 0])`.

The `strictness` parameter scales the `getMinimumSpacing` requirement; `0` disables it entirely.

`weightedPick` (`lib/game-selection.ts:80`) is the underlying primitive — generic weighted random over a list with a per-entry weight function.

## 6. Content pipeline as phased filter/enrich

`content/scripts/build-cards.ts` transforms `rows.json` into deck JSON through ordered phases. Each phase can drop rows; rejections are tallied per `RejectionReason`.

1. `buildCard` (`:262`) — apply title/subtitle templates, parse `startYear`/`endYear`, compute `durationYears`, validate length/year-in-title/etc. Rejection reasons defined at `:82`.
2. `hydrateWikipediaMetadata` (`:402`) — fetch image + summary + Wikipedia URL from Wikimedia APIs.
3. `hydratePageViews` (`:480`) — fetch previous-month pageviews per Wikipedia title.
4. NSFW filter (`:700`).
5. `dedupeMergedCards` (`:558`) — collapse duplicate qids.
6. `toCard` (`:365`) — strip `BuiltCard` fields down to the runtime `Card` shape.

To add a new field on cards: add to `BuiltCard` (`:21`), populate in `buildCard`, propagate through enrichment, surface in `toCard`, then add to `types/cards.ts`.

## 7. Slug-path ID convention

A deck's `id` is its slug path joined by `-`. The same string is the JSON filename and the basis for the URL.

- `content/deck-tree.ts:36` `deckDefinitionToDeck` — `id: slugPath.join("-")`.
- `public/decks/all-reigns-monarchs.json` — file at id.
- `/play/reigns/monarchs` — URL from slug path.

`lib/categories.ts` and `pages/play/[[...slug]].tsx` rely on this round-trip. When adding a deck: new slug at every level, never reuse a slug as both a leaf and a group sibling.

## 8. Hierarchical deck tree with frequency-weighted selection

`content/deck-tree.ts` is a static config — each node has a `frequency` (selection weight) and optional `themeHue` (inherited by children).

At draw time `chooseDeckFromTree` (`lib/game-selection.ts:331`) recursively picks a child by weighted random, with `DECK_RECENCY_PENALTY` (`:16`) reducing the weight of recently-drawn decks.

**Invariant**: top-level decks must have visible children, even if just one. `lib/categories.ts:104` throws otherwise. For a single-source deck, wrap the source query under a one-child leaf.

## 9. Two-lever difficulty system

Difficulty is enforced through two orthogonal filters, both checked at draw time:

1. **Page-view floor** (`lib/free-play-difficulty-rules.ts:18`, `DIFFICULTY_MIN_PAGE_VIEWS`): hard minimum on monthly Wikipedia pageviews. Easy = 25k, Normal = 10k, Hard = 1k.
2. **Top-pool share** (`lib/game-selection.ts:18`, `DIFFICULTY_TOP_POOL`): preferentially draw from the top X% of the deck by rank. Easy = top 25%, Normal = top 50%, Hard = no cap.

Adding a new difficulty means setting both levers, plus updating `difficultyCounts` precomputation in `content/scripts/build-cards.ts:735`.

## 10. Frontmatter-driven query registration

There is no central registry of queries. `content/query-definitions.ts:42` recursively scans `content/queries/` for any `query.ts` file and imports each as a `QueryDefinition`.

Each query directory needs three files:

- `query.rq` — SPARQL text.
- `query.ts` — `defineQuery({ id, title, cards: { titleTemplate, subtitleTemplate? }, ... })`.
- `rows.json` — cached SPARQL response (populated by `bun run sparql:run --query <id>`).

The legacy queries live under `content/queries-legacy/` — they're on disk but NOT loaded because the scanner only looks at `content/queries/`.

## 11. Animation layers decoupled from state

The board (`components/board.tsx`) maintains the state machine; animation is rendered by stateless layer components that accept a "request" object.

- `PlacementAnimationLayer` (`components/placement-animation-layer.tsx`) — driven by `PlacementAnimationState` from `lib/placement-animation.ts:createPlacementAnimationState`.
- `DealAnimationLayer` (`components/deal-animation-layer.tsx`) — driven by `openingDeal` / `deckState` props.
- `CorrectionAnimationLayer` (`components/correction-animation-layer.tsx`) — driven by `badlyPlaced` state.

Each layer renders during its phase and signals completion via `onAnimationComplete`. State transitions live in board.tsx; the layers don't own game state.
