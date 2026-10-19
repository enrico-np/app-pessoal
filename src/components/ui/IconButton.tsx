import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { pressHardSm } from "./pressable";

// Round 44 px button with a small hard shadow, used in the teal header (gear, calendar).
const classes = cn(
  "inline-flex size-tap items-center justify-center rounded-full border-2 border-border bg-surface text-foreground",
  pressHardSm,
  "[&_svg]:size-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
);

export function IconButton({
  label,
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button type={type} aria-label={label} className={cn(classes, className)} {...props}>
      {children}
    </button>
  );
}

export function IconLink({ label, href, children }: { label: string; href: string; children: ReactNode }) {
  return (
    <Link href={href} aria-label={label} className={classes}>
      {children}
    </Link>
  );
}
