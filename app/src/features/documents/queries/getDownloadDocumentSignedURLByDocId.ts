import { HttpError } from 'wasp/server';
import { type GetDownloadDocumentSignedURLByDocId } from 'wasp/server/operations';
import { getDownloadFileSignedURLFromS3 } from '../../../lib/s3Utils';

export const getDownloadDocumentSignedURLByDocId: GetDownloadDocumentSignedURLByDocId<
  { id: string },
  string
> = async ({ id }, context) => {
  if (!context.user) throw new HttpError(401);

  // Check if user is owner of document
  const doc = await context.entities.Document.findFirst({
    where: { id },
  });
  if (!doc) throw new HttpError(404, "Document not found");

  const isOwner = doc.userId === context.user.id;

  // If not owner, check if user is a recipient of a template linked to this document
  let isRecipient = false;
  if (!isOwner) {
    const recipient = await context.entities.Recipient.findFirst({
      where: {
        contact: {
          email: context.user.email,
        },
        template: {
          documentId: id,
        },
      },
    });
    isRecipient = Boolean(recipient);
  }

  if (!isOwner && !isRecipient) {
    throw new HttpError(403, "You do not have access to this document");
  }

  return await getDownloadFileSignedURLFromS3({ key: doc.key });
};
