import { HttpError } from 'wasp/server';
import { type CreateRecipient } from 'wasp/server/operations';
import * as z from 'zod';
import type { Recipient } from 'wasp/entities';

const createRecipientInputSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  color: z.string().min(1),
  status: z.enum(["Draft", "Sent", "Signed"]).optional(),
  templateId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
});

export const createRecipient: CreateRecipient<
  z.infer<typeof createRecipientInputSchema>,
  Recipient
> = async (args, context) => {
  if (!context.user) throw new HttpError(401, "Unauthorized");

  const template = await context.entities.Template.findFirst({
    where: { id: args.templateId, userId: context.user.id },
  });

  if (!template)
    throw new HttpError(403, "Template not found or access denied.");

  let contactId = args.contactId;

  if (contactId) {
    const contact = await context.entities.Contact.findFirst({
      where: { id: contactId, userId: context.user.id },
    });
    if (!contact) {
      throw new HttpError(403, "Contact not found or access denied.");
    }
  } else {
    if (!args.name || !args.email) {
      throw new HttpError(
        400,
        "Name and email are required when contactId is not provided."
      );
    }

    const newContact = await context.entities.Contact.create({
      data: {
        name: args.name,
        email: args.email,
        user: { connect: { id: context.user.id } },
      },
    });

    contactId = newContact.id;
  }

  return await context.entities.Recipient.create({
    data: {
      color: args.color,
      status: args.status ?? "Draft",
      templateId: args.templateId,
      contactId: contactId,
    },
  });
};