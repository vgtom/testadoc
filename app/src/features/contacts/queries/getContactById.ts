import { Contact } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { GetContactById } from 'wasp/server/operations';

export const getContactById: GetContactById<{ id: string }, Contact> = async (
  { id },
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const contact = await context.entities.Contact.findUnique({
    where: { id },
    include: { recipients: true },
  });

  if (!contact || contact.userId !== context.user.id) {
    throw new HttpError(404, 'Contact not found');
  }

  return contact;
};
