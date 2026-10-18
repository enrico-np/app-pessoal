# app-pessoal

Personal productivity web app. Features are added incrementally, one folder each.

- Stack: Next.js App Router (read `AGENTS.md`; the version is newer than usual, check `node_modules/next/dist/docs/`), TypeScript, Tailwind, SQLite + Drizzle.
- Layout: `src/features/<name>/` per feature; DB client in `src/db/client.ts`; tables re-exported from `src/db/schema.ts`; exportable tables in `src/features/registry.ts`.
- After schema changes run `npm run db:push`. Verify with `npm run typecheck`, `npm run lint`, `npm test`.
- Data lives in `data/app.db` (git-ignored). Keep data easy to export (CSV/JSON) for external analysis.
- Spec-driven (lightweight): new features that add a table or page start with a spec in `specs/NNN-name.md` (copy `specs/TEMPLATE.md`). Draft it with the user and get approval before writing code; derive tests from "Done when".

## Language
- The app's user-facing text (UI labels, messages, errors, page titles, dates, number and currency formats) is Brazilian Portuguese (pt-BR). Format with `Intl` using `pt-BR` and `BRL`; do not hard-code formats.
- Code identifiers, comments, specs, README, commit messages and this file are in English.

## Writing rules (code comments, specs, docs, commit messages)
- Write literally. State what the code does or what was observed. No metaphors, idioms, filler or marketing language.
- Use concrete names: file paths, commands, table and function names.
- Mark anything not verified as "not verified". If unknown, write "unknown". Do not guess.
- Comments explain why, not what. Do not write comments that restate the code.

## Verification
- Do not say a task is done until the relevant command ran and passed in this session (`npm run typecheck`, `npm run lint`, `npm test`, or the app running). Report failures with the actual output.
- If something fails twice, stop and ask instead of trying a third variation; then record the lesson here.
