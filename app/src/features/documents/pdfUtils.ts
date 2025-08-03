import { PDFDocument } from "pdf-lib";
import { PageData } from "./types";

// Creates a new PDF file from an array of pages with their parent documents
export async function createPdfFileFromPageData(
  pages: PageData[]
): Promise<File> {
  const newPdf = await PDFDocument.create();

  for (const pageData of pages) {
    // Always copy from the first (and only) page of each pageData.pdfDoc
    const [copiedPage] = await newPdf.copyPages(pageData.pdfDoc, [0]);
    newPdf.addPage(copiedPage);
  }

  const pdfBytes = await newPdf.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], {
    type: "application/pdf",
  });
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
  const blob = new Blob([new Uint8Array(pdfBytes)], {
    type: "application/pdf",
  });
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

    for (const pageData of pages) {
      // Always copy from the first (and only) page of each pageData.pdfDoc
      const [copiedPage] = await newPdfDoc.copyPages(pageData.pdfDoc, [0]);
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

// Converts a PDF URL into a list of PageData objects with isolated PDF documents
export async function getPagesFromPdfUrl(
  pdfUrl: string,
  sourceDocId?: string
): Promise<PageData[]> {
  const response = await fetch(pdfUrl);
  const pdfBytes = await response.arrayBuffer();
  const sourcePdf = await PDFDocument.load(pdfBytes);

  const pages: PageData[] = [];
  const pageCount = sourcePdf.getPageCount();

  // Create isolated PDF documents for each page
  for (let index = 0; index < pageCount; index++) {
    // Create a new PDF document containing only this page
    const singlePagePdf = await PDFDocument.create();
    const [copiedPage] = await singlePagePdf.copyPages(sourcePdf, [index]);
    singlePagePdf.addPage(copiedPage);

    pages.push({
      id: crypto.randomUUID(), // unique identifier for frontend tracking
      pageNumber: index + 1,
      pdfDoc: singlePagePdf, // Each page gets its own isolated PDF document
      pdfBytes: new Uint8Array(pdfBytes), // Keep original bytes for reference
      sourceDocId,
    });
  }

  return pages;
}


// Creates a merged PDF URL from PageData array - ensures consistency with pagination view
export async function pageDataArrayToPdfUrl(
  pages: PageData[]
): Promise<{ url: string; file: File }> {
  console.log("Updating pdf data to url and file")
  const mergedPdf = await PDFDocument.create();

  // Process pages in their current order
  for (const pageData of pages) {
    try {
      // Always copy from the first (and only) page of each pageData.pdfDoc
      const [copiedPage] = await mergedPdf.copyPages(pageData.pdfDoc, [0]);
      mergedPdf.addPage(copiedPage);
    } catch (error) {
      console.error(`Error copying page ${pageData.pageNumber}:`, error);
      // Skip this page if there's an error, but continue with others
      continue;
    }
  }

  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([new Uint8Array(pdfBytes)], {
    type: "application/pdf",
  });

  return {
    url: URL.createObjectURL(blob),
    file: new File([blob], "combined.pdf", { type: "application/pdf" }),
  };
}

// Helper function to ensure page data integrity
export function validatePageData(pages: PageData[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    if (!page.id) {
      errors.push(`Page at index ${i} missing ID`);
    }

    if (!page.pdfDoc) {
      errors.push(`Page ${page.pageNumber} missing PDF document`);
    } else {
      try {
        const pageCount = page.pdfDoc.getPageCount();
        if (pageCount !== 1) {
          errors.push(
            `Page ${page.pageNumber} PDF document should contain exactly 1 page, found ${pageCount}`
          );
        }
      } catch (error) {
        errors.push(
          `Page ${page.pageNumber} PDF document is corrupted: ${error}`
        );
      }
    }

    if (page.pageNumber !== i + 1) {
      errors.push(
        `Page number mismatch: expected ${i + 1}, got ${page.pageNumber}`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Helper function to fix page numbering
export function normalizePageNumbers(pages: PageData[]): PageData[] {
  return pages.map((page, index) => ({
    ...page,
    pageNumber: index + 1,
  }));
}
