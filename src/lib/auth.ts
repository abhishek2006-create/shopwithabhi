import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
export const authConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.NEXTAUTH_SECRET &&
  process.env.AUTH_PRIVATE_JWK &&
  process.env.AUTH_ISSUER &&
  process.env.NEXT_PUBLIC_CONVEX_URL,
);
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt", maxAge: 7 * 86400 },
  providers:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : [],
  pages: { signIn: "/signin", error: "/signin" },
  callbacks: {
    async signIn({ profile }) {
      return Boolean(
        profile &&
        "email_verified" in profile &&
        profile.email_verified === true,
      );
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.sub = account.providerAccountId;
        token.emailVerified =
          "email_verified" in profile && profile.email_verified === true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.emailVerified = token.emailVerified === true;
      }
      return session;
    },
  },
};
