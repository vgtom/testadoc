import { HttpError } from 'wasp/server';
import { type GetDocumentById } from 'wasp/server/operations';
import type { Document, PlacedAsset, Recipient } from 'wasp/entities';
import { CompleteDocument } from '../types';

export const getDocumentById: GetDocumentById<
  { id: string | undefined },
  CompleteDocument | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  const doc = await context.entities.Document.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: {
      placedAssets: {
        include: {
          recipient: true,
        },
      },
    },
  });
  if (!doc) throw new HttpError(404, "Document not found");
  return doc as CompleteDocument;
};