import { HttpError } from "wasp/server";
import { type GetAllSignRequestedTemplates } from "wasp/server/operations";
import type { Template } from "wasp/entities";
import { CompleteTemplateObject } from "../../types";

export type TemplateWithRecipientId = CompleteTemplateObject & {
  recipientId: string;
};

export const getAllSignRequestedTemplates: GetAllSignRequestedTemplates<
  void,
  TemplateWithRecipientId[]
> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const recipients = await context.entities.Recipient.findMany({
    where: {
      contact: {
        email: context.user.email,
      },
      status: "Sent",
    },
    include: {
      template: {
        include: {
          document: {
            include: {
              placedAssets: true,
            },
          },
          recipients: {
            include: {
              contact: true, // Include contact for each recipient
            },
          },
          placedAssets: {
            include: {
              recipient: true,
            },
          },
        },
      },
    },
  });

  const uniqueTemplatesMap = new Map<string, TemplateWithRecipientId>();

  for (const recipient of recipients) {
    if (recipient.template) {
      uniqueTemplatesMap.set(recipient.template.id, {
        ...recipient.template,
        recipientId: recipient.id,
      });
    }
  }

  return Array.from(uniqueTemplatesMap.values()).sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
};