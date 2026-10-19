import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { pressFlat, pressHard } from "./pressable";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "default" | "icon";

const variants: Record<Variant, string> = {
  primary: cn("border-border bg-accent text-accent-foreground", pressHard),
  secondary: cn("border-border bg-surface text-foreground", pressHard),
  ghost: cn("border-transparent text-foreground hover:bg-foreground/10", pressFlat),
  danger: cn("border-border bg-danger text-danger-foreground", pressHard),
};

const sizes: Record<Size, string> = {
  default: "min-h-tap px-4",
  icon: "size-tap",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export function Button({ variant = "primary", size = "default", className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control border-2 text-sm font-medium",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
