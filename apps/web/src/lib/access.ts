import { prisma, Role } from "@repo/db";

/** Role hierarchy: OWNER ⊇ EDITOR ⊇ VIEWER. */
const ROLE_RANK: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

export function roleAtLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** Can this role push document (Yjs) state updates? Viewers cannot. */
export function canEdit(role: Role): boolean {
  return roleAtLeast(role, Role.EDITOR);
}

export class AccessError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AccessError";
  }
}

/**
 * Resolve the requesting user's access row for a document.
 * Access is ALWAYS derived from the DocumentAccess table — never from a
 * client-supplied role/ownership claim. Returns null if the user has no access.
 */
export function getAccess(userId: string, documentId: string) {
  return prisma.documentAccess.findUnique({
    where: { documentId_userId: { documentId, userId } },
  });
}

/**
 * Assert the user has at least `min` role on the document, or throw AccessError.
 * This is the single tenant-isolation choke point used by every mutation.
 */
export async function assertAccess(
  userId: string,
  documentId: string,
  min: Role = Role.VIEWER,
) {
  const access = await getAccess(userId, documentId);
  if (!access || !roleAtLeast(access.role, min)) {
    throw new AccessError();
  }
  return access;
}
