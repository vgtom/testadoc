import * as z from "zod";
import { HttpError } from "wasp/server";
import { type Document } from "wasp/entities";
import { getDownloadFileSignedURLFromS3, getUploadFileSignedURLFromS3 } from "../file-upload/s3Utils";
import { ensureArgsSchemaOrThrowHttpError } from "../server/validation";
import type { CreateDocument, GetDownloadDocumentSignedURL } from "wasp/server/operations";

const createDocumentInputSchema = z.object({
  fileName: z.string().nonempty(),
  fileType: z.string().nonempty(), // Only allow PDF in frontend
});

type CreateDocumentInput = z.infer<typeof createDocumentInputSchema>;


export const createDocument: CreateDocument<
  CreateDocumentInput,
  {
    s3UploadUrl: string;
    s3UploadFields: Record<string, string>;
  }
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { fileType, fileName } = ensureArgsSchemaOrThrowHttpError(
    createDocumentInputSchema,
    rawArgs
  );

  // Only allow PDF
  if (fileType !== "application/pdf") {
    throw new HttpError(400, "Only PDF files are allowed");
  }

  const { s3UploadUrl, s3UploadFields, key } =
    await getUploadFileSignedURLFromS3({
      fileType,
      fileName,
      userId: context.user.id,
    });

  await context.entities.Document.create({
    data: {
      name: fileName,
      key: key,
      status: "Draft",
      user: { connect: { id: context.user.id } },
      url: s3UploadUrl
    },
  });

  return {
    s3UploadUrl,
    s3UploadFields,
  };

  // Optionally, you could return s3UploadUrl and s3UploadFields for direct upload from client
};

export const getAllDocuments = async (
  _args: void,
  context: any
): Promise<Document[]> => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.Document.findMany({
    where: { user: { id: context.user.id } },
    orderBy: { createdAt: "desc" },
  });
};

const getDownloadFileSignedURLInputSchema = z.object({ key: z.string().nonempty() });

type GetDownloadFileSignedURLInput = z.infer<typeof getDownloadFileSignedURLInputSchema>;

export const getDownloadDocumentSignedURL: GetDownloadDocumentSignedURL<
  GetDownloadFileSignedURLInput,
  string
> = async (rawArgs, _context) => {
  const { key } = ensureArgsSchemaOrThrowHttpError(getDownloadFileSignedURLInputSchema, rawArgs);
  return await getDownloadFileSignedURLFromS3({ key });
};
