import { HttpError } from "wasp/server";
import { type CreateAuditLog } from "wasp/server/operations";
import { AuditLogActionType, AuditLogTag } from "./auditTypes";

type CreateAuditLogInput = {
  actionType: AuditLogActionType;
  actionDescription?: string;
  templateId?: string;
  recipientId?: string;
  tag?: AuditLogTag;
  ipAddress?: string;
};

type CreateAuditLogOutput = {
  success: boolean;
  message: string;
  auditLog: {
    id: string;
    createdAt: Date;
    actionType: string;
    actionDescription?: string | null;
    templateId?: string | null;
    tag?: string | null;
    ipAddress?: string | null;
    recipientId?: string | null;
  };
};

export const createAuditLog: CreateAuditLog<
  CreateAuditLogInput,
  CreateAuditLogOutput
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const {
    actionType,
    actionDescription,
    templateId,
    tag,
    ipAddress,
    recipientId,
  } = args;

  // Validate input
  if (!actionType) {
    throw new HttpError(400, "Action type is required.");
  }

  // Validate templateId if provided
  if (templateId) {
    const template = await context.entities.Template.findUnique({
      where: { id: templateId },
      include: {recipients:{include: {contact: true}}}
    });
    if (!template) {
      throw new HttpError(404, "Template not found.");
    }
  }

  // Create the audit log entry
  const auditLog = await context.entities.AuditLog.create({
    data: {
      actionType,
      actionDescription,
      tag,
      ipAddress,
      user: { connect: { id: context.user.id } },
      ...(templateId && { template: { connect: { id: templateId } } }),
      ...(recipientId && { recipient: { connect: { id: recipientId } } }),
    },
  });

  console.log("---- created audit log ----")

  return {
    success: true,
    message: `Audit log entry created successfully.`,
    auditLog: {
      id: auditLog.id,
      createdAt: auditLog.createdAt,
      actionType: auditLog.actionType,
      actionDescription: auditLog.actionDescription ?? null,
      templateId: auditLog.templateId ?? null,
      tag: auditLog.tag ?? null,
      ipAddress: auditLog.ipAddress ?? null,
      recipientId: auditLog.recipientId ?? null,
    },
  };
};
