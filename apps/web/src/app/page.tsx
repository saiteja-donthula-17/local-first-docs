import Link from "next/link";
import { Clock, FileText } from "lucide-react";
import { prisma } from "@repo/db";
import { requireUser } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { CreateDocumentButton } from "@/components/documents/create-document-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await requireUser();

  const accesses = await prisma.documentAccess.findMany({
    where: { userId: user.id },
    include: { document: true },
    orderBy: { document: { updatedAt: "desc" } },
  });

  return (
    <>
      <AppHeader email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Your documents</h1>
            <p className="text-sm text-muted-foreground">
              {accesses.length} document{accesses.length === 1 ? "" : "s"}
            </p>
          </div>
          <CreateDocumentButton />
        </div>

        {accesses.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <FileText className="size-8 text-muted-foreground" aria-hidden />
            <p className="text-muted-foreground">
              No documents yet. Create your first one.
            </p>
            <CreateDocumentButton />
          </Card>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {accesses.map(({ document, role }) => (
              <li key={document.id}>
                <Link href={`/documents/${document.id}`} className="block h-full">
                  <Card className="h-full gap-0 p-4 transition-colors hover:border-primary/50">
                    <div className="flex items-start justify-between gap-2">
                      <FileText className="size-5 text-primary" aria-hidden />
                      <Badge variant="secondary">{role}</Badge>
                    </div>
                    <h2 className="mt-3 line-clamp-2 font-medium">
                      {document.title}
                    </h2>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" aria-hidden />
                      Updated {new Date(document.updatedAt).toLocaleDateString()}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
