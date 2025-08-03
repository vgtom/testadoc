import { Contact } from 'wasp/entities';
import { HttpError } from 'wasp/server';
import { GetAllContacts } from 'wasp/server/operations';

export const getAllContacts: GetAllContacts<void, Contact[]> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.Contact.findMany({
    where: { user: { id: context.user.id } },
    orderBy: { createdAt: "desc" },
  });
};