import { PDFDocument } from "pdf-lib";
import { PageData } from "./types";

// Creates a new PDF file from an array of pages with their parent documents
export async function createPdfFileFromPageData(
  pages: PageData[]
): Promise<File> {
  const newPdf = await PDFDocument.create();

  for (const { pdfDoc, originalPageNumber } of pages) {
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [originalPageNumber]);
    newPdf.addPage(copiedPage);
  }

  const pdfBytes = await newPdf.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  return new File([blob], "combined.pdf", { type: "application/pdf" });
}

// Load a PDF from a remote URL
export async function loadPdfFromUrl(url: string): Promise<PDFDocument> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Failed to fetch PDF: ${response.statusText}`);
  const pdfBytes = await response.arrayBuffer();
  return await PDFDocument.load(pdfBytes);
}

// Generate a blob URL from a PDF document
export async function createPdfBlobUrl(pdfDoc: PDFDocument): Promise<string> {
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

// Extract one page from a document as a standalone PDF
export async function extractSinglePage(
  sourcePdfDoc: PDFDocument,
  pageNumber: number
): Promise<PDFDocument> {
  const newPdfDoc = await PDFDocument.create();
  const [copiedPage] = await newPdfDoc.copyPages(sourcePdfDoc, [
    pageNumber - 1,
  ]);
  newPdfDoc.addPage(copiedPage);
  return newPdfDoc;
}

// Validate if the file is a valid PDF and under 50MB
export function validatePdfFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!file) return { valid: false, error: "No file provided" };
  if (file.type !== "application/pdf")
    return { valid: false, error: "Only PDF files are allowed" };
  if (file.size > 50 * 1024 * 1024)
    return { valid: false, error: "File size exceeds 50MB limit" };
  return { valid: true };
}

// Downloads a new PDF from selected pages
export async function downloadPdf(pages: PageData[], fileName: string) {
  try {
    const newPdfDoc = await PDFDocument.create();

    for (const { pdfDoc, originalPageNumber } of pages) {
      const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [
        originalPageNumber,
      ]);
      newPdfDoc.addPage(copiedPage);
    }

    const pdfBytes = await newPdfDoc.save();
    const blob = new Blob([new Uint8Array(pdfBytes)], {
      type: "application/pdf",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading PDF:", error);
    throw new Error("Failed to download PDF");
  }
}

// Converts a PDF URL into a list of PageData objects
export async function getPagesFromPdfUrl(
  pdfUrl: string,
  sourceDocId?: string
): Promise<PageData[]> {
  const response = await fetch(pdfUrl);
  const pdfBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);

  return pdfDoc.getPages().map((_, index) => ({
    id: crypto.randomUUID(), // unique identifier for frontend tracking
    pageNumber: index + 1,
    originalPageNumber: index,
    pdfDoc,
    sourceDocId,
  }));
}

export async function pageDataArrayToPdfUrl(pages: PageData[]): Promise<string> {
  const newPdf = await PDFDocument.create();

  for (const { pdfDoc, originalPageNumber } of pages) {
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [originalPageNumber]);
    newPdf.addPage(copiedPage);
  }

  const pdfBytes = await newPdf.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
  return URL.createObjectURL(blob); // you can use this in an <iframe> or <a download>
}
