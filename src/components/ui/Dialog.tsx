"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "./Button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

// Native <dialog> shown as a bottom sheet on phones and a centered panel from 768 px.
// Escape and a click on the backdrop close it.
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // The inner div fills the dialog, so a click whose target is the dialog itself landed on the backdrop.
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto w-full max-w-none rounded-t-card bg-surface text-foreground backdrop:bg-black/50 md:m-auto md:max-w-lg md:rounded-card"
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar">
            ✕
          </Button>
        </div>
        <div className="overflow-y-auto p-4">{open && children}</div>
      </div>
    </dialog>
  );
}
