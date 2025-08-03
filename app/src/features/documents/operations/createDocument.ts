import { HttpError } from 'wasp/server';
import { type CreateDocument } from 'wasp/server/operations';
import * as z from 'zod';
import type { Document } from 'wasp/entities';
import { ensureArgsSchemaOrThrowHttpError } from '../../../server/validation';
import { getUploadFileSignedURLFromS3 } from '../../../lib/s3Utils';

const createDocumentInputSchema = z.object({
  fileName: z.string().nonempty(),
  fileType: z.string().nonempty(),
});

type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;

export const createDocument: CreateDocument<
  CreateDocumentInput,
  {
    s3UploadUrl: string;
    s3UploadFields: Record<string, string>;
    doc: Document;
  }
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);

  const { fileType, fileName } = ensureArgsSchemaOrThrowHttpError(
    createDocumentInputSchema,
    rawArgs
  );

  if (fileType !== "application/pdf") {
    throw new HttpError(400, "Only PDF files are allowed");
  }

  const { s3UploadUrl, s3UploadFields, key } =
    await getUploadFileSignedURLFromS3({
      fileType,
      fileName,
      userId: context.user.id,
    });

  const doc = await context.entities.Document.create({
    data: {
      name: fileName,
      key: key,
      status: "Draft",
      user: { connect: { id: context.user.id } },
      url: s3UploadUrl,
    },
  });

  return { s3UploadUrl, s3UploadFields, doc };
};