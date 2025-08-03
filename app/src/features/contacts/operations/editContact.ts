// src/features/contacts/operations/editContact.js
import { HttpError } from 'wasp/server';
import { type EditContact } from 'wasp/server/operations';

type EditContactInput = {
  contactId: string;
  name?: string;
  email?: string;
};

type EditContactOutput = {
  success: boolean;
  message: string;
  contact: {
    id: string;
    name: string;
    email: string;
  };
};

export const editContact: EditContact<EditContactInput, EditContactOutput> = async (
  args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  const { contactId, name, email } = args;

  // Verify the contact exists and belongs to the user
  const contact = await context.entities.Contact.findFirst({
    where: { id: contactId, userId: context.user.id },
  });

  if (!contact) {
    throw new HttpError(404, 'Contact not found or access denied.');
  }

  // Validate input
  if (!name && !email) {
    throw new HttpError(400, 'At least one field (name or email) must be provided for update.');
  }

  // Check if email is already used by another contact
  if (email && email !== contact.email) {
    const existingContact = await context.entities.Contact.findFirst({
      where: { email, userId: context.user.id },
    });
    if (existingContact) {
      throw new HttpError(400, 'A contact with this email already exists.');
    }
  }

  // Update the contact
  const updatedContact = await context.entities.Contact.update({
    where: { id: contactId },
    data: {
      name: name ?? contact.name,
      email: email ?? contact.email,
    },
  });

  return {
    success: true,
    message: `Contact '${updatedContact.name}' updated successfully.`,
    contact: {
      id: updatedContact.id,
      name: updatedContact.name,
      email: updatedContact.email,
    },
  };
};