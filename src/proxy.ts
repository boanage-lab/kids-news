// Next.js 16: the middleware convention was renamed to `proxy`.
// This file replaces what used to be `middleware.ts`.
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  // Run on everything except static files, _next, and favicon
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
