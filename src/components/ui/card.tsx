import type React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  key,
}: {
  className?: string;
  children: React.ReactNode;
  key?: React.Key;
}) {
  return (
    <div
      key={key}
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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("text-lg font-semibold text-[--color-text] mb-1", className)}>
      {children}
    </h2>
  );
}

export function CardDescription({
  children,
}: {
  children: React.ReactNode;
}) {
  return <p className="text-sm text-[--color-muted] mb-4">{children}</p>;
}
