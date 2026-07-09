import { jwtVerify } from "jose";
import { prisma, Role } from "@repo/db";

export type Authorization = {
  userId: string;
  role: Role;
  /** Viewers connect read-only — the server drops any document updates they send. */
  readOnly: boolean;
};

/**
 * The single security choke point for the realtime server.
 *
 * 1. Verifies the HMAC handshake token (rejects forged/expired tokens).
 * 2. Resolves the user's role from DocumentAccess — the DB, never the token.
 *    No access row → throw → connection refused (tenant isolation on the socket).
 * 3. Viewers are authorized but read-only, so a hacked client cannot push edits.
 */
export async function authorizeConnection(
  token: string,
  documentName: string,
): Promise<Authorization> {
  if (!token) throw new Error("Missing authentication token");

  const secretValue = process.env.COLLAB_TOKEN_SECRET;
  if (!secretValue) throw new Error("COLLAB_TOKEN_SECRET is not set");
  const secret = new TextEncoder().encode(secretValue);

  const { payload } = await jwtVerify(token, secret);
  const userId = payload.sub;
  if (!userId) throw new Error("Invalid token: missing subject");

  const access = await prisma.documentAccess.findUnique({
    where: { documentId_userId: { documentId: documentName, userId } },
  });
  if (!access) throw new Error("Forbidden: no access to this document");

  return {
    userId,
    role: access.role,
    readOnly: access.role === Role.VIEWER,
  };
}
