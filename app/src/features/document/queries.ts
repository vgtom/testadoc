import { HttpError } from "wasp/server";
import type {
  GetAllDocuments,
  GetDocumentById,
  GetPlacedAssetsByDocumentId,
  GetTemplateById,
  GetPlacedAssetsByTemplateId,
  GetAllTemplates,
  GetRecipientsByTemplateId,
} from "wasp/server/operations";
import type { Document, PlacedAsset, Recipient, Template } from "wasp/entities";
import { RecipientWithContact, CompleteTemplateObject } from "./types";

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
  (Document & { placedAssets: PlacedAsset[] }) | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  const doc = await context.entities.Document.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: { placedAssets: true },
  });
  if (!doc) throw new HttpError(404, "Document not found");
  return doc;
};

export const getPlacedAssetsByDocumentId: GetPlacedAssetsByDocumentId<
  { id: string | undefined },
  PlacedAsset[] | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  const doc = await context.entities.Document.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: { placedAssets: true },
  });
  if (!doc) throw new HttpError(404, "Document not found");
  return doc.placedAssets;
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

export const getPlacedAssetsByTemplateId: GetPlacedAssetsByTemplateId<
  { id: string | undefined },
  PlacedAsset[] | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);
  const template = await context.entities.Template.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: { placedAssets: true },
  });
  if (!template) throw new HttpError(404, "Template not found");
  return template.placedAssets;
};

export const getTemplateById: GetTemplateById<
  { id: string | undefined },
  CompleteTemplateObject | null
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const template = await context.entities.Template.findFirst({
    where: { id: args.id, userId: context.user.id },
    include: {
      placedAssets: {
        include: {
          recipient: true,
        },
      },
      document: {
        include: {
          placedAssets: true,
        },
      },
      recipients: true,
    },
  });

  if (!template) throw new HttpError(404, "Template not found");

  return template as CompleteTemplateObject;
};

export const getRecipientsByTemplateId: GetRecipientsByTemplateId<
  { templateId: string | undefined },
  RecipientWithContact[] | null
> = async ({ templateId }, context) => {
  if (!context.user) throw new HttpError(401, "Unauthorized");
  if (!templateId) throw new HttpError(400, "Template ID is required");
  
  const template = await context.entities.Template.findFirst({
    where: {
      id: templateId,
      userId: context.user.id,
    },
    include: {
      recipients: {
        include: {
          contact: true,
        },
      },
    },
  });

  if (!template) throw new HttpError(404, "Template not found");

  return template.recipients;
};
