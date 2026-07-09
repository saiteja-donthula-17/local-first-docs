import { SignJWT } from "jose";

/**
 * Mints a short-lived, HMAC-signed token used ONLY for the collab-server
 * WebSocket handshake. It carries the user id; the server independently looks
 * up that user's DocumentAccess for the requested document (never trusts a
 * client-claimed role). Signed with COLLAB_TOKEN_SECRET, shared with the server.
 */
export async function mintCollabToken(userId: string): Promise<string> {
  const secretValue = process.env.COLLAB_TOKEN_SECRET;
  if (!secretValue) throw new Error("COLLAB_TOKEN_SECRET is not set");
  const secret = new TextEncoder().encode(secretValue);

  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}
