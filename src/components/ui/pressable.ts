import { cn } from "@/lib/cn";

// Hover and press feedback for every button and button-styled link (spec 003). Pick the one that matches
// the element's shadow. Movement and scaling are wrapped in motion-safe, so with reduced motion only the
// shadow or colour changes. Tailwind's hover: already applies only on devices that can hover.

const base = "transition-[translate,scale,box-shadow,filter,background-color] duration-100 motion-reduce:transition-none";

// Elements with shadow-hard (4 px): pushed into the page by the shadow offset, shadow removed.
export const pressHard = cn(
  base,
  "shadow-hard not-disabled:hover:shadow-none not-disabled:active:shadow-none",
  "motion-safe:not-disabled:hover:translate-x-1 motion-safe:not-disabled:hover:translate-y-1",
  "motion-safe:not-disabled:active:translate-x-1 motion-safe:not-disabled:active:translate-y-1",
);

// Elements with shadow-hard-sm (2 px).
export const pressHardSm = cn(
  base,
  "shadow-hard-sm not-disabled:hover:shadow-none not-disabled:active:shadow-none",
  "motion-safe:not-disabled:hover:translate-x-0.5 motion-safe:not-disabled:hover:translate-y-0.5",
  "motion-safe:not-disabled:active:translate-x-0.5 motion-safe:not-disabled:active:translate-y-0.5",
);

// Elements without a shadow: darker on hover, slightly smaller while pressed. For transparent elements,
// add `hover:bg-foreground/10` so the tint is visible.
export const pressFlat = cn(base, "not-disabled:hover:brightness-90 motion-safe:not-disabled:active:scale-96");

// Full-width rows inside a card (switches, list rows): tint only, because scaling a whole row looks like
// the card is breaking apart.
export const pressRow = cn(base, "not-disabled:hover:bg-foreground/5 not-disabled:active:bg-foreground/10");
