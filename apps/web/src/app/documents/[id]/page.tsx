import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@repo/db";
import { requireUser } from "@/lib/session";
import { canEdit, getAccess } from "@/lib/access";
import { AppHeader } from "@/components/app-header";
import { DocumentEditor } from "@/components/editor/document-editor";
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
          <Badge variant="secondary">{access.role}</Badge>
        </div>

        <h1 className="mb-4 text-2xl font-semibold">{document.title}</h1>

        <DocumentEditor
          documentId={document.id}
          editable={canEdit(access.role)}
        />
      </main>
    </>
  );
}
