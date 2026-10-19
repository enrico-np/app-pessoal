import Link from "next/link";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { pressFlat, pressHardSm } from "./pressable";

// Pill used for filters. Selected chips use the accent fill and a small hard shadow.
function chipClasses(selected: boolean) {
  return cn(
    "inline-flex min-h-tap shrink-0 items-center rounded-full border-2 border-border px-3.5 text-sm",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
    selected ? cn("bg-accent font-bold text-accent-foreground", pressHardSm) : cn("bg-surface text-foreground", pressFlat),
  );
}

export function ChipLink({ href, selected, children }: { href: string; selected: boolean; children: string }) {
  return (
    <Link href={href} aria-current={selected ? "true" : undefined} className={chipClasses(selected)}>
      {children}
    </Link>
  );
}

export function ChipButton({
  selected,
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button type={type} aria-pressed={selected} className={cn(chipClasses(selected), className)} {...props} />
  );
}
