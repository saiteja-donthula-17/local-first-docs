"use client";

import { useCallback, useState } from "react";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Collaborator = {
  userId: string;
  email: string;
  name: string | null;
  role: "OWNER" | "EDITOR" | "VIEWER";
};

export function ShareDialog({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/access`);
      if (res.ok) {
        const data = (await res.json()) as { collaborators: Collaborator[] };
        setCollaborators(data.collaborators);
      }
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) void refresh();
  }

  async function onAdd(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      if (res.ok) {
        toast.success("Access updated");
        setEmail("");
        await refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Could not share");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onRemove(userId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/access`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) await refresh();
      else toast.error("Could not remove collaborator");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="gap-1.5" />}
      >
        <UserPlus className="size-4" aria-hidden />
        Share
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>
            Invite people by email and choose their access level.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onAdd} className="flex items-center gap-2">
          <Input
            type="email"
            required
            placeholder="teammate@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Select
            value={role}
            onValueChange={(v) => setRole(v as "EDITOR" | "VIEWER")}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EDITOR">Editor</SelectItem>
              <SelectItem value="VIEWER">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" disabled={busy}>
            Add
          </Button>
        </form>

        <div className="mt-1 space-y-0.5">
          {loading ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : (
            collaborators.map((c) => (
              <div
                key={c.userId}
                className="flex items-center gap-3 rounded-md px-1 py-1.5"
              >
                <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {(c.name ?? c.email).slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {c.name ?? c.email}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {c.email}
                  </p>
                </div>
                <Badge variant="secondary">{c.role}</Badge>
                {c.role !== "OWNER" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    disabled={busy}
                    onClick={() => onRemove(c.userId)}
                    aria-label={`Remove ${c.email}`}
                  >
                    <X className="size-4" aria-hidden />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
