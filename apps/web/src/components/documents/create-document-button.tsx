"use client";

import { Plus } from "lucide-react";
import { useFormStatus } from "react-dom";
import { createDocument } from "@/app/actions/documents";
import { Button } from "@/components/ui/button";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      <Plus className="size-4" aria-hidden />
      {pending ? "Creating…" : "New document"}
    </Button>
  );
}

export function CreateDocumentButton() {
  return (
    <form action={createDocument}>
      <Submit />
    </form>
  );
}
