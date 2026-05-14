# Outlast!

Outlast! is a daily browser puzzle game. Players see cards — empires, wars, monarch reigns, papal reigns, space missions, building construction, companies, TV series — each with a real Wikidata-sourced duration. Drag them into a timeline sorted by **how long each thing lasted** (shortest to longest). Three wrong placements ends the game.

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

Edit `.env` and set `OUTLAST_CONTACT_EMAIL` to your email address. Wikimedia requires API requests to identify their operator.

## Development

> You might need to run `xattr -dr com.apple.quarantine node_modules` before running

Run the app locally:

```bash
bun run dev
```

Then visit [localhost:3000](http://localhost:3000).

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
