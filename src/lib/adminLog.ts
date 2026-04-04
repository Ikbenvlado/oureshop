import { prisma } from "./prisma";

export async function logAdminAction(
  userId: string,
  email: string,
  action: string,
  entity: string,
  entityId?: string | number | null,
  detail?: string
) {
  try {
    await prisma.adminLog.create({
      data: {
        userId,
        email,
        action,
        entity,
        entityId: entityId != null ? String(entityId) : null,
        detail: detail ?? null,
      },
    });
  } catch {
    // logging must never break the main flow
  }
}
