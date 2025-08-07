import React, { FC, useEffect, useRef, useState } from "react";
import { Document, PlacedAsset } from "wasp/entities";
import { PageData, PlacedObject } from "../types";
import { getPagesFromPdfUrl, pageDataArrayToPdfUrl } from "../pdfUtils";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min";
import { Trash, Plus, Upload, Download } from "lucide-react";
import { Button } from "../../../components/ui/button";

type PdfPaginationProps = {
  doc: (Document & { placedAssets?: PlacedAsset[] | null }) | null;
  fileUrl: string | null;
  handlePageClick: (pagenum: number) => void;
  setPages: React.Dispatch<React.SetStateAction<PageData[]>>;
  pages: PageData[];
  placedObjects: PlacedObject[];
  setPlacedObjects: React.Dispatch<React.SetStateAction<PlacedObject[]>>;
  setUpdatedFileAndUrl: React.Dispatch<
    React.SetStateAction<{
      url: string;
      file: File | null;
    }>
  >;
  readonly?: boolean;
};

function reorderPages<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

const PdfEditablePagination: FC<PdfPaginationProps> = ({
  doc,
  fileUrl,
  handlePageClick,
  pages,
  setPages,
  placedObjects,
  setPlacedObjects,
  setUpdatedFileAndUrl,
  readonly,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePageId, setActivePageId] = useState<string>();
  const [pageImages, setPageImages] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [renderingProgress, setRenderingProgress] = useState<{
    [key: string]: boolean;
  }>({});
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [isAddingPages, setIsAddingPages] = useState(false);
  const [isMadeSomeEdit, setIsMadeSomeEdit] = useState(false);

  useEffect(() => {
    if (!fileUrl || !doc?.id) return;
    setLoading(true);
    getPagesFromPdfUrl(fileUrl, doc.id)
      .then((pagesData) => {
        const isolatedPages = pagesData.map((page, index) => ({
          ...page,
          pageNumber: index + 1,
        }));
        setPages(isolatedPages);
        generatePageThumbnails(isolatedPages);
      })
      .finally(() => setLoading(false));
  }, [fileUrl, doc?.id]);

  useEffect(() => {
    if (!isMadeSomeEdit) return;
    if (pages.length === 0) {
      setMergedPdfUrl(null);
      setUpdatedFileAndUrl({ url: "", file: null });
      return;
    }

    const updatedPages = pages.map((page, index) => ({
      ...page,
      pageNumber: index + 1,
    }));

    const needsUpdate = updatedPages.some(
      (page, index) => page.pageNumber !== pages[index].pageNumber
    );

    if (needsUpdate) {
      setPages(updatedPages);
    }

    generateMergedPdf(updatedPages);
  }, [pages]);

  const generateMergedPdf = async (currentPages: PageData[]) => {
    if (!isMadeSomeEdit) return;
    try {
      const { url, file } = await pageDataArrayToPdfUrl(currentPages);
      setMergedPdfUrl(url);
      setUpdatedFileAndUrl({ url, file });
    } catch (error) {
      console.error("Error generating merged PDF:", error);
      setMergedPdfUrl(null);
      setUpdatedFileAndUrl({ url: "", file: null });
    }
  };

  const generatePageThumbnails = async (pagesToRender: PageData[] = pages) => {
    for (const pageData of pagesToRender) {
      if (pageImages[pageData.id]) continue; // Skip existing thumbnails
      setRenderingProgress((prev) => ({ ...prev, [pageData.id]: true }));
      try {
        const pdfBytes = await pageData.pdfDoc.save();
        const blob = new Blob([new Uint8Array(pdfBytes)], {
          type: "application/pdf",
        });
        const thumbnailUrl = await createThumbnailFromPdfBlob(
          blob,
          pageData.pageNumber
        );
        setPageImages((prev) => ({
          ...prev,
          [pageData.id]:
            thumbnailUrl || createPlaceholderImage(pageData.pageNumber),
        }));
      } catch (error) {
        console.error(
          "Error generating thumbnail for page:",
          pageData.id,
          error
        );
        setPageImages((prev) => ({
          ...prev,
          [pageData.id]: createPlaceholderImage(pageData.pageNumber),
        }));
      }
      setRenderingProgress((prev) => ({ ...prev, [pageData.id]: false }));
    }
  };

  const createThumbnailFromPdfBlob = async (
    blob: Blob,
    pageNumber: number
  ): Promise<string | null> => {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const scale = 0.5;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      if (!context) return null;
      await page.render({ canvasContext: context, viewport }).promise;
      return canvas.toDataURL();
    } catch (error) {
      console.error("Error creating thumbnail:", error);
      return null;
    }
  };

  const createPlaceholderImage = (pageNumber: number): string => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = 150;
      canvas.height = 200;
      ctx.fillStyle = "#f8f9fa";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#dee2e6";
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      ctx.fillStyle = "#6c757d";
      ctx.fillRect(30, 40, 90, 100);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(32, 42, 86, 96);
      ctx.fillStyle = "#dee2e6";
      for (let i = 0; i < 8; i++) {
        const y = 50 + i * 10;
        const width = i === 7 ? 40 : 70;
        ctx.fillRect(40, y, width, 2);
      }
      ctx.fillStyle = "#6c757d";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.fillText(`Page ${pageNumber}`, canvas.width / 2, canvas.height - 15);
    }
    return canvas.toDataURL();
  };

  const updatePlacedObjectsAfterPageChange = (
    oldPages: PageData[],
    newPages: PageData[]
  ) => {
    const pageIdToNewNumber: Record<string, number> = {};
    newPages.forEach((p, idx) => {
      pageIdToNewNumber[p.id] = idx + 1;
    });

    setPlacedObjects((prevObjects) =>
      prevObjects.map((obj) => {
        const oldPageObj = oldPages.find(
          (p) => p.pageNumber === obj.pageNumber
        );
        if (!oldPageObj) return obj;
        const newPageNumber = pageIdToNewNumber[oldPageObj.id];
        return newPageNumber ? { ...obj, pageNumber: newPageNumber } : obj;
      })
    );
  };

  const movePage = (index: number, direction: 1 | -1) => {
    setIsMadeSomeEdit(true)
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    setPages((prevPages) => {
      const newPages = reorderPages(prevPages, index, targetIndex);
      updatePlacedObjectsAfterPageChange(prevPages, newPages);
      return newPages;
    });
  };

  const deletePage = (index: number) => {
    setIsMadeSomeEdit(true)
    const pageIdToDelete = pages[index].id;

    setPages((prevPages) => {
      const newPages = prevPages.filter((_, i) => i !== index);
      setPlacedObjects((prev) =>
        prev.filter((obj) => {
          const oldPage = prevPages.find(
            (p) => p.pageNumber === obj.pageNumber
          );
          return oldPage?.id !== pageIdToDelete;
        })
      );
      updatePlacedObjectsAfterPageChange(prevPages, newPages);
      setPageImages((prev) => {
        const updated = { ...prev };
        delete updated[pageIdToDelete];
        return updated;
      });
      return newPages;
    });
  };

  const handlePageClickInternal = (pageId: string, pageNumber: number) => {
    setActivePageId(pageId);
    handlePageClick(pageNumber);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please select a PDF file");
      return;
    }
    setIsMadeSomeEdit(true)

    try {
      const fileUrl = URL.createObjectURL(file);
      await addPagesFromPdf(fileUrl, file.name);
    } catch (error) {
      console.error("Error adding pages:", error);
      alert("Error adding pages from the selected PDF");
    } finally {
      setIsAddingPages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const addPagesFromPdf = async (pdfUrl: string, fileName: string) => {
    setIsAddingPages(true);

    try {
      const response = await fetch(pdfUrl);
      const pdfBytes = await response.arrayBuffer();
      const sourcePdf = await PDFDocument.load(pdfBytes);

      const newPages: PageData[] = [];
      const pageCount = sourcePdf.getPageCount();

      for (let i = 0; i < pageCount; i++) {
        const pageId = `${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}-${i}`;
        const pageNumber = pages.length + i + 1;

        const singlePagePdf = await PDFDocument.create();
        const [copiedPage] = await singlePagePdf.copyPages(sourcePdf, [i]);
        singlePagePdf.addPage(copiedPage);

        newPages.push({
          id: pageId,
          pageNumber,
          pdfBytes: new Uint8Array(pdfBytes),
          pdfDoc: singlePagePdf,
          sourceDocId: `upload-${Date.now()}`,
          fileName,
        });
      }

      setPages((prevPages) => {
        const updatedPages = [...prevPages, ...newPages];
        generatePageThumbnails(newPages);
        return updatedPages;
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      throw error;
    }
  };

  const downloadMergedPdf = () => {
    if (mergedPdfUrl) {
      const link = document.createElement("a");
      link.href = mergedPdfUrl;
      link.download = `merged-document-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="w-[200px] p-5 text-center text-gray-500 flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-[200px] overflow-auto p-4 bg-gray-100 border border-gray-300 rounded"
    >
      <div className="mb-4 space-y-2">
        {pages.length > 0 && (
          <div className="text-xs text-gray-600 text-center">
            {pages.length} page{pages.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {doc && pages.length > 0 ? (
        <div className="flex flex-col gap-4">
          {pages.map((page, index) => (
            <div
              key={page.id}
              onClick={() => handlePageClickInternal(page.id, page.pageNumber)}
              className={`group relative cursor-pointer rounded-lg p-2 transition-all ${
                activePageId === page.id
                  ? "border-2 border-blue-500 bg-blue-50 shadow-md"
                  : "border border-gray-300 bg-white shadow-sm"
              }`}
            >
              {index > 0 && (
                <button
                  disabled={readonly}
                  onClick={(e) => {
                    e.stopPropagation();
                    movePage(index, -1);
                  }}
                  className="absolute top-1 right-1 hidden group-hover:flex p-1 bg-white rounded shadow hover:bg-gray-100 z-10"
                  title="Move Up"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </button>
              )}

              <div className="relative mb-2">
                {renderingProgress[page.id] ? (
                  <div className="flex h-[120px] items-center justify-center rounded bg-gray-200 text-xs text-gray-500">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-100 border-t-blue-500" />
                    Processing...
                  </div>
                ) : (
                  <img
                    src={
                      pageImages[page.id] ||
                      createPlaceholderImage(page.pageNumber)
                    }
                    alt={`Page ${page.pageNumber}`}
                    className="w-full max-h-40 rounded shadow"
                  />
                )}
              </div>

              <div className="text-center text-xs text-gray-600 font-medium">
                Page {page.pageNumber}
              </div>

              {index < pages.length - 1 && (
                <button
                  disabled={readonly}
                  onClick={(e) => {
                    e.stopPropagation();
                    movePage(index, 1);
                  }}
                  className="absolute bottom-1 right-1 hidden group-hover:flex p-1 bg-white rounded shadow hover:bg-gray-100 z-10"
                  title="Move Down"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-gray-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              )}

              {pages.length !== 1 && (
                <button
                  disabled={readonly}
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePage(index);
                  }}
                  className="absolute bottom-1 left-1 hidden group-hover:flex p-1 bg-white rounded shadow hover:bg-red-100 z-10"
                  title="Delete Page"
                >
                  <Trash size={15} color="red" />
                </button>
              )}
            </div>
          ))}

          <Button
            onClick={handleFileSelect}
            disabled={isAddingPages || readonly}
            className="text-sm p-2"
            title="Add pages from PDF"
            size={"sm"}
            variant={"outline"}
          >
            {isAddingPages ? (
              <>
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus size={10} />
                Add Pages
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="text-center text-gray-500 p-10">
          <div className="text-2xl">📄</div>
          {doc ? "No pages found in document" : "No document selected"}
          <div className="mt-4">
            <button
              onClick={handleFileSelect}
              className="flex items-center justify-center gap-2 mx-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Upload size={16} />
              Select PDF File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfEditablePagination;
