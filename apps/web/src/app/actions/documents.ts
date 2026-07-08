"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma, Role } from "@repo/db";
import { requireUser } from "@/lib/session";
import { assertAccess } from "@/lib/access";

/** Create a new document; the creator becomes its OWNER. */
export async function createDocument(formData: FormData) {
  const user = await requireUser();
  const raw = (formData.get("title") as string | null)?.trim();
  const title = raw && raw.length > 0 ? raw.slice(0, 200) : "Untitled";

  const doc = await prisma.document.create({
    data: {
      title,
      access: { create: { userId: user.id, role: Role.OWNER } },
    },
  });

  redirect(`/documents/${doc.id}`);
}

/** Rename a document (EDITOR+). */
export async function renameDocument(formData: FormData) {
  const user = await requireUser();
  const documentId = String(formData.get("documentId"));
  const title = String(formData.get("title") ?? "").trim().slice(0, 200) || "Untitled";

  await assertAccess(user.id, documentId, Role.EDITOR);
  await prisma.document.update({ where: { id: documentId }, data: { title } });

  revalidatePath(`/documents/${documentId}`);
  revalidatePath("/");
}

/** Delete a document (OWNER only). */
export async function deleteDocument(formData: FormData) {
  const user = await requireUser();
  const documentId = String(formData.get("documentId"));

  await assertAccess(user.id, documentId, Role.OWNER);
  await prisma.document.delete({ where: { id: documentId } });

  revalidatePath("/");
}
