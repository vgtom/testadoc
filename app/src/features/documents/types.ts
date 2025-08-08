import { PDFDocument, PDFPage } from "pdf-lib";
import {
  Contact,
  Document,
  PlacedAsset,
  Recipient,
  Template,
} from "wasp/entities";
import z from "zod";

export interface Asset {
  id: string;
  dataUrl: string;
  type: EditType;
  static?: boolean;
  name?: string;
}

export enum EditType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  PLACEHOLDER = "PLACEHOLDER",
  TEMPLATE_DATE = "TEMPLATE_DATE",
  TEMPLATE_INITIAL = "TEMPLATE_INITIAL",
  TEMPLATE_SIGN = "TEMPLATE_SIGN",
}

export interface PlacedObject {
  id: string;
  type: EditType;
  assetId?: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number | null;
  pageNumber: number;
  recipientId: string;
  color?: string;
  value?: string;
}

export type RecipientWithContact = Recipient & { contact: Contact };



export type CompleteTemplateObject = Template & {
  placedAssets: (PlacedAsset & { recipient: Recipient | null })[];
  document: Document & { placedAssets: PlacedAsset[] | null };
  recipients: RecipientWithContact[] | null;
};

export type CompleteDocument = Document & {
  placedAssets: (PlacedAsset & {
    recipient: Recipient | null | undefined;
  })[];
};

export interface PageData {
  id: string;
  pageNumber: number;
  pdfBytes?: Uint8Array;
  pdfDoc: PDFDocument;
  sourceDocId?: string;
  fileName?: "[Saved]" | string
}

export const ZTemplateStatusEnum = z.enum(['Draft', 'Sent', 'Completed']);

export type TemplateStatus = z.infer<typeof ZTemplateStatusEnum>;

export const ZRecipientStatusEnum = z.enum(['Draft', 'Recieved', 'Viewed', 'Finished']);

export type RecipientStatus = z.infer<typeof ZRecipientStatusEnum>;

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PaginationInput = {
  page: number;
  pageSize: number;
};