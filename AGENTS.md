# SPANDLE!

SPANDLE! is a daily timeline-placement puzzle game where players sort cards by how long things lasted (duration), built on Wikimedia data. Forked from [wikitrivia](https://wikitrivia.tomjwatson.com/).

## Basics

- Use **Bun** for package management and scripts. Do not use npm or yarn.
- App framework: Next.js 16 (Turbopack), React 19, TypeScript strict mode.
- CSS: vanilla-extract (`styles/*.css.ts`).
- Typecheck: `bun run typecheck` (tsc --noEmit).
- Lint: `bun run lint` (tsc + oxlint).
- Format: `bun run format` (oxfmt).
- Tests: `bun test`.
- All checks at once: `bun run agent:check`.

## Key areas

- **Frontend** — Next.js pages in `pages/`, components in `components/`, game logic in `lib/`.
- **Room / multiplayer** — Cloudflare Worker + Durable Object in `workers/room.ts`. Dev server: `bun run worker:dev`. Deploy: `bun run worker:deploy`.
- **Content pipeline** — SPARQL queries in `content/queries/`, deck tree in `content/deck-tree.ts`, built artifacts in `public/decks/`.

## Content

- Source queries live in `content/queries/<query-id>/`.
- Each query folder has `query.ts`, `query.rq`, and `rows.json`.
- Decks are composed in `content/deck-tree.ts`.
- Content tooling notes live in `content/README.md`.

When working on content, inspect saved `rows.json` before changing query logic. Be skeptical of technically valid categories that are not obviously playable.

Bad card data should usually be fixed directly on Wikidata.

## API Scripts

Scripts that hit Wikimedia APIs require a local `.env` copied from `.env.example`. Set `SPANDLE_CONTACT_EMAIL` to your email so requests identify themselves correctly to Wikimedia.

Never run build-card or SPARQL query scripts inside the sandbox. Request escalation first.
