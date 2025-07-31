import React, { useEffect, useRef, useState, useCallback } from "react";
import { Document as PdfDocument, Page } from "react-pdf";
import DrawingPanel from "../components/DrawingPanel";
import TemplateEditorToolbar from "../components/TemplateToolbar";
import {
  Asset,
  CompleteTemplateObject,
  EditType,
  PageData,
  PlacedObject,
} from "../types";
import { PlacedObjectComponent } from "../components/PlacedObject";
import { Recipient } from "wasp/entities";
import PdfEdittablePagination from "../components/PdfEdittablePagination";
import toast from "react-hot-toast";

type TemplateEditorProps = {
  template: CompleteTemplateObject | null;
  fileUrl: string | null;
};

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  fileUrl,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pageHeight, setPageHeight] = useState<number>(1000);
  const [showDrawingPanel, setShowDrawingPanel] = useState<boolean>(false);
  const [activeRecipient, setActiveRecipient] = useState<Recipient>();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<number>(1);
  const [pages, setPages] = useState<PageData[]>([]);

  useEffect(() => {
    if (template && template.placedAssets) {
      setAssets((prev) => [
        ...prev,
        ...template.placedAssets.map((i) => ({
          id: i.id,
          dataUrl: i.value,
          type: i.type as EditType,
        })),
      ]);
      setPlacedObjects(
        template.placedAssets.map((i) => ({
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
        }))
      );
    }
  }, [template]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      if (containerWidth) {
        const newWidth = containerWidth - 100;
        setWidth(newWidth);
        setPageHeight(newWidth);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [containerRef.current]);

  const handleLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    []
  );

  const pixelsToPercent = useCallback(
    (pixelValue: number, totalSize: number): number => {
      return pixelValue / totalSize;
    },
    []
  );

  const updateImagePosition = useCallback(
    (id: string, xPercent: number, yPercent: number) => {
      setPlacedObjects((prev) => {
        const index = prev.findIndex((img) => img.id === id);
        if (index === -1) return prev;
        const newImages = [...prev];
        newImages[index] = { ...newImages[index], xPercent, yPercent };
        return newImages;
      });
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, pageNumber: number) => {
      e.preventDefault();
      const data = e.dataTransfer.getData("text/plain");
      const pageElement = e.currentTarget;
      const rect = pageElement.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (!activeRecipient?.id) {
        toast.error("Recipient must be selected");
        return;
      }
      if (data.startsWith("asset:")) {
        const assetId = data.replace("asset:", "");
        const asset = assets.find((a) => a.id === assetId);
        if (!asset) return;
        const initialWidth = 200;
        const initialHeight = 150;
        const newImage: PlacedObject = {
          id: Date.now().toString(),
          type: asset.type,
          assetId,
          xPercent: pixelsToPercent(x, width),
          yPercent: pixelsToPercent(y, pageHeight),
          widthPercent: pixelsToPercent(initialWidth, width),
          heightPercent: pixelsToPercent(initialHeight, pageHeight),
          pageNumber,
          color: activeRecipient?.color || "transparent",
          recipientId: activeRecipient?.id,
        };
        setPlacedObjects((prev) => [...prev, newImage]);
        setSelectedImage(newImage.id);
      } else if (data.startsWith("image:")) {
        const imageId = data.replace("image:", "");
        const imageIndex = placedObjects.findIndex((img) => img.id === imageId);
        if (imageIndex === -1) return;
        setPlacedObjects((prev) => {
          const newImages = [...prev];
          newImages[imageIndex] = {
            ...newImages[imageIndex],
            pageNumber,
            xPercent: pixelsToPercent(x, width),
            yPercent: pixelsToPercent(y, pageHeight),
          };
          return newImages;
        });
        setSelectedImage(imageId);
      }
    },
    [assets, placedObjects, pixelsToPercent, width, pageHeight, activeRecipient]
  );

  const handleDeleteAsset = (assetId: string) =>
    setPlacedObjects((prev) => prev.filter((i) => i.id !== assetId));

  const handlePageClick = (pagenum: number) => setActivePage(pagenum);

  if (!template?.document) return null;
  return (
    <div className="flex h-[calc(100vh-6rem)] bg-gray-50">
      {/* Pagination now contains all the reorder logic */}
      <PdfEdittablePagination
        doc={template?.document}
        fileUrl={fileUrl}
        handlePageClick={handlePageClick}
        pages={pages}
        setPages={setPages}
        placedObjects={placedObjects}
        setPlacedObjects={setPlacedObjects}
      />

      <div className="flex-1 p-6 overflow-auto ">
        <div className="max-w-4xl mx-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading PDF...</span>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {showDrawingPanel && (
            <DrawingPanel
              setAssets={setAssets}
              setShowDrawingPanel={setShowDrawingPanel}
            />
          )}

          <div
            ref={containerRef}
            className="bg-white rounded-lg shadow-lg p-6 relative "
          >
            {template && (
              <PdfDocument
                file={fileUrl}
                onLoadSuccess={handleLoadSuccess}
                onLoadError={(e: Error) => setError(e.message)}
                className="pdf-document"
              >
                <div
                  key={`page_${activePage}`}
                  className={`relative mb-8 last:mb-0 cursor-pointer w-fit`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, activePage)}
                >
                  <div className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <Page
                      pageNumber={activePage}
                      width={width}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="pdf-page w-fit m-auto"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                      Page {activePage}
                    </div>
                    {placedObjects
                      .filter((img) => img.pageNumber === activePage)
                      .map((placedAsset) => (
                        <PlacedObjectComponent
                          key={placedAsset.id}
                          placedAsset={placedAsset}
                          asset={assets.find(
                            (a) => a.id === placedAsset.assetId
                          )}
                          pageWidth={width}
                          pageHeight={pageHeight}
                          isSelected={selectedImage === placedAsset.id}
                          setSelectedObject={setSelectedImage}
                          updateObjectPosition={updateImagePosition}
                          onDelete={handleDeleteAsset}
                        />
                      ))}
                  </div>
                </div>
              </PdfDocument>
            )}
          </div>
        </div>
      </div>

      <TemplateEditorToolbar
        template={template}
        setAssets={setAssets}
        assets={assets}
        fileUrl={fileUrl}
        placedImages={placedObjects}
        setPlacedImages={setPlacedObjects}
        setShowDrawingPanel={setShowDrawingPanel}
        activeRole={activeRecipient}
        setActiveRole={setActiveRecipient}
      />
    </div>
  );
};
