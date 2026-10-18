# 001 – Menu screen

Status: in progress

## Problem
I need one screen that opens first, gets me to any feature in one tap, and shows the few numbers that matter today. My priorities change, so I must be able to rearrange it without editing code.

## Behavior
- Route `/` is the menu. Language: pt-BR. Phone first; scales to desktop.
- The menu is a grid of blocks. Grid columns: 2 on phone, 4 on screens 768 px and wider.
- Block sizes: `sm` = 1x1, `md` = 2x1, `lg` = 2x2 (columns x rows).
- Block types:
  - `shortcut`: label, icon, internal path or URL. One tap opens it.
  - `note`: label and free text, shown on the block.
  - `counter`: label, integer value, `+` and `-` buttons that work outside edit mode.
  - `card`: a summary provided by a feature. The block stores only the card key; the card component renders its own data.
- Normal mode shows blocks and lets me use them. It has one "Editar" button.
- Edit mode (toggled by "Editar", left with "Concluir") lets me:
  - add a block (choose type, fill fields, choose size),
  - remove a block (with a confirmation),
  - reorder blocks with "move earlier" and "move later" buttons,
  - rename a block and change its icon (picked from a fixed list of about 24 emoji),
  - change a block's size.
- Changes are saved immediately; there is no separate save button.
- A feature adds a card by registering it in `src/features/menu/cards.ts` (key, pt-BR label, component). The block picker lists registered cards.
- First registered card: "Tarefas abertas" (count of `tasks` rows with `done = false`). It exists to prove the registry works.
- A new database starts with an empty menu and an empty-state message with an "Editar" button.

Out of scope: drag and drop, multiple menu pages, per-block colors, service worker and offline mode, login.

## Data
New table `menu_blocks` (in `src/features/menu/schema.ts`, re-exported from `src/db/schema.ts`):

| column | type | notes |
|---|---|---|
| id | integer, primary key, autoincrement | |
| type | text, not null | `shortcut`, `note`, `counter`, `card` |
| label | text, not null | |
| icon | text | one emoji from the fixed list |
| size | text, not null, default `sm` | `sm`, `md`, `lg` |
| position | integer, not null | unique order; lower comes first |
| config | text (JSON), not null, default `{}` | `href` for shortcut, `text` for note, `value` for counter, `cardKey` for card |
| created_at | integer (timestamp), not null | |

- Exportable: yes. Add `menu_blocks` to `src/features/registry.ts`.
- Config is validated with a Zod schema per type before it is written. Add `zod` as a dependency.

## Done when
- [ ] Opening `/` with an empty database shows the empty state in pt-BR.
- [ ] I can add one block of each type and see it on the grid.
- [ ] A counter's `+` and `-` change its value and survive a page reload, outside edit mode.
- [ ] Reordering moves a block one position and survives a reload; positions stay unique and gapless.
- [ ] Renaming, changing icon and changing size persist after a reload.
- [ ] Removing a block asks for confirmation and removes only that block.
- [ ] A shortcut with an invalid `href` (empty, or not starting with `/`, `http://` or `https://`) is rejected with a pt-BR error message.
- [ ] The "Tarefas abertas" card shows the correct count after rows are inserted into `tasks`.
- [ ] Layout has no horizontal scroll at 360 px width; tap targets are at least 44 px.
- [ ] `/api/export/menu_blocks?format=csv` downloads the blocks.
- [ ] Unit tests cover: position reordering logic, config validation per type, href validation. `npm run typecheck`, `npm run lint`, `npm test` pass.

## Plan
Foundation (built first, only what this screen uses):
- Design tokens in `src/app/globals.css` (colors, spacing, radius; light and dark).
- `src/components/ui/`: `Button`, `Input`, `Card`.
- `src/lib/format.ts`: pt-BR number formatter (used by counter and cards). Date and BRL helpers are not added until a feature needs them.

Feature:
- `src/features/menu/schema.ts`, `queries.ts` (list, add, update, remove, move), `validation.ts` (Zod), `cards.ts` (registry).
- Server Actions in `src/features/menu/actions.ts` for every write; each action validates input and revalidates `/`.
- Components in `src/features/menu/components/`: `MenuGrid`, `Block` (one renderer per type), `BlockEditor` (form), `IconPicker`.
- Page `src/app/page.tsx` renders `MenuGrid` inside `<Suspense>`. Edit-mode state is client-side only.
- Reads are split into two layers. Reason: `better-sqlite3` is synchronous, so with `cacheComponents: true` an unguarded query runs at build time and the page ships stale data (documented in `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/connection.md`).
  - `src/features/menu/queries.ts`: plain query functions, no `connection()`. Unit tests call these.
  - `src/features/menu/data.ts`: one wrapper per read used for rendering; each calls `await connection()` and then the query. Pages and components import reads only from `data.ts`.
  - Not verified: whether `connection()` throws outside a request (in Vitest). Check when writing the first test; the split is kept either way.
- Actions call `revalidatePath("/")` after writes. Reads are not cached (`"use cache"` is not used): SQLite is local and single-user.
- `public/manifest.webmanifest` and `<link rel="manifest">` so it can be installed on a phone. Icons: placeholder PNGs, not verified on a real device.
- Next.js APIs (Server Actions, caching with `cacheComponents`) are checked against `node_modules/next/dist/docs/` before use.

## Tasks
- [x] Foundation: tokens, `Button`, `Input`, `Card`, `format.ts` with tests
- [ ] Schema, `db:push`, registry entry for export
- [ ] Zod validation and tests
- [ ] Queries and move logic, with tests
- [ ] Server Actions
- [ ] `MenuGrid` and block renderers
- [ ] Edit mode: add, remove, move, rename, icon, size
- [ ] "Tarefas abertas" card and card registry
- [ ] Manifest
- [ ] Check the "Done when" list in the running app at 360 px width
