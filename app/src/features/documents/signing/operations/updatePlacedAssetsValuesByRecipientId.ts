import { HttpError } from 'wasp/server';
import { type UpdatePlacedAssetsValuesByRecipientId } from 'wasp/server/operations';
import * as z from 'zod';
import { PlacedAsset } from 'wasp/entities';

const inputSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      recipientId: z.string().uuid(),
      value: z.string(),
    })
  ),
});

type UpdatePayload = z.infer<typeof inputSchema>;

export const updatePlacedAssetsValuesByRecipientId: UpdatePlacedAssetsValuesByRecipientId<
  UpdatePayload,
  PlacedAsset[]
> = async ({ updates }, context) => {
  if (!context.user) throw new HttpError(401, 'Unauthorized');

  inputSchema.parse({ updates });

  const recipientIds = [...new Set(updates.map((u) => u.recipientId))];
  if (recipientIds.length !== 1) {
    throw new HttpError(400, 'All updates must belong to the same recipient');
  }

  const recipientId = recipientIds[0];

  const recipient = await context.entities.Recipient.findUnique({
    where: { id: recipientId },
    include: { contact: true },
  });

  if (!recipient || recipient.contact.email !== context.user.email) {
    throw new HttpError(403, 'You are not authorized to update these fields');
  }

  const validAssets = await context.entities.PlacedAsset.findMany({
    where: {
      recipientId,
      id: { in: updates.map((u) => u.id) },
    },
  });

  const updatedAssets: PlacedAsset[] = [];
  for (const { id, value } of updates) {
    const matching = validAssets.find((pa) => pa.id === id);
    if (!matching) continue;

    const updated = await context.entities.PlacedAsset.update({
      where: { id },
      data: { value },
    });

    updatedAssets.push(updated);
  }

  return updatedAssets;
};
