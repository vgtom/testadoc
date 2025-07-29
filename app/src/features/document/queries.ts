import { HttpError } from 'wasp/server';
import type { GetAllDocuments, GetDocumentById, GetEditsByDocumentId } from 'wasp/server/operations';
import type { Document, DocumentEdit } from 'wasp/entities';

export const getAllDocuments: GetAllDocuments<void, Document[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.Document.findMany({
    where: { user: { id: context.user.id } },
    orderBy: { createdAt: 'desc' },
  });
};

export const getDocumentById: GetDocumentById<
  { id: string | undefined },
  Document & { edits: DocumentEdit[] } | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  const doc = await context.entities.Document.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: {edits: true}
  });
  if (!doc) throw new HttpError(404, "Document not found");
  return doc;
};

export const getEditsByDocumentId: GetEditsByDocumentId<
  { id: string | undefined },
  DocumentEdit[] | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  const doc = await context.entities.Document.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: {edits: true}
  });
  if (!doc) throw new HttpError(404, "Document not found");
  return doc.edits;
};
