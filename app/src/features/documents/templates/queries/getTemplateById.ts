import { HttpError } from 'wasp/server';
import { type GetTemplateById } from 'wasp/server/operations';
import type { Template, Document, PlacedAsset, Recipient } from 'wasp/entities';
import { CompleteTemplateObject } from '../../types';

export const getTemplateById: GetTemplateById<
  { id: string | undefined },
  CompleteTemplateObject | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const template = await context.entities.Template.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: {
      placedAssets: {
        include: {
          recipient: true,
        },
      },
      document: {
        include: {
          placedAssets: true,
        },
      },
      recipients: true,
    },
  });

  if (!template) throw new HttpError(404, "Template not found");

  return template as CompleteTemplateObject;
};