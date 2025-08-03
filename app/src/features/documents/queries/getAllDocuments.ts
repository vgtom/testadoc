import { HttpError } from 'wasp/server';
import { type GetAllDocuments } from 'wasp/server/operations';
import type { Document } from 'wasp/entities';

export const getAllDocuments: GetAllDocuments<void, Document[]> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.Document.findMany({
    where: { user: { id: context.user.id } },
    orderBy: { createdAt: "desc" },
  });
};