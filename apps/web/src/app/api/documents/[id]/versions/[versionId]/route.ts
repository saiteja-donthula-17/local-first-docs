import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { getAccess } from "@/lib/access";

/** Fetch a single version's Yjs snapshot (base64) for restore/preview. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const { id, versionId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const access = await getAccess(session.user.id, id);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const version = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId: id }, // scoped to the document
    select: { snapshot: true },
  });
  if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    snapshot: Buffer.from(version.snapshot).toString("base64"),
  });
}
