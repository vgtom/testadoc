import React, { FC, useEffect, useRef, useState } from "react";
import { Document, PlacedAsset } from "wasp/entities";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import { PageData, PlacedObject } from "../types";
import { getPagesFromPdfUrl, pageDataArrayToPdfUrl } from "../pdfUtils";
import { PDFDocument } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.min";

type PdfPaginationProps = {
  doc: (Document & { placedAssets?: PlacedAsset[] }) | null;
  fileUrl: string | null;
  handlePageClick: (pagenum: number) => void;
  setPages: React.Dispatch<React.SetStateAction<PageData[]>>;
  pages: PageData[];
  placedObjects: PlacedObject[];
  setPlacedObjects: React.Dispatch<React.SetStateAction<PlacedObject[]>>;
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(100);
  const [activePageId, setActivePageId] = useState<string>();
  const [pdfUrl, setPdfUrl] = useState<string | null>(fileUrl);
  const [pageImages, setPageImages] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [renderingProgress, setRenderingProgress] = useState<{
    [key: string]: boolean;
  }>({});
  const [pdfDocument, setPdfDocument] = useState<PDFDocument | null>(null);

  useEffect(() => {
    if (!fileUrl || !doc?.id) return;
    setLoading(true);
    getPagesFromPdfUrl(fileUrl, doc.id)
      .then((pagesData) => {
        setPages(pagesData);
        loadPdfDocument(fileUrl);
      })
      .finally(() => setLoading(false));
  }, [fileUrl, doc?.id]);

  useEffect(() => {
    if (pages.length > 0) {
      pageDataArrayToPdfUrl(pages).then((url) => {
        setPdfUrl(url);
      });
    }
  }, [pages]);

  useEffect(() => {
    if (pdfDocument && pages.length > 0) {
      generatePageThumbnails();
    }
  }, [pdfDocument, pages.length]);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setWidth(containerWidth - 48);
      }
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // --- PDF render/thumbnail code omitted for brevity (same as previous answers) ---
  const loadPdfDocument = async (url: string) => {
    try {
      const response = await fetch(url);
      const pdfBytes = await response.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      setPdfDocument(pdf);
    } catch (error) {
      generatePlaceholderThumbnails();
    }
  };

  const generatePageThumbnails = async () => {
    if (!pdfDocument) {
      generatePlaceholderThumbnails();
      return;
    }
    for (let i = 0; i < pages.length; i++) {
      const pageData = pages[i];
      setRenderingProgress((prev) => ({ ...prev, [pageData.id]: true }));
      try {
        const newPdf = await PDFDocument.create();
        const pageIndex = pageData.pageNumber - 1;
        if (pageIndex < pdfDocument.getPageCount()) {
          const [copiedPage] = await newPdf.copyPages(pdfDocument, [pageIndex]);
          newPdf.addPage(copiedPage);
          const pdfBytes = await newPdf.save();
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
        } else {
          setPageImages((prev) => ({
            ...prev,
            [pageData.id]: createPlaceholderImage(pageData.pageNumber),
          }));
        }
      } catch (error) {
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

  const generatePlaceholderThumbnails = () => {
    const images: { [key: string]: string } = {};
    pages.forEach((page) => {
      images[page.id] = createPlaceholderImage(page.pageNumber);
    });
    setPageImages(images);
  };
  // --- End of thumbnail helpers ---

  const updatePlacedObjectsAfterPageChange = (
    oldPages: PageData[],
    newPages: PageData[]
  ) => {
    // Map oldPageId -> its index in oldPages
    const oldPageIdToOldNumber: Record<string, number> = {};
    oldPages.forEach((p, idx) => {
      oldPageIdToOldNumber[p.id] = idx + 1;
    });
    // Map newPageId -> its number/index in newPages
    const newPageIdToNewNumber: Record<string, number> = {};
    newPages.forEach((p, idx) => {
      newPageIdToNewNumber[p.id] = idx + 1;
    });
    // For each object, find the old page's id (by pageNumber from old array),
    // then find its new position in new array
    setPlacedObjects((prevObjects) =>
      prevObjects.map((obj) => {
        // Find the old pageId this obj was attached to
        const oldPageObj = oldPages.find(
          (p) => p.pageNumber === obj.pageNumber
        );
        if (!oldPageObj) return obj;
        const newPageNumber = newPageIdToNewNumber[oldPageObj.id];
        return { ...obj, pageNumber: newPageNumber };
      })
    );
  };

  // Drag and drop handler
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    const newPages = reorderPages(
      pages,
      result.source.index,
      result.destination.index
    );
    // Resync placedObjects' pageNumbers
    updatePlacedObjectsAfterPageChange(pages, newPages);
    setPages(newPages);
  };

  // Move (up = -1, down = 1)
  const movePage = (index: number, direction: 1 | -1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    const newPages = reorderPages(pages, index, targetIndex);
    updatePlacedObjectsAfterPageChange(pages, newPages);
    setPages(newPages);
  };

  const deletePage = (index: number) => {
    const pageIdToDelete = pages[index].id;
    const newPages = pages.filter((_, i) => i !== index);
    updatePlacedObjectsAfterPageChange(pages, newPages);
    setPages(newPages);
    // Remove placed objects that were on the deleted page
    setPlacedObjects((prev) =>
      prev.filter((obj) => {
        // which page did this obj belong to?
        const oldPage = pages.find((p) => p.pageNumber === obj.pageNumber);
        if (!oldPage) return false; // should not happen
        return oldPage.id !== pageIdToDelete;
      })
    );
  };

  const handlePageClickInternal = (pageId: string, pageNumber: number) => {
    setActivePageId(pageId);
    handlePageClick(pageNumber);
  };

  if (loading) {
    return (
      <div
        className="pdf-pagination-loading w-[200px]"
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#6c757d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <div
          className="spinner"
          style={{
            width: "20px",
            height: "20px",
            border: "2px solid #f3f3f3",
            borderTop: "2px solid #007bff",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="pdf-pagination-container overflow-auto w-[200px]"
      style={{
        padding: "16px",
        backgroundColor: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #dee2e6",
      }}
    >
      {doc && pages.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="pages" direction="horizontal">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="pages-container"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "12px",
                  justifyContent: "flex-start",
                }}
              >
                {pages.map((page, index) => (
                  <Draggable key={page.id} draggableId={page.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        onClick={() =>
                          handlePageClickInternal(page.id, page.pageNumber)
                        }
                        className={`group relative w-full cursor-pointer rounded-lg p-2 transition-all duration-200 ${
                          activePageId === page.id
                            ? "border-2 border-blue-500 bg-blue-50 shadow-md"
                            : "border border-gray-300 bg-white shadow-sm"
                        } ${
                          snapshot.isDragging
                            ? "scale-105 rotate-1 shadow-lg"
                            : ""
                        }`}
                        style={{
                          ...provided.draggableProps.style,
                          minWidth: "120px",
                          maxWidth: "180px",
                        }}
                      >
                        {/* Move Up Button */}
                        {index > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              movePage(index, -1);
                            }}
                            className="absolute right-1 top-1 hidden group-hover:flex items-center justify-center rounded bg-white p-1 shadow hover:bg-gray-100 z-10"
                            title="Move Up"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-gray-700"
                              fill="none"
                              viewBox="0 0 24 24"
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

                        {/* Thumbnail */}
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
                              className="h-auto max-h-40 w-full rounded shadow"
                            />
                          )}
                        </div>

                        {/* Page Number */}
                        <div
                          className={`text-center text-xs ${
                            activePageId === page.id
                              ? "font-bold text-blue-500"
                              : "text-gray-600"
                          }`}
                        >
                          Page {page.pageNumber}
                        </div>

                        {/* Move Down Button */}
                        {index < pages.length - 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              movePage(index, 1);
                            }}
                            className="absolute right-1 bottom-1 hidden group-hover:flex items-center justify-center rounded bg-white p-1 shadow hover:bg-gray-100 z-10"
                            title="Move Down"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-gray-700"
                              fill="none"
                              viewBox="0 0 24 24"
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

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(index);
                          }}
                          className="absolute left-1 bottom-1 hidden group-hover:flex items-center justify-center rounded bg-white p-1 shadow hover:bg-red-100 z-10"
                          title="Delete Page"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-red-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "#6c757d",
            fontSize: "14px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div style={{ fontSize: "24px" }}>📄</div>
          {doc ? "No pages found in document" : "No document selected"}
        </div>
      )}
    </div>
  );
};

export default PdfEditablePagination;
