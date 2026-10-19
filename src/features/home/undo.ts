// Undo/redo stack for the edit session (spec 002). Pure functions so they can be unit-tested.
// Each entry holds the layout before and after one change; undo restores `before`, redo restores `after`.

export const UNDO_LIMIT = 20;

export type UndoEntry<L> = { label: string; before: L; after: L };
export type UndoStack<L> = { past: UndoEntry<L>[]; future: UndoEntry<L>[] };

export function emptyStack<L>(): UndoStack<L> {
  return { past: [], future: [] };
}

// A new change clears the redo list and drops the oldest entry past the limit.
export function pushChange<L>(stack: UndoStack<L>, entry: UndoEntry<L>): UndoStack<L> {
  return { past: [...stack.past, entry].slice(-UNDO_LIMIT), future: [] };
}

export function undo<L>(stack: UndoStack<L>): { stack: UndoStack<L>; entry?: UndoEntry<L> } {
  const entry = stack.past.at(-1);
  if (!entry) return { stack };
  return { stack: { past: stack.past.slice(0, -1), future: [entry, ...stack.future] }, entry };
}

export function redo<L>(stack: UndoStack<L>): { stack: UndoStack<L>; entry?: UndoEntry<L> } {
  const entry = stack.future[0];
  if (!entry) return { stack };
  return { stack: { past: [...stack.past, entry], future: stack.future.slice(1) }, entry };
}
