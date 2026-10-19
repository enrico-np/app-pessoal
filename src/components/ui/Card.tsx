import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border-2 border-border bg-surface p-4 shadow-hard-sm", className)}
      {...props}
    />
  );
}
