import { HttpError } from 'wasp/server';
import { type GetDownloadDocumentSignedURLByDocId } from 'wasp/server/operations';
import { getDownloadFileSignedURLFromS3 } from '../../../lib/s3Utils';

export const getDownloadDocumentSignedURLByDocId: GetDownloadDocumentSignedURLByDocId<
  { id: string },
  string
> = async ({ id }, context) => {

  // Check if user is owner of document
  const doc = await context.entities.Document.findFirst({
    where: { id },
  });
  if (!doc) throw new HttpError(404, "Document not found");

  return await getDownloadFileSignedURLFromS3({ key: doc.key });
};
