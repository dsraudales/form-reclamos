import type { AdminRole } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      adminId: string;
      role: AdminRole;
    };
  }

  interface User {
    adminId?: string;
    role?: AdminRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    adminId?: string;
    role?: AdminRole;
  }
}
