import { HttpError } from "wasp/server";
import {
  type AuditLog,
  type Template,
  type Recipient,
  type Contact,
  type User,
} from "wasp/entities";
import { GetAuditLogByTemplateId } from "wasp/server/operations";

export type GetAuditLogByTemplateIdInput = {
  templateId?: string;
};

export type GetAuditLogByTemplateIdOutput = (AuditLog & {
  user: { id: string; email: string };
  recipient: (Recipient & { contact: Contact | null }) | null;
})[];

export const getAuditLogByTemplateId: GetAuditLogByTemplateId<
  GetAuditLogByTemplateIdInput,
  GetAuditLogByTemplateIdOutput
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  if (!context.entities?.AuditLog || !context.entities?.Template) {
    throw new HttpError(500, "Database configuration error");
  }

  const { templateId } = args;

  if (!templateId) {
    throw new HttpError(400, "Template ID is required");
  }

  const template = await context.entities.Template.findFirst({
    where: {
      id: templateId,
      user: { id: context.user.id },
    },
  });

  if (!template) {
    throw new HttpError(
      403,
      "Forbidden: You do not have access to this template"
    );
  }

  try {
    const auditLogs = await context.entities.AuditLog.findMany({
      where: {
        templateId,
      },
      include: {
        user: {
          select: { id: true, email: true },
        },
        recipient: {
          include: {
            contact: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return auditLogs;
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    throw new HttpError(500, "Failed to fetch audit logs");
  }
};
