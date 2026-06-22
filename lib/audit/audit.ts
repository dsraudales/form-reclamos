import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getIpHash } from "@/lib/security/ip";

export async function audit(action: AuditAction, input: { actorId?: string; targetId?: string; metadata?: Prisma.InputJsonValue }) {
  await prisma.auditLog.create({
    data: {
      action,
      actorId: input.actorId,
      targetId: input.targetId,
      metadata: input.metadata,
      ipHash: await getIpHash()
    }
  });
}
