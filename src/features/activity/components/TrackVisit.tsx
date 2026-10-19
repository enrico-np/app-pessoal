"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { logVisitAction } from "../actions";

// Records one "open" entry per page view, for "Ordenar pelos mais usados" (spec 002). Renders nothing.
export function TrackVisit() {
  const pathname = usePathname();
  useEffect(() => {
    void logVisitAction(pathname);
  }, [pathname]);
  return null;
}
