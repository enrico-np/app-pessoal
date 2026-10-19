"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { logExternalOpenAction } from "@/features/activity/actions";
import { isInternalHref } from "@/lib/href";

// Internal paths are counted by TrackVisit; external URLs are counted here when tapped.
export function PinLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (isInternalHref(href)) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={() => void logExternalOpenAction(href)}>
      {children}
      <span className="sr-only">(abre em nova aba)</span>
    </a>
  );
}
