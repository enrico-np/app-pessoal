"use client";

import { Ellipsis, History, House, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { pressFlat } from "./pressable";

type Tab = { label: string; href?: string; icon: ReactNode };

// Ferramentas and Mais have no screens yet (spec 002): shown disabled, not links.
const TABS: Tab[] = [
  { label: "Início", href: "/", icon: <House /> },
  { label: "Histórico", href: "/historico", icon: <History /> },
  { label: "Ferramentas", icon: <LayoutGrid /> },
  { label: "Mais", icon: <Ellipsis /> },
];

// Pages where the bar is hidden: the edit screen is a task inside Início.
const HIDDEN_ON = ["/editar"];

export function BottomNav() {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-4 bottom-4 z-20 mx-auto grid h-17 max-w-md grid-cols-4 rounded-full border-2 border-border bg-surface px-2.5 py-1.5 shadow-hard"
    >
      {TABS.map((tab) => {
        const active = tab.href !== undefined && pathname === tab.href;
        const inner = (
          <>
            <span aria-hidden="true" className="flex h-6 items-center [&_svg]:size-5">
              {tab.icon}
            </span>
            {tab.label}
          </>
        );
        if (!tab.href) {
          return (
            <span
              key={tab.label}
              aria-disabled="true"
              className="flex flex-col items-center justify-center text-xs text-muted opacity-60"
            >
              {inner}
            </span>
          );
        }
        return (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center rounded-full text-xs",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
              pressFlat,
              active
                ? "place-self-center border-2 border-border bg-accent px-3.5 py-1 font-bold text-accent-foreground"
                : "text-muted hover:bg-foreground/10",
            )}
          >
            {inner}
          </Link>
        );
      })}
    </nav>
  );
}
