import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  getDownloadDocumentSignedURLByDocId,
  getTemplateByRecipientId,
  updatePlacedAssetsValuesByRecipientId,
  updateRecipient,
  useQuery
} from "wasp/client/operations";
import { Asset, EditType, PlacedObject } from "../../types";
import { Page, Document as PdfDocument } from "react-pdf";
import { Button } from "../../../../components/ui/button";
import { PlacedObjectComponent } from "../../components/PlacedObject";
import TemplateDrawer from "../components/TemplateSignDrawer";
import toast from "react-hot-toast";

export const TemplateSigner: React.FC = () => {
  const { recipientId } = useParams<{ recipientId: string }>();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [width, setWidth] = useState<number>(800);
  const [pageHeight, setPageHeight] = useState<number>(1000);
  const [activePage, setActivePage] = useState<number>(1);
  const [placedObjects, setPlacedObjects] = useState<PlacedObject[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [selectedObject, setSelectedObject] = useState<string | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");

  const { data: template, isLoading } = useQuery(getTemplateByRecipientId, {
    recipientId: recipientId!,
  });

  // Check if the recipient's status is 'Signed'
  const isRecipientFinished =
    template?.recipients?.find((r) => r.id === recipientId)?.status ===
    "Finished";

  useEffect(() => {
    if (!recipientId) return;
    updateRecipient({ recipientId: recipientId, status: "Viewed" });
  }, [recipientId]);

  useEffect(() => {
    if (!placedObjects.some((i) => !i.value)) setIsDrawerOpen(false);
  }, [placedObjects])

  useEffect(() => {
    console.log(placedObjects.map((i) => ({ id: i.id, value: i.value || "" })));
  }, [placedObjects]);

  useEffect(() => {
    if (!template?.id) return;
    const fetchPdfUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!template || !template?.documentId)
          throw new Error("Template is missing");
        const url = await getDownloadDocumentSignedURLByDocId({
          id: template?.documentId,
        });
        setFileUrl(url);
      } catch (err: any) {
        setError(err.message || "Failed to load PDF URL");
      } finally {
        setLoading(false);
      }
    };
    fetchPdfUrl();
  }, [template?.id]);

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const newWidth = containerWidth - 100;
      setWidth(newWidth);
      setPageHeight(newWidth); // assuming square aspect ratio
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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
          value: i.value || "",
        }))
      );
    }
  }, [template]);

  useEffect(() => {
    if (selectedObject) {
      const selectedAsset = placedObjects.find(
        (obj) => obj.id === selectedObject
      );
      if (selectedAsset) {
        setInputValue(selectedAsset.value || "");
      }
    }
  }, [selectedObject, placedObjects]);

  const handleSave = () => {
    console.log("Save button clicked");
    console.log(placedObjects);
    if (!recipientId) return;
    updatePlacedAssetsValuesByRecipientId({
      updates: placedObjects
        .filter((i) => i.recipientId === recipientId)
        .map((i) => ({
          id: i.id,
          recipientId: recipientId,
          value: i.value || "",
        })),
    }).then(() => toast("Saved successfully!"));
  };

  const handleSaveAndSendToNext = () => {
    console.log("Save and Complete button clicked");
    console.log(placedObjects);
    if (!recipientId) return;
    updatePlacedAssetsValuesByRecipientId({
      shouldSendToNextRecipient: true,
      updates: placedObjects
        .filter((i) => i.recipientId === recipientId)
        .map((i) => ({
          id: i.id,
          recipientId: recipientId,
          value: i.value || "",
        })),
    })
      .then(() => toast("Saved successfully!"))
      .catch((err) => toast.error(err.message));
  };

  const handleDecline = () => {
    console.log("Decline button clicked");
    // Add decline logic here
  };

  const handleNextAsset = () => {
    const editableTypes = [
      EditType.TEMPLATE_DATE,
      EditType.TEMPLATE_INITIAL,
      EditType.TEMPLATE_SIGN,
    ];
    const editableObjects = placedObjects
      .filter((obj) => editableTypes.includes(obj.type))
      .sort((a, b) => a.pageNumber - b.pageNumber || a.id.localeCompare(b.id));

    const currentIndex = editableObjects.findIndex(
      (obj) => obj.id === selectedObject
    );
    const nextIndex = (currentIndex + 1) % editableObjects.length;
    const nextAsset = editableObjects[nextIndex];

    if (nextAsset) {
      setSelectedObject(nextAsset.id);
      setActivePage(nextAsset.pageNumber);
      setIsDrawerOpen(true);
    }
  };

  const handlePreviousAsset = () => {
    const editableTypes = [
      EditType.TEMPLATE_DATE,
      EditType.TEMPLATE_INITIAL,
      EditType.TEMPLATE_SIGN,
    ];
    const editableObjects = placedObjects
      .filter((obj) => editableTypes.includes(obj.type))
      .sort((a, b) => a.pageNumber - b.pageNumber || a.id.localeCompare(b.id));

    const currentIndex = editableObjects.findIndex(
      (obj) => obj.id === selectedObject
    );
    const prevIndex =
      (currentIndex - 1 + editableObjects.length) % editableObjects.length;
    const prevAsset = editableObjects[prevIndex];

    if (prevAsset) {
      setSelectedObject(prevAsset.id);
      setActivePage(prevAsset.pageNumber);
      setIsDrawerOpen(true);
    }
  };



  const handleValueChange = (value: string) => {
    if (!selectedObject || isRecipientFinished) return; // Prevent changes if recipient is Signed
    setPlacedObjects((prev) =>
      prev.map((obj) => (obj.id === selectedObject ? { ...obj, value } : obj))
    );
    setInputValue(value);
  };

  if (isLoading || loading) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-4xl w-full p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
            <div className="flex items-center justify-center h-[1000px]">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-gray-600 text-lg">
                  Loading Document...
                </p>
              </div>
            </div>
            <div className="mt-4 h-8 bg-gray-200 rounded w-1/4 mx-auto"></div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !template?.document) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-4xl w-full p-6">
          <div className="bg-white rounded-lg shadow-lg p-6 text-red-600 text-center">
            Error loading template: {error || "Document not found"}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col bg-gray-50">
      <nav className="bg-white shadow-sm p-4 flex justify-end gap-4">
        <Button
          variant="default"
          onClick={handleSave}
          disabled={isRecipientFinished}
        >
          Save
        </Button>
        <Button
          variant="default"
          onClick={handleSaveAndSendToNext}
          disabled={isRecipientFinished || placedObjects.some((i) => !i.value)}
        >
          Save and Complete
        </Button>
        <Button
          variant="outline"
          onClick={handleDecline}
          disabled={isRecipientFinished}
        >
          Decline
        </Button>
      </nav>
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div
              className="bg-white rounded-lg shadow-lg p-6 relative"
              ref={containerRef}
            >
              <PdfDocument
                file={fileUrl}
                onLoadSuccess={({ numPages }) => {
                  setPageCount(numPages);
                }}
              >
                {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                  (pageData, index) => (
                    <div
                      key={`page_${index + 1}`}
                      className="relative mb-8 last:mb-0 w-fit "
                    >
                      <div className="relative border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <Page
                          pageNumber={index + 1}
                          width={width}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          className="pdf-page w-fit m-auto"
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                          Page {index + 1}
                        </div>
                        {placedObjects
                          .filter((obj) => obj.pageNumber === index + 1)
                          .map((placedAsset) => (
                            <PlacedObjectComponent
                              key={placedAsset.id}
                              placedAsset={placedAsset}
                              asset={{
                                dataUrl: placedAsset.value || "",
                                id: placedAsset.id,
                                type: placedAsset.type,
                              }}
                              containerRef={containerRef}
                              pageWidth={width}
                              pageHeight={pageHeight}
                              isSelected={selectedObject === placedAsset.id}
                              setSelectedObject={(id) => {
                                setSelectedObject(id);
                                if (id && !isRecipientFinished)
                                  setIsDrawerOpen(true);
                              }}
                              updateObjectPosition={() => {}}
                              onDelete={() => {}}
                              onResize={() => {}}
                              isReadOnly
                              isValueEdittable={!isRecipientFinished}
                            />
                          ))}
                      </div>
                    </div>
                  )
                )}
              </PdfDocument>
            </div>
          </div>
        </div>
      </div>

      <TemplateDrawer
        isOpen={isDrawerOpen}
        setIsOpen={setIsDrawerOpen}
        selectedAsset={placedObjects.find((obj) => obj.id === selectedObject)}
        inputValue={inputValue}
        setInputValue={setInputValue}
        onValueChange={handleValueChange}
        onNextAsset={handleNextAsset}
        onPreviousAsset={handlePreviousAsset}
        readOnly={isRecipientFinished}
      />
    </main>
  );
};
