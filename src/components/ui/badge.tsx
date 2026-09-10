import type React from "react";
import { cn } from "@/lib/utils";

type Variant = "success" | "warning" | "danger" | "muted" | "primary" | "teal";

const variantClasses: Record<Variant, string> = {
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  danger:  "bg-red-100   text-red-800   border-red-200",
  muted:   "bg-stone-100 text-stone-600 border-stone-200",
  primary: "bg-orange-100 text-orange-800 border-orange-200",
  teal:    "bg-teal-100  text-teal-800  border-teal-200",
};

export function Badge({
  variant = "muted",
  children,
  className,
}: {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
