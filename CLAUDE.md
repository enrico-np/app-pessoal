# app-pessoal

Personal productivity web app. Features are added incrementally, one folder each.

- Stack: Next.js App Router (read `AGENTS.md`; the version is newer than usual, check `node_modules/next/dist/docs/`), TypeScript, Tailwind, SQLite + Drizzle.
- Layout: `src/features/<name>/` per feature; DB client in `src/db/client.ts`; tables re-exported from `src/db/schema.ts`; exportable tables in `src/features/registry.ts`.
- After schema changes run `npm run db:push`. Verify with `npm run typecheck`, `npm run lint`, `npm test`.
- Data lives in `data/app.db` (git-ignored). Keep data easy to export (CSV/JSON) for external analysis.
