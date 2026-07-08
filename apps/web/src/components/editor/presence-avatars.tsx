"use client";

import { useEffect, useState } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";

type PresenceUser = { clientId: number; name: string; color: string };

/**
 * Renders avatars for OTHER collaborators currently in the document, read from
 * the Yjs awareness protocol (populated by CollaborationCaret's `user` field).
 */
export function PresenceAvatars({ provider }: { provider: HocuspocusProvider }) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    const awareness = provider.awareness;
    if (!awareness) return;

    const update = () => {
      const list: PresenceUser[] = [];
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return; // skip self
        const user = (state as { user?: { name?: string; color?: string } }).user;
        if (user?.name) {
          list.push({ clientId, name: user.name, color: user.color ?? "#888888" });
        }
      });
      setUsers(list);
    };

    update();
    awareness.on("change", update);
    return () => awareness.off("change", update);
  }, [provider]);

  if (users.length === 0) return null;

  return (
    <div className="flex items-center" aria-label={`${users.length} other collaborator(s) online`}>
      <div className="flex -space-x-2">
        {users.slice(0, 5).map((u) => (
          <span
            key={u.clientId}
            title={u.name}
            className="inline-flex size-6 items-center justify-center rounded-full border-2 border-card text-[10px] font-semibold text-white"
            style={{ backgroundColor: u.color }}
          >
            {u.name.slice(0, 1).toUpperCase()}
          </span>
        ))}
      </div>
      {users.length > 5 && (
        <span className="pl-2 text-xs text-muted-foreground">
          +{users.length - 5}
        </span>
      )}
    </div>
  );
}
