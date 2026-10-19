import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "default" | "icon";

// Hover and press move the button by the shadow offset (4px = translate-1) and remove the shadow,
// so it looks pushed into the page. Reduced motion keeps only the shadow change.
const pressable =
  "shadow-hard hover:translate-x-1 hover:translate-y-1 hover:shadow-none active:translate-x-1 active:translate-y-1 active:shadow-none motion-reduce:translate-x-0 motion-reduce:translate-y-0";

const variants: Record<Variant, string> = {
  primary: cn("border-border bg-accent text-accent-foreground", pressable),
  secondary: cn("border-border bg-surface text-foreground", pressable),
  ghost: "border-transparent text-foreground hover:bg-foreground/10",
  danger: cn("border-border bg-danger text-danger-foreground", pressable),
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
        "transition-[translate,box-shadow] duration-100 motion-reduce:transition-none",
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
