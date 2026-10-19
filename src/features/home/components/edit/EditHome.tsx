"use client";

import { horizontalListSortingStrategy, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { ChevronLeft, GripVertical, Lock, Minus, Pencil, Plus, Redo2, Trash2, Undo2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button, Dialog, Icon, Switch } from "@/components/ui";
import { pressFlat } from "@/components/ui/pressable";
import { featureLabel } from "@/features/catalog";
import { HISTORY_COUNT_MAX, HISTORY_COUNT_MIN } from "@/features/settings/validation";
import { cn } from "@/lib/cn";
import { saveEditSessionAction } from "../../actions";
import {
  addPanel,
  addPin,
  draftFromLayout,
  moveGroup,
  movePanel,
  movePin,
  panelName,
  removePanel,
  removePin,
  sessionPayload,
  setHistoryCount,
  setPinsOrder,
  updatePanel,
  updatePin,
  type Draft,
  type DraftGroup,
  type DraftPanel,
  type DraftPin,
  type DraftResult,
  type DraftSettings,
} from "../../draft";
import { panelType, SIZE_LABELS } from "../../panel-types";
import type { Layout } from "../../queries";
import { emptyStack, pushChange, redo, undo, type UndoStack } from "../../undo";
import { PIN_MAX } from "../../validation";
import { AddPanelDialog } from "./AddPanelDialog";
import { PanelDialog } from "./PanelDialog";
import { PinDialog } from "./PinDialog";
import { SortableList, useSortableItem } from "./sortable";

const eyebrow = "text-xs leading-4 font-bold tracking-[0.06em] text-muted uppercase";

type Dialogs =
  | { kind: "none" }
  | { kind: "add-panel"; feature?: string }
  | { kind: "panel"; panel: DraftPanel }
  | { kind: "pin"; pin?: DraftPin }
  | { kind: "leave" };

// Edit mode of Início (spec 002 board E1; behavior from spec 003). Changes live in a draft in this
// component. Concluir saves the draft in one request; Voltar discards it after a confirmation.
export function EditHome({
  layout,
  settings,
  openAddPanel,
}: {
  layout: Layout;
  settings: DraftSettings;
  openAddPanel: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => draftFromLayout(layout, settings));
  const [stack, setStack] = useState<UndoStack<Draft>>(emptyStack);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialogs>(openAddPanel ? { kind: "add-panel" } : { kind: "none" });
  const [saving, startSaving] = useTransition();
  const dirty = draft.changes.length > 0;

  // Reload or closing the tab with unsaved changes shows the browser's own warning.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // Applies one draft step; on success records it for undo and closes the dialog.
  function apply(result: DraftResult) {
    if (!result.ok) return setError(result.error);
    setError(null);
    setDialog({ kind: "none" });
    if (result.data === draft) return;
    const label = result.data.changes.at(-1) ?? "";
    setStack((s) => pushChange(s, { label, before: draft, after: result.data }));
    setDraft(result.data);
    setStatus(`Última mudança: ${label}.`);
  }

  function step(kind: "undo" | "redo") {
    const { stack: next, entry } = kind === "undo" ? undo(stack) : redo(stack);
    if (!entry) return;
    setStack(next);
    setDraft(kind === "undo" ? entry.before : entry.after);
    setError(null);
    setStatus(kind === "undo" ? `Desfeito: ${entry.label}.` : `Refeito: ${entry.label}.`);
  }

  function finish() {
    if (!dirty) return router.push("/");
    setError(null);
    startSaving(async () => {
      const result = await saveEditSessionAction(sessionPayload(draft));
      if (!result.ok) return setError(result.error);
      router.push("/");
    });
  }

  function back() {
    if (dirty) setDialog({ kind: "leave" });
    else router.push("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-6 pb-32">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="icon" aria-label="Voltar" onClick={back}>
            <ChevronLeft aria-hidden="true" />
          </Button>
          <h1 className="text-2xl leading-7 font-bold">Editando o início</h1>
        </div>
        <p className="text-sm text-muted">Arraste para mudar a ordem. Nada é salvo até você tocar em Concluir.</p>
        <div className="flex gap-3">
          {/* Narrower padding and normal weight: three buttons with icons must fit in 360 px (measured 360.66 px
              with Button's defaults). */}
          <Button
            variant="secondary"
            className="flex-1 gap-1.5 px-3 font-normal"
            onClick={() => step("undo")}
            disabled={saving || stack.past.length === 0}
          >
            <Undo2 aria-hidden="true" />
            Desfazer
          </Button>
          <Button
            variant="secondary"
            className="flex-1 gap-1.5 px-3 font-normal"
            onClick={() => step("redo")}
            disabled={saving || stack.future.length === 0}
          >
            <Redo2 aria-hidden="true" />
            Refazer
          </Button>
          <Button className="flex-[1.2] font-bold" onClick={finish} disabled={saving}>
            Concluir
          </Button>
        </div>
        <p role="status" className="min-h-5 text-[0.8125rem] text-muted">
          {status}
        </p>
        {error && dialog.kind === "none" && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </header>

      <section aria-labelledby="edit-fixados" className="flex flex-col gap-3">
        <h2 id="edit-fixados" className={eyebrow}>
          Fixados · {draft.pins.length} de {PIN_MAX} · toque para trocar, arraste para mover
        </h2>
        <SortableList
          items={draft.pins.map((p) => ({ id: `pin:${p.id}`, name: p.label }))}
          strategy={horizontalListSortingStrategy}
          onMove={(from, to) => apply(movePin(draft, from, to))}
        >
          <ul className="-mx-4 flex gap-3 overflow-x-auto px-4 pt-4 pr-6 pb-2 [scrollbar-width:none]">
            {draft.pins.map((pin) => (
              <EditPin
                key={pin.id}
                pin={pin}
                onOpen={() => setDialog({ kind: "pin", pin })}
                onRemove={() => apply(removePin(draft, pin.id))}
              />
            ))}
            {draft.pins.length < PIN_MAX && (
              <li className="w-16 shrink-0">
                <button
                  type="button"
                  onClick={() => setDialog({ kind: "pin" })}
                  className={cn("flex w-full flex-col items-center gap-2 text-xs text-muted", pressFlat)}
                >
                  <span className="flex size-15 items-center justify-center rounded-card border-2 border-dashed border-muted [&_svg]:size-6">
                    <Plus aria-hidden="true" />
                  </span>
                  Adicionar
                </button>
              </li>
            )}
          </ul>
        </SortableList>
        <div className="overflow-hidden rounded-card border-2 border-border bg-surface shadow-hard-sm">
          <Switch
            label="Ordenar pelos mais usados"
            description={
              draft.settings.pins_order === "usage"
                ? "Ligado: os mais tocados nos últimos 7 dias vêm primeiro"
                : "Desligado: a ordem é a que você escolheu"
            }
            checked={draft.settings.pins_order === "usage"}
            onChange={(on) => apply(setPinsOrder(draft, on ? "usage" : "manual"))}
          />
        </div>
      </section>

      <hr className="border-t border-border" />

      <section aria-labelledby="edit-paineis" className="flex flex-col gap-4">
        <h2 id="edit-paineis" className={eyebrow}>
          Painéis
        </h2>
        {draft.groups.length === 0 && <p className="text-sm text-muted">Nenhum painel ainda. Toque em + para adicionar.</p>}
        <SortableList
          items={draft.groups.map((g) => ({ id: `group:${g.key}`, name: featureLabel(g.key) }))}
          strategy={verticalListSortingStrategy}
          onMove={(from, to) => apply(moveGroup(draft, from, to, featureLabel(draft.groups[from].key)))}
        >
          {draft.groups.map((group) => (
            <EditGroup
              key={group.key}
              group={group}
              onMovePanel={(from, to) => apply(movePanel(draft, group.key, from, to))}
              onEditPanel={(panel) => setDialog({ kind: "panel", panel })}
              onRemovePanel={(panel) => apply(removePanel(draft, panel.id))}
              onAddPanel={() => setDialog({ kind: "add-panel", feature: group.key })}
            />
          ))}
        </SortableList>
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
          <Button
            variant="secondary"
            size="icon"
            aria-label="Mostrar menos itens"
            disabled={draft.settings.history_count <= HISTORY_COUNT_MIN}
            onClick={() => apply(setHistoryCount(draft, draft.settings.history_count - 1))}
          >
            <Minus aria-hidden="true" />
          </Button>
          <output aria-live="polite" className="min-w-4 text-center font-mono text-xl font-bold">
            {draft.settings.history_count}
          </output>
          <Button
            size="icon"
            aria-label="Mostrar mais itens"
            disabled={draft.settings.history_count >= HISTORY_COUNT_MAX}
            onClick={() => apply(setHistoryCount(draft, draft.settings.history_count + 1))}
          >
            <Plus aria-hidden="true" />
          </Button>
        </div>
      </section>

      <Button
        aria-label="Adicionar painel"
        onClick={() => setDialog({ kind: "add-panel" })}
        className="fixed right-4 bottom-6 z-10 size-15 rounded-full [&_svg]:size-6"
      >
        <Plus aria-hidden="true" />
      </Button>

      {dialog.kind === "add-panel" && (
        <AddPanelDialog
          open
          initialFeature={dialog.feature}
          usedTypeKeys={draft.groups.flatMap((g) => g.panels.map((p) => p.typeKey))}
          error={error}
          onClose={() => setDialog({ kind: "none" })}
          onAdd={(input) => apply(addPanel(draft, input))}
        />
      )}
      {dialog.kind === "panel" && (
        <PanelDialog
          panel={dialog.panel}
          error={error}
          onClose={() => setDialog({ kind: "none" })}
          onSave={(update) => apply(updatePanel(draft, dialog.panel.id, update))}
        />
      )}
      {dialog.kind === "pin" && (
        <PinDialog
          pin={dialog.pin}
          error={error}
          onClose={() => setDialog({ kind: "none" })}
          onSave={(input) => apply(dialog.pin ? updatePin(draft, dialog.pin.id, input) : addPin(draft, input))}
        />
      )}
      <Dialog open={dialog.kind === "leave"} onClose={() => setDialog({ kind: "none" })} title="Descartar alterações?">
        <div className="flex flex-col gap-4">
          <p className="text-sm">Se voltar agora, as mudanças desta edição serão perdidas.</p>
          <Button variant="secondary" className="min-h-12" onClick={() => setDialog({ kind: "none" })}>
            Continuar editando
          </Button>
          <Button variant="danger" className="min-h-12 font-bold" onClick={() => router.push("/")}>
            Descartar e voltar
          </Button>
        </div>
      </Dialog>
    </main>
  );
}

function EditPin({ pin, onOpen, onRemove }: { pin: DraftPin; onOpen: () => void; onRemove: () => void }) {
  const { setNodeRef, style, setHandleRef, handleProps, isDragging, consumeDragClick } = useSortableItem(`pin:${pin.id}`);
  return (
    <li ref={setNodeRef} style={style} className="w-16 shrink-0" data-pin={pin.label}>
      <button
        type="button"
        ref={setHandleRef}
        {...handleProps}
        aria-label={`Trocar ${pin.label}`}
        onClick={() => {
          if (!consumeDragClick()) onOpen();
        }}
        className={cn("flex w-full touch-manipulation flex-col items-center gap-2 text-xs", pressFlat)}
      >
        <span
          className={cn(
            "flex size-15 items-center justify-center rounded-card border-2 border-dashed border-border bg-surface [&_svg]:size-6",
            isDragging && "border-solid shadow-hard",
          )}
        >
          <Icon name={pin.icon} />
        </span>
        <span className="w-full truncate">{pin.label}</span>
      </button>
      <button
        type="button"
        aria-label={`Remover ${pin.label}`}
        onClick={onRemove}
        className={cn("absolute -top-4 -right-3 flex size-tap items-center justify-center", pressFlat)}
      >
        {/* 28 px badge inside a 44 px tap area. */}
        <span className="flex size-7 items-center justify-center rounded-full border-2 border-border bg-danger text-danger-foreground [&_svg]:size-3.5">
          <X aria-hidden="true" />
        </span>
      </button>
    </li>
  );
}

function EditGroup({
  group,
  onMovePanel,
  onEditPanel,
  onRemovePanel,
  onAddPanel,
}: {
  group: DraftGroup;
  onMovePanel: (from: number, to: number) => void;
  onEditPanel: (panel: DraftPanel) => void;
  onRemovePanel: (panel: DraftPanel) => void;
  onAddPanel: () => void;
}) {
  const { setNodeRef, style, setHandleRef, handleProps, isDragging } = useSortableItem(`group:${group.key}`);
  const name = featureLabel(group.key);
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex flex-col gap-2 rounded-card bg-background", isDragging && "shadow-hard")}
      data-edit-group={group.key}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          ref={setHandleRef}
          {...handleProps}
          aria-label={`Mover grupo ${name}`}
          className={cn(
            "flex size-tap shrink-0 touch-manipulation items-center justify-center rounded-control text-muted hover:bg-foreground/10 [&_svg]:size-5",
            pressFlat,
          )}
        >
          <GripVertical aria-hidden="true" />
        </button>
        <h3 className="flex-1 text-[1.0625rem] leading-6 font-bold">{name}</h3>
      </div>
      <SortableList
        items={group.panels.map((p) => ({ id: `panel:${p.id}`, name: panelName(p) }))}
        strategy={verticalListSortingStrategy}
        onMove={onMovePanel}
      >
        {group.panels.map((panel) => (
          <EditPanel key={panel.id} panel={panel} onEdit={() => onEditPanel(panel)} onRemove={() => onRemovePanel(panel)} />
        ))}
      </SortableList>
      <button
        type="button"
        onClick={onAddPanel}
        className={cn("min-h-tap rounded-card border-2 border-dashed border-muted text-sm hover:bg-foreground/10", pressFlat)}
      >
        + Adicionar painel de {name}
      </button>
    </div>
  );
}

function EditPanel({ panel, onEdit, onRemove }: { panel: DraftPanel; onEdit: () => void; onRemove: () => void }) {
  const { setNodeRef, style, setHandleRef, handleProps, isDragging } = useSortableItem(`panel:${panel.id}`);
  const type = panelType(panel.typeKey);
  const name = panelName(panel);
  return (
    <article
      ref={setNodeRef}
      style={style}
      data-edit-panel={name}
      className={cn(
        "flex items-center gap-2 rounded-card border-2 border-dashed border-[var(--link)] bg-surface py-2 pr-2 pl-1",
        isDragging && "border-solid shadow-hard",
      )}
    >
      <button
        type="button"
        ref={setHandleRef}
        {...handleProps}
        aria-label={`Mover ${name}`}
        className={cn(
          "flex size-tap shrink-0 touch-manipulation items-center justify-center rounded-control text-muted hover:bg-foreground/10 [&_svg]:size-5",
          pressFlat,
        )}
      >
        <GripVertical aria-hidden="true" />
      </button>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-bold">{name}</span>
        <span className="text-xs text-muted">
          {type?.label ?? "Painel"} · {SIZE_LABELS[panel.size].toLowerCase()}
        </span>
      </span>
      <Button variant="secondary" size="icon" aria-label={`Editar ${name}`} onClick={onEdit}>
        <Pencil aria-hidden="true" />
      </Button>
      <Button variant="danger" size="icon" aria-label={`Remover ${name}`} onClick={onRemove}>
        <Trash2 aria-hidden="true" />
      </Button>
    </article>
  );
}
