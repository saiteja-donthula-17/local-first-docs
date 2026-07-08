import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@repo/db";
import { requireUser } from "@/lib/session";
import { getAccess } from "@/lib/access";
import { AppHeader } from "@/components/app-header";
import { ConnectionStatus } from "@/components/connection-status";
import { Badge } from "@/components/ui/badge";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next 16: route params are async.
  const { id } = await params;
  const user = await requireUser();

  // Tenant isolation: no access row → 404 (don't leak existence).
  const access = await getAccess(user.id, id);
  if (!access) notFound();

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) notFound();

  return (
    <>
      <AppHeader email={user.email} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <ConnectionStatus />
            <Badge variant="secondary">{access.role}</Badge>
          </div>
        </div>

        <h1 className="text-2xl font-semibold">{document.title}</h1>

        <div className="mt-6 rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
          The collaborative editor arrives in Phase 2 — Tiptap + Yjs with local
          (IndexedDB) persistence, so this document will open and edit fully
          offline.
        </div>
      </main>
    </>
  );
}
