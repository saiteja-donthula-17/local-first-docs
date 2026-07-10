"use client";

import { Loader2 } from "lucide-react";
import type { ConnState } from "@/hooks/use-collaboration";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  ConnState,
  { label: string; className: string; spin?: boolean; dot?: string; desc: string }
> = {
  offline: {
    label: "Offline",
    className: "text-muted-foreground",
    dot: "bg-muted-foreground/50",
    desc: "You're offline. Keep editing — changes are saved locally and will sync when you reconnect.",
  },
  connecting: {
    label: "Connecting…",
    className: "text-amber-600 dark:text-amber-500",
    spin: true,
    desc: "Connecting to the collaboration server. You can keep editing now — your work is saved locally and syncs automatically once connected.",
  },
  syncing: {
    label: "Syncing…",
    className: "text-blue-600 dark:text-blue-400",
    spin: true,
    desc: "Syncing your document with the server and other collaborators.",
  },
  live: {
    label: "Live",
    className: "text-emerald-600 dark:text-emerald-500",
    dot: "bg-emerald-500",
    desc: "Live — your edits sync in real time with everyone in this document.",
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
      title={c.desc}
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
