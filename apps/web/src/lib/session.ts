import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Require an authenticated user in a Server Component / Server Action.
 * Redirects to /login when there is no session.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}
