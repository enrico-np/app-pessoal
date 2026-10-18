# app-pessoal

Personal productivity web app. Features are added incrementally, one folder each.

- Stack: Next.js App Router (read `AGENTS.md`; the version is newer than usual, check `node_modules/next/dist/docs/`), TypeScript, Tailwind, SQLite + Drizzle.
- Layout: `src/features/<name>/` per feature; DB client in `src/db/client.ts`; tables re-exported from `src/db/schema.ts`; exportable tables in `src/features/registry.ts`.
- After schema changes run `npm run db:generate` (writes a SQL migration in `drizzle/`, commit it) and `npm run db:migrate`. Do not use `drizzle-kit push`: it can drop columns with data. Verify with `npm run typecheck`, `npm run lint`, `npm test`.
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

## UI
- Shared UI lives in `src/components/ui/` (Button, Input, Card, Table) with design tokens in `src/app/globals.css`. Features reuse these components; do not write ad-hoc one-off styles. Create the shared components when the first feature needs a screen.
- Date, number and currency formatting goes through `src/lib/format.ts` (pt-BR, BRL), not inline.

## Exports
- CSV export is Brazilian Excel format (`;` separator, `,` decimal, UTF-8 BOM). JSON export keeps `.` decimals.

## Lessons
Append one line per repeated mistake: what went wrong, and the rule that prevents it. Empty so far.

## Data reads in pages
- `better-sqlite3` is synchronous. With `cacheComponents: true`, a Server Component that queries it without `await connection()` (from `next/server`) is prerendered at build time and shows stale data.
- Each feature keeps two read layers:
  - `queries.ts`: plain query functions, no `connection()`. Unit tests import these.
  - `data.ts`: wrappers that call `await connection()` and then the query. Pages and components import reads only from `data.ts`, never from `queries.ts`.
- Wrap components that read data in `<Suspense>`. Do not cache reads with `"use cache"`; the database is local and single-user.
- Route handlers with dynamic params (like `/api/export/[table]`) are already dynamic; verified with `next build` on 2026-10-18.
