"use client";

import { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import {
  EditorToolbar,
  LocalIndicator,
  type LocalSaveState,
} from "./editor-toolbar";

/**
 * Local-first collaborative editor.
 *
 * Phase 2: a Y.Doc bound to Tiptap, persisted to IndexedDB via y-indexeddb.
 * IndexedDB is the source of truth — the editor opens, edits and reloads with
 * ZERO network requests. (The WebSocket sync layer is added in Phase 3.)
 */
export function CollaborativeEditor({
  documentId,
  editable,
}: {
  documentId: string;
  editable: boolean;
}) {
  // One Y.Doc per mounted document; stable for the component's lifetime.
  const [ydoc] = useState(() => new Y.Doc());
  const [localState, setLocalState] = useState<LocalSaveState>("loading");
  const savingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Namespaced per document so each doc has its own IndexedDB store.
    const persistence = new IndexeddbPersistence(`lfd:${documentId}`, ydoc);
    persistence.once("synced", () => setLocalState("saved"));

    const onUpdate = () => {
      setLocalState("saving");
      if (savingTimer.current) clearTimeout(savingTimer.current);
      // y-indexeddb writes synchronously on update; this is just UI feedback.
      savingTimer.current = setTimeout(() => setLocalState("saved"), 400);
    };
    ydoc.on("update", onUpdate);

    return () => {
      ydoc.off("update", onUpdate);
      if (savingTimer.current) clearTimeout(savingTimer.current);
      void persistence.destroy();
    };
  }, [documentId, ydoc]);

  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [
      // Yjs owns history — disable StarterKit's native undo/redo (v3: `undoRedo`).
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: ydoc }),
    ],
    editorProps: {
      attributes: {
        class: "tiptap min-h-[60vh] w-full max-w-none focus:outline-none",
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Document body",
      },
    },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      {editable && editor ? (
        <EditorToolbar editor={editor} localState={localState} />
      ) : (
        <div className="flex items-center justify-between border-b border-border/60 px-3 py-2">
          <span className="text-xs text-muted-foreground">Read-only (Viewer)</span>
          <LocalIndicator state={localState} />
        </div>
      )}

      <div className="px-4 py-4">
        {editor ? (
          <EditorContent editor={editor} />
        ) : (
          <div className="min-h-[60vh] animate-pulse text-sm text-muted-foreground">
            Loading editor…
          </div>
        )}
      </div>
    </div>
  );
}
