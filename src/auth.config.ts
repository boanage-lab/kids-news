import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

// Edge-compatible config (no Prisma / Node APIs).
// Used by proxy.ts and as the base for full auth.ts.
const providers: NextAuthConfig["providers"] = [
  Credentials({
    // auth logic runs only from src/auth.ts (Node). In edge, we just declare shape.
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async () => null,
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    })
  );
}

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "USER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string | undefined) ?? "USER";
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const role: string = auth?.user?.role ?? "USER";

      if (pathname.startsWith("/admin")) {
        return isLoggedIn && role === "ADMIN";
      }
      if (pathname.startsWith("/bookmarks")) {
        return isLoggedIn;
      }
      return true;
    },
  },
};
