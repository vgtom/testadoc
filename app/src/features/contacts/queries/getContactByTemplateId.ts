import { Contact } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { GetContactByTemplateId } from 'wasp/server/operations';

export const getContactByTemplateId: GetContactByTemplateId<
  { templateId: string },
  Contact[]
> = async ({ templateId }, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // First, check if the template belongs to the user
  const template = await context.entities.Template.findUnique({
    where: { id: templateId },
    select: { userId: true },
  });

  if (!template || template.userId !== context.user.id) {
    throw new HttpError(403, 'Unauthorized access to template');
  }

  // Then, get all contacts linked through recipients of this template
  const recipients = await context.entities.Recipient.findMany({
    where: { templateId },
    include: { contact: true },
  });

  return recipients.map((r) => r.contact);
};
