# 002 – Início v2 (home, editing, settings, history)

Status: shipped (2026-10-19). Parts changed by `specs/003-inicio-ajustes.md` (pin cap, pin ordering, edit sessions, drag and drop, Histórico rows and chips, calendar).

Design source: Design canvas "Menu principal — ideias", boards E, E1, E2, E3, E4, E5, E5b, E6, E7. Visual rules: design system "app-pessoal" (teal neo-brutalist, Parkinsans titles, Geist body).

## Problem
The menu from spec 001 is one flat grid of blocks. I want a home screen that shows my shortcuts, a summary of each feature grouped by feature, and what I did recently, and that I can rearrange with undo when I make a mistake.

## Behavior

### Layout (all main tabs)
- A teal header band (`bg-accent`, 2px bottom border) holds the page title. On Início it also holds the date (pt-BR, long form) and a gear button that opens Ajustes.
- A floating, rounded bottom bar with 4 tabs: Início (`/`), Histórico (`/historico`), Ferramentas, Mais. The active tab is a teal pill around icon and label.
- Ferramentas and Mais have no screens in this spec. They are shown disabled: muted color, `aria-disabled="true"`, not focusable as links, no navigation on tap.

### Início (`/`)
Three sections in fixed order, separated by a 1px line:
1. **Fixados**: up to 6 shortcuts in one row that scrolls sideways. Each shortcut has a label, an icon and a target (internal path or URL, same validation as spec 001 `href`).
2. **Painéis**: one group per feature, titled with the feature name. Each group lists its panels in order. Groups appear only when they have at least one panel.
3. **Histórico**: the last N entries of the activity log (N from settings, 1 to 5, default 3) and a "Ver histórico completo" button that opens `/historico`. Always the last section.

- Panels keep their normal controls (for example, a counter's `+` and `−` work without entering edit mode).
- Empty state (E4): when there are no pins and no panels, show the empty Fixados slot, a card with "Adicionar primeiro painel", and "Nada por aqui ainda." in Histórico.

### Panels and sizes (E7)
- A panel is an instance of a panel type that a feature registers in code (like `cards.ts` today). A panel type declares: key, feature key, pt-BR label, short description, the sizes it supports, and one component per size.
- Sizes: `sm` (half width, two per row, key number only), `md` (full width, current look), `lg` (full width, more detail or direct actions).
- Panel types shipped with this spec: only the ones whose data exists today:
  - `tasks.open-count`: Tarefas abertas, sizes `sm`, `md`, `lg` (`lg` lists the 3 oldest open tasks with a checkbox that marks them done).
  - `general.counter`: integer counter with label and optional daily goal; sizes `sm`, `md`, `lg` (`lg` shows the goal as cells).
  - `general.note`: free text; sizes `md`, `lg`.
- Gastos do mês, Treino, Agenda and other examples on the canvas are not built here; they arrive with their own features.

### Editing (E1, E2)
- Opened from Ajustes › "Editar início". Route: `/?editar=1` (not verified as the best option; see Plan).
- Header row: "Desfazer", "Refazer", "Concluir". A status line names the last change ("Última mudança: painel “Nota” removido.").
- Every change is saved immediately (as in spec 001). Undo and redo apply the inverse or repeat of each change. The stack holds up to 20 changes, lives only in the open edit session, and is cleared on "Concluir" or page reload.
- Fixados: label "Fixados · X de 6"; each pin shows a remove badge; tapping a pin replaces it; an empty slot adds one while fewer than 6 exist. A switch "Ordenar pelos mais usados" orders pins by how often their target was opened in the last 30 days instead of the manual order.
- Painéis: each panel shows a drag handle, edit and remove buttons. Each group has "+ Adicionar painel de <grupo>". A floating `+` opens the add sheet.
- Order of panels inside a group and order of groups: reorder with move buttons. Drag and drop is out of scope (as in spec 001); the handle is visual only until a later spec.
- Histórico section shows a stepper "Itens no início" (1 to 5).
- Add sheet (E2): choose feature, then panel type, then size (only sizes the type supports). Types already on the home screen show as disabled when the type allows only one instance (`tasks.open-count`); counters and notes allow many.

### Ajustes (E3, gear)
A bottom sheet with:
- "Editar início" → edit mode.
- Modo escuro: switch with three states stored (`light`, `dark`, `system`); the switch sets `light`/`dark`; default `system`. Dark values come from the design system (E6).
- Tamanho do texto: `sm`, `md` (default), `lg`, applied as the root font size.
- Exportar dados: links to the existing `/api/export/<table>` routes, CSV and JSON.
- Fazer backup: downloads a copy of the SQLite database and records the date. Shows "Último: <data>".
- App version.

### Histórico (`/historico`, E5, E5b)
- Lists activity log entries newest first, grouped by day ("Hoje", "Ontem", then "sexta, 16 de outubro").
- Filters: feature chips (Tudo plus one per feature with entries) and a period. Period shortcuts: Hoje, 7 dias, 30 dias, Este mês, or a custom range picked on a month calendar (start and end day; future days disabled). Filters are kept in the URL query (`?feature=tasks&de=2026-10-12&ate=2026-10-18`).
- Search button: out of scope for this spec (shown disabled or hidden; see Open questions).
- Each entry shows icon, text, feature and time. Tapping opens the related item when one exists.

### Out of scope
Drag and drop; Ferramentas and Mais screens; history search; panel types for features that do not exist yet; login; offline mode; restoring a backup from inside the app.

### Decisions (2026-10-19)
1. Ferramentas and Mais tabs: shown disabled until they have screens.
2. Existing `menu_blocks` data: not migrated. `data/app.db` held 4 test rows (checked 2026-10-19 on a copy) and `tasks` was empty. The migration drops `menu_blocks`; Início starts empty (E4). New features add their own panel types as they are built.
3. "Ordenar pelos mais usados" counts any visit to an internal path (one `open` row per page view of that path). External URLs count only when opened from Fixados.
4. Icons: switch from the emoji list to `lucide-react` (new dependency), fixed list of about 24 icons, stored by icon name.

## Data
New tables (one migration). All exportable: add to `src/features/registry.ts`.

`home_pins` (in `src/features/home/schema.ts`)

| column | type | notes |
|---|---|---|
| id | integer, primary key, autoincrement | |
| label | text, not null | |
| icon | text, not null | key from the fixed icon list |
| href | text, not null | `/…`, `http://…` or `https://…` |
| position | integer, not null, unique | manual order |
| created_at | integer (timestamp), not null | |

Cap of 6 enforced in the mutation, not in SQL.

`home_panels`

| column | type | notes |
|---|---|---|
| id | integer, primary key, autoincrement | |
| type_key | text, not null | for example `tasks.open-count` |
| group_key | text, not null | feature key; group shown under this name |
| size | text, not null | `sm`, `md`, `lg`; must be a size the type supports |
| position | integer, not null | order inside the group; unique per `group_key` |
| config | text (JSON), not null, default `{}` | validated per type with Zod |
| created_at | integer (timestamp), not null | |

`home_groups`

| column | type | notes |
|---|---|---|
| group_key | text, primary key | |
| position | integer, not null, unique | group order on Início |

`app_settings`

| column | type | notes |
|---|---|---|
| key | text, primary key | `theme`, `text_size`, `pins_order`, `history_count`, `last_backup_at` |
| value | text (JSON), not null | validated per key with Zod |

`activity_log`

| column | type | notes |
|---|---|---|
| id | integer, primary key, autoincrement | |
| kind | text, not null | `change` (shown in Histórico) or `open` (used only for "mais usados") |
| feature_key | text, not null | `tasks`, `home`, … |
| action | text, not null | for example `task.done`, `panel.removed`, `counter.changed` |
| summary | text, not null | pt-BR text shown in the list |
| target_href | text | where tapping the entry goes; null if nothing to open |
| created_at | integer (timestamp), not null, indexed | |

`menu_blocks`: dropped in the same migration and removed from `src/features/registry.ts`. `src/features/menu/` (including `cards.ts`) is replaced by `src/features/home/`; spec 001 stays as history.

## Done when
- [x] `/` shows the teal header with title, long pt-BR date and gear; the bottom bar shows the active tab as a teal pill around icon and label.
- [x] With an empty database, `/` shows the empty state (E4) in pt-BR.
- [x] I can add up to 6 pins; a 7th is rejected with a pt-BR message; the row scrolls sideways at 360 px.
- [x] With "Ordenar pelos mais usados" on, pins follow the 30-day open count; off, they follow manual order.
- [x] I can add `tasks.open-count`, `general.counter` and `general.note` panels in each supported size, and each size renders as in E7.
- [x] A size the panel type does not support is rejected by validation.
- [x] Panels appear under their group; groups and panels can be reordered and the order survives a reload.
- [x] In edit mode, Desfazer reverts the last change and Refazer reapplies it, for add, remove, move, resize and pin changes; the stack clears on Concluir.
- [x] Removing a panel or pin happens at once and can be undone (no confirmation dialog).
- [x] Histórico on `/` shows the last N `change` entries, N from settings (1 to 5).
- [x] `/historico` groups entries by day and filters by feature and by period (shortcuts and custom range); filters survive a reload through the URL.
- [x] Modo escuro and Tamanho do texto apply immediately and persist after a reload.
- [x] Exportar dados downloads every registered table in CSV (`;`, `,` decimal, BOM) and JSON.
- [x] Fazer backup downloads a database file that opens in SQLite, and "Último:" shows its date. Checked by opening the file with `better-sqlite3` in `e2e/settings.spec.ts`; the `sqlite3` CLI was not run (not verified).
- [x] No horizontal page scroll at 360 px; tap targets at least 44 px; text contrast at least 4.5:1 in light and dark. Contrast is checked from the tokens in `globals.css` by `tests/contrast.test.ts`, not from rendered pixels.
- [x] Unit tests cover: pin cap, size validation per panel type, position logic for panels and groups, undo/redo stack, settings validation, history filtering by feature and date range (inclusive, in the local time zone). `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` pass.

## Plan
Implemented 2026-10-19. Written before coding; Next.js APIs were checked against `node_modules/next/dist/docs/`. The deviations below are what the code does where it differs from this plan.

- New feature folder `src/features/home/`: `schema.ts`, `queries.ts`, `data.ts` (`connection()` wrappers), `mutations.ts`, `actions.ts`, `validation.ts`, `panels.ts` (panel type registry, replaces `menu/cards.ts`), `undo.ts` (pure stack logic, unit-tested), `components/`.
- New feature folder `src/features/activity/`: `schema.ts`, `queries.ts` (filter by feature and range), `log.ts` (`logActivity()` called from other features' mutations).
- `src/features/settings/`: `schema.ts`, `queries.ts`, `validation.ts`. Theme applied as `data-theme` on `<html>`; `globals.css` gains a `[data-theme="dark"]` block next to the existing `prefers-color-scheme` block.
- Shared UI in `src/components/ui/`: `Sheet` (bottom sheet, reuses `Dialog`), `Switch`, `SegmentedControl`, `Chip`, `Calendar` (month grid, range), `BottomNav`, `PageHeader`.
- Routes: `/` (Início), `/?editar=1` (edit mode, client state), `/historico`, `/api/backup` (route handler; copies the DB with SQLite `VACUUM INTO` to a temporary file and streams it; not verified with `better-sqlite3`).
- `lib/format.ts`: add long date (`domingo, 18 de outubro`) and day-group labels (Hoje, Ontem).
- One migration creates the 5 tables and drops `menu_blocks`. No data is copied.

### Deviations from the plan
- Edit mode is a route, `/editar`, not `/?editar=1`. The bottom bar is hidden there. `/editar?adicionar=1` opens the add sheet (link from the empty state).
- Two migrations instead of one: `drizzle/0001_drop_menu_blocks.sql` drops the old table, `drizzle/0002_inicio_v2.sql` creates the 5 tables.
- The panel type registry is `src/features/home/panel-types.ts`; components are in `components/panels.tsx`.
- `/api/backup` uses `better-sqlite3`'s `serialize()` instead of `VACUUM INTO`; the file is named `app-pessoal-YYYY-MM-DD.db`.
- The `tasks.open-count` medium panel shows the count with no progress bar, because `tasks` has no completion date to compute progress from.
- Reordering a panel or pin is done with "Mover para cima" / "Mover para baixo" buttons inside its dialog. The grip icon on panel rows is visual only (no drag). Groups have up/down buttons in the editor.
- Panels of type `general.*` go in the group "Geral".
- The search field shown in E5 is not implemented.
- `/historico` query parameters: `feature`, `periodo` (`hoje`, `7d`, `30d`, `mes`), `de` and `ate` (ISO days, custom range).
- The undo stack is client state in `EditHome.tsx` (limit 20 steps). Leaving `/editar` discards it.
- `next build` was checked in the cloud workspace with `--webpack` and stand-in Google Fonts responses (`NEXT_FONT_GOOGLE_MOCKED_RESPONSES`), because that workspace cannot reach Google Fonts. A plain `next build` (Turbopack, real fonts) was not verified.

## Tasks
Browser checks in `e2e/home.spec.ts`, `e2e/historico.spec.ts` and `e2e/settings.spec.ts` (Playwright, 360 x 740).

- [x] Decide tabs, "mais usados", icons and `menu_blocks` data (2026-10-19)
- [x] Schema, migration, registry entries
- [x] Settings: validation, queries, theme and text size applied in `layout.tsx`
- [x] Activity log: table, `logActivity()`, calls from tasks and home mutations
- [x] Panel registry and the three panel types in three sizes
- [x] Pins: queries, cap, "mais usados" ordering
- [x] Shared UI components
- [x] Início page with header, sections and bottom bar; empty state
- [x] Edit mode with undo/redo and add sheet
- [x] Ajustes sheet: theme, text size, export, backup
- [x] Histórico page with feature and period filters
- [x] Remove `src/features/menu/`, its tests and `e2e/menu*.spec.ts`; drop `menu_blocks`
- [x] Check "Done when" at 360 px, light and dark (screenshots of `/`, `/editar`, `/historico` and the gear sheet reviewed in both themes)
