import React, { useEffect, useRef, useState, useCallback } from "react";
import { Document as PdfDocument, Page } from "react-pdf";
import DrawingPanel from "../components/DrawingPanel";
import DocumentEditorToolbar from "../components/EditorToolbar";
import { Document, PlacedAsset } from "wasp/entities";
import PdfPagination from "../components/PdfPagination";
import { Asset, EditType, PlacedObject } from "../types";
import { PlacedObjectComponent } from "../components/PlacedObject";

type DocumentEditorProps = {
  doc: (Document & { placedAssets: PlacedAsset[] }) | null;
  fileUrl: string | null;
};

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  doc,
  fileUrl,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pageHeight, setPageHeight] = useState<number>(1000);
  const [showDrawingPanel, setShowDrawingPanel] = useState<boolean>(false);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<number>(1);

  useEffect(() => {
    if (doc && doc.placedAssets) {
      setAssets((prev) => [
        ...prev,
        ...doc.placedAssets.map((i) => ({
          id: i.id,
          dataUrl: i.value,
          type: i.type as EditType,
        })),
      ]);
      setPlacedObjects(
        doc.placedAssets.map((i) => ({
          id: i.id,
          type: i.type as EditType,
          assetId: i.id,
          xPercent: i.xPercent,
          yPercent: i.yPercent,
          widthPercent: i.widthPercent,
          heightPercent: i.heightPercent,
          pageNumber: i.pageNumber,
        }))
      );
    }
  }, [doc]);

  useEffect(() => {
    console.log(assets);
  }, [assets]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      const containerWidth = containerRef.current?.offsetWidth;
      if (containerWidth) {
        const newWidth = containerWidth - 100;
        setWidth(newWidth);
        setPageHeight(newWidth * 1.414);
      }
    };
    updateWidth();
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

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

      if (data.startsWith("asset:")) {
        console.log(data);
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
    [assets, placedObjects, pixelsToPercent, width, pageHeight]
  );

  const handleDeleteAsset = (assetId: string) =>
    setPlacedObjects((prev) => prev.filter((i) => i.id !== assetId));

  const handlePageClick = (pagenum: number) => setActivePage(pagenum);

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-gray-50">
      <PdfPagination
        doc={doc}
        fileUrl={fileUrl}
        handlePageClick={handlePageClick}
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
            className="bg-white rounded-lg shadow-lg p-6 relative"
          >
            {doc && (
              <PdfDocument
                file={fileUrl}
                onLoadSuccess={handleLoadSuccess}
                onLoadError={(e: Error) => setError(e.message)}
                className="pdf-document"
              >
                <div
                  key={`page_${activePage}`}
                  className={`relative mb-8 last:mb-0 cursor-pointer`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, activePage)}
                >
                  <div className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <Page
                      pageNumber={activePage}
                      width={width}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="pdf-page"
                    />
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                      Page {activePage}
                    </div>
                    {placedObjects
                      .filter((img) => img.pageNumber === activePage)
                      .map((image) => (
                        <PlacedObjectComponent
                          key={image.id}
                          placedAsset={image}
                          asset={assets.find((a) => a.id === image.id)}
                          width={width}
                          pageHeight={pageHeight}
                          isSelected={selectedImage === image.id}
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

      <DocumentEditorToolbar
        doc={doc}
        assets={assets}
        fileUrl={fileUrl}
        placedImages={placedObjects}
        setPlacedImages={setPlacedObjects}
        setShowDrawingPanel={setShowDrawingPanel}
      />
    </div>
  );
};
