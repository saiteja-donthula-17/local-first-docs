"use client";

import { useEffect } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import type * as Y from "yjs";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { EditorToolbar, LocalIndicator } from "./editor-toolbar";
import { ConnectionBadge } from "./connection-badge";
import { PresenceAvatars } from "./presence-avatars";
import {
  useCollaboration,
  type ConnState,
} from "@/hooks/use-collaboration";
import type { LocalSaveState } from "./editor-toolbar";
import { colorFor } from "@/lib/user-color";

type EditorProps = {
  documentId: string;
  editable: boolean;
  userId: string;
  userName: string;
};

/**
 * Local-first + real-time collaborative editor.
 *
 * A single Y.Doc (a CRDT) is synced through IndexedDB (offline source of truth)
 * and Hocuspocus (live convergence + presence). Concurrent/offline edits merge
 * deterministically, so no collaborator's work is ever overwritten.
 */
export function CollaborativeEditor(props: EditorProps) {
  const { collab, localState, conn } = useCollaboration(props.documentId);

  if (!collab) {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card px-4 py-4">
        <div className="min-h-[60vh] animate-pulse text-sm text-muted-foreground">
          Connecting…
        </div>
      </div>
    );
  }

  return (
    <BoundEditor
      {...props}
      ydoc={collab.ydoc}
      provider={collab.provider}
      localState={localState}
      conn={conn}
    />
  );
}

function BoundEditor({
  ydoc,
  provider,
  editable,
  userId,
  userName,
  localState,
  conn,
}: EditorProps & {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  localState: LocalSaveState;
  conn: ConnState;
}) {
  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [
      // Yjs owns history — disable StarterKit's native undo/redo (v3: `undoRedo`).
      StarterKit.configure({ undoRedo: false }),
      Collaboration.configure({ document: ydoc }),
      CollaborationCaret.configure({
        provider,
        user: { name: userName, color: colorFor(userId) },
      }),
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
      <div className="flex items-center gap-3 border-b border-border/60 px-3 py-1.5">
        <PresenceAvatars provider={provider} />
        {!editable && (
          <span className="text-xs text-muted-foreground">
            Read-only (Viewer)
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          <ConnectionBadge state={conn} />
          <span className="h-4 w-px bg-border" aria-hidden />
          <LocalIndicator state={localState} />
        </div>
      </div>

      {editable && editor && <EditorToolbar editor={editor} />}

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
