"use client";

import { useState, useTransition } from "react";
import { completeTaskAction } from "../actions";

// One open task on the large "Tarefas abertas" panel. Checking it marks the task done.
// The whole row is the label, so the tap target is the full row, not the 20 px box.
export function TaskCheckbox({ id, title }: { id: number; title: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <li className="border-t border-border">
      <label className="flex min-h-tap cursor-pointer items-center gap-3 py-2 text-sm">
        <input
          type="checkbox"
          disabled={pending}
          onChange={() =>
            startTransition(async () => {
              const result = await completeTaskAction(id);
              if (!result.ok) setError(result.error);
            })
          }
          className="size-5 shrink-0 accent-[var(--foreground)]"
        />
        <span className="min-w-0 flex-1 truncate">{title}</span>
        {error && <span className="text-xs text-danger">{error}</span>}
      </label>
    </li>
  );
}
