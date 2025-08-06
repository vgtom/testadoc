import { HttpError } from "wasp/server";
import { type GetTemplateByRecipientId } from "wasp/server/operations";
import type { CompleteTemplateObject } from "../../types";

export const getTemplateByRecipientId: GetTemplateByRecipientId<
  { recipientId: string },
  CompleteTemplateObject
> = async ({ recipientId }, context) => {
  if (!context.user) throw new HttpError(401);

  // Fetch recipient and ensure email match
  const recipient = await context.entities.Recipient.findUnique({
    where: { id: recipientId },
    include: {
      contact: true, // assumes contact.email is available
    },
  });

  if (!recipient || recipient.contact?.email !== context.user.email) {
    throw new HttpError(403, "You are not authorized to view this template");
  }

  // Fetch template with all required data
  const template = await context.entities.Template.findUnique({
    where: { id: recipient.templateId },
    include: {
      placedAssets: {
        where: { recipientId },
        include: { recipient: true },
      },
      document: {
        include: { placedAssets: true },
      },
      recipients: {
        include: {
          contact: true
        }
      },
    },
  });

  if (!template) throw new HttpError(404, "Template not found");

  return template;
};
