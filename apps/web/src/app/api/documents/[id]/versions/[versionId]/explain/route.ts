import { NextResponse } from "next/server";
import { streamText } from "ai";
import { groq } from "@ai-sdk/groq";
import { z } from "zod";
import { prisma } from "@repo/db";
import { auth } from "@/lib/auth";
import { getAccess } from "@/lib/access";
import { snapshotToText } from "@/lib/yjs-text";

const MAX_B64 = 8 * 1024 * 1024;
const MAX_CHARS = 6000; // keep prompt bounded (tokens + cost)
const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

const bodySchema = z.object({ current: z.string().min(1).max(MAX_B64) });

/**
 * AI feature: explain, in plain English, what changed between a saved version
 * and the current document. Streams the response. Any member may use it.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const { id, versionId } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const access = await getAccess(session.user.id, id);
  if (!access) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "AI isn't configured. Add GROQ_API_KEY to enable this feature." },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const version = await prisma.documentVersion.findFirst({
    where: { id: versionId, documentId: id },
    select: { snapshot: true, label: true },
  });
  if (!version) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const olderText = snapshotToText(new Uint8Array(version.snapshot)).slice(
    0,
    MAX_CHARS,
  );
  const currentText = snapshotToText(
    Buffer.from(parsed.data.current, "base64"),
  ).slice(0, MAX_CHARS);

  const result = streamText({
    model: groq(MODEL),
    system:
      "You compare two versions of a document for a non-technical reader. " +
      "Explain WHAT changed in content and meaning — added, removed, reworded, " +
      "or restructured — as a few short bullet points. Be concise and specific. " +
      "If the two are effectively identical, say so in one line.",
    prompt:
      `OLDER version${version.label ? ` ("${version.label}")` : ""}:\n"""\n${olderText || "(empty)"}\n"""\n\n` +
      `CURRENT version:\n"""\n${currentText || "(empty)"}\n"""\n\n` +
      `Explain what changed from the older version to the current one.`,
  });

  return result.toTextStreamResponse();
}
