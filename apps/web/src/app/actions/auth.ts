"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";

/** Server Action used by the login form via useActionState. */
export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    // signIn throws a NEXT_REDIRECT on success — re-throw anything that isn't an auth failure.
    if (error instanceof AuthError) {
      return "Invalid email or password.";
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
