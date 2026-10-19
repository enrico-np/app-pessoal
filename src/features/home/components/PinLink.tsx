"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { logPinOpenAction } from "@/features/activity/actions";
import { cn } from "@/lib/cn";
import { isInternalHref } from "@/lib/href";

// Every tap is counted for "Ordenar pelos mais usados" (spec 003), for internal and external targets.
export function PinLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  const count = () => void logPinOpenAction(href);
  if (isInternalHref(href)) {
    return (
      <Link href={href} className={className} onClick={count}>
        {children}
      </Link>
    );
  }
  // `relative` keeps the absolutely positioned sr-only text inside the scrolling pin row; without it the
  // text is placed against the page and widens it (observed: 581 px page width with 8 link pins).
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn("relative", className)} onClick={count}>
      {children}
      <span className="sr-only">(abre em nova aba)</span>
    </a>
  );
}
