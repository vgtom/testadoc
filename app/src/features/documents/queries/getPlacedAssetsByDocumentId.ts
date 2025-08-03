import { HttpError } from 'wasp/server';
import { type GetPlacedAssetsByDocumentId } from 'wasp/server/operations';
import type { PlacedAsset } from 'wasp/entities';

export const getPlacedAssetsByDocumentId: GetPlacedAssetsByDocumentId<
  { id: string | undefined },
  PlacedAsset[] | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  const doc = await context.entities.Document.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: { placedAssets: true },
  });
  if (!doc) throw new HttpError(404, "Document not found");
  return doc.placedAssets;
};