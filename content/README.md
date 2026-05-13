# Content Tooling

Outlast! decks are generated from checked-in Wikidata Query Service results. The runtime app only reads the built artifacts under `public/decks/`; this folder holds the pipeline that produces them.

Each source query lives in `content/queries/<query-id>/` with:

- `query.ts`: typed card/deck metadata (title template, subtitle template, minScore)
- `query.rq`: the SPARQL query (must emit `?startYear` and `?endYear` columns; empty `?endYear` is treated as ongoing)
- `rows.json`: the saved result snapshot

The deck tree is composed in `content/deck-tree.ts`. Each top-level deck can pull from one or more sources.

## Commands

List query ids:

```bash
bun run sparql:list
```

Refresh one query snapshot:

```bash
bun run sparql:run --query monarch-reigns-duration
```

Refresh all query snapshots:

```bash
bun run sparql:run
```

Build deck JSON from saved rows (adds Wikipedia metadata + pageviews, filters NSFW, dedupes by qid, writes `public/decks/`):

```bash
bun run decks:build
```

## Two-stage refresh

`sparql:run` is the only step that calls Wikidata. It overwrites `rows.json` snapshots. `decks:build` only processes whatever is in `rows.json` — it does not fetch new entities. To add new cards from Wikidata, run `sparql:run` first.

## Environment

Scripts that contact Wikimedia APIs require a local `.env`. From the repo root:

```bash
cp .env.example .env
```

Fill in `OUTLAST_CONTACT_EMAIL` before running API-backed commands. The user-agent name is derived from the GitHub `origin` remote (e.g. `your-org/outlast`); falls back to `local/outlast-dev` if no git remote is set.
