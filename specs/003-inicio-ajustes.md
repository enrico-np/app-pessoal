# 003 – Início adjustments (buttons, pins, edit sessions, history)

Status: shipped (2026-10-19)

Changes to spec 002 after testing on 2026-10-19. Where this spec and spec 002 differ, this spec applies.

## Problem
After using Início v2: buttons give no feedback, "Ordenar pelos mais usados" did not move a pin I tapped often, a pin's destination is typed by hand, the back button in edit mode keeps changes the same way Concluir does, reordering takes several taps per step, Histórico shows one row per small edit, and the calendar only moves one month at a time.

Observed on 2026-10-19 in `data/app.db`: `pins_order` was `"manual"`, so the switch was off. With it on, the result would still have been wrong: usage counts every page view of the pin's address, and the three pins pointing at `/` get a count from every visit to Início.

## Behavior

### Buttons (all screens)
- Every button and every link styled as a button reacts to hover and to press. Elements with a hard shadow keep the current `Button` effect (move by the shadow offset, shadow removed). Elements without a shadow (ghost buttons, icon squares, chips, calendar days, bottom bar tabs, pins) get a background tint on hover and scale to 0.96 while pressed.
- One shared class in `src/components/ui/` provides this; ad-hoc buttons in features are replaced by shared components.
- With `prefers-reduced-motion: reduce`, only colour and shadow change; no movement or scaling.

### Fixados
- Cap: 8 pins (was 6).
- Adding or changing a pin: a "Destino" select lists the app's pages (Início, Histórico, and pages that later features register) and a last option "Link". Choosing a page fills the address; choosing "Link" shows a field to paste an `http://` or `https://` URL. Name and icon are still chosen in the dialog; choosing a page fills its name and icon when those fields are empty.
- An existing pin whose address matches a registered page opens with that page selected; any other address opens as "Link".
- Ordering: default is manual (the order set by drag in edit mode). With "Ordenar pelos mais usados" on, pins are ordered by how many times that pin was tapped in the last 7 days; ties follow the manual order.
- Only taps on a pin count (internal and external). Page views no longer count; `TrackVisit` and the `page.open` rows stop being written. Existing `open` rows stay in the table and are ignored.
- On Início, pins are not draggable.

### Panels
- The three panel types (`tasks.open-count`, `general.counter`, `general.note`) are placeholders. They are removed, with their saved rows, in the spec of the first real feature. Nothing changes about them in this spec.

### Editing (`/editar`)
- Changes are kept in the page until Concluir. Nothing is written to the database while editing.
- Concluir writes all changes at once, records one Histórico entry for the session, and returns to Início. With no changes, it returns without writing anything.
- Voltar (top-left arrow): with no changes, returns to Início. With changes, a dialog asks "Descartar alterações?" with the text "Se voltar agora, as mudanças desta edição serão perdidas." and two buttons: "Continuar editando" (closes the dialog) and "Descartar e voltar" (returns to Início, nothing written).
- Reloading or closing the tab with changes shows the browser's own leave-page warning (`beforeunload`). The browser's back gesture inside the app is not intercepted (not verified whether Next.js allows it).
- Desfazer and Refazer work on the changes of the current session, with the 20-step limit. They no longer write to the database or to Histórico.
- "Ordenar pelos mais usados" and "Itens no início" are part of the session: applied on Concluir, discarded on Voltar.
- Drag and drop:
  - Pins: drag to reorder in the Fixados row.
  - Panels: drag by the grip handle to reorder inside their group. Panels do not move between groups (the group is the feature).
  - Groups: drag by a grip handle on the group title to reorder groups.
  - Works with touch and mouse. Keyboard: focus the handle, Space to lift, arrow keys to move, Space to drop, Escape to cancel.
- Removed: the up/down arrows on groups, and the "Mover" buttons in the pin and panel dialogs.

### Histórico
- An edit session is one row: "Início editado · N mudanças" (or "1 mudança"). Tapping the row expands it in place and lists each change in order ("Atalho “YT” fixado", "Painel “Nota” removido", …). Tapping again collapses it.
- Entries already in the table from spec 002 (one row per change, `layout.undo`, `layout.redo`) are shown as they are.
- Feature chips: no "Início" chip. Início is not a feature. Its entries appear under "Tudo". Chips still appear for real features that have entries.
- Counter `+` and `−` outside edit mode still record one row per tap (unchanged).

### Calendar (Histórico › period › custom range)
- The month title ("outubro de 2026") is a button. Tapping it shows the 12 months of that year; tapping the year title then shows a grid of 12 years. Choosing a year shows its months; choosing a month shows its days.
- Arrows move by one month, one year or 12 years, depending on the view.
- Months and years after today are disabled, as days are now.

### Out of scope
Moving panels between groups; search in Histórico; removing the placeholder panels (deferred, see Panels); intercepting the browser back gesture.

## Data
`activity_log`: new column `details`, text (JSON), nullable. For an edit session: an array of the pt-BR change summaries, in order. Null for every other entry. Exportable as today (the table is already in `src/features/registry.ts`; CSV writes the JSON as text).

New `action` values: `home.edited` (kind `change`, feature `home`, one per session) and `pin.open` (kind `open`, feature `home`, `target_href` = the pin's address). `home.edited` replaces the per-change actions for new sessions.

`home_pins`: no change. The cap moves from 6 to 8 in `PIN_MAX`.

`app_settings`: no change. `pins_order` default stays `manual`.

One migration: `drizzle/0003_*.sql` adds `activity_log.details`.

## Done when
- [x] Every button and button-styled link shows a hover and a press effect; with reduced motion there is no movement or scaling. Browser test checks the gear button (hover) and the empty Fixados link (press); other elements use the same classes from `pressable.ts` (checked by reading the code, not by a test per element).
- [x] I can add up to 8 pins; a 9th is rejected with a pt-BR message.
- [x] The pin dialog lists Início, Histórico and "Link"; "Link" shows a URL field; an invalid URL is rejected with a pt-BR message.
- [x] With "Ordenar pelos mais usados" on, a pin tapped more times in the last 7 days comes before one tapped less, regardless of their addresses; taps older than 7 days do not count; ties follow manual order. Off, pins follow manual order.
- [x] Visiting a page does not change pin order.
- [x] In edit mode, nothing is written to the database before Concluir (checked in a unit test and in the browser).
- [x] Concluir after N changes writes the final layout and settings and adds exactly one Histórico row with N details.
- [x] Voltar with changes shows the dialog; "Continuar editando" keeps the changes on screen; "Descartar e voltar" leaves Início as it was before the session.
- [x] Voltar and Concluir with no changes return to Início without a dialog and without a Histórico row.
- [x] Desfazer and Refazer change only the on-screen layout.
- [x] Pins, panels (inside their group) and groups can be reordered by drag with touch, with the mouse and with the keyboard; the order survives Concluir and a reload. No arrow buttons remain. Browser tests: keyboard for pins, panels and groups; mouse and touch for pins only. Touch uses Chrome DevTools Protocol touch events in Playwright; a real phone was not tested (not verified).
- [x] In Histórico, a session row expands and collapses to show its changes.
- [x] Histórico has no "Início" chip.
- [x] The calendar switches days → months → years and back; future months and years are disabled.
- [x] No horizontal page scroll at 360 px; tap targets at least 44 px. `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e` pass.

## Plan
- Shared press/hover class in `src/components/ui/` (`pressable.ts` or a `@utility` in `globals.css`); apply it in `Button`, `IconButton`, `Chip`, `BottomNav`, `Calendar` and the edit-mode controls, replacing the local `square` and `ToolbarButton` styles in `EditHome.tsx`.
- Edit session state in the client: `EditHome.tsx` holds a draft `Layout` plus draft settings and a list of change summaries. Pure functions in `src/features/home/draft.ts` (add, update, remove, reorder for pins, panels and groups) so unit tests cover them. New panels and pins get temporary negative ids in the draft.
- One Server Action `saveEditSessionAction(draft, settings, changes)` → `saveEditSessionMutation` validates the whole layout (pin cap, panel types and sizes, configs) and settings, replaces pins, panels and groups in one transaction (new rows get real ids), writes the settings, and logs one `home.edited` entry with `details`.
- Remove the per-change edit actions and mutations (`addPinAction`, `movePanelAction`, `restoreLayoutAction`, …) once nothing calls them. `changeCounterAction` stays.
- Drag and drop: `@dnd-kit/core` and `@dnd-kit/sortable` (new dependencies; touch, pointer and keyboard sensors). Versions to be checked with `npm view` before installing.
- Pins: `PinLink` calls a `logPinOpenAction(href)` on every tap; `openCountsSince` filters on `action = 'pin.open'`; window 7 days in `src/features/home/data.ts`. Delete `TrackVisit` and `logVisitAction`.
- Page list for the "Destino" select: `src/features/catalog.ts` gains a list of pages (`{ href, label, icon }`); Início and Histórico now, features add theirs.
- Histórico: `ActivityList` renders a disclosure (`<button aria-expanded>`) for rows with `details`; `activityFeatureKeys` excludes `home`.
- Calendar: a `view` state (`days`, `months`, `years`) in `src/components/ui/Calendar.tsx`; grid helpers in `src/lib/calendar.ts` with unit tests.
- Update `e2e/home.spec.ts` and `e2e/historico.spec.ts` for the new flows; add a test that `/editar` writes nothing before Concluir.

### Deviations from the plan
- Press/hover classes are in `src/components/ui/pressable.ts`: `pressHard`, `pressHardSm` (shadowed elements), `pressFlat` (no shadow: tint and scale) and `pressRow` (full-width rows, switches, segmented controls, calendar cells: tint only, because scaling a row or a joined segment opens gaps).
- On touch screens there is no hover effect, only the press effect: Tailwind's `hover:` applies only when the device reports `(hover: hover)`. The hover browser test runs in a context without touch emulation for this reason.
- Session rows in Histórico use `<details>`/`<summary>` instead of `<button aria-expanded>`: the list is a Server Component, and `<details>` gives the open state and keyboard support without client code.
- The session row summary is "Início editado · N mudanças"; changing "Itens no início" is listed as "Itens do histórico no início: N".
- `openCountsSince` was renamed `pinOpenCountsSince`. `logPinOpenAction` calls `refresh()`, so Início shows the new order after coming back from an external link.
- The draft functions are in `src/features/home/draft.ts`; `queries.ts` keeps one write for the session, `replaceLayout()`. The per-change queries, mutations and actions from spec 002 were removed, along with `layoutSchema` and `restoreLayoutMutation`.
- Drag and drop code is in `src/features/home/components/edit/sortable.tsx`. Each `DndContext` gets an id from `useId()`; without it dnd-kit's `aria-describedby` ids differ between server and browser (hydration mismatch observed in the dev server log). Screen reader announcements are in pt-BR.
- The Link field is a text input with `inputMode="url"`, not `type="url"`: the browser's URL check blocked the submit with its own English message before the pt-BR one.
- Found while testing: with several link pins, the hidden "(abre em nova aba)" text made Início 581 px wide at 360 px. `PinLink` is now `relative`, which keeps that text inside the pin row.
- Pins are not draggable on Início; only in `/editar`, as specified.

## Tasks
- [x] Approve this spec (2026-10-19)
- [x] Shared press/hover style, applied everywhere
- [x] Migration for `activity_log.details` (`drizzle/0003_activity_details.sql`)
- [x] Draft functions and `saveEditSessionMutation` with unit tests (`tests/home-pins.test.ts`, `tests/home-panels.test.ts`, `tests/home-session.test.ts`)
- [x] Edit mode: draft state, Concluir, Voltar dialog, `beforeunload`
- [x] Drag and drop for pins, panels and groups
- [x] Pin dialog: Destino select and Link field; cap 8
- [x] Pin tap counting, 7-day window; remove `TrackVisit`
- [x] Histórico: session rows with details; no Início chip
- [x] Calendar month and year views
- [x] Browser tests; check at 360 px in light and dark (screenshots of `/`, `/editar`, the Voltar dialog, `/historico` with an open session row, and the month and year views, reviewed in both themes)
