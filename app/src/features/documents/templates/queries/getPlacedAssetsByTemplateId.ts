import { HttpError } from 'wasp/server';
import { type GetPlacedAssetsByTemplateId } from 'wasp/server/operations';
import type { PlacedAsset, Template } from 'wasp/entities';

export const getPlacedAssetsByTemplateId: GetPlacedAssetsByTemplateId<
  { id: string | undefined },
  PlacedAsset[] | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  const template = await context.entities.Template.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: { placedAssets: true },
  });
  if (!template) throw new HttpError(404, "Template not found");
  return template.placedAssets;
};