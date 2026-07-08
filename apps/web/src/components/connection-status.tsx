"use client";

import { Badge } from "@/components/ui/badge";

/**
 * Placeholder connection indicator. The real online / offline / syncing state
 * machine (driven by the Yjs provider + local outbox) arrives with the sync
 * engine in Phase 3–5.
 */
export function ConnectionStatus() {
  return (
    <Badge variant="outline" className="gap-1.5">
      <span className="size-2 rounded-full bg-muted-foreground/40" aria-hidden />
      Offline-ready
    </Badge>
  );
}
