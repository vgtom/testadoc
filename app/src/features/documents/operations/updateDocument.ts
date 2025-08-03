import { HttpError } from 'wasp/server';
import { type UpdateDocument } from 'wasp/server/operations';
import { ensureArgsSchemaOrThrowHttpError } from "../../../server/validation";

import { getUploadFileSignedURLFromS3 } from '../../../lib/s3Utils';
import * as z from 'zod';
import type { Document } from 'wasp/entities';

const updateDocumentInputSchema = z.object({
  documentId: z.string(),
  fileName: z.string().min(1),
  fileType: z.string(),
});

export const updateDocument: UpdateDocument<
  {
    documentId: string;
    fileName: string;
    fileType: string;
  },
  {
    s3UploadUrl: string;
    s3UploadFields: Record<string, string>;
    doc: Document;
  }
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401, 'User not authenticated');

  const { documentId, fileType, fileName } = ensureArgsSchemaOrThrowHttpError(
    updateDocumentInputSchema,
    rawArgs
  );

  if (fileType !== "application/pdf") {
    throw new HttpError(400, "Only PDF files are allowed");
  }

  // Verify document exists and user owns it
  const existingDocument = await context.entities.Document.findFirst({
    where: {
      id: documentId,
      userId: context.user.id,
    },
  });

  if (!existingDocument) {
    throw new HttpError(404, 'Document not found or access denied');
  }

  try {
    // Get new signed URL for S3 upload
    const { s3UploadUrl, s3UploadFields, key } = await getUploadFileSignedURLFromS3({
      fileType,
      fileName,
      userId: context.user.id,
    });

    // Update document record with new file info
    const updatedDoc = await context.entities.Document.update({
      where: { id: documentId },
      data: {
        name: fileName,
        key: key,
        url: s3UploadUrl,
      },
      include: {
        placedAssets: true,
      },
    });

    return { 
      s3UploadUrl, 
      s3UploadFields, 
      doc: updatedDoc 
    };
  } catch (error) {
    console.error('Error updating document:', error);
    throw new HttpError(500, 'Failed to update document');
  }
};