import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { mintCollabToken } from "@/lib/collab-token";

// Issues a WS-handshake token for the authenticated user. The collab server
// verifies this token and authorizes per-document access on its own.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await mintCollabToken(session.user.id);
  // Don't cache — tokens are short-lived and per-user.
  return NextResponse.json(
    { token },
    { headers: { "Cache-Control": "no-store" } },
  );
}
