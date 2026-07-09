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
 * Creation is deferred one macrotask so React StrictMode's immediate dev
 * double-mount tears down BEFORE any socket opens — no churned connections.
 * `collab` stays null until ready; the editor renders only once it exists.
 */
export function useCollaboration(documentId: string) {
  const [collab, setCollab] = useState<Collab | null>(null);
  const [localState, setLocalState] = useState<LocalSaveState>("loading");
  const [status, setStatus] = useState<WebSocketStatus>(
    WebSocketStatus.Connecting,
  );
  const [remoteSynced, setRemoteSynced] = useState(false);
  const [pending, setPending] = useState(0);
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    let disposed = false;
    let ydoc: Y.Doc | null = null;
    let persistence: IndexeddbPersistence | null = null;
    let provider: HocuspocusProvider | null = null;
    let savingTimer: ReturnType<typeof setTimeout> | null = null;

    const start = setTimeout(() => {
      if (disposed) return;

      const doc = new Y.Doc();
      ydoc = doc;

      persistence = new IndexeddbPersistence(`lfd:${documentId}`, doc);
      persistence.once("synced", () => setLocalState("saved"));

      // Any doc change (local typing or a remote update) is written to IndexedDB.
      const onUpdate = () => {
        setLocalState("saving");
        if (savingTimer) clearTimeout(savingTimer);
        savingTimer = setTimeout(() => setLocalState("saved"), 400);
      };
      doc.on("update", onUpdate);

      provider = new HocuspocusProvider({
        url: WS_URL,
        name: documentId,
        document: doc,
        // Fetch a fresh handshake token (uses the session cookie) on every
        // (re)connect. The server verifies it and enforces the user's role.
        token: async () => {
          const res = await fetch("/api/collab-token");
          if (!res.ok) return "";
          const data = (await res.json()) as { token: string };
          return data.token;
        },
        onStatus: ({ status }) => setStatus(status),
        onSynced: () => setRemoteSynced(true),
        onDisconnect: () => setRemoteSynced(false),
        // Local edits not yet acknowledged by the server — the visible sync queue.
        onUnsyncedChanges: ({ number }) => setPending(number),
      });

      setCollab({ ydoc: doc, provider });
    }, 0);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      disposed = true;
      clearTimeout(start);
      if (savingTimer) clearTimeout(savingTimer);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      provider?.destroy();
      void persistence?.destroy();
      ydoc?.destroy();
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

  return { collab, localState, conn, pending };
}
