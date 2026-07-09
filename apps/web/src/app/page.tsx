import { FileText } from "lucide-react";
import { prisma } from "@repo/db";
import { requireUser } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { CreateDocumentButton } from "@/components/documents/create-document-button";
import { DocumentList } from "@/components/documents/document-list";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();

  const accesses = await prisma.documentAccess.findMany({
    where: { userId: user.id },
    include: {
      document: { include: { _count: { select: { access: true } } } },
    },
    orderBy: { document: { updatedAt: "desc" } },
  });

  const docs = accesses.map(({ document, role }) => ({
    id: document.id,
    title: document.title,
    role: role as "OWNER" | "EDITOR" | "VIEWER",
    updatedAt: document.updatedAt.toISOString(),
    collaborators: document._count.access,
  }));

  return (
    <>
      <AppHeader email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Your documents</h1>
            <p className="text-sm text-muted-foreground">
              {docs.length} document{docs.length === 1 ? "" : "s"}
            </p>
          </div>
          <CreateDocumentButton />
        </div>

        {docs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <div className="rounded-full bg-primary/10 p-3">
              <FileText className="size-7 text-primary" aria-hidden />
            </div>
            <div>
              <h2 className="font-medium">Create your first document</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                It opens instantly, works offline, syncs in real time, and keeps
                a full version history.
              </p>
            </div>
            <CreateDocumentButton />
          </Card>
        ) : (
          <DocumentList docs={docs} />
        )}
      </main>
    </>
  );
}
