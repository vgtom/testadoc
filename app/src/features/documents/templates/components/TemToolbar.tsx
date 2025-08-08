import {
  Calendar,
  Download,
  EllipsisVertical,
  Save,
  Send,
  Signature,
  Text,
} from "lucide-react";
import React, { FC, useCallback, useEffect, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { PDFDocument } from "pdf-lib";
import {
  createPlacedAssetsByTemplateId,
  getRecipientsByTemplateId,
  updateRecipient,
  updateTemplate,
  useQuery,
} from "wasp/client/operations";
import RecipientFormDialog from "./RecipientForm";
import { cn } from "../../../../client/cn";
import {
  Asset,
  CompleteTemplateObject,
  EditType,
  PlacedObject,
  RecipientWithContact,
} from "../../types";
import { toast } from "sonner";
import { Recipient } from "wasp/entities";
import { Pencil, Trash2 } from "lucide-react";
import { deleteRecipient } from "wasp/client/operations"; // ✅ Add these
import { uploadDocumentWithProgress } from "../../documentUploading";
import { CgProfile } from "react-icons/cg";
import { makeColorTransparent } from "../../../../lib/utils";

const templateAssetTools: Asset[] = [
  {
    type: EditType.TEMPLATE_DATE,
    dataUrl: "",
    id: "1",
    name: "Date",
  },
  {
    type: EditType.TEMPLATE_INITIAL,
    dataUrl: "",
    id: "2",
    name: "Initial",
  },
  {
    type: EditType.TEMPLATE_SIGN,
    dataUrl: "",
    id: "3",
    name: "Signature",
  },
];

type DocTemplateEditorToolbarProp = {
  setShowDrawingPanel: React.Dispatch<React.SetStateAction<boolean>>;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  placedImages: PlacedObject[];
  setPlacedImages: React.Dispatch<React.SetStateAction<PlacedObject[]>>;
  fileUrl: string | null;
  template: CompleteTemplateObject | null;
  setActiveRecipient: React.Dispatch<
    React.SetStateAction<Recipient | undefined>
  >;
  activeRecipient: Recipient | undefined;
  updatedFileAndUrl: {
    url: string;
    file: File | null;
  };
  onSendForSignClick?: () => void;
  isReadOnly?: boolean;
};

const TemplateEditorToolbar: FC<DocTemplateEditorToolbarProp> = ({
  setShowDrawingPanel,
  setAssets,
  assets,
  placedImages,
  setPlacedImages,
  fileUrl,
  template,
  activeRecipient,
  setActiveRecipient,
  updatedFileAndUrl,
  onSendForSignClick,
  isReadOnly,
}) => {
  const [showSignRecipientForm, setShowSignRecipientForm] = useState(false);
  const [editRecipient, setEditRecipient] =
    useState<RecipientWithContact | null>(null); // ✅ For editing

  const { data: recipients } = useQuery(getRecipientsByTemplateId, {
    templateId: template?.id,
  });

  useEffect(() => {
    if (!recipients) return;

    setPlacedImages((prev) =>
      prev.map((obj) => {
        const recipient = recipients.find((r) => r.id === obj.recipientId);
        return recipient
          ? { ...obj, color: recipient.color || undefined }
          : obj;
      })
    );
  }, [recipients, setPlacedImages]);

  useEffect(() => {
    if (!recipients?.[0]?.id) return;
    setActiveRecipient(recipients?.[0]);
    // setActiveRecipientColor(getRecipientColor(0))
  }, [recipients]);

  useEffect(() => {
    setAssets((prev) => [...prev, ...templateAssetTools]);
  }, []);

  const handleEditClick = (recipient: RecipientWithContact) => {
    if (isReadOnly) {
      toast.error("You can't modify already sent templates");
      return;
    }
    setEditRecipient(recipient);
    setShowSignRecipientForm(true);
  };

  const handleDeleteClick = async (recipientId: string) => {
    if (isReadOnly) {
      toast.error("You can't modify already sent templates");
      return;
    }
    if (!confirm("Are you sure you want to delete this recipient?")) return;
    try {
      await deleteRecipient({ recipientId });
      setPlacedImages((prev) =>
        prev.filter((i) => i.recipientId !== recipientId)
      );
      toast.success("Recipient deleted");
      setActiveRecipient(undefined);
    } catch (err) {
      toast.error("Error deleting recipient");
      console.error(err);
    }
  };

  const handleAssetDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    assetId: string
  ) => {
    if (isReadOnly) {
      toast.error("You can't modify already sent templates");
      return;
    }
    e.dataTransfer.setData("text/plain", `asset:${assetId}`);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleAddSignRecipientClick = () => {
    if (isReadOnly) {
      toast.error("You can't modify already sent templates");
      return;
    }
    setShowSignRecipientForm(true);
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
            (overlay.heightPercent || 0) * pageHeight;
          const w = overlay.widthPercent * pageWidth;
          const h = (overlay.heightPercent || 0) * pageHeight;
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
    if (isReadOnly) {
      toast.error("You can't modify already sent templates");
      return;
    }
    if (!template?.documentId) {
      toast.error("Template and document required");
      return;
    }

    try {
      const dataToSave = {
        documentId: template.documentId,
        templateId: template.id,
        placedAssets: placedImages.map((placedObj) => ({
          pageNumber: placedObj.pageNumber,
          type: placedObj.type,
          value: assets.find((i) => i.id === placedObj.assetId)?.dataUrl || "",
          xPercent: placedObj.xPercent,
          yPercent: placedObj.yPercent,
          widthPercent: placedObj.widthPercent,
          heightPercent: placedObj.heightPercent,
          documentId: template.documentId,
          recipientId: placedObj.recipientId as string,
        })),
      };

      console.log("saveToDB: updatedFileAndUrl", updatedFileAndUrl);

      if (updatedFileAndUrl.file) {
        const newDoc = await uploadDocumentWithProgress({
          file: updatedFileAndUrl.file,
          makeTemplate: false,
          setUploadProgressPercent(percent) {
            console.log("Upload progress:", percent);
          },
        });

        dataToSave.documentId = newDoc.doc.id;
        dataToSave.placedAssets.forEach((i) => (i.documentId = newDoc.doc.id));

        await updateTemplate({
          templateId: template.id,
          documentId: newDoc.doc.id,
        });
      }

      await createPlacedAssetsByTemplateId(dataToSave);
      toast.success("Saved successfully!");
    } catch (err) {
      console.error("Error saving to DB:", err);
      toast.error("Error saving to database");
    }
  }, [template, placedImages, assets, updatedFileAndUrl]);

  const handleSendForSignClick = () => {
    if (
      !confirm(
        "You won't be able to make anychanges to the template after sending for sign. Are you sure to send?"
      )
    )
      return;
    if (!template?.id) {
      toast.error("Template ID not set.");
      return;
    }
    if (!recipients?.[0].id) return;
    onSendForSignClick?.();
    saveToDB().then(() => {
      updateRecipient({
        recipientId: recipients?.[0].id,
        status: "Recieved",
      }).then(() => {
        toast.success("Sent to first recipient for sign...");
      });
      updateTemplate({ templateId: template.id, status: "Sent" }).then(() => {
        toast.success("Sent for sign...");
      });
    });
  };

  return (
    <>
      <RecipientFormDialog
        showSignRecipientForm={showSignRecipientForm}
        setShowSignRecipientForm={(val) => {
          setShowSignRecipientForm(val);
          if (!val) setEditRecipient(null);
        }}
        templateId={template?.id}
        recipientToEdit={editRecipient} // ✅ Pass this in
      />

      <div className="w-64 bg-white shadow-lg p-4 border-r overflow-y-auto grid grid-rows-[1fr_min-content]">
        <div className="mb-6 ">
          <div className="space-y-2 py-2">
            {recipients?.map((recipient, index) => (
              <div
                key={recipient.id}
                onClick={() => {
                  setActiveRecipient(recipient);
                }}
                style={{
                  backgroundColor:
                    makeColorTransparent(
                      recipient.color || "transparent",
                      10
                    ) || "transparent",
                  borderColor:
                    activeRecipient?.id === recipient.id ? recipient.color || "transparent" : "",
                }}
                className={cn(
                  "p-2 bg-gray-100 text-sm text-gray-700 border-2 border-transparent rounded-lg cursor-pointer flex   items-center group gap-1 relative"
                )}
              >
                <CgProfile color={recipient.color || "transparent"} />
                <span className=" text-sm"> {recipient.contact.email}</span>
                <span className="flex gap-1 opacity-0 group-hover:opacity-100 absolute right-3 bg-white p-2 ">
                  <button
                    className="text-gray-600 hover:text-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(recipient);
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(recipient.id);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </span>
              </div>
            ))}

            <Button
              onClick={handleAddSignRecipientClick} // TODO: Replace with modal or form
              variant={"outline"}
              className="w-full"
            >
              + Add Recipient
            </Button>
          </div>
          <hr />
          <div className="space-y-2 py-2">
            {templateAssetTools.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-move border"
                style={{
                  backgroundColor: activeRecipient?.color || "transparent",
                }}
                draggable
                onDragStart={(e) => handleAssetDragStart(e, asset.id)}
              >
                <EllipsisVertical />

                {asset.type === EditType.TEMPLATE_DATE && <Calendar />}
                {asset.type === EditType.TEMPLATE_INITIAL && <Text />}
                {asset.type === EditType.TEMPLATE_SIGN && <Signature />}

                {asset.type === EditType.IMAGE && (
                  <img
                    src={asset.dataUrl}
                    alt="Asset"
                    className="w-10 h-10 object-cover rounded border"
                  />
                )}
                <div className="flex-1">
                  <span className="text-sm font-medium">{asset.name}</span>
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

        <div className="mb-6 h-fit">
          <div className="space-y-2">
            {/* <Button
              onClick={exportAsJSON}
              className="w-full flex bg-gray-600"
            >
              <Download size={18} /> Export as JSON
            </Button> */}

            <Button
              onClick={handleSendForSignClick}
              disabled={isReadOnly}
              className="w-full flex bg-gray-800"
            >
              <Send size={18} /> Send for sign
            </Button>
            <Button
              onClick={saveToDB}
              className="w-full flex bg-gray-800"
              disabled={isReadOnly}
            >
              <Save size={18} /> Save
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateEditorToolbar;
