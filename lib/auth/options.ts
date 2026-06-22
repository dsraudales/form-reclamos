import argon2 from "argon2";
import type { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";
import { audit } from "@/lib/audit/audit";
import { prisma } from "@/lib/db/prisma";
import { env } from "@/lib/env";
import { getIpHash } from "@/lib/security/ip";
import { rateLimit } from "@/lib/security/rate-limit";

const credentialsSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(200)
});

const providers: NextAuthOptions["providers"] = [];

if (env.microsoft.clientId && env.microsoft.clientSecret && env.microsoft.tenantId) {
  providers.push(
    AzureADProvider({
      clientId: env.microsoft.clientId,
      clientSecret: env.microsoft.clientSecret,
      tenantId: env.microsoft.tenantId,
      authorization: { params: { scope: "openid profile email User.Read" } }
    })
  );
}

if (env.localLoginEnabled) {
  providers.push(
    CredentialsProvider({
      name: "Login local temporal",
      credentials: {
        email: { label: "Correo institucional", type: "email" },
        password: { label: "Contraseña", type: "password" }
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const ipHash = await getIpHash();
        const limited = await rateLimit(`login:${ipHash}:${parsed.data.email.toLowerCase()}`, env.localLoginRateLimit, 15 * 60);
        if (!limited.allowed) {
          return null;
        }

        const admin = await prisma.adminUser.findUnique({
          where: { email: parsed.data.email.toLowerCase() }
        });

        if (!admin?.active || !admin.passwordHash) {
          return null;
        }

        const valid = await argon2.verify(admin.passwordHash, parsed.data.password);
        if (!valid) {
          return null;
        }

        await prisma.adminUser.update({
          where: { id: admin.id },
          data: { lastLoginAt: new Date() }
        });
        await audit("LOGIN", { actorId: admin.id });

        return {
          id: admin.id,
          adminId: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        };
      }
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  secret: env.nextAuthSecret,
  pages: {
    signIn: "/admin/login",
    error: "/admin/login"
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "azure-ad") {
        return true;
      }

      const email = user.email?.toLowerCase();
      if (!email) {
        return false;
      }

      const entraObjectId = typeof profile?.sub === "string" ? profile.sub : undefined;
      const admin = await prisma.adminUser.findUnique({ where: { email } });
      if (!admin?.active) {
        return false;
      }

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          entraObjectId: admin.entraObjectId ?? entraObjectId,
          lastLoginAt: new Date()
        }
      });
      await audit("LOGIN", { actorId: admin.id });
      user.adminId = admin.id;
      user.role = admin.role;
      return true;
    },
    async jwt({ token, user }) {
      if (user?.adminId && user.role) {
        token.adminId = user.adminId;
        token.role = user.role;
      }

      if (!token.adminId && token.email) {
        const admin = await prisma.adminUser.findUnique({
          where: { email: token.email.toLowerCase() }
        });
        if (admin?.active) {
          token.adminId = admin.id;
          token.role = admin.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.adminId && token.role) {
        session.user.adminId = token.adminId;
        session.user.role = token.role;
      }
      return session;
    }
  }
};
