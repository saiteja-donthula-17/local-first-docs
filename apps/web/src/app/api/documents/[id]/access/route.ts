import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, Role } from "@repo/db";
import { auth } from "@/lib/auth";
import { getAccess } from "@/lib/access";

const shareSchema = z.object({
  email: z.string().email().max(254),
  role: z.enum(["EDITOR", "VIEWER"]),
});
const revokeSchema = z.object({ userId: z.string().min(1) });

/** List everyone with access to the document (any member). */
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

  const rows = await prisma.documentAccess.findMany({
    where: { documentId: id },
    orderBy: { role: "asc" }, // OWNER, EDITOR, VIEWER
    select: {
      role: true,
      user: { select: { id: true, email: true, name: true } },
    },
  });

  return NextResponse.json({
    collaborators: rows.map((r) => ({
      userId: r.user.id,
      email: r.user.email,
      name: r.user.name,
      role: r.role,
    })),
  });
}

/** Grant or update a collaborator's role (Owner only). */
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
  if (!access || access.role !== Role.OWNER) {
    return NextResponse.json({ error: "Only the owner can share" }, { status: 403 });
  }

  const parsed = shareSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json(
      { error: "No account with that email. They need to sign up first." },
      { status: 404 },
    );
  }
  if (target.id === session.user.id) {
    return NextResponse.json(
      { error: "You already own this document." },
      { status: 400 },
    );
  }

  await prisma.documentAccess.upsert({
    where: { documentId_userId: { documentId: id, userId: target.id } },
    update: { role: parsed.data.role },
    create: { documentId: id, userId: target.id, role: parsed.data.role },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}

/** Revoke a collaborator (Owner only; can't remove self). */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const access = await getAccess(session.user.id, id);
  if (!access || access.role !== Role.OWNER) {
    return NextResponse.json({ error: "Only the owner can manage access" }, { status: 403 });
  }

  const parsed = revokeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (parsed.data.userId === session.user.id) {
    return NextResponse.json(
      { error: "You can't remove yourself as owner." },
      { status: 400 },
    );
  }

  await prisma.documentAccess.deleteMany({
    where: { documentId: id, userId: parsed.data.userId, role: { not: Role.OWNER } },
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
