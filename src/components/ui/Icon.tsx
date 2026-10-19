import {
  Banknote,
  Bed,
  BookOpen,
  Briefcase,
  Calendar,
  Car,
  Clock,
  Droplet,
  Dumbbell,
  Gamepad2,
  Heart,
  House,
  Lightbulb,
  Link,
  ListChecks,
  Music,
  NotebookPen,
  Pill,
  Plane,
  ShoppingCart,
  Star,
  Target,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "./icon-names";

const ICONS: Record<IconName, LucideIcon> = {
  "list-checks": ListChecks,
  wallet: Wallet,
  banknote: Banknote,
  dumbbell: Dumbbell,
  heart: Heart,
  droplet: Droplet,
  "notebook-pen": NotebookPen,
  calendar: Calendar,
  clock: Clock,
  star: Star,
  target: Target,
  "book-open": BookOpen,
  "shopping-cart": ShoppingCart,
  utensils: Utensils,
  pill: Pill,
  bed: Bed,
  briefcase: Briefcase,
  house: House,
  car: Car,
  plane: Plane,
  music: Music,
  gamepad: Gamepad2,
  lightbulb: Lightbulb,
  link: Link,
};

// Decorative by default: the label next to the icon carries the meaning.
export function Icon({ name, className }: { name: string; className?: string }) {
  const Component = ICONS[name as IconName] ?? Link;
  return <Component aria-hidden="true" className={className} strokeWidth={2} />;
}
