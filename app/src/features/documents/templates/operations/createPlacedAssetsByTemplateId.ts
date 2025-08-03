import { HttpError } from 'wasp/server';
import { type CreatePlacedAssetsByTemplateId } from 'wasp/server/operations';
import * as z from 'zod';
import type { Template } from 'wasp/entities';

const createPlacedAssetsByTemplateIdInputSchema = z.object({
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
      recipientId: z.string().uuid(),
    })
  ),
  documentId: z.string().uuid(),
  templateId: z.string().uuid(),
});

export const createPlacedAssetsByTemplateId: CreatePlacedAssetsByTemplateId<
  z.infer<typeof createPlacedAssetsByTemplateIdInputSchema>,
  Template | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const template = await context.entities.Template.findFirst({
    where: { id: args.templateId, userId: context.user.id },
  });

  if (!template) throw new HttpError(404, "Template not found");

  await context.entities.PlacedAsset.deleteMany({
    where: { templateId: args.templateId },
  });

  await context.entities.PlacedAsset.createMany({
    data: args.placedAssets.map((asset) => ({
      ...asset,
      documentId: args.documentId,
      templateId: args.templateId,
    })),
  });

  return template;
};