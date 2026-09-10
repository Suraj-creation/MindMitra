import type React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  id,
  role,
  tabIndex,
  onClick,
  style,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      id={id}
      role={role}
      tabIndex={tabIndex}
      onClick={onClick}
      style={style}
      className={cn(
        "rounded-xl border border-[--color-border] bg-white p-6 shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
  id,
  style,
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 id={id} style={style} className={cn("text-lg font-semibold text-[--color-text] mb-1", className)}>
      {children}
    </h2>
  );
}

export function CardDescription({
  children,
  className,
  id,
  style,
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p id={id} style={style} className={cn("text-sm text-[--color-muted] mb-4", className)}>
      {children}
    </p>
  );
}
