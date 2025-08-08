import React, { useEffect, useRef, useState, useCallback } from "react";
import { Document as PdfDocument, Page } from "react-pdf";
import DrawingPanel from "../../components/DrawingPanel";
import {
  Asset,
  CompleteTemplateObject,
  EditType,
  PageData,
  PlacedObject,
} from "../../types";
import { Recipient } from "wasp/entities";
import toast from "react-hot-toast";
import PdfEdittablePagination from "../../components/PdfEdittablePagination";
import { PlacedObjectComponent } from "../../components/PlacedObject";
import TemplateEditorToolbar from "../components/TemToolbar";
import PdfPage from "../../components/PdfPage";

type TemplateEditorProps = {
  template: CompleteTemplateObject | null;
  fileUrl: string | null;
};

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  fileUrl,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null); // Add ref for page element

  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [pageHeight, setPageHeight] = useState<number>(1000);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showDrawingPanel, setShowDrawingPanel] = useState<boolean>(false);
  const [activeRecipient, setActiveRecipient] = useState<Recipient>();

  const [assets, setAssets] = useState<Asset[]>([]);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<number>(1);
  const [pages, setPages] = useState<PageData[]>([]);
  const [updatedFileAndUrl, setUpdatedFileAndUrl] = useState<{
    url: string;
    file: File | null;
  }>({ url: "", file: null });
  const [isReadOnly, setIsReadOnly] = useState(true);

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
          value:
            template.status === "Sent" || template.status === "Completed"
              ? i.value
              : "",
        }))
      );
    }
  }, [template]);

  useEffect(() => {
    if (
      template &&
      template?.status !== "Sent" &&
      template?.status !== "Completed"
    )
      setIsReadOnly(false);
  }, [template]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const containerHeight = containerRef.current.offsetHeight;
      console.log(containerRef.current.classList)
      if (containerWidth) {
        const newWidth = containerWidth
        setWidth(newWidth);
        setPageHeight(containerHeight)
        
        // Don't automatically set pageHeight here anymore
        // Let it be calculated based on actual PDF dimensions
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

  // Method 1: Handle page render success to get actual dimensions
  const handlePageRenderSuccess = useCallback((page: any) => {
    console.log('Page rendered successfully');
    
    // Get the rendered page element
    const pageElement = pageRef.current?.querySelector('.react-pdf__Page__canvas') as HTMLCanvasElement;
    if (pageElement) {
      const actualHeight = pageElement.height * (width / pageElement.width);
      console.log('Calculated page height:', actualHeight);
      setPageHeight(actualHeight);
    }
  }, [width]);

  // Method 2: Alternative approach using page load success
  const handlePageLoadSuccess = useCallback((page: any) => {
    console.log('Page loaded successfully');
    
    // Get page dimensions from the PDF page object
    const { width: pageWidth, height: pageHeightPdf } = page.getViewport({ scale: 1 });
    
    // Calculate the scaled height based on our desired width
    const scaledHeight = (pageHeightPdf / pageWidth) * width;
    console.log('PDF Page dimensions:', { pageWidth, pageHeightPdf });
    console.log('Scaled height:', scaledHeight);
    
    setPageHeight(scaledHeight);
  }, [width]);

  // Method 3: Use ResizeObserver to monitor the actual rendered page size
  useEffect(() => {
    if (!pageRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        if (height > 0 && height !== pageHeight) {
          console.log('ResizeObserver detected height:', height);
          setPageHeight(height);
        }
      }
    });
    
    const pageElement = pageRef.current.querySelector('.react-pdf__Page');
    if (pageElement) {
      resizeObserver.observe(pageElement);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [activePage, width]);

  const pixelsToPercent = useCallback(
    (pixelValue: number, totalSize: number): number => {
      return pixelValue / totalSize;
    },
    []
  );

  const updateImagePosition = useCallback(
    (id: string, xPercent: number, yPercent: number) => {
      // Clamp the position to ensure it stays within page bounds
      const clampedXPercent = Math.max(0, Math.min(1, xPercent));
      const clampedYPercent = Math.max(0, Math.min(1, yPercent));

      setPlacedObjects((prev) => {
        const index = prev.findIndex((img) => img.id === id);
        if (index === -1) return prev;
        const newImages = [...prev];
        newImages[index] = {
          ...newImages[index],
          xPercent: clampedXPercent,
          yPercent: clampedYPercent,
        };
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
      if (isReadOnly) {
        toast.error("Read-only mode!");
      }
      const data = e.dataTransfer.getData("text/plain");
      console.log(data);

      // Get the PDF page element specifically
      const pageElement = e.currentTarget;
      const rect = pageElement.getBoundingClientRect();

      // Calculate position relative to the PDF page
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Ensure the drop is within bounds
      if (x < 0 || y < 0 || x > width || y > pageHeight) {
        return; // Don't place if outside page bounds
      }

      if (!activeRecipient?.id) {
        toast.error("Recipient must be selected");
        return;
      }

      if (data.startsWith("asset:")) {
        const assetId = data.replace("asset:", "");
        const asset = assets.find((a) => a.id === assetId);
        if (!asset) return;

        // const initialWidth = 200;
        // const initialHeight = 150;

        const newImage: PlacedObject = {
          id: Date.now().toString(),
          type: asset.type,
          assetId,
          xPercent: pixelsToPercent(x, width),
          yPercent: pixelsToPercent(y, pageHeight),
          widthPercent: .2,
          heightPercent: null,
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
          console.log(newImages);
          return newImages;
        });
        setSelectedImage(imageId);
      }
    },
    [
      assets,
      placedObjects,
      pixelsToPercent,
      width,
      pageHeight,
      activeRecipient,
      isReadOnly,
    ]
  );

  const handleDeleteAsset = (assetId: string) =>
    setPlacedObjects((prev) => prev.filter((i) => i.id !== assetId));

  const handlePageClick = (pagenum: number) => setActivePage(pagenum);

  if (!template?.document) return null;
  return (
    <div className="flex h-[calc(100vh-6rem)] bg-gray-50">
      {/* Pagination now contains all the reorder logic */}
      <PdfEdittablePagination
        setUpdatedFileAndUrl={setUpdatedFileAndUrl}
        doc={template.document}
        fileUrl={fileUrl}
        handlePageClick={handlePageClick}
        pages={pages}
        setPages={setPages}
        placedObjects={placedObjects}
        setPlacedObjects={setPlacedObjects}
        readonly={isReadOnly}
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
            className="bg-white rounded-lg shadow-lg w-full relative  "

            ref={containerRef}
          >
            {template && (
              <PdfDocument
                file={updatedFileAndUrl.url || fileUrl}
                onLoadSuccess={handleLoadSuccess}
                onLoadError={(e: Error) => setError(e.message)}
                className="pdf-document"
              >
                <div
                  key={`page_${activePage}`}
                  className={`relative mb-8 last:mb-0 w-fit`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, activePage)}
                  ref={pageRef} // Add ref here
                >
                  <div className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <Page
                      pageNumber={activePage}
                      width={width}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="pdf-page w-fit m-auto"
                      onRenderSuccess={handlePageRenderSuccess} // Method 1
                      onLoadSuccess={handlePageLoadSuccess}     // Method 2
                    />
                    {/* Remove the fixed red overlay and use actual page height */}
                    {/* <div 
                      className="bg-red-400 h-full top-0 left-0 z-80 absolute" 
                      style={{
                        width: width - 10, 
                        height: pageHeight // This will now use the actual calculated height
                      }}
                    >
                    </div> */}
                    <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                      Page {activePage}
                    </div>
                    {placedObjects
                      .filter((img) => img.pageNumber === activePage)
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
                          isSelected={selectedImage === placedAsset.id}
                          setSelectedObject={setSelectedImage}
                          updateObjectPosition={updateImagePosition}
                          onDelete={handleDeleteAsset}
                          isReadOnly={isReadOnly}
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
        updatedFileAndUrl={updatedFileAndUrl}
        template={template}
        setAssets={setAssets}
        assets={assets}
        fileUrl={fileUrl}
        placedImages={placedObjects}
        setPlacedImages={setPlacedObjects}
        setShowDrawingPanel={setShowDrawingPanel}
        activeRecipient={activeRecipient}
        setActiveRecipient={setActiveRecipient}
        onSendForSignClick={() => setIsReadOnly(true)}
        isReadOnly={isReadOnly}
      />
    </div>
  );
};