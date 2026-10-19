"use client";

import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDndMonitor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, type SortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useState, type CSSProperties, type ReactNode } from "react";

// Drag and drop for the edit screen (spec 003), on @dnd-kit. Each list (pins, groups, the panels of one
// group) is its own DndContext, so items never move between lists.
// Touch starts after a 200 ms hold so a quick swipe still scrolls; the mouse starts after 5 px of movement.
// Keyboard: Space lifts and drops, arrows move, Escape cancels. Enter is left alone so that a pin, which
// is also a button, still opens its dialog with Enter.

export type SortableItem = { id: UniqueIdentifier; name: string };

const instructions =
  "Para mover, pressione espaço, use as setas para mudar a posição e pressione espaço de novo para soltar. Esc cancela.";

function announcements(items: SortableItem[]): Announcements {
  const name = (id: UniqueIdentifier) => items.find((i) => i.id === id)?.name ?? "item";
  const position = (id: UniqueIdentifier | undefined) => items.findIndex((i) => i.id === id) + 1;
  return {
    onDragStart: ({ active }) => `${name(active.id)} levantado. Posição ${position(active.id)} de ${items.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `${name(active.id)} na posição ${position(over.id)} de ${items.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `${name(active.id)} solto na posição ${position(over.id)} de ${items.length}.` : `${name(active.id)} solto.`,
    onDragCancel: ({ active }) => `Movimento cancelado. ${name(active.id)} voltou ao lugar.`,
  };
}

export function SortableList({
  items,
  strategy,
  onMove,
  children,
}: {
  items: SortableItem[];
  strategy: SortingStrategy;
  onMove: (from: number, to: number) => void;
  children: ReactNode;
}) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space"] },
    }),
  );

  // Without a stable id, dnd-kit numbers its aria-describedby ids with a counter that differs between the
  // server render and the browser, which causes a hydration mismatch.
  const id = useId();

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from >= 0 && to >= 0) onMove(from, to);
  }

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{ announcements: announcements(items), screenReaderInstructions: { draggable: instructions } }}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={strategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

// State for one sortable item. `setNodeRef` and `style` go on the element that moves; `setHandleRef` and
// `handleProps` on the element the user grabs. Returned flat: the React lint rule treats an object that holds
// a ref callback as a ref and rejects reading it during render.
export function useSortableItem(id: UniqueIdentifier) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    attributes: { roleDescription: "item arrastável" },
  });
  // A mouse drag ends with a click on the dragged element; this flag lets that click be ignored.
  const [dragged, setDragged] = useState(false);
  useDndMonitor({
    onDragStart: ({ active }) => {
      if (active.id === id) setDragged(true);
    },
  });

  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    position: "relative",
  };

  return {
    isDragging,
    setNodeRef,
    style,
    setHandleRef: setActivatorNodeRef,
    handleProps: {
      ...attributes,
      ...listeners,
      // Space drops the item on keydown; without this the keyup would also click the handle.
      onKeyUp: (e: React.KeyboardEvent) => {
        if (e.key === " ") e.preventDefault();
      },
    },
    // Call at the start of the handle's onClick: true means the click came from a drag and must be ignored.
    consumeDragClick: () => {
      setDragged(false);
      return dragged;
    },
  };
}
