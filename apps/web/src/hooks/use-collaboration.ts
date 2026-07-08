"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
import type { LocalSaveState } from "@/components/editor/editor-toolbar";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:1234";

/** Derived network state shown to the user. */
export type ConnState = "offline" | "connecting" | "syncing" | "live";

export type Collab = { ydoc: Y.Doc; provider: HocuspocusProvider };

/**
 * Wires one document's Y.Doc to BOTH:
 *  - IndexedDB (local-first source of truth; always works offline), and
 *  - the Hocuspocus WebSocket provider (real-time sync + server persistence).
 *
 * Everything is created inside the effect so React StrictMode's double-mount
 * cleanly tears down (destroy) and recreates the socket — no leaked connections.
 * `collab` is null until ready; the editor renders only once it exists.
 */
export function useCollaboration(documentId: string) {
  const [collab, setCollab] = useState<Collab | null>(null);
  const [localState, setLocalState] = useState<LocalSaveState>("loading");
  const [status, setStatus] = useState<WebSocketStatus>(
    WebSocketStatus.Connecting,
  );
  const [remoteSynced, setRemoteSynced] = useState(false);
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const ydoc = new Y.Doc();
    const persistence = new IndexeddbPersistence(`lfd:${documentId}`, ydoc);
    persistence.once("synced", () => setLocalState("saved"));

    // Any doc change (local typing or a remote update) is written to IndexedDB.
    let savingTimer: ReturnType<typeof setTimeout> | null = null;
    const onUpdate = () => {
      setLocalState("saving");
      if (savingTimer) clearTimeout(savingTimer);
      savingTimer = setTimeout(() => setLocalState("saved"), 400);
    };
    ydoc.on("update", onUpdate);

    const provider = new HocuspocusProvider({
      url: WS_URL,
      name: documentId,
      document: ydoc,
      onStatus: ({ status }) => setStatus(status),
      onSynced: () => setRemoteSynced(true),
      onDisconnect: () => setRemoteSynced(false),
    });

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // The Y.Doc + WebSocket provider are external resources that can only be
    // created here (not during render), and StrictMode-safe teardown requires
    // the effect. Exposing the handle via state is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollab({ ydoc, provider });

    return () => {
      ydoc.off("update", onUpdate);
      if (savingTimer) clearTimeout(savingTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      provider.destroy();
      void persistence.destroy();
      ydoc.destroy();
      setCollab(null);
    };
  }, [documentId]);

  const conn: ConnState = !online
    ? "offline"
    : status === WebSocketStatus.Connected
      ? remoteSynced
        ? "live"
        : "syncing"
      : "connecting";

  return { collab, localState, conn };
}
