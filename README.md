# app-pessoal

Personal app to make daily life easier, built one feature at a time.

**Stack:** Next.js (App Router) · TypeScript · Tailwind · SQLite via Drizzle ORM · lucide-react icons · Vitest · Playwright

## Screens

- `/` Início: teal header with date and the gear (Ajustes: Editar início, Modo escuro, Tamanho do texto, Exportar dados, Fazer backup), then Fixados (up to 6 shortcuts), Painéis grouped by feature, and the last history entries.
- `/editar`: add, remove, resize and reorder pins, panels and groups, with Desfazer/Refazer.
- `/historico`: activity log grouped by day, filtered by feature and period.

See `specs/002-inicio-v2.md`.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run db:migrate  # create/update tables in data/app.db
npm run dev         # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | dev server |
| `npm run db:generate` | create a SQL migration in `drizzle/` from schema changes |
| `npm run db:migrate` | apply pending migrations to the SQLite file |
| `npm run db:studio` | browse the data in a web UI |
| `npm test` | unit tests |
| `npm run test:e2e` | browser tests (Playwright, 360 px, separate `data/e2e.db`) |
| `npm run typecheck` / `npm run lint` | static checks |

## Adding a feature

Each feature lives in `src/features/<name>/` (schema, queries, components).

1. Create `src/features/<name>/schema.ts` with the Drizzle table(s).
2. Re-export it from `src/db/schema.ts`, then run `npm run db:generate` and `npm run db:migrate`. Commit the generated file in `drizzle/`.
3. To make it downloadable, add the table to `src/features/registry.ts`.
4. Add pages under `src/app/<name>/`.
5. To show it on Início, add panel types in `src/features/home/panel-types.ts` (with their components in `src/features/home/components/panels.tsx`) and the feature's label in `src/features/catalog.ts`.
6. To record changes in Histórico, call `logActivity()` from `src/features/activity/log.ts` inside the feature's mutations.

`src/features/tasks` is a minimal example of the pattern.

## Data and analysis

- All data is in one file: `data/app.db` (git-ignored). Open it directly with pandas
  (`sqlite3`), DuckDB, DBeaver, Metabase, etc.
- Export any registered table: `/api/export/<table>?format=csv` or `?format=json`. CSV uses `;` as separator, `,` as decimal mark and a UTF-8 BOM (Brazilian Excel format). JSON is unchanged, with `.` decimals; use it for pandas or DuckDB.
- Back up with Ajustes → Fazer backup (`/api/backup`, downloads `app-pessoal-YYYY-MM-DD.db`), or by copying `data/app.db`.
- Tables: `tasks`, `home_pins`, `home_panels`, `home_groups`, `app_settings`, `activity_log` (all exportable).
