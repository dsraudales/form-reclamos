import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import type { AdminRole } from "@prisma/client";
import { authOptions } from "@/lib/auth/options";

const roleRank: Record<AdminRole, number> = {
  AUDITOR: 1,
  REVISOR: 2,
  ADMIN: 3
};

export async function requireSession(minRole: AdminRole = "AUDITOR") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.adminId || roleRank[session.user.role] < roleRank[minRole]) {
    redirect("/admin/login");
  }
  return session;
}

export async function requireApiSession(minRole: AdminRole = "AUDITOR") {
  const session = await getServerSession(authOptions);
  if (!session?.user?.adminId || roleRank[session.user.role] < roleRank[minRole]) {
    return null;
  }
  return session;
}
