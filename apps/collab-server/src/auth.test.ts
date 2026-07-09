import { afterAll, describe, expect, it } from "vitest";
import { SignJWT } from "jose";
import { prisma } from "@repo/db";
import { authorizeConnection } from "./auth";

const DOC = "demo-doc-0001"; // seeded shared document

async function tokenFor(
  userId: string,
  secret = process.env.COLLAB_TOKEN_SECRET!,
): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
}

async function idFor(email: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`Seed missing user ${email} — run \`npm run db:seed\``);
  return user.id;
}

afterAll(async () => {
  await prisma.$disconnect();
});

describe("authorizeConnection (realtime socket auth)", () => {
  it("authorizes an OWNER as writable", async () => {
    const res = await authorizeConnection(await tokenFor(await idFor("alice@demo.dev")), DOC);
    expect(res.role).toBe("OWNER");
    expect(res.readOnly).toBe(false);
  });

  it("authorizes an EDITOR as writable", async () => {
    const res = await authorizeConnection(await tokenFor(await idFor("bob@demo.dev")), DOC);
    expect(res.role).toBe("EDITOR");
    expect(res.readOnly).toBe(false);
  });

  it("authorizes a VIEWER as READ-ONLY (cannot push edits)", async () => {
    const res = await authorizeConnection(await tokenFor(await idFor("carol@demo.dev")), DOC);
    expect(res.role).toBe("VIEWER");
    expect(res.readOnly).toBe(true);
  });

  it("rejects a user with no access to the document (tenant isolation)", async () => {
    const stranger = await prisma.user.upsert({
      where: { email: "stranger@demo.dev" },
      update: {},
      create: { email: "stranger@demo.dev", name: "Stranger", passwordHash: "x" },
    });
    await expect(authorizeConnection(await tokenFor(stranger.id), DOC)).rejects.toThrow(
      /no access/i,
    );
  });

  it("rejects a forged / malformed token", async () => {
    await expect(authorizeConnection("not-a-valid-jwt", DOC)).rejects.toThrow();
  });

  it("rejects a token signed with the wrong secret", async () => {
    const bad = await tokenFor(await idFor("alice@demo.dev"), "the-wrong-secret");
    await expect(authorizeConnection(bad, DOC)).rejects.toThrow();
  });

  it("rejects a missing token", async () => {
    await expect(authorizeConnection("", DOC)).rejects.toThrow(/missing/i);
  });
});
