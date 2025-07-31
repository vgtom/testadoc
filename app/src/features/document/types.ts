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
  roleId?: string;
  color?: string;
}