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
  let emailToCheck = args.email;

  if (contactId) {
    const contact = await context.entities.Contact.findFirst({
      where: { id: contactId, userId: context.user.id },
    });

    if (!contact) {
      throw new HttpError(403, "Contact not found or access denied.");
    }

    emailToCheck = contact.email;
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

  // 🔒 Check for existing recipient with the same email and template
  const duplicate = await context.entities.Recipient.findFirst({
    where: {
      contact: { email: emailToCheck },
      templateId: args.templateId,
    },
    include: { contact: true },
  });

  if (duplicate) {
    throw new HttpError(409, "Recipient with this email already exists for this template.");
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
