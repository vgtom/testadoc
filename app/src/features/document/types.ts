import { PDFDocument, PDFPage } from "pdf-lib";
import {
  Contact,
  Document,
  PlacedAsset,
  Recipient,
  Template,
} from "wasp/entities";

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
  assetId: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  pageNumber: number;
  recipientId: string;
  color?: string;
}

export type RecipientWithContact = Recipient & { contact: Contact };

export type CompleteTemplateObject = Template & {
  placedAssets: (PlacedAsset & { recipient: Recipient | null })[];
  document: Document & { placedAssets: PlacedAsset[] };
  recipients: Recipient[];
};

export type CompleteDocument = Document & {
  placedAssets: (PlacedAsset & {
    recipient: Recipient | null | undefined;
  })[];
};

export interface PageData {
  id: string;
  pageNumber: number;
  originalPageNumber: number;
  pdfDoc: PDFDocument;
  sourceDocId?: string;
}
