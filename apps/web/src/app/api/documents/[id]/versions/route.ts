import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { canEdit, getAccess } from "@/lib/access";

// Cap the incoming snapshot so a malicious client can't OOM the server with a
// giant payload (base64; ~8MB decodes to ~6MB of binary).
const MAX_SNAPSHOT_B64 = 8 * 1024 * 1024;

const createSchema = z.object({
  snapshot: z.string().min(1).max(MAX_SNAPSHOT_B64),
  label: z.string().trim().max(120).optional(),
  isAuto: z.boolean().optional().default(false),
});

/** List a document's version timeline (any member). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const access = await getAccess(session.user.id, id);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const versions = await prisma.documentVersion.findMany({
    where: { documentId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      label: true,
      isAuto: true,
      size: true,
      createdAt: true,
      author: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json({
    versions: versions.map((v) => ({
      id: v.id,
      label: v.label,
      isAuto: v.isAuto,
      size: v.size,
      createdAt: v.createdAt,
      authorName: v.author.name ?? v.author.email,
    })),
  });
}

/** Capture a new snapshot (EDITOR+). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const access = await getAccess(session.user.id, id);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canEdit(access.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid snapshot" }, { status: 400 });
  }

  const snapshot = Buffer.from(parsed.data.snapshot, "base64");
  if (snapshot.length === 0) {
    return NextResponse.json({ error: "Empty snapshot" }, { status: 400 });
  }

  const version = await prisma.documentVersion.create({
    data: {
      documentId: id,
      snapshot,
      label: parsed.data.label || null,
      isAuto: parsed.data.isAuto,
      size: snapshot.length,
      authorId: session.user.id,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: version.id }, { status: 201 });
}
