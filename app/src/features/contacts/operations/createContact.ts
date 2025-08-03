// src/features/contacts/operations/createContact.js
import { HttpError } from 'wasp/server';
import { type CreateContact } from 'wasp/server/operations';

type CreateContactInput = {
  name: string;
  email: string;
};

type CreateContactOutput = {
  success: boolean;
  message: string;
  contact: {
    id: string;
    name: string;
    email: string;
  };
};

export const createContact: CreateContact<CreateContactInput, CreateContactOutput> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  const { name, email } = args;

  // Validate input
  if (!name || !email) {
    throw new HttpError(400, 'Name and email are required.');
  }

  // Check if email is already used by another contact for this user
  const existingContact = await context.entities.Contact.findFirst({
    where: { email, userId: context.user.id },
  });

  if (existingContact) {
    throw new HttpError(400, 'A contact with this email already exists.');
  }

  // Create the contact
  const contact = await context.entities.Contact.create({
    data: {
      name,
      email,
      user: { connect: { id: context.user.id } },
    },
  });

  return {
    success: true,
    message: `Contact '${contact.name}' created successfully.`,
    contact: {
      id: contact.id,
      name: contact.name,
      email: contact.email,
    },
  };
};