import { NextAuthConfig, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";

interface CustomUser extends User {
  role?: string;
}

interface CustomSession extends Session {
  user: CustomUser;
}

interface CustomToken extends JWT {
  role?: string;
}

export default {
  trustHost: true,
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      const customUser = user as CustomUser;
      if (user?.id) {
        token.sub = customUser.id;
        token.role = customUser.role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      const customSession = session as CustomSession;
      const customToken = token as CustomToken;
      if (token?.sub && token?.role) {
        customSession.user = (customSession.user || {}) as CustomUser;
        customSession.user.id = customToken.sub;
        customSession.user.role = customToken.role;
      }
      return customSession;
    },
  },
} satisfies NextAuthConfig;
