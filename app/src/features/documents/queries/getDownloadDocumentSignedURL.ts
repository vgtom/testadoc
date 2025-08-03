import { HttpError } from 'wasp/server';
import { type GetDownloadDocumentSignedURL } from 'wasp/server/operations';
import { ensureArgsSchemaOrThrowHttpError } from "../../../server/validation";

import * as z from 'zod';
import { getDownloadFileSignedURLFromS3 } from '../../../lib/s3Utils';

const getDownloadFileSignedURLInputSchema = z.object({
  key: z.string().nonempty(),
});

export const getDownloadDocumentSignedURL: GetDownloadDocumentSignedURL<
  z.infer<typeof getDownloadFileSignedURLInputSchema>,
  string
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);
  const { key } = ensureArgsSchemaOrThrowHttpError(
    getDownloadFileSignedURLInputSchema,
    rawArgs
  );

  const doc = await context.entities.Document.findFirst({
    where: { key, userId: context.user.id },
  });

  if (!doc)
    throw new HttpError(403, "You do not have access to this document.");
  return await getDownloadFileSignedURLFromS3({ key });
};