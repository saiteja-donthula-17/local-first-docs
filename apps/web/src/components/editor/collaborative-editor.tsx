"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import type * as Y from "yjs";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { EditorToolbar, LocalIndicator, WordCount } from "./editor-toolbar";
import { ConnectionBadge } from "./connection-badge";
import { PresenceAvatars } from "./presence-avatars";
import { VersionHistory } from "./version-history";
import { ExportMenu } from "./export-menu";
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
  title: string;
};

/**
 * Local-first + real-time collaborative editor.
 *
 * A single Y.Doc (a CRDT) is synced through IndexedDB (offline source of truth)
 * and Hocuspocus (live convergence + presence). Concurrent/offline edits merge
 * deterministically, so no collaborator's work is ever overwritten.
 */
export function CollaborativeEditor(props: EditorProps) {
  const { collab, localState, conn, pending } = useCollaboration(
    props.documentId,
  );

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
      pending={pending}
    />
  );
}

function BoundEditor({
  documentId,
  ydoc,
  provider,
  editable,
  userId,
  userName,
  title,
  localState,
  conn,
  pending,
}: EditorProps & {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  localState: LocalSaveState;
  conn: ConnState;
  pending: number;
}) {
  const editor = useEditor({
    editable,
    immediatelyRender: false,
    extensions: [
      // Yjs owns history — disable StarterKit's native undo/redo (v3: `undoRedo`).
      StarterKit.configure({ undoRedo: false }),
      Placeholder.configure({ placeholder: "Start writing…" }),
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

  // Toast only on real offline↔online transitions (not the initial connect).
  const prevConn = useRef(conn);
  useEffect(() => {
    const prev = prevConn.current;
    prevConn.current = conn;
    if (prev === conn) return;
    if (conn === "offline") {
      toast.warning("You're offline — changes are saved locally");
    } else if (prev === "offline" && conn === "live") {
      toast.success("Back online — synced");
    }
  }, [conn]);

  // If connecting drags on (e.g. a sleeping free-tier server waking up), reassure
  // the user once that editing already works and will sync automatically.
  const slowInfoShown = useRef(false);
  useEffect(() => {
    if (conn === "live" || conn === "offline") return;
    const timer = setTimeout(() => {
      if (!slowInfoShown.current) {
        slowInfoShown.current = true;
        toast.info(
          "Connecting to the collaboration server… You can keep editing now — your work is saved locally and will sync automatically.",
          { duration: 7000 },
        );
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [conn]);

  return (
    <div className="editor-shell overflow-hidden rounded-lg border border-border bg-card">
      <div className="editor-chrome flex items-center gap-1 border-b border-border/60 px-2 py-1.5">
        <PresenceAvatars provider={provider} />
        <VersionHistory documentId={documentId} ydoc={ydoc} canEdit={editable} />
        {editor && <ExportMenu editor={editor} title={title} />}
        {!editable && (
          <span className="pl-1 text-xs text-muted-foreground">
            Read-only (Viewer)
          </span>
        )}
        <div className="ml-auto flex items-center gap-3">
          {editor && <WordCount editor={editor} />}
          {pending > 0 && (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-500"
              title={`${pending} local change(s) queued — will sync when connected`}
            >
              <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
              {pending} pending
            </span>
          )}
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
