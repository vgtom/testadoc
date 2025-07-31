import * as z from "zod";
import { HttpError } from "wasp/server";
import { Recipient, Template, type Document } from "wasp/entities";
import {
  getDownloadFileSignedURLFromS3,
  getUploadFileSignedURLFromS3,
} from "../../lib/s3Utils";
import { ensureArgsSchemaOrThrowHttpError } from "../../server/validation";
import type {
  CreateDocument,
  GetDownloadDocumentSignedURL,
  GetDownloadDocumentSignedURLByDocId,
  GetPlacedAssetsByDocumentId,
  CreatePlacedAssetsByTemplateId,
  CreateTemplate,
  CreateRecipient,
  UpdateDocument
} from "wasp/server/operations";
import { PDFDocument } from "pdf-lib";
import { S3Client } from "@aws-sdk/client-s3";

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

export const getAllDocuments = async (
  _args: void,
  context: any
): Promise<Document[]> => {
  if (!context.user) throw new HttpError(401);
  return context.entities.Document.findMany({
    where: { user: { id: context.user.id } },
    orderBy: { createdAt: "desc" },
  });
};

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

export const getDownloadDocumentSignedURLByDocId: GetDownloadDocumentSignedURLByDocId<
  { id: string },
  string
> = async ({ id }, context) => {
  if (!context.user) throw new HttpError(401);
  const doc = await context.entities.Document.findFirst({
    where: { id, userId: context.user.id },
  });
  if (!doc) throw new HttpError(404, "Document not found");
  return await getDownloadFileSignedURLFromS3({ key: doc.key });
};

const createPlacedAssetsByDocumentIdInputSchema = z.object({
  placedAssets: z.array(
    z.object({
      type: z.enum([
        "TEXT",
        "IMAGE",
        "PLACEHOLDER",
        "TEMPLATE_DATE",
        "TEMPLATE_INITIAL",
        "TEMPLATE_SIGN",
      ]),
      value: z.string(),
      pageNumber: z.number().int().min(1),
      xPercent: z.number().min(0).max(1),
      yPercent: z.number().min(0).max(1),
      widthPercent: z.number().min(0).max(1),
      heightPercent: z.number().min(0).max(1),
    })
  ),
  documentId: z.string().uuid(),
});

export const createPlacedAssetsByDocumentId: GetPlacedAssetsByDocumentId<
  z.infer<typeof createPlacedAssetsByDocumentIdInputSchema>,
  Document | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const doc = await context.entities.Document.findFirst({
    where: { id: args.documentId, userId: context.user.id },
  });

  if (!doc) throw new HttpError(404, "Document not found");

  await context.entities.PlacedAsset.deleteMany({
    where: { documentId: args.documentId },
  });

  await context.entities.PlacedAsset.createMany({
    data: args.placedAssets.map((asset) => ({
      ...asset,
      documentId: args.documentId,
    })),
  });

  return doc;
};

const createPlacedAssetsByTemplateIdInputSchema = z.object({
  placedAssets: z.array(
    z.object({
      type: z.enum([
        "TEXT",
        "IMAGE",
        "PLACEHOLDER",
        "TEMPLATE_DATE",
        "TEMPLATE_INITIAL",
        "TEMPLATE_SIGN",
      ]),
      value: z.string(),
      pageNumber: z.number().int().min(1),
      xPercent: z.number().min(0).max(1),
      yPercent: z.number().min(0).max(1),
      widthPercent: z.number().min(0).max(1),
      heightPercent: z.number().min(0).max(1),
      recipientId: z.string().uuid(),
    })
  ),
  documentId: z.string().uuid(),
  templateId: z.string().uuid(),
});

export const createPlacedAssetsByTemplateId: CreatePlacedAssetsByTemplateId<
  z.infer<typeof createPlacedAssetsByTemplateIdInputSchema>,
  Template | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const template = await context.entities.Template.findFirst({
    where: { id: args.templateId, userId: context.user.id },
  });

  if (!template) throw new HttpError(404, "Template not found");

  await context.entities.PlacedAsset.deleteMany({
    where: { templateId: args.templateId },
  });

  await context.entities.PlacedAsset.createMany({
    data: args.placedAssets.map((asset) => ({
      ...asset,
      documentId: args.documentId,
      templateId: args.templateId,
    })),
  });

  return template;
};

export const createTemplateInputSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  documentId: z.string().uuid(),
});

export const createTemplate: CreateTemplate<
  z.infer<typeof createTemplateInputSchema>,
  Template
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  return await context.entities.Template.create({
    data: {
      name: args.name,
      documentId: args.documentId,
      userId: context.user.id,
    },
  });
};

const createRecipientInputSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  color: z.string().min(1),
  status: z.enum(["Draft", "Sent", "Signed"]).optional(),
  templateId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
});

export const createRecipient: CreateRecipient<
  z.infer<typeof createRecipientInputSchema>,
  Recipient
> = async (args, context) => {
  if (!context.user) throw new HttpError(401, "Unauthorized");

  const template = await context.entities.Template.findFirst({
    where: { id: args.templateId, userId: context.user.id },
  });

  if (!template)
    throw new HttpError(403, "Template not found or access denied.");

  let contactId = args.contactId;

  if (contactId) {
    const contact = await context.entities.Contact.findFirst({
      where: { id: contactId, userId: context.user.id },
    });
    if (!contact) {
      throw new HttpError(403, "Contact not found or access denied.");
    }
  } else {
    if (!args.name || !args.email) {
      throw new HttpError(
        400,
        "Name and email are required when contactId is not provided."
      );
    }

    const newContact = await context.entities.Contact.create({
      data: {
        name: args.name,
        email: args.email,
        user: { connect: { id: context.user.id } },
      },
    });

    contactId = newContact.id;
  }

  return await context.entities.Recipient.create({
    data: {
      color: args.color,
      status: args.status ?? "Draft",
      templateId: args.templateId,
      contactId: contactId,
    },
  });
};

export const updateDocumentInputSchema = z.object({
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
        // Optionally reset status when document is updated
        // status: "Draft",
      },
      include: {
        placedAssets: true, // Include related data if needed
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