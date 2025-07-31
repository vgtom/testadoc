import * as z from "zod";
import { HttpError } from "wasp/server";
import { DocumentEdit, SignRole, Template, type Document } from "wasp/entities";
import {
  getDownloadFileSignedURLFromS3,
  getUploadFileSignedURLFromS3,
} from "../../lib/s3Utils";
import { ensureArgsSchemaOrThrowHttpError } from "../../server/validation";
import type {
  CreateDocument,
  GetDownloadDocumentSignedURL,
  GetDocumentById,
  GetDownloadDocumentSignedURLByDocId,
  GetEditsByDocumentId,
  GetEditsByTemplateId,
  CreateEditsByTemplateId,
  CreateTemplate,
  CreateSignRole,
} from "wasp/server/operations";
import { ArrowRightSquare, Edit } from "lucide-react";

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

  const doc = await context.entities.Document.create({
    data: {
      name: fileName,
      key: key,
      status: "Draft",
      user: { connect: { id: context.user.id } },
      url: s3UploadUrl,
    },
  });

  return {
    s3UploadUrl,
    s3UploadFields,
    doc,
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

const getDownloadFileSignedURLInputSchema = z.object({
  key: z.string().nonempty(),
});

type GetDownloadFileSignedURLInput = z.infer<
  typeof getDownloadFileSignedURLInputSchema
>;

export const getDownloadDocumentSignedURL: GetDownloadDocumentSignedURL<
  GetDownloadFileSignedURLInput,
  string
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  const { key } = ensureArgsSchemaOrThrowHttpError(
    getDownloadFileSignedURLInputSchema,
    rawArgs
  );
  // Ensure the document belongs to the current user
  const doc = await context.entities.Document.findFirst({
    where: { key, userId: context.user.id },
  });
  if (!doc) {
    throw new HttpError(403, "You do not have access to this document.");
  }
  return await getDownloadFileSignedURLFromS3({ key });
};

const getDownloadFileSignedURLByIdInputSchema = z.object({
  id: z.string().nonempty(),
});

type GetDownloadFileSignedURLByIdInput = z.infer<
  typeof getDownloadFileSignedURLByIdInputSchema
>;

export const getDownloadDocumentSignedURLByDocId: GetDownloadDocumentSignedURLByDocId<
  GetDownloadFileSignedURLByIdInput,
  string
> = async (rawArgs, context) => {
  if (!context.user) throw new HttpError(401);
  const { id } = rawArgs; // id is string
  const doc = await context.entities.Document.findFirst({
    where: { id: id, userId: context.user.id },
  });
  if (!doc) throw new HttpError(404, "Document not found");
  return await getDownloadFileSignedURLFromS3({ key: doc.key });
};

export const createEditsByDocumentIdInputSchema = z.object({
  edits: z.array(
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

type CreateEditsByDocumentIdInputSchema = z.infer<
  typeof createEditsByDocumentIdInputSchema
>;

export const createEditsByDocumentId: GetEditsByDocumentId<
  CreateEditsByDocumentIdInputSchema,
  Document | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const doc = await context.entities.Document.findFirst({
    where: { id: args.documentId, userId: context.user.id },
  });

  if (!doc) throw new HttpError(404, "Document not found");

  await context.entities.DocumentEdit.deleteMany({
    where: { documentId: args.documentId },
  });

  const editsWithDocumentId = args.edits.map((edit) => ({
    ...edit,
    documentId: args.documentId,
  }));

  await context.entities.DocumentEdit.createMany({
    data: editsWithDocumentId,
  });

  return doc;
};

export const createEditsByTemplateIdInputSchema = z.object({
  edits: z.array(
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
      roleId: z.string().uuid(),
    })
  ),
  documentId: z.string().uuid(),
  templateId: z.string().uuid(),
});


export type CreateEditsByTemplateIdInputSchema = z.infer<
  typeof createEditsByTemplateIdInputSchema
>;

export const createEditsByTemplateId: CreateEditsByTemplateId<
  CreateEditsByTemplateIdInputSchema,
  Template | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const template = await context.entities.Template.findFirst({
    where: { id: args.templateId, userId: context.user.id },
  });

  if (!template) throw new HttpError(404, "Template not found");

  await context.entities.DocumentEdit.deleteMany({
    where: { templateId: args.templateId },
  });

  const editsWithIds = args.edits.map((edit) => ({
    ...edit,
    documentId: args.documentId,
    templateId: args.templateId,
  }));

  await context.entities.DocumentEdit.createMany({
    data: editsWithIds,
  });

  return template;
};

export const createTemplateInputSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  documentId: z.string().uuid(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;

export const createTemplate: CreateTemplate<
  CreateTemplateInput,
  Template
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const template = await context.entities.Template.create({
    data: {
      name: args.name,
      documentId: args.documentId,
      userId: context.user.id,
    },
  });

  return template;
};

export const createSignRoleInputSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1),
  status: z.enum(["Draft", "Sent", "Signed"]).optional(), // Optional override
  templateId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
});

export type CreateSignRoleInput = z.infer<typeof createSignRoleInputSchema>;

export const createSignRole: CreateSignRole<
  CreateSignRoleInput,
  SignRole
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  // Optional: validate template belongs to user
  const template = await context.entities.Template.findFirst({
    where: {
      id: args.templateId,
      userId: context.user.id,
    },
  });

  if (!template) {
    throw new HttpError(403, "Template not found or access denied.");
  }

  if (args.contactId) {
    const contact = await context.entities.Contact.findFirst({
      where: {
        id: args.contactId,
        userId: context.user.id,
      },
    });

    if (!contact) {
      throw new HttpError(403, "Contact not found or access denied.");
    }
  }

  const signRole = await context.entities.SignRole.create({
    data: {
      name: args.name,
      color: args.color,
      status: args.status ?? "Draft",
      templateId: args.templateId,
      contactId: args.contactId,

    },
  });

  return signRole;
};
