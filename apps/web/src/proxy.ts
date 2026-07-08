import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// Next 16 renamed `middleware` -> `proxy`. This runs the edge-safe auth check
// (see authConfig.callbacks.authorized) on every non-static, non-API route.
const { auth } = NextAuth(authConfig);
export default auth;

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
