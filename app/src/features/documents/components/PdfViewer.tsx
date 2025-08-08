import { FC, useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
import { PlacedObjectComponent } from "./PlacedObject";
import { PlacedAsset, Recipient } from "wasp/entities";
import { Asset, EditType, PlacedObject } from "../types";
import {
  OnDocumentLoadSuccess,
  OnPageLoadSuccess,
  OnRenderSuccess,
} from "react-pdf/dist/shared/types.js";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export type PlacedAssetWithRecipient = PlacedAsset & {
  recipient: Recipient | null;
};

type PdfViewerProps = {
  fileUrl: string | null;
  placedAssets?: PlacedAssetWithRecipient[];
  isPlacedValueVisible?: boolean;
  isPlacedValueEdittable?: boolean;
  isPlacedReadOnly?: boolean;
  setSelectedObject?: React.Dispatch<React.SetStateAction<string | null>>;
  updateObjectPosition?: (
    id: string,
    xPercent: number,
    yPercent: number
  ) => void;
};

export const PdfViewer: FC<PdfViewerProps> = ({
  fileUrl,
  placedAssets = [],
  isPlacedReadOnly = true,
  isPlacedValueEdittable = false,
  isPlacedValueVisible = true,
  setSelectedObject,
  updateObjectPosition,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null); // Add ref for page element

  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [pageHeight, setPageHeight] = useState<number>(1000);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);

  useEffect(() => {
    if (placedAssets) {
      setAssets((prev) => [
        ...prev,
        ...placedAssets.map((i) => ({
          id: i.id,
          dataUrl: i.value,
          type: i.type as EditType,
        })),
      ]);
      setPlacedObjects(
        placedAssets.map((i) => ({
          id: i.id,
          type: i.type as EditType,
          assetId: i.id,
          xPercent: i.xPercent,
          yPercent: i.yPercent,
          widthPercent: i.widthPercent,
          heightPercent: i.heightPercent,
          pageNumber: i.pageNumber,
          color: i.recipient?.color || "transparent",
          recipientId: i.recipientId!,
          value: i.value,
        }))
      );
    }
  }, [placedAssets]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      console.log(containerRef.current.classList);
      if (containerWidth) {
        const newWidth = containerWidth;
        setWidth(newWidth);
        setPageHeight(containerHeight);

        // Don't automatically set pageHeight here anymore
        // Let it be calculated based on actual PDF dimensions
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [containerRef.current]);

  useEffect(() => {
    if (!pageRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        if (height > 0 && height !== pageHeight) {
          console.log("ResizeObserver detected height:", height);
          setPageHeight(height);
        }
      }
    });

    const pageElement = pageRef.current.querySelector(".react-pdf__Page");
    if (pageElement) {
      resizeObserver.observe(pageElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, pageHeight]);

  useEffect(() => {
    if (!fileUrl) {
      setError("No PDF URL provided");
      setIsLoading(false);
      setNumPages(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(fileUrl, { method: "HEAD" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to access PDF: ${response.statusText}`);
        }
      })
      .catch((err) => {
        setError(err.message);
        setIsLoading(false);
      });
  }, [fileUrl]);

  const handleLoadSuccess: OnDocumentLoadSuccess = ({
    numPages,
  }: {
    numPages: number;
  }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  // Method 1: Handle page render success to get actual dimensions
  const handlePageRenderSuccess: OnRenderSuccess = useCallback(
    (page) => {
      console.log("Page rendered successfully");

      // Get the rendered page element
      const pageElement = pageRef.current?.querySelector(
        ".react-pdf__Page__canvas"
      ) as HTMLCanvasElement;
      if (pageElement) {
        const actualHeight = pageElement.height * (width / pageElement.width);
        console.log("Calculated page height:", actualHeight);
        setPageHeight(actualHeight);
      }
    },
    [width]
  );

  // Method 2: Alternative approach using page load success
  const handlePageLoadSuccess: OnPageLoadSuccess = useCallback(
    (page: any) => {
      console.log("Page loaded successfully");

      // Get page dimensions from the PDF page object
      const { width: pageWidth, height: pageHeightPdf } = page.getViewport({
        scale: 1,
      });

      // Calculate the scaled height based on our desired width
      const scaledHeight = (pageHeightPdf / pageWidth) * width;
      console.log("PDF Page dimensions:", { pageWidth, pageHeightPdf });
      console.log("Scaled height:", scaledHeight);

      setPageHeight(scaledHeight);
    },
    [width]
  );

  const handleLoadError = (e: Error) => {
    setError(`Failed to load PDF: ${e.message}`);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 relative max-w-full overflow-x-auto">
      {isLoading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Loading PDF...</span>
          </div>
        </div>
      )}

      {/* {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-medium">Error loading PDF:</p>
          <p className="text-sm">{error}</p>
        </div>
      )} */}

      {fileUrl && (
        <div
          ref={containerRef}
          className={`transition-opacity duration-300 ${
            isLoading ? "opacity-70" : "opacity-100"
          }`}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={handleLoadError}
            className="pdf-document "
            loading={<div>Loading PDF...</div>}
          >
            {numPages &&
              Array.from({ length: numPages }, (_, index) => {
                const pageNumber = index + 1;
                return (
                  <div
                    key={`page_${pageNumber}`}
                    className="relative mb-8 last:mb-0 mx-auto"
                    ref={pageRef} // Add ref here
                  >
                    <div className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <Page
                        pageNumber={pageNumber}
                        width={width}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="pdf-page"
                        onRenderSuccess={handlePageRenderSuccess}
                        onLoadSuccess={handlePageLoadSuccess}
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                        Page {pageNumber}
                      </div>
                      {placedObjects
                        .filter((img) => img.pageNumber === pageNumber)
                        .map((placedAsset) => (
                          <PlacedObjectComponent
                            key={placedAsset.id}
                            placedAsset={placedAsset}
                            containerRef={containerRef}
                            asset={assets.find(
                              (a) => a.id === placedAsset.assetId
                            )}
                            pageWidth={width}
                            pageHeight={pageHeight}
                            isSelected={false}
                            setSelectedObject={(id) => setSelectedObject?.(id)}
                            updateObjectPosition={(id, xPercent, yPercent) => {
                              updateObjectPosition?.(id, xPercent, yPercent);
                            }}
                            onDelete={() => {}}
                            isReadOnly={isPlacedReadOnly}
                            isValueEdittable={isPlacedValueEdittable}
                            showValue={isPlacedValueVisible}
                          />
                        ))}
                    </div>
                  </div>
                );
              })}
          </Document>
        </div>
      )}

      {!fileUrl && !isLoading && (
        <div className="text-center text-gray-500 py-12">
          <div className="text-4xl mb-4">📄</div>
          <p>No PDF to display</p>
        </div>
      )}
    </div>
  );
};
