"use client";

import { useState } from "react";
import { Button, Dialog, Icon, Input } from "@/components/ui";
import { ICON_LABELS, ICON_NAMES, type IconName } from "@/components/ui/icon-names";
import { cn } from "@/lib/cn";
import type { HomePinRow } from "../../schema";
import type { Direction, PinInput } from "../../validation";

// Add or change a pin: name, address, icon, and its place in the manual order.
export function PinDialog({
  pin,
  isFirst,
  isLast,
  pending,
  error,
  onClose,
  onSave,
  onMove,
}: {
  pin?: HomePinRow;
  isFirst: boolean;
  isLast: boolean;
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (input: PinInput) => void;
  onMove: (direction: Direction) => void;
}) {
  const [label, setLabel] = useState(pin?.label ?? "");
  const [href, setHref] = useState(pin?.href ?? "/");
  const [icon, setIcon] = useState<IconName>((pin?.icon as IconName) ?? "star");
  return (
    <Dialog open onClose={onClose} title={pin ? `Trocar “${pin.label}”` : "Fixar atalho"}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ label, href, icon });
        }}
      >
        <Input label="Nome" value={label} maxLength={20} onChange={(e) => setLabel(e.target.value)} />
        <Input label="Endereço" value={href} onChange={(e) => setHref(e.target.value)} placeholder="/tarefas ou https://…" />
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-medium">Ícone</legend>
          <div role="radiogroup" className="grid grid-cols-6 gap-1">
            {ICON_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={icon === name}
                aria-label={ICON_LABELS[name]}
                onClick={() => setIcon(name)}
                className={cn(
                  "flex size-tap items-center justify-center rounded-control border-2 [&_svg]:size-5",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
                  icon === name ? "border-border bg-accent text-accent-foreground" : "border-transparent hover:bg-foreground/10",
                )}
              >
                <Icon name={name} />
              </button>
            ))}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="min-h-12 text-base font-bold">
          {pin ? "Salvar" : "Fixar"}
        </Button>
        {pin && (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" disabled={pending || isFirst} onClick={() => onMove("earlier")}>
              ← Mover para trás
            </Button>
            <Button variant="secondary" disabled={pending || isLast} onClick={() => onMove("later")}>
              Mover para frente →
            </Button>
          </div>
        )}
      </form>
    </Dialog>
  );
}
