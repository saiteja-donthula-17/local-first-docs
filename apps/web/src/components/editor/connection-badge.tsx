"use client";

import { Loader2 } from "lucide-react";
import type { ConnState } from "@/hooks/use-collaboration";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  ConnState,
  { label: string; className: string; spin?: boolean; dot?: string }
> = {
  offline: { label: "Offline", className: "text-muted-foreground", dot: "bg-muted-foreground/50" },
  connecting: {
    label: "Connecting…",
    className: "text-amber-600 dark:text-amber-500",
    spin: true,
  },
  syncing: {
    label: "Syncing…",
    className: "text-blue-600 dark:text-blue-400",
    spin: true,
  },
  live: {
    label: "Live",
    className: "text-emerald-600 dark:text-emerald-500",
    dot: "bg-emerald-500",
  },
};

export function ConnectionBadge({ state }: { state: ConnState }) {
  const c = CONFIG[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        c.className,
      )}
      role="status"
      aria-live="polite"
      title={`Connection: ${c.label}`}
    >
      {c.spin ? (
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
      ) : (
        <span className={cn("size-2 rounded-full", c.dot)} aria-hidden />
      )}
      {c.label}
    </span>
  );
}
