import { Recipient, Contact, User } from "wasp/entities";
import { HttpError } from "wasp/server";
import { type UpdateRecipient } from "wasp/server/operations";

import * as z from "zod";

const updateRecipientInputSchema = z.object({
  recipientId: z.string().uuid(),
  color: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
});

type UpdateRecipientPayload = z.infer<typeof updateRecipientInputSchema>;

export const updateRecipient: UpdateRecipient<
  UpdateRecipientPayload,
  Recipient
> = async (args, context) => {
  const { user } = context;
  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { recipientId, color, contactName, contactEmail } =
    updateRecipientInputSchema.parse(args);

  const recipient = await context.entities.Recipient.findFirst({
    where: {
      id: recipientId,
      template: { userId: user.id },
    },
    include: { contact: true },
  });

  if (!recipient) {
    throw new HttpError(404, "Recipient not found");
  }

  // Update recipient
  const updatedRecipient = await context.entities.Recipient.update({
    where: { id: recipientId },
    data: {
      ...(color ? { color } : {}),
    },
  });

  // Optionally update contact
  if (contactName || contactEmail) {
    await context.entities.Contact.update({
      where: { id: recipient.contactId },
      data: {
        name: contactName || recipient.contact.name,
        email: contactEmail || recipient.contact.email,
      },
    });
  }

  return updatedRecipient;
};
