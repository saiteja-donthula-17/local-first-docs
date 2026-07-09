"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteDocument } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";

export function DeleteDocumentButton({
  documentId,
  title,
}: {
  documentId: string;
  title: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-7 text-muted-foreground hover:text-destructive"
      aria-label={`Delete ${title}`}
      disabled={pending}
      onClick={(e) => {
        // The card is a Link — don't navigate when deleting.
        e.preventDefault();
        e.stopPropagation();
        if (!window.confirm(`Delete “${title}”? This can't be undone.`)) return;
        const fd = new FormData();
        fd.set("documentId", documentId);
        startTransition(async () => {
          await deleteDocument(fd);
          toast.success("Document deleted");
        });
      }}
    >
      <Trash2 className="size-4" aria-hidden />
    </Button>
  );
}
