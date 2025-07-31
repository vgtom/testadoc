import { HttpError } from "wasp/server";
import type {
  GetAllDocuments,
  GetDocumentById,
  GetEditsByDocumentId,
  GetTemplateById,
  GetEditsByTemplateId,
  GetAllTemplates,
  GetSignRolesByTemplateId,
} from "wasp/server/operations";
import type { Document, DocumentEdit, SignRole, Template } from "wasp/entities";

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

export const getDocumentById: GetDocumentById<
  { id: string | undefined },
  (Document & { edits: DocumentEdit[] }) | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  const doc = await context.entities.Document.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: { edits: true },
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
    include: { edits: true },
  });
  if (!doc) throw new HttpError(404, "Document not found");
  return doc.edits;
};

export const getAllTemplates: GetAllTemplates<void, Template[]> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.Template.findMany({
    where: { user: { id: context.user.id } },
    orderBy: { createdAt: "desc" },
  });
};

export const getEditsByTemplateId: GetEditsByTemplateId<
  { id: string | undefined },
  DocumentEdit[] | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  const template = await context.entities.Template.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: { edits: true },
  });
  if (!template) throw new HttpError(404, "Template not found");
  return template.edits;
};

export type CompleteTemplateObject = Template & {
  edits: (DocumentEdit & { role: SignRole | null })[]; // 👈 allow null
  document: Document & { edits: DocumentEdit[] };
  sign_roles: SignRole[];
};

export const getTemplateById: GetTemplateById<
  { id: string | undefined },
  CompleteTemplateObject | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const template = await context.entities.Template.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: {
      edits: {
        include: {
          role: true,
        },
      },
      document: {
        include: {
          edits: true,
        },
      },
      sign_roles: true,
    },
  });

  if (!template) throw new HttpError(404, "Template not found");

  // ✅ Force cast to the expected return type
  return template as CompleteTemplateObject;
};


export const getSignRolesByTemplateId: GetSignRolesByTemplateId<
  { templateId: string | undefined },
  SignRole[] | null
> = async ({ templateId }, context) => {
  if (!context.user) throw new HttpError(401, "Unauthorized");
  if (!templateId) throw new HttpError(400, "Template ID is required");

  const template = await context.entities.Template.findFirst({
    where: {
      id: templateId,
      userId: context.user.id,
    },
    include: {
      sign_roles: true,
      edits: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!template) throw new HttpError(404, "Template not found");

  return template.sign_roles;
};
