import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe auth configuration.
 *
 * This subset is imported by `proxy.ts` (Next 16's renamed middleware), which
 * runs on the edge and must NOT pull in Node-only modules (Prisma, bcrypt).
 * The Credentials provider — which needs both — is added in `auth.ts` instead.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [], // real providers are attached in auth.ts (Node runtime)
  callbacks: {
    // Route protection. `false` triggers a redirect to `pages.signIn`.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isPublic = path.startsWith("/login") || path.startsWith("/register");
      if (isPublic) return true;
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
