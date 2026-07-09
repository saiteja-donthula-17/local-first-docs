"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { Clock, History, RotateCcw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bytesToBase64, base64ToBytes } from "@/lib/collab-bytes";
import { restoreSnapshotIntoDoc } from "@/lib/yjs-restore";

type VersionMeta = {
  id: string;
  label: string | null;
  isAuto: boolean;
  size: number;
  createdAt: string;
  authorName: string;
};

export function VersionHistory({
  documentId,
  ydoc,
  canEdit,
}: {
  documentId: string;
  ydoc: Y.Doc;
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [explain, setExplain] = useState<{
    label: string;
    text: string;
    loading: boolean;
  } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`);
      if (res.ok) {
        const data = (await res.json()) as { versions: VersionMeta[] };
        setVersions(data.versions);
      }
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) void refresh();
  }

  async function saveVersion(label?: string, isAuto = false) {
    const update = Y.encodeStateAsUpdate(ydoc);
    const res = await fetch(`/api/documents/${documentId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ snapshot: bytesToBase64(update), label, isAuto }),
    });
    return res.ok;
  }

  async function onSave(label?: string) {
    setBusy(true);
    try {
      if (await saveVersion(label)) {
        toast.success("Version saved");
        await refresh();
      } else {
        toast.error("Could not save version");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onRestore(version: VersionMeta) {
    setBusy(true);
    try {
      // Safety net so a restore is itself reversible.
      await saveVersion("Auto-save before restore", true);

      const res = await fetch(
        `/api/documents/${documentId}/versions/${version.id}`,
      );
      if (!res.ok) {
        toast.error("Could not load that version");
        return;
      }
      const { snapshot } = (await res.json()) as { snapshot: string };
      const ok = restoreSnapshotIntoDoc(ydoc, base64ToBytes(snapshot));
      if (ok) {
        toast.success("Restored — synced to all collaborators");
        await refresh();
        setOpen(false);
      } else {
        toast.error("Snapshot could not be applied");
      }
    } finally {
      setBusy(false);
    }
  }

  // ⌘S / Ctrl+S → quick-save an (unlabeled) version. Latest-ref keeps deps stable.
  const saveRef = useRef(onSave);
  saveRef.current = onSave;
  useEffect(() => {
    if (!canEdit) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        void saveRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canEdit]);

  // AI: stream a plain-English explanation of what changed since this version.
  async function onExplain(version: VersionMeta) {
    const label = version.label || (version.isAuto ? "Auto-save" : "Snapshot");
    setExplain({ label, text: "", loading: true });
    try {
      const update = Y.encodeStateAsUpdate(ydoc);
      const res = await fetch(
        `/api/documents/${documentId}/versions/${version.id}/explain`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ current: bytesToBase64(update) }),
        },
      );
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setExplain({
          label,
          text: data.error ?? "Could not generate an explanation.",
          loading: false,
        });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setExplain({ label, text: acc, loading: true });
      }
      setExplain({ label, text: acc, loading: false });
    } catch {
      setExplain({
        label,
        text: "Could not generate an explanation.",
        loading: false,
      });
    }
  }

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger
        render={<Button variant="ghost" size="sm" className="gap-1.5" />}
      >
        <History className="size-4" aria-hidden />
        History
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>
            Restoring applies the snapshot as a new edit — it never overwrites
            other collaborators&apos; live work.
          </SheetDescription>
        </SheetHeader>

        {canEdit && (
          <div className="px-4 pb-3">
            <SaveVersionButton onSave={onSave} busy={busy} />
          </div>
        )}

        <ScrollArea className="flex-1 px-4">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : versions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No versions yet. Save one to start your timeline.
            </p>
          ) : (
            <ul className="space-y-2 py-2">
              {versions.map((v) => (
                <li key={v.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {v.label || (v.isAuto ? "Auto-save" : "Snapshot")}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" aria-hidden />
                        {new Date(v.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {v.authorName} · {(v.size / 1024).toFixed(1)} KB
                        {v.isAuto ? " · auto" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-stretch gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onExplain(v)}
                        className="gap-1.5"
                      >
                        <Sparkles className="size-3.5" aria-hidden />
                        Explain
                      </Button>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={busy}
                          onClick={() => onRestore(v)}
                          className="gap-1.5"
                        >
                          <RotateCcw className="size-3.5" aria-hidden />
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          Snapshots store a compacted, garbage-collected Yjs state. The live doc
          uses CRDT GC to keep growth bounded over time.
        </div>
      </SheetContent>
    </Sheet>

      <Dialog open={!!explain} onOpenChange={(o) => !o && setExplain(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" aria-hidden />
              What changed
            </DialogTitle>
            <DialogDescription>
              Since “{explain?.label}” → now, explained by AI.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] min-h-24 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm leading-relaxed">
            {explain?.text}
            {explain?.loading && (
              <span className="ml-0.5 inline-block animate-pulse">▍</span>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SaveVersionButton({
  onSave,
  busy,
}: {
  onSave: (label?: string) => Promise<void>;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="w-full gap-1.5" />}>
        <Save className="size-4" aria-hidden />
        Save current version
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save version</DialogTitle>
          <DialogDescription>
            Capture a snapshot of the current document. Add an optional label.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="e.g. First draft"
          value={label}
          maxLength={120}
          onChange={(e) => setLabel(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              await onSave(label.trim() || undefined);
              setLabel("");
              setOpen(false);
            }}
          >
            {busy ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
