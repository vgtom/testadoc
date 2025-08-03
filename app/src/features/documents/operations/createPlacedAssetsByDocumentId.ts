import { HttpError } from 'wasp/server';
import { type GetPlacedAssetsByDocumentId } from 'wasp/server/operations';
import * as z from 'zod';
import type { Document } from 'wasp/entities';

const createPlacedAssetsByDocumentIdInputSchema = z.object({
  placedAssets: z.array(
    z.object({
      type: z.enum([
        "TEXT",
        "IMAGE",
        "PLACEHOLDER",
        "TEMPLATE_DATE",
        "TEMPLATE_INITIAL",
        "TEMPLATE_SIGN",
      ]),
      value: z.string(),
      pageNumber: z.number().int().min(1),
      xPercent: z.number().min(0).max(1),
      yPercent: z.number().min(0).max(1),
      widthPercent: z.number().min(0).max(1),
      heightPercent: z.number().min(0).max(1),
    })
  ),
  documentId: z.string().uuid(),
});

export const createPlacedAssetsByDocumentId: GetPlacedAssetsByDocumentId<
  z.infer<typeof createPlacedAssetsByDocumentIdInputSchema>,
  Document | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const doc = await context.entities.Document.findFirst({
    where: { id: args.documentId, userId: context.user.id },
  });

  if (!doc) throw new HttpError(404, "Document not found");

  await context.entities.PlacedAsset.deleteMany({
    where: { documentId: args.documentId },
  });

  await context.entities.PlacedAsset.createMany({
    data: args.placedAssets.map((asset) => ({
      ...asset,
      documentId: args.documentId,
    })),
  });

  return doc;
};