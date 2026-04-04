import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 15;

export async function isLockedOut(email: string): Promise<{ locked: boolean; remainingMinutes: number }> {
  const record = await prisma.loginAttempt.findFirst({ where: { email } });
  if (!record?.lockedUntil || record.lockedUntil <= new Date()) return { locked: false, remainingMinutes: 0 };
  const remaining = Math.ceil((record.lockedUntil.getTime() - Date.now()) / 60000);
  return { locked: true, remainingMinutes: remaining };
}

async function recordFailedAttempt(email: string): Promise<void> {
  const existing = await prisma.loginAttempt.findFirst({ where: { email } });
  const newAttempts = (existing?.attempts ?? 0) + 1;

  await prisma.loginAttempt.upsert({
    where: { email_ip: { email, ip: "global" } },
    create: { email, ip: "global", attempts: 1 },
    update: {
      attempts: { increment: 1 },
      ...(newAttempts >= MAX_ATTEMPTS
        ? { lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60 * 1000) }
        : {}),
    },
  });
}

async function clearAttempts(email: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { email } }).catch(() => {});
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials.email as string)?.toLowerCase().trim();
        const password = credentials.password as string;
        if (!email || !password) return null;

        // Check lockout
        const { locked } = await isLockedOut(email);
        if (locked) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          await recordFailedAttempt(email);
          return null;
        }

        if (user.blocked) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await recordFailedAttempt(email);
          return null;
        }

        await clearAttempts(email);

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.role) token.role = session.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      (session.user as any).role = token.role;
      return session;
    },
  },
});
