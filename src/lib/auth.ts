import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import bcrypt from "bcrypt";

import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const { email, password } = credentials;
        console.log(email, password);
        const validatedFields = LoginSchema.safeParse({ email, password });

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;
          const currentUser = await getUserByEmail(email);
          if (!currentUser || !currentUser.password) {
            return null;
          }
          const passwordsMatch = await bcrypt.compare(
            password,
            currentUser.password,
          );
          if (passwordsMatch) {
            console.log("returning user");
            return currentUser;
          }
          return null;
        }
        return null;
      },
    }),
  ],
});
