"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  createBlockAction,
  moveBlockAction,
  removeBlockAction,
  updateBlockAction,
} from "../actions";
import type { ActionResult } from "../mutations";
import { BLOCK_SIZES, BLOCK_TYPES, type BlockSize, type BlockType, type MenuBlockRow } from "../schema";
import { LABEL_MAX, NOTE_MAX } from "../validation";
import { IconPicker } from "./IconPicker";

export const TYPE_LABELS: Record<BlockType, string> = {
  shortcut: "Atalho",
  note: "Nota",
  counter: "Contador",
  card: "Resumo",
};

const SIZE_LABELS: Record<BlockSize, string> = {
  sm: "Pequeno",
  md: "Largo",
  lg: "Grande",
};

export type CardOption = { key: string; label: string };

type Props = {
  // Without a block the editor creates one; with a block it edits that block.
  block?: MenuBlockRow;
  isFirst?: boolean;
  isLast?: boolean;
  cardOptions: CardOption[];
  onClose: () => void;
};

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function BlockEditor({ block, isFirst = false, isLast = false, cardOptions, onClose }: Props) {
  const [type, setType] = useState<BlockType>(block?.type ?? "shortcut");
  const [label, setLabel] = useState(block?.label ?? "");
  const [icon, setIcon] = useState<string | null>(block?.icon ?? null);
  const [size, setSize] = useState<BlockSize>(block?.size ?? "sm");
  const [href, setHref] = useState(str(block?.config.href));
  const [text, setText] = useState(str(block?.config.text));
  const [value, setValue] = useState(String(typeof block?.config.value === "number" ? block.config.value : 0));
  const [cardKey, setCardKey] = useState(str(block?.config.cardKey) || cardOptions[0]?.key || "");
  const [error, setError] = useState<string | null>(null);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, closeOnSuccess: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
      else if (closeOnSuccess) onClose();
    });
  }

  function config(): Record<string, unknown> {
    switch (type) {
      case "shortcut":
        return { href };
      case "note":
        return { text };
      case "counter":
        // Empty field means 0; anything else non-integer is rejected by validation with a pt-BR message.
        return { value: value.trim() === "" ? 0 : Number(value.replace(",", ".")) };
      case "card":
        return { cardKey };
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const fields = { label, icon, size, config: config() };
    if (block) run(() => updateBlockAction(block.id, fields), true);
    else run(() => createBlockAction({ type, ...fields }), true);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {!block && (
        <Select
          label="Tipo"
          value={type}
          onChange={(e) => setType(e.target.value as BlockType)}
          options={BLOCK_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))}
        />
      )}

      <Input label="Nome" value={label} maxLength={LABEL_MAX} onChange={(e) => setLabel(e.target.value)} required />

      {type === "shortcut" && (
        <Input
          label="Endereço"
          value={href}
          onChange={(e) => setHref(e.target.value)}
          placeholder="/tarefas ou https://..."
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
        />
      )}
      {type === "note" && (
        <Textarea label="Texto" value={text} maxLength={NOTE_MAX} onChange={(e) => setText(e.target.value)} />
      )}
      {type === "counter" && (
        <Input label="Valor" value={value} onChange={(e) => setValue(e.target.value)} inputMode="numeric" />
      )}
      {type === "card" &&
        (cardOptions.length > 0 ? (
          <Select
            label="Resumo"
            value={cardKey}
            onChange={(e) => setCardKey(e.target.value)}
            options={cardOptions.map((c) => ({ value: c.key, label: c.label }))}
          />
        ) : (
          <p className="text-sm text-muted">Nenhum resumo disponível ainda.</p>
        ))}

      <IconPicker value={icon} onChange={setIcon} />

      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">Tamanho</legend>
        <div role="radiogroup" className="grid grid-cols-3 gap-1">
          {BLOCK_SIZES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={size === s}
              onClick={() => setSize(s)}
              className={cn(
                "min-h-tap rounded-control border text-sm",
                "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent",
                size === s ? "border-accent bg-accent/10 font-medium" : "border-border hover:bg-border/50",
              )}
            >
              {SIZE_LABELS[s]}
            </button>
          ))}
        </div>
      </fieldset>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {block ? "Salvar" : "Adicionar"}
      </Button>

      {block && (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              disabled={pending || isFirst}
              onClick={() => run(() => moveBlockAction(block.id, "earlier"), false)}
            >
              ← Mover para trás
            </Button>
            <Button
              variant="secondary"
              disabled={pending || isLast}
              onClick={() => run(() => moveBlockAction(block.id, "later"), false)}
            >
              Mover para frente →
            </Button>
          </div>
          {confirmingRemove ? (
            <div className="flex flex-col gap-2 rounded-control border border-danger p-3">
              <p className="text-sm">Remover “{block.label}”? Esta ação não pode ser desfeita.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" disabled={pending} onClick={() => setConfirmingRemove(false)}>
                  Cancelar
                </Button>
                <Button variant="danger" disabled={pending} onClick={() => run(() => removeBlockAction(block.id), true)}>
                  Remover
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" className="text-danger" disabled={pending} onClick={() => setConfirmingRemove(true)}>
              Remover bloco
            </Button>
          )}
        </div>
      )}
    </form>
  );
}
