# app-pessoal

Personal app to make daily life easier, built one feature at a time.

**Stack:** Next.js (App Router) · TypeScript · Tailwind · SQLite via Drizzle ORM · Vitest

## Getting started

```bash
npm install
cp .env.example .env.local
npm run db:push     # create/update tables in data/app.db
npm run dev         # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run db:push` | sync schema to the SQLite file |
| `npm run db:studio` | browse the data in a web UI |
| `npm test` | unit tests |
| `npm run typecheck` / `npm run lint` | static checks |

## Adding a feature

Each feature lives in `src/features/<name>/` (schema, queries, components).

1. Create `src/features/<name>/schema.ts` with the Drizzle table(s).
2. Re-export it from `src/db/schema.ts`, then run `npm run db:push`.
3. To make it downloadable, add the table to `src/features/registry.ts`.
4. Add pages under `src/app/<name>/`.

`src/features/tasks` is a minimal example of the pattern.

## Data and analysis

- All data is in one file: `data/app.db` (git-ignored). Open it directly with pandas
  (`sqlite3`), DuckDB, DBeaver, Metabase, etc.
- Export any registered table: `/api/export/<table>?format=csv` or `?format=json`. CSV uses `;` as separator, `,` as decimal mark and a UTF-8 BOM (Brazilian Excel format). JSON is unchanged, with `.` decimals; use it for pandas or DuckDB.
- Back up by copying `data/app.db`.
