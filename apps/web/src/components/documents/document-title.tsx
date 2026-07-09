"use client";

import { useRef, useState } from "react";
import { renameDocument } from "@/app/actions/documents";

export function DocumentTitle({
  documentId,
  initialTitle,
  canEdit,
}: {
  documentId: string;
  initialTitle: string;
  canEdit: boolean;
}) {
  const [title, setTitle] = useState(initialTitle);
  const lastSaved = useRef(initialTitle);

  if (!canEdit) {
    return <h1 className="mb-4 text-2xl font-semibold">{title}</h1>;
  }

  async function save() {
    const trimmed = title.trim() || "Untitled";
    setTitle(trimmed);
    if (trimmed === lastSaved.current) return;
    lastSaved.current = trimmed;
    const fd = new FormData();
    fd.set("documentId", documentId);
    fd.set("title", trimmed);
    await renameDocument(fd);
  }

  return (
    <input
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      aria-label="Document title"
      maxLength={200}
      className="mb-4 w-full rounded-md bg-transparent text-2xl font-semibold outline-none hover:bg-muted/40 focus:bg-muted/40"
    />
  );
}
