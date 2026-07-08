import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@repo/db";

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(6).max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { email, name, passwordHash } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
