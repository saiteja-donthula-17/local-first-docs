"use client";

import dynamic from "next/dynamic";

// The editor touches browser-only APIs (IndexedDB) — load it client-side only.
const CollaborativeEditor = dynamic(
  () => import("./collaborative-editor").then((m) => m.CollaborativeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="overflow-hidden rounded-lg border border-border bg-card px-4 py-4">
        <div className="min-h-[60vh] animate-pulse text-sm text-muted-foreground">
          Loading editor…
        </div>
      </div>
    ),
  },
);

export function DocumentEditor(props: {
  documentId: string;
  editable: boolean;
  userId: string;
  userName: string;
  title: string;
}) {
  return <CollaborativeEditor {...props} />;
}
