import React, { useEffect, useRef, useState, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { PDFDocument } from "pdf-lib";
import { Pencil, Square, Circle, Download, Trash2, Save } from "lucide-react";
import { Button } from "../components/ui/button";
import {debounce} from "lodash";
import { PlacedImageComponent } from "./components/DocumentPlacedImage";

// Mock dependencies
const mockDocumentId: string = "sample-doc-123";
// const mockGetDownloadUrl = async (): Promise<string> =>
//   "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";
const mockWithProtectedLayout = <T extends React.ComponentType<any>>(Component: T): T => Component;

export interface Asset {
  id: string;
  dataUrl: string;
}

export interface PlacedImage {
  id: string;
  assetId: string;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
  pageNumber: number;
}

interface DrawingTool {
  type: "pen" | "rectangle" | "circle";
  color: string;
  size: number;
}

interface DrawingState {
  isDrawing: boolean;
  startX: number;
  startY: number;
  context: CanvasRenderingContext2D | null;
}




type DocumentEditorProps = {
  fileUrl: string | null;
};


const DocumentEditor: React.FC<DocumentEditorProps> = ({fileUrl}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef<DrawingState>({
    isDrawing: false,
    startX: 0,
    startY: 0,
    context: null,
  });

  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pageHeight, setPageHeight] = useState<number>(0);
  const [showDrawingPanel, setShowDrawingPanel] = useState<boolean>(false);
  const [currentTool, setCurrentTool] = useState<DrawingTool>({
    type: "pen",
    color: "#000000",
    size: 2,
  });
  const [assets, setAssets] = useState<Asset[]>([]);
  const [placedImages, setPlacedImages] = useState<PlacedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<number>(1);

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

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (context) {
        drawingRef.current.context = context;
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = currentTool.color;
        context.lineWidth = currentTool.size;
      }
    }
  }, [showDrawingPanel, currentTool.color, currentTool.size]);

  const handleLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const pixelsToPercent = useCallback((pixelValue: number, totalSize: number): number => {
    return pixelValue / totalSize;
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.context) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    drawingRef.current.isDrawing = true;
    drawingRef.current.startX = x;
    drawingRef.current.startY = y;
    const ctx = drawingRef.current.context;
    ctx.strokeStyle = currentTool.color;
    ctx.lineWidth = currentTool.size;
    if (currentTool.type === "pen") {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  }, [currentTool.color, currentTool.size, currentTool.type]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current.isDrawing || !drawingRef.current.context) return;
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = drawingRef.current.context;
    if (currentTool.type === "pen") {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const startX = drawingRef.current.startX;
      const startY = drawingRef.current.startY;
      const width = x - startX;
      const height = y - startY;
      ctx.beginPath();
      if (currentTool.type === "rectangle") {
        ctx.rect(startX, startY, width, height);
      } else if (currentTool.type === "circle") {
        const radius = Math.sqrt(width * width + height * height);
        ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      }
      ctx.stroke();
    }
  }, [currentTool.type]);

  const stopDrawing = () => {
    drawingRef.current.isDrawing = false;
  };

  const clearCanvas = useCallback(() => {
    if (drawingRef.current.context && canvasRef.current) {
      drawingRef.current.context.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
    }
  }, []);

  const saveDrawingAsAsset = useCallback(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    const newAsset: Asset = {
      id: Date.now().toString(),
      dataUrl,
    };
    setAssets((prev) => [...prev, newAsset]);
    clearCanvas();
    setShowDrawingPanel(false);
  }, [clearCanvas]);

  const updateImagePosition = useCallback((id: string, xPercent: number, yPercent: number) => {
    setPlacedImages((prev) => {
      const index = prev.findIndex((img) => img.id === id);
      if (index === -1) return prev;
      const newImages = [...prev];
      newImages[index] = { ...newImages[index], xPercent, yPercent };
      return newImages;
    });
  }, []);

  const deleteImage = (imageId: string) => {
    setPlacedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleAssetDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, assetId: string) => {
    e.dataTransfer.setData("text/plain", `asset:${assetId}`);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleImageDragStart = useCallback((e: React.DragEvent<HTMLDivElement>, imageId: string) => {
    e.dataTransfer.setData("text/plain", `image:${imageId}`);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>, pageNumber: number) => {
    e.preventDefault();
    const data = e.dataTransfer.getData("text/plain");
    const pageElement = e.currentTarget;
    const rect = pageElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (data.startsWith("asset:")) {
      const assetId = data.replace("asset:", "");
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return;

      const initialWidth = 200;
      const initialHeight = 150;
      const newImage: PlacedImage = {
        id: Date.now().toString(),
        assetId,
        xPercent: pixelsToPercent(x, width),
        yPercent: pixelsToPercent(y, pageHeight),
        widthPercent: pixelsToPercent(initialWidth, width),
        heightPercent: pixelsToPercent(initialHeight, pageHeight),
        pageNumber,
      };
      setPlacedImages((prev) => [...prev, newImage]);
      setSelectedImage(newImage.id);
    } else if (data.startsWith("image:")) {
      const imageId = data.replace("image:", "");
      const imageIndex = placedImages.findIndex((img) => img.id === imageId);
      if (imageIndex === -1) return;

      setPlacedImages((prev) => {
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
  }, [assets, placedImages, pixelsToPercent, width, pageHeight]);

  const exportAsJSON = useCallback(async () => {
    try {
      const exportData = {
        originalPDF: fileUrl,
        assets,
        placedImages,
        timestamp: new Date().toISOString(),
      };
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `edited-document-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      alert("Document exported as JSON!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Error exporting document as JSON");
    }
  }, [fileUrl, assets, placedImages]);

  const exportAsPDF = useCallback(async () => {
    try {
      if (!fileUrl) throw new Error("No PDF loaded");
      const existingPdfBytes = await fetch(fileUrl).then((res) => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const pageNumber = i + 1;
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const overlays = placedImages.filter((img) => img.pageNumber === pageNumber);
        for (const overlay of overlays) {
          const asset = assets.find((a) => a.id === overlay.assetId);
          if (!asset) continue;
          const pngImageBytes = await fetch(asset.dataUrl).then((res) => res.arrayBuffer());
          const pngImage = await pdfDoc.embedPng(pngImageBytes);
          const x = overlay.xPercent * pageWidth;
          const y = pageHeight - (overlay.yPercent * pageHeight) - (overlay.heightPercent * pageHeight);
          const w = overlay.widthPercent * pageWidth;
          const h = overlay.heightPercent * pageHeight;
          page.drawImage(pngImage, { x, y, width: w, height: h });
        }
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `edited-document-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      alert("Document exported as PDF!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Error exporting document as PDF");
    }
  }, [placedImages, assets, fileUrl]);

  const handlePageClick = (pageNumber: number) => {
    setActivePage(pageNumber);
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] bg-gray-50">
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-2xl max-w-4xl w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">Draw Asset</h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={clearCanvas}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Clear
                    </Button>
                    <Button
                      onClick={saveDrawingAsAsset}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                    >
                      <Save size={16} /> Save to Assets
                    </Button>
                    <Button
                      onClick={() => setShowDrawingPanel(false)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
                <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={700}
                    height={500}
                    className="bg-white cursor-crosshair block"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Draw on the canvas above, then click "Save to Assets" to add it to the assets list
                </p>
              </div>
            </div>
          )}
          <div
            ref={containerRef}
            className="bg-white rounded-lg shadow-lg p-6 relative"
          >
            {fileUrl && (
              <Document
                file={fileUrl}
                onLoadSuccess={handleLoadSuccess}
                onLoadError={(e: Error) => setError(e.message)}
                className="pdf-document"
              >
                {Array.from(new Array(numPages), (_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <div
                      key={`page_${pageNumber}`}
                      className={`relative mb-8 last:mb-0 cursor-pointer ${
                        activePage === pageNumber ? "border-2 border-blue-500 rounded-lg" : ""
                      }`}
                      onClick={() => handlePageClick(pageNumber)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, pageNumber)}
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
                        {placedImages
                          .filter((img) => img.pageNumber === pageNumber)
                          .map((image) => (
                            <PlacedImageComponent
                              key={image.id}
                              image={image}
                              assets={assets}
                              width={width}
                              pageHeight={pageHeight}
                              selectedImage={selectedImage}
                              setSelectedImage={setSelectedImage}
                              updateImagePosition={updateImagePosition}
                              // onDragStart={handleImageDragStart}
                            />
                          ))}
                      </div>
                    </div>
                  );
                })}
              </Document>
            )}
          </div>
        </div>
      </div>
      <div className="w-64 bg-white shadow-lg p-4 border-r overflow-y-auto">
        <h2 className="text-xl font-bold mb-6 text-gray-800">PDF Editor</h2>
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-700">Active Page</h3>
          <select
            value={activePage}
            onChange={(e) => setActivePage(Number(e.target.value))}
            className="w-full p-2 border rounded-lg"
          >
            {Array.from(new Array(numPages), (_, index) => (
              <option key={index + 1} value={index + 1}>
                Page {index + 1}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-700">Drawing Tools</h3>
          <Button
            onClick={() => setShowDrawingPanel(true)}
            className="w-full flex items-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Pencil size={18} /> New Drawing
          </Button>
        </div>
        {showDrawingPanel && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-medium mb-3 text-gray-700">Drawing Tool</h4>
            <div className="flex gap-2 mb-3">
              {[
                { type: "pen" as const, icon: Pencil, label: "Pen" },
                { type: "rectangle" as const, icon: Square, label: "Rectangle" },
                { type: "circle" as const, icon: Circle, label: "Circle" },
              ].map(({ type, icon: Icon, label }) => (
                <Button
                  key={type}
                  onClick={() => setCurrentTool((prev) => ({ ...prev, type }))}
                  className={`p-2 rounded-lg transition-colors ${
                    currentTool.type === type
                      ? "bg-blue-500 text-white"
                      : "bg-white border hover:bg-gray-100"
                  }`}
                  title={label}
                >
                  <Icon size={16} />
                </Button>
              ))}
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Color:
              </label>
              <input
                type="color"
                value={currentTool.color}
                onChange={(e) =>
                  setCurrentTool((prev) => ({ ...prev, color: e.target.value }))
                }
                className="w-full h-10 rounded-lg border"
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1 text-gray-600">
                Size: {currentTool.size}px
              </label>
              <input
                type="range"
                min="1"
                max="20"
                value={currentTool.size}
                onChange={(e) =>
                  setCurrentTool((prev) => ({
                    ...prev,
                    size: parseInt(e.target.value),
                  }))
                }
                className="w-full"
              />
            </div>
          </div>
        )}
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-700">Assets ({assets.length})</h3>
          <div className="space-y-2">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-move"
                draggable
                onDragStart={(e) => handleAssetDragStart(e, asset.id)}
              >
                <img
                  src={asset.dataUrl}
                  alt="Asset"
                  className="w-10 h-10 object-cover rounded border"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium">Asset {asset.id.slice(-4)}</span>
                </div>
              </div>
            ))}
            {assets.length === 0 && (
              <p className="text-sm text-gray-500 italic">No assets created yet</p>
            )}
          </div>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-700">Placed Images ({placedImages.length})</h3>
          <div className="space-y-2">
            {placedImages.map((image) => {
              const asset = assets.find((a) => a.id === image.assetId);
              if (!asset) return null;
              return (
                <div
                  key={image.id}
                  className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-move"
                  draggable
                  onDragStart={(e) => handleImageDragStart(e, image.id)}
                >
                  <img
                    src={asset.dataUrl}
                    alt="Placed drawing"
                    className="w-10 h-10 object-cover rounded border"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium">Drawing {image.id.slice(-4)}</span>
                    <div className="text-xs text-gray-500">Page {image.pageNumber}</div>
                  </div>
                  <Button
                    onClick={() => deleteImage(image.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              );
            })}
            {placedImages.length === 0 && (
              <p className="text-sm text-gray-500 italic">No images placed yet</p>
            )}
          </div>
        </div>
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-700">Export Options</h3>
          <div className="space-y-2">
            <Button
              onClick={exportAsJSON}
              disabled={placedImages.length === 0}
              className="w-full flex items-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={18} /> Export as JSON
            </Button>
            <Button
              onClick={exportAsPDF}
              disabled={placedImages.length === 0}
              className="w-full flex items-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={18} /> Export as PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default mockWithProtectedLayout(DocumentEditor);