# SPANDLE!

SPANDLE! is a daily browser puzzle game. Players see cards — empires, wars, monarch reigns, papal reigns, space missions, building construction, companies, TV series — each with a real Wikidata-sourced duration. Drag them into a timeline sorted by **how long each thing lasted** (shortest to longest). Three wrong placements ends the game.

Forked from and inspired by [wikitrivia](https://wikitrivia.tomjwatson.com/) by Tom J. Watson.

## Setup

Install bun

```bash
curl -fsSL https://bun.sh/install | bash
```

Install dependencies with Bun:

```bash
bun install
```

Create a local env file before running scripts that contact Wikimedia APIs:

```bash
cp .env.example .env
```

Edit `.env` and set `SPANDLE_CONTACT_EMAIL` to your email address — Wikimedia requires API requests to identify their operator.

## Development

> You might need to run `xattr -dr com.apple.quarantine node_modules` before running

Run the app locally:

```bash
bun run dev
```

Then visit [localhost:3000](http://localhost:3000).

### Testing the multiplayer room locally

The "Play with friends" feature requires the Cloudflare Worker running alongside the Next.js dev server.

**1. Add the worker URL to your local env:**

```bash
# .env.local
NEXT_PUBLIC_ROOM_WORKER_URL=http://localhost:8787
```

**2. Start the worker dev server** (in a separate terminal):

```bash
bunx wrangler dev
```

This starts the room worker at `http://localhost:8787` with a local Durable Object.

**3. Start the Next.js dev server** (in another terminal):

```bash
bun run dev
```

**4. Test it:**
- Go to [localhost:3000](http://localhost:3000), click "Play with friends", create a room
- Copy the room link and open it in a second browser window or incognito tab to join as another player

Note: the local worker uses an in-memory Durable Object — state is lost when `wrangler dev` restarts.

Build the static site:

```bash
bun run build
```

Serve the built `out/` directory:

```bash
bun run start
```

Useful checks:

```bash
bun run typecheck
bun run lint
bun run format:check
bun test
```

## Deployment

The frontend is a static Next.js export hosted on Cloudflare Pages. The "Play with friends" multiplayer feature runs on a separate Cloudflare Worker with Durable Objects.

### Frontend (Cloudflare Pages)

The Pages project (`outlast-game`) is connected to this GitHub repo and deploys automatically on every push to `main`. No manual steps needed — just push.

### Multiplayer worker (Cloudflare Worker)

The room worker is deployed separately and must be re-deployed manually whenever `workers/room.ts` changes:

```bash
bunx wrangler login   # first time only — opens browser to authenticate
bunx wrangler deploy
```

Wrangler will print the worker URL on success:
```
https://spandle-room.akash-agrahari.workers.dev
```

### Environment variable

The frontend needs to know the worker URL. Set it in two places:

**Locally** — add to `.env.local`:
```
NEXT_PUBLIC_ROOM_WORKER_URL=https://spandle-room.akash-agrahari.workers.dev
```

**Production** — Cloudflare dashboard → Workers & Pages → `outlast-game` → Settings → Environment variables → add `NEXT_PUBLIC_ROOM_WORKER_URL` with the same value. Then trigger a new Pages deployment (push a commit or click Retry) for the variable to take effect.

### Preview deployments (feature branches)

Every push to a non-`main` branch automatically gets a Cloudflare Pages preview URL:

```
https://<branch-name>.outlast-game.pages.dev
```

Preview branches use the same `NEXT_PUBLIC_ROOM_WORKER_URL` as production (set under the **Preview** environment in Pages settings), so room features work on preview URLs out of the box.

To fully isolate a preview environment from production (e.g. to avoid test rooms polluting the production worker), deploy a separate staging worker and point the Preview env var at it:

```bash
bunx wrangler deploy --name spandle-room-staging
```

Then in Cloudflare dashboard → `outlast-game` → Settings → Environment variables → switch to **Preview** → set `NEXT_PUBLIC_ROOM_WORKER_URL` to the staging worker URL.

### Scaling

The free Cloudflare plan covers ~100,000 Worker requests/day and 1,000 concurrent WebSocket connections. For a friends game this is very generous (a 15-round game with 4 players uses ~200–300 messages total). If the app grows, upgrade to the **Workers Paid plan ($5/month)** — no code or config changes needed, just a billing upgrade in the Cloudflare dashboard. That raises limits to 10M requests/day with effectively unlimited concurrent rooms.

## Sound effects

Sound effects are synthesized at runtime using the Web Audio API — no audio files or external libraries. The `lib/sound.ts` module lazy-initialises a single `AudioContext` on first use (satisfying browser autoplay policy) and exposes five one-shot functions:

| Event | Function | Sound |
|---|---|---|
| Card placed correctly | `playCorrect()` | Short ascending two-note ding (C5 → E5) |
| Card placed incorrectly / skipped | `playWrong()` | Low descending buzz (triangle wave, 210 → 105 Hz) |
| Game over (daily / free play) | `playGameOver()` | Three descending notes (C4 → A3 → F3) |
| Game starts (all modes) | `playGameStart()` | Quick ascending three-note whoosh (G4 → C5 → E5) |
| Room game ends (leaderboard appears) | `playRoomEnd()` | Four-note ascending fanfare (C5 → E5 → G5 → C6) |

To change a sound, edit the corresponding function in `lib/sound.ts`. Each function creates an oscillator node, schedules a gain envelope (attack → decay → release), then disconnects automatically. If the `AudioContext` is suspended (e.g. browser hasn't received a user gesture yet) the call silently no-ops.

## Content

Game content comes from Wikidata Query Service snapshots in `content/queries/` and is built into deck JSON under `public/decks/`.

Two-stage pipeline:

1. `bun run sparql:run` — fetch fresh rows from Wikidata into each `content/queries/<id>/rows.json`.
2. `bun run decks:build` — turn `rows.json` files into `public/decks/<id>.json` (adds Wikipedia metadata + pageviews, filters NSFW, dedupes by qid).

For more on the pipeline, see [content/README.md](content/README.md). For architectural patterns, see [.claude/docs/architectural_patterns.md](.claude/docs/architectural_patterns.md). For the productionization roadmap, see [path-to-production.md](path-to-production.md).

## FAQ

### Where does the data come from?

The data is sourced from [Wikidata](https://www.wikidata.org) and [Wikipedia](https://wikipedia.org). Card durations are computed from Wikidata's start-time / end-time properties (P580/P582, P571/P576, etc., varying per category).

### I found a card with incorrect data. What should I do?

If the underlying Wikidata item is wrong, fix it directly on Wikidata — it will get picked up the next time the decks are rebuilt. For cards where Wikidata is technically valid but feels wrong for the game (e.g. ongoing-but-not-really), the planned mechanism is a `content/card-overrides.json` blocklist; see `path-to-production.md` §4.

## License

MIT — see [LICENSE.md](LICENSE.md). Original wikitrivia copyright held by Tom J. Watson.
