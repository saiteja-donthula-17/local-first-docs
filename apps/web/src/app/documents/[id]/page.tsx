import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma, Role } from "@repo/db";
import { requireUser } from "@/lib/session";
import { canEdit, getAccess } from "@/lib/access";
import { AppHeader } from "@/components/app-header";
import { DocumentEditor } from "@/components/editor/document-editor";
import { DocumentTitle } from "@/components/documents/document-title";
import { ShareDialog } from "@/components/documents/share-dialog";
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
            {access.role === Role.OWNER && <ShareDialog documentId={document.id} />}
            <Badge variant="secondary">{access.role}</Badge>
          </div>
        </div>

        <DocumentTitle
          documentId={document.id}
          initialTitle={document.title}
          canEdit={canEdit(access.role)}
        />

        <DocumentEditor
          documentId={document.id}
          editable={canEdit(access.role)}
          userId={user.id}
          userName={user.name ?? user.email ?? "Anonymous"}
        />
      </main>
    </>
  );
}
