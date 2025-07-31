import { Circle, Download, Pencil, Save, Square, Trash2 } from "lucide-react";
import React, { FC, useCallback } from "react";
import { Button } from "../../../components/ui/button";
import { PDFDocument } from "pdf-lib";
import { Document } from "wasp/entities";
import { Asset, PlacedObject } from "../types";
import { toast } from "sonner";
import { createPlacedAssetsByDocumentId } from "wasp/client/operations";

type DocumentEditorToolbarProps = {
  setShowDrawingPanel: React.Dispatch<React.SetStateAction<boolean>>;
  assets: Asset[];
  placedImages: PlacedObject[];
  setPlacedImages: React.Dispatch<React.SetStateAction<PlacedObject[]>>;
  fileUrl: string | null;
  doc: Document | null;
};

const DocumentEditorToolbar: FC<DocumentEditorToolbarProps> = ({
  setShowDrawingPanel,
  assets,
  placedImages,
  setPlacedImages,
  fileUrl,
  doc,
}) => {
  const handleAssetDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, assetId: string) => {
      e.dataTransfer.setData("text/plain", `asset:${assetId}`);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleImageDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, imageId: string) => {
      e.dataTransfer.setData("text/plain", `image:${imageId}`);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const deleteImage = (imageId: string) => {
    setPlacedImages((prev) => prev.filter((img) => img.id !== imageId));
  };

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
      toast("Document exported as JSON!");
    } catch (error) {
      console.error("Export error:", error);
      toast("Error exporting document as JSON");
    }
  }, [fileUrl, assets, placedImages]);

  const exportAsPDF = useCallback(async () => {
    try {
      if (!fileUrl) throw new Error("No PDF loaded");
      const existingPdfBytes = await fetch(fileUrl).then((res) =>
        res.arrayBuffer()
      );
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const pageNumber = i + 1;
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const overlays = placedImages.filter(
          (img) => img.pageNumber === pageNumber
        );
        for (const overlay of overlays) {
          const asset = assets.find((a) => a.id === overlay.assetId);
          if (!asset) continue;
          const pngImageBytes = await fetch(asset.dataUrl).then((res) =>
            res.arrayBuffer()
          );
          const pngImage = await pdfDoc.embedPng(pngImageBytes);
          const x = overlay.xPercent * pageWidth;
          const y =
            pageHeight -
            overlay.yPercent * pageHeight -
            overlay.heightPercent * pageHeight;
          const w = overlay.widthPercent * pageWidth;
          const h = overlay.heightPercent * pageHeight;
          page.drawImage(pngImage, { x, y, width: w, height: h });
        }
      }
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], {
        type: "application/pdf",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `edited-document-${Date.now()}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast("Document exported as PDF!");
    } catch (error) {
      console.error("Export error:", error);
      toast("Error exporting document as PDF");
    }
  }, [placedImages, assets, fileUrl]);

  const saveToDB = useCallback(async () => {
    if (doc)
      createPlacedAssetsByDocumentId({
        documentId: doc.id,
        
        placedAssets: placedImages.map((placedObj) => ({
          pageNumber: placedObj.pageNumber,
          type: placedObj.type,
          value: assets.find((i) => i.id === placedObj.assetId)?.dataUrl || "",
          xPercent: placedObj.xPercent,
          yPercent: placedObj.yPercent,
          widthPercent: placedObj.widthPercent,
          heightPercent: placedObj.heightPercent,
          documentId: doc.id,

        })),
      });
  }, [doc, placedImages, assets, fileUrl]);

  return (
    <div className="w-64 bg-white shadow-lg p-4 border-r overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800">PDF Editor</h2>
      <div className="mb-6">
        <Button
          variant={"outline"}
          onClick={() => setShowDrawingPanel(true)}
          className="w-full flex items-center gap-2 p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Pencil size={18} /> New Drawing
        </Button>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-700">
          Assets ({assets.length})
        </h3>
        <div className="space-y-2">
          {assets.filter(i => !i.type.includes("TEMPLATE")).map((asset) => (
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
                <span className="text-sm font-medium">
                  Asset {asset.id.slice(-4)}
                </span>
              </div>
            </div>
          ))}
          {assets.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              No assets created yet
            </p>
          )}
        </div>
      </div>
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-700">
          Placed Images ({placedImages.length})
        </h3>
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
                  <span className="text-sm font-medium">
                    Drawing {image.id.slice(-4)}
                  </span>
                  <div className="text-xs text-gray-500">
                    Page {image.pageNumber}
                  </div>
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
          <Button
            onClick={saveToDB}
            // disabled={placedImages.length === 0}
            className="w-full flex items-center gap-2 p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={18} /> Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DocumentEditorToolbar;
