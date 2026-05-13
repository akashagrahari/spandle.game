# Outlast!

Outlast! is a daily timeline-placement puzzle game where players sort cards by how long things lasted (duration), built on Wikimedia data. Forked from [wikitrivia](https://wikitrivia.tomjwatson.com/).

## Basics

- Use Bun for package management and scripts.
- Do not use npm or yarn.
- App framework: Next.js.
- Lint/typecheck: `bun run lint`.
- Format: `bun run format`.

## Content

- Source queries live in `content/queries/<query-id>/`.
- Each query folder has `query.ts`, `query.rq`, and `rows.json`.
- Decks are composed in `content/deck-tree.ts`.
- Content tooling notes live in `content/README.md`.

When working on content, inspect saved `rows.json` before changing query logic. Be skeptical of technically valid categories that are not obviously playable.

Bad card data should usually be fixed directly on Wikidata.

## API Scripts

Scripts that hit Wikimedia APIs require a local `.env` copied from `.env.example`. Set `OUTLAST_CONTACT_EMAIL` to your email so requests identify themselves correctly to Wikimedia.

Never run build-card or SPARQL query scripts inside the sandbox. Request escalation first.
