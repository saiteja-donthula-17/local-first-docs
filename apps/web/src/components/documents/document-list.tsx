"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock, FileText, Search, Users } from "lucide-react";
import { DeleteDocumentButton } from "./delete-document-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { relativeTime } from "@/lib/relative-time";

type DocItem = {
  id: string;
  title: string;
  role: "OWNER" | "EDITOR" | "VIEWER";
  updatedAt: string;
  collaborators: number;
};

export function DocumentList({ docs }: { docs: DocItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? docs.filter((d) => d.title.toLowerCase().includes(q)) : docs;
  }, [query, docs]);

  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents…"
          className="pl-9"
          aria-label="Search documents"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No documents match “{query}”.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <li key={d.id}>
              <Link href={`/documents/${d.id}`} className="block h-full">
                <Card className="h-full gap-0 p-4 transition-colors hover:border-primary/50">
                  <div className="flex items-start justify-between gap-2">
                    <FileText className="size-5 text-primary" aria-hidden />
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary">{d.role}</Badge>
                      {d.role === "OWNER" && (
                        <DeleteDocumentButton documentId={d.id} title={d.title} />
                      )}
                    </div>
                  </div>
                  <h2 className="mt-3 line-clamp-2 font-medium">{d.title}</h2>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span
                      className="inline-flex items-center gap-1"
                      suppressHydrationWarning
                    >
                      <Clock className="size-3" aria-hidden />
                      {relativeTime(d.updatedAt)}
                    </span>
                    {d.collaborators > 1 && (
                      <span
                        className="inline-flex items-center gap-1"
                        title={`${d.collaborators} people have access`}
                      >
                        <Users className="size-3" aria-hidden />
                        {d.collaborators}
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
