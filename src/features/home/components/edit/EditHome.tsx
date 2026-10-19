"use client";

import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  GripVertical,
  Lock,
  Minus,
  Pencil,
  Plus,
  Redo2,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useTransition, type ReactNode } from "react";
import { Icon, Switch } from "@/components/ui";
import { featureLabel } from "@/features/catalog";
import { updateSettingAction } from "@/features/settings/actions";
import { HISTORY_COUNT_MAX, HISTORY_COUNT_MIN, type PinOrder } from "@/features/settings/validation";
import { cn } from "@/lib/cn";
import type { ActionResult } from "@/lib/result";
import {
  addPanelAction,
  addPinAction,
  moveGroupAction,
  movePanelAction,
  movePinAction,
  removePanelAction,
  removePinAction,
  restoreLayoutAction,
  updatePanelAction,
  updatePinAction,
} from "../../actions";
import type { EditResult } from "../../mutations";
import { panelType, SIZE_LABELS } from "../../panel-types";
import type { Layout } from "../../queries";
import type { HomePanelRow, HomePinRow } from "../../schema";
import { emptyStack, pushChange, redo, undo, type UndoStack } from "../../undo";
import { PIN_MAX } from "../../validation";
import { AddPanelDialog } from "./AddPanelDialog";
import { PanelDialog } from "./PanelDialog";
import { PinDialog } from "./PinDialog";

const eyebrow = "text-xs leading-4 font-bold tracking-[0.06em] text-muted uppercase";
const square = cn(
  "inline-flex size-tap shrink-0 items-center justify-center rounded-control border-2 border-border [&_svg]:size-4",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-40",
);

type Dialogs =
  | { kind: "none" }
  | { kind: "add-panel"; feature?: string }
  | { kind: "panel"; panel: HomePanelRow }
  | { kind: "pin"; pin?: HomePinRow };

// Edit mode of Início (spec 002, design board E1). Every change is saved at once; the undo stack lives
// only in this component, so it is cleared when the page is left or reloaded.
export function EditHome({
  layout,
  pinsOrder,
  historyCount,
  openAddPanel,
}: {
  layout: Layout;
  pinsOrder: PinOrder;
  historyCount: number;
  openAddPanel: boolean;
}) {
  const [stack, setStack] = useState<UndoStack<Layout>>(emptyStack);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialogs>(openAddPanel ? { kind: "add-panel" } : { kind: "none" });
  const [pending, startTransition] = useTransition();

  // Runs an edit; on success records it for undo and closes the dialog.
  function run(action: () => Promise<EditResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error);
      setStack((s) => pushChange(s, result.data));
      setStatus(`Última mudança: ${result.data.label}.`);
      setDialog({ kind: "none" });
    });
  }

  function runSetting(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error);
    });
  }

  function step(kind: "undo" | "redo") {
    const { stack: next, entry } = kind === "undo" ? undo(stack) : redo(stack);
    if (!entry) return;
    setError(null);
    startTransition(async () => {
      const result = await restoreLayoutAction(kind === "undo" ? entry.before : entry.after, kind);
      if (!result.ok) return setError(result.error);
      setStack(next);
      setStatus(kind === "undo" ? `Desfeito: ${entry.label}.` : `Refeito: ${entry.label}.`);
    });
  }

  const groups = layout.groups
    .map((g) => ({ key: g.groupKey, panels: layout.panels.filter((p) => p.groupKey === g.groupKey) }))
    .filter((g) => g.panels.length > 0);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-32">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Voltar" className={cn(square, "bg-surface shadow-hard-sm")}>
            <ChevronLeft aria-hidden="true" />
          </Link>
          <h1 className="text-2xl leading-7 font-bold">Editando o início</h1>
        </div>
        <p className="text-sm text-muted">Mude a ordem, remova ou adicione painéis.</p>
        <div className="flex gap-3">
          <ToolbarButton onClick={() => step("undo")} disabled={pending || stack.past.length === 0} icon={<Undo2 />}>
            Desfazer
          </ToolbarButton>
          <ToolbarButton onClick={() => step("redo")} disabled={pending || stack.future.length === 0} icon={<Redo2 />}>
            Refazer
          </ToolbarButton>
          <Link
            href="/"
            className="flex min-h-tap flex-[1.2] items-center justify-center rounded-control border-2 border-border bg-accent px-4 text-sm font-bold text-accent-foreground shadow-hard"
          >
            Concluir
          </Link>
        </div>
        <p role="status" className="min-h-5 text-[0.8125rem] text-muted">
          {status}
        </p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </header>

      <section aria-labelledby="edit-fixados" className="flex flex-col gap-3">
        <h2 id="edit-fixados" className={eyebrow}>
          Fixados · {layout.pins.length} de {PIN_MAX} · toque para trocar
        </h2>
        <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pt-4 pr-6 pb-2 [scrollbar-width:none]">
          {layout.pins.map((pin) => (
            <li key={pin.id} className="relative w-16 shrink-0" data-pin={pin.label}>
              <button
                type="button"
                aria-label={`Trocar ${pin.label}`}
                onClick={() => setDialog({ kind: "pin", pin })}
                className="flex w-full flex-col items-center gap-2 text-xs"
              >
                <span className="flex size-15 items-center justify-center rounded-card border-2 border-dashed border-border bg-surface [&_svg]:size-6">
                  <Icon name={pin.icon} />
                </span>
                <span className="w-full truncate">{pin.label}</span>
              </button>
              <button
                type="button"
                aria-label={`Remover ${pin.label}`}
                disabled={pending}
                onClick={() => run(() => removePinAction(pin.id))}
                className="absolute -top-4 -right-3 flex size-tap items-center justify-center"
              >
                {/* 28 px badge inside a 44 px tap area. */}
                <span className="flex size-7 items-center justify-center rounded-full border-2 border-border bg-danger text-danger-foreground [&_svg]:size-3.5">
                  <X aria-hidden="true" />
                </span>
              </button>
            </li>
          ))}
          {layout.pins.length < PIN_MAX && (
            <li className="w-16 shrink-0">
              <button
                type="button"
                onClick={() => setDialog({ kind: "pin" })}
                className="flex w-full flex-col items-center gap-2 text-xs text-muted"
              >
                <span className="flex size-15 items-center justify-center rounded-card border-2 border-dashed border-muted [&_svg]:size-6">
                  <Plus aria-hidden="true" />
                </span>
                Adicionar
              </button>
            </li>
          )}
        </ul>
        <div className="overflow-hidden rounded-card border-2 border-border bg-surface shadow-hard-sm">
          <Switch
            label="Ordenar pelos mais usados"
            description={
              pinsOrder === "usage" ? "Ligado: os mais abertos nos últimos 30 dias vêm primeiro" : "Desligado: a ordem é a que você escolheu"
            }
            checked={pinsOrder === "usage"}
            disabled={pending}
            onChange={(on) => runSetting(() => updateSettingAction("pins_order", on ? "usage" : "manual"))}
          />
        </div>
      </section>

      <hr className="border-t border-border" />

      <section aria-labelledby="edit-paineis" className="flex flex-col gap-4">
        <h2 id="edit-paineis" className={eyebrow}>
          Painéis
        </h2>
        {groups.length === 0 && <p className="text-sm text-muted">Nenhum painel ainda. Toque em + para adicionar.</p>}
        {groups.map((g, gi) => (
          <div key={g.key} className="flex flex-col gap-2" data-edit-group={g.key}>
            <div className="flex items-center gap-2">
              <h3 className="flex-1 text-[1.0625rem] leading-6 font-bold">{featureLabel(g.key)}</h3>
              <button
                type="button"
                aria-label={`Mover grupo ${featureLabel(g.key)} para cima`}
                disabled={pending || gi === 0}
                onClick={() => run(() => moveGroupAction(g.key, "earlier"))}
                className={cn(square, "bg-surface")}
              >
                <ArrowUp aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label={`Mover grupo ${featureLabel(g.key)} para baixo`}
                disabled={pending || gi === groups.length - 1}
                onClick={() => run(() => moveGroupAction(g.key, "later"))}
                className={cn(square, "bg-surface")}
              >
                <ArrowDown aria-hidden="true" />
              </button>
            </div>
            {g.panels.map((panel) => {
              const type = panelType(panel.typeKey);
              const name = type?.nameOf(panel.config) ?? panel.typeKey;
              return (
                <article
                  key={panel.id}
                  data-edit-panel={name}
                  className="flex items-center gap-2 rounded-card border-2 border-dashed border-[var(--link)] bg-surface py-2 pr-2 pl-2"
                >
                  <GripVertical aria-hidden="true" className="size-5 shrink-0 text-muted" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-bold">{name}</span>
                    <span className="text-xs text-muted">
                      {type?.label ?? "Painel"} · {SIZE_LABELS[panel.size].toLowerCase()}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Editar ${name}`}
                    onClick={() => setDialog({ kind: "panel", panel })}
                    className={cn(square, "bg-surface")}
                  >
                    <Pencil aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remover ${name}`}
                    disabled={pending}
                    onClick={() => run(() => removePanelAction(panel.id))}
                    className={cn(square, "bg-danger text-danger-foreground")}
                  >
                    <Trash2 aria-hidden="true" />
                  </button>
                </article>
              );
            })}
            <button
              type="button"
              onClick={() => setDialog({ kind: "add-panel", feature: g.key })}
              className="min-h-tap rounded-card border-2 border-dashed border-muted text-sm"
            >
              + Adicionar painel de {featureLabel(g.key)}
            </button>
          </div>
        ))}
      </section>

      <hr className="border-t border-border" />

      <section aria-labelledby="edit-historico" className="flex flex-col gap-3">
        <h2 id="edit-historico" className={eyebrow}>
          Histórico
        </h2>
        <div className="flex items-center gap-3 rounded-card border-2 border-border bg-surface py-2.5 pr-3 pl-4 shadow-hard">
          <Lock aria-hidden="true" className="size-5 shrink-0 text-muted" />
          <span className="flex flex-1 flex-col">
            <span className="text-sm font-bold">Itens no início</span>
            <span className="text-xs text-muted">
              Sempre no fim. De {HISTORY_COUNT_MIN} a {HISTORY_COUNT_MAX}.
            </span>
          </span>
          <button
            type="button"
            aria-label="Mostrar menos itens"
            disabled={pending || historyCount <= HISTORY_COUNT_MIN}
            onClick={() => runSetting(() => updateSettingAction("history_count", historyCount - 1))}
            className={cn(square, "bg-surface shadow-hard-sm")}
          >
            <Minus aria-hidden="true" />
          </button>
          <output aria-live="polite" className="min-w-4 text-center font-mono text-xl font-bold">
            {historyCount}
          </output>
          <button
            type="button"
            aria-label="Mostrar mais itens"
            disabled={pending || historyCount >= HISTORY_COUNT_MAX}
            onClick={() => runSetting(() => updateSettingAction("history_count", historyCount + 1))}
            className={cn(square, "bg-accent text-accent-foreground shadow-hard-sm")}
          >
            <Plus aria-hidden="true" />
          </button>
        </div>
      </section>

      <button
        type="button"
        aria-label="Adicionar painel"
        onClick={() => setDialog({ kind: "add-panel" })}
        className="fixed right-4 bottom-6 z-10 flex size-15 items-center justify-center rounded-full border-2 border-border bg-accent text-accent-foreground shadow-hard [&_svg]:size-6"
      >
        <Plus aria-hidden="true" />
      </button>

      {dialog.kind === "add-panel" && (
        <AddPanelDialog
          open
          initialFeature={dialog.feature}
          usedTypeKeys={layout.panels.map((p) => p.typeKey)}
          pending={pending}
          error={error}
          onClose={() => setDialog({ kind: "none" })}
          onAdd={(input) => run(() => addPanelAction(input))}
        />
      )}
      {dialog.kind === "panel" && (
        <PanelDialog
          panel={dialog.panel}
          isFirst={dialog.panel.position === 0}
          isLast={dialog.panel.position === layout.panels.filter((p) => p.groupKey === dialog.panel.groupKey).length - 1}
          pending={pending}
          error={error}
          onClose={() => setDialog({ kind: "none" })}
          onSave={(update) => run(() => updatePanelAction(dialog.panel.id, update))}
          onMove={(direction) => run(() => movePanelAction(dialog.panel.id, direction))}
        />
      )}
      {dialog.kind === "pin" && (
        <PinDialog
          pin={dialog.pin}
          isFirst={dialog.pin?.id === layout.pins[0]?.id}
          isLast={dialog.pin?.id === layout.pins.at(-1)?.id}
          pending={pending}
          error={error}
          onClose={() => setDialog({ kind: "none" })}
          onSave={(input) => run(() => (dialog.pin ? updatePinAction(dialog.pin.id, input) : addPinAction(input)))}
          onMove={(direction) => dialog.pin && run(() => movePinAction(dialog.pin!.id, direction))}
        />
      )}
    </main>
  );
}

function ToolbarButton({
  onClick,
  disabled,
  icon,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  icon: ReactNode;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-tap flex-1 items-center justify-center gap-1.5 rounded-control border-2 border-border bg-surface px-3 text-sm shadow-hard-sm disabled:opacity-45 disabled:shadow-none [&_svg]:size-4"
    >
      <span aria-hidden="true">{icon}</span>
      {children}
    </button>
  );
}
