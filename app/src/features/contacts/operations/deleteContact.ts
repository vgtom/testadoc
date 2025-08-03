// actions.js
import { HttpError } from 'wasp/server';
import { type DeleteContact } from 'wasp/server/operations';

export const deleteContact: DeleteContact<
  { contactId: string },
  { success: boolean; message: string }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  const { contactId } = args;

  // Verify the contact exists and belongs to the user
  const contact = await context.entities.Contact.findFirst({
    where: { id: contactId, userId: context.user.id },
  });

  if (!contact) {
    throw new HttpError(404, 'Contact not found or access denied.');
  }

  // Check for related recipients (optional, for feedback)
  const recipientCount = await context.entities.Recipient.count({
    where: { contactId: contactId },
  });

  // Delete the contact (related Recipients will be deleted automatically due to onDelete: Cascade)
  await context.entities.Contact.delete({
    where: { id: contactId },
  });

  return {
    success: true,
    message: `Contact '${contact.name}' deleted successfully. ${
      recipientCount > 0
        ? `${recipientCount} related recipient(s) also deleted.`
        : 'No related recipients found.'
    }`,
  };
};