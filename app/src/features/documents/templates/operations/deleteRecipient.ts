import { DeleteRecipient } from 'wasp/server/operations';
import { Recipient, User } from 'wasp/entities';
import { HttpError } from 'wasp/server';

type DeleteRecipientPayload = {
  recipientId: string;
};

export const deleteRecipient: DeleteRecipient<DeleteRecipientPayload, void> = async (args, context) => {
  const { user } = context;
  if (!user) {
    throw new HttpError(401, 'Unauthorized');
  }

  const { recipientId } = args;

  // Ensure the recipient belongs to the user
  const recipient = await context.entities.Recipient.findFirst({
    where: {
      id: recipientId,
      template: { userId: user.id },
    },
  });

  if (!recipient) {
    throw new HttpError(404, 'Recipient not found');
  }

  await context.entities.Recipient.delete({
    where: { id: recipientId },
  });
};