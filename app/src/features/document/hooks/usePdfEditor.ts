import { PDFDocument } from "pdf-lib";
import { useState, useCallback } from "react";
// import { saveEditedDocument } from "wasp/client/operations";
import { createPdfFileFromPageData, loadPdfFromUrl } from "../pdfUtils";
import { updateDocument } from "wasp/client/operations";
import { updateDocumentWithProgress } from "../documentUploading";
import { Document } from "wasp/entities";

export interface PageData {
  id: string;
  pageNumber: number;
  originalPageNumber: number;
  pdfDoc: PDFDocument;
  sourceDocId?: string;
}

export function usePdfEditor(initialFileUrl: string) {
  const [pages, setPages] = useState<PageData[]>([]);
  const [originalPdfDoc, setOriginalPdfDoc] = useState<PDFDocument | null>(
    null
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial document
  const loadDocument = useCallback(async (fileUrl: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const pdfDoc = await loadPdfFromUrl(fileUrl);
      setOriginalPdfDoc(pdfDoc);

      const pageCount = pdfDoc.getPageCount();
      const initialPages: PageData[] = Array.from(
        { length: pageCount },
        (_, index) => ({
          id: `original-${index}`,
          pageNumber: index + 1,
          originalPageNumber: index + 1,
          pdfDoc: pdfDoc,
        })
      );

      setPages(initialPages);
      setHasChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PDF");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reorder pages
  const reorderPages = useCallback(
    (sourceIndex: number, destinationIndex: number) => {
      setPages((currentPages) => {
        const newPages = Array.from(currentPages);
        const [reorderedPage] = newPages.splice(sourceIndex, 1);
        newPages.splice(destinationIndex, 0, reorderedPage);

        // Update page numbers
        const updatedPages = newPages.map((page, index) => ({
          ...page,
          pageNumber: index + 1,
        }));

        setHasChanges(true);
        return updatedPages;
      });
    },
    []
  );

  // Add page from another document
  const addPage = useCallback(
    async (
      sourcePdfDoc: PDFDocument,
      sourcePageNumber: number,
      insertAtPosition: number,
      sourceDocId?: string
    ) => {
      try {
        const newPage: PageData = {
          id: `${sourceDocId || "external"}-${sourcePageNumber}-${Date.now()}`,
          pageNumber: insertAtPosition,
          originalPageNumber: sourcePageNumber,
          pdfDoc: sourcePdfDoc,
          sourceDocId,
        };

        setPages((currentPages) => {
          const newPages = [...currentPages];
          newPages.splice(insertAtPosition - 1, 0, newPage);

          // Update page numbers
          const updatedPages = newPages.map((page, index) => ({
            ...page,
            pageNumber: index + 1,
          }));

          setHasChanges(true);
          return updatedPages;
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add page");
      }
    },
    []
  );

  // Remove page
  const removePage = useCallback((pageIndex: number) => {
    setPages((currentPages) => {
      if (currentPages.length <= 1) {
        setError("Cannot remove the last page");
        return currentPages;
      }

      const newPages = currentPages.filter((_, index) => index !== pageIndex);
      const updatedPages = newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      setHasChanges(true);
      return updatedPages;
    });
  }, []);

  // Duplicate page
  const duplicatePage = useCallback((pageIndex: number) => {
    setPages((currentPages) => {
      const pageToClone = currentPages[pageIndex];
      const newPage: PageData = {
        ...pageToClone,
        id: `${pageToClone.id}-duplicate-${Date.now()}`,
        pageNumber: pageIndex + 2,
      };

      const newPages = [...currentPages];
      newPages.splice(pageIndex + 1, 0, newPage);

      // Update page numbers
      const updatedPages = newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      setHasChanges(true);
      return updatedPages;
    });
  }, []);

  // Save document
  const saveDocument = useCallback(
    async (
      documentId: string,
      fileName: string
    ): Promise<{ document?: Document; success: boolean; error?: string }> => {
      if (!hasChanges) return { success: true };

      setIsLoading(true);
      setError(null);

      try {
        const { doc } = await updateDocumentWithProgress({
          documentId,
          file: await createPdfFileFromPageData(pages),
          setUploadProgressPercent(percent) {
            console.log(percent);
          },
        });
        const result = {
          document: doc as Document,
          success: !!doc,
          error: "Failed to save document",
        };
        // const result = await saveEditedPdfDocument(
        //   documentId,
        //   pages.map((page) => ({
        //     pdfDoc: page.,
        //     originalPageNumber: page.originalPageNumber,

        //   })),
        //   fileName
        // );

        if (result.success) {
          setHasChanges(false);
          return result;
        } else {
          setError(result.error || "Failed to save document");
          return result;
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to save document";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [pages, hasChanges]
  );

  // Reset changes
  const resetChanges = useCallback(() => {
    if (originalPdfDoc && initialFileUrl) {
      loadDocument(initialFileUrl);
    }
  }, [originalPdfDoc, initialFileUrl, loadDocument]);

  return {
    pages,
    hasChanges,
    isLoading,
    error,
    loadDocument,
    reorderPages,
    addPage,
    removePage,
    duplicatePage,
    saveDocument,
    resetChanges,
    setError,
  };
}
