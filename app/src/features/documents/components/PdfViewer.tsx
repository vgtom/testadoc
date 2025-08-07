import { FC, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
import { PlacedObjectComponent } from "./PlacedObject";
import { PlacedAsset, Recipient } from "wasp/entities";
import { Asset, EditType, PlacedObject } from "../types";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export type PlacedAssetWithRecipient = PlacedAsset & { recipient: Recipient | null };

type PdfViewerProps = {
  fileUrl: string | null;
  placedAssets?: PlacedAssetWithRecipient[];
};

export const PdfViewer: FC<PdfViewerProps> = ({
  fileUrl,
  placedAssets = [],
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800);
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
    if (!containerRef.current) return;

    const updateWidth = () => {
      const containerWidth = containerRef.current?.offsetWidth;
      if (containerWidth) setWidth(containerWidth - 100);
    };

    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

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

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const handleLoadError = (e: Error) => {
    setError(`Failed to load PDF: ${e.message}`);
    setIsLoading(false);
  };

  return (
    <div
      
      className="bg-white rounded-lg shadow-lg p-6 relative max-w-full overflow-x-auto"
    >
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
                  >
                    <div className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                      <Page
                        pageNumber={pageNumber}
                        width={width}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="pdf-page"
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
                            pageHeight={900}
                            isSelected={false}
                            setSelectedObject={() => {}}
                            updateObjectPosition={() => {}}
                            onDelete={() => {}}
                            isReadOnly={true}
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
