import React, { useRef, useState } from "react";
import {
  useQuery,
  getAllDocuments,
  getDownloadDocumentSignedURL,
} from "wasp/client/operations";
import {
  uploadDocumentWithProgress,
  type FileUploadError,
} from "../documentUploading";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { cn } from "../../../lib/utils";
import { useDrop } from "react-dnd";
import { type Document } from "wasp/entities";
import { DocumentCard } from "../components/DocListCard";

// DnD item type for file
const FILE = "FILE";

export default function DocumentsContainer() {
  const {
    data: documents,
    isLoading,
    error,
    refetch,
  } = useQuery(getAllDocuments);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
  const [uploadError, setUploadError] = useState<FileUploadError | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "columns">("columns");

  // react-dnd drop
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: [FILE],
    // We use native file drag, so monitor only
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
    // No drop handler here, we use native file drop
  });

  // Native file drop handler
  const handleNativeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/pdf") {
      handleFileUpload(file);
    } else if (file) {
      setUploadError({
        message: "Only PDF files are allowed.",
        code: "INVALID_FILE_TYPE",
      });
    }
  };

  const handleUploadClick = () => inputRef.current?.click();

  const handleFileUpload = async (file: File) => {
    setUploadError(null);
    setUploadProgressPercent(0);
    setUploadingFile(file);
    try {
      await uploadDocumentWithProgress({
        file,
        setUploadProgressPercent,
        makeTemplate: false
      });
      refetch();
      setUploadingFile(null);
    } catch (err: any) {
      setUploadError(
        err && err.code
          ? err
          : {
              message: err?.message || "Failed to upload document.",
              code: "UPLOAD_FAILED",
            }
      );
      setUploadingFile(null);
    } finally {
      setUploadProgressPercent(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  if (error)
    return (
      <div className="text-center text-red-500">Error loading documents.</div>
    );

  // No documents: show upload button and optional uploading state, not centered
  if (!documents || documents.length === 0) {
    return (
      <div
        ref={drop}
        className="p-8 w-full max-w-2xl mx-auto relative"
        onDrop={handleNativeDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-6">
          <div className="flex flex-row gap-4 items-center">
            <Button
              size="lg"
              className="text-lg px-8 py-4 m-auto"
              onClick={handleUploadClick}
              variant="default"
            >
              Start signing, upload file
            </Button>
            <Input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {/* <span className="text-gray-500">or use the upload button</span> */}
          </div>
          {uploadError && (
            <div className="text-red-500 mt-2">{uploadError.message}</div>
          )}
          {uploadingFile && (
            <div className="w-full max-w-md">
              <div className="flex items-center gap-2">
                <span className="font-medium">{uploadingFile.name}</span>
                <span className="text-xs text-gray-400">Uploading...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgressPercent}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {uploadProgressPercent}%
              </div>
            </div>
          )}
        </div>
        {(isOver || canDrop) && (
          <div
            className={cn(
              "fixed inset-0 z-50 flex items-center justify-center bg-blue-900/60",
              "transition-colors duration-200"
            )}
            style={{ pointerEvents: "all" }}
          >
            <div className="bg-white rounded-xl shadow-2xl px-12 py-10 text-center border-4 border-blue-500">
              <div className="text-blue-700 font-semibold text-2xl mb-2">
                Drop your PDF here to upload
              </div>
              <div className="text-gray-500">Only PDF files are supported</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Documents exist: show list, upload button, and only show drop area on drag
  return (
    <div
      ref={drop}
      className="p-4 w-full container mx-auto relative"
      onDrop={handleNativeDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Uploaded Documents</h2>
        <div className="flex gap-2 items-center">
          <Button
            onClick={handleUploadClick}
            disabled={!!uploadingFile}
            variant="default"
          >
            Upload PDF
          </Button>
        </div>
        <Input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      {uploadError && (
        <div className="text-red-500 mb-2">{uploadError.message}</div>
      )}
      {(isOver || canDrop) && (
        <div
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center bg-blue-900/60",
            "transition-colors duration-200"
          )}
          style={{ pointerEvents: "all" }}
        >
          <div className="bg-white rounded-xl shadow-2xl px-12 py-10 text-center border-4 border-blue-500">
            <div className="text-blue-700 font-semibold text-2xl mb-2">
              Drop your PDF here to upload
            </div>
            <div className="text-gray-500">Only PDF files are supported</div>
          </div>
        </div>
      )}
      <div
        className={cn(
          viewMode === "columns"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
            : "grid gap-4"
        )}
      >
        {uploadingFile && (
          <DocumentCard
            doc={{}}
            uploadProgressPercent={uploadProgressPercent}
          />
        )}
        {documents.map((doc: Document) => (
          <DocumentCard doc={doc} key={doc.id} />
        ))}
      </div>
    </div>
  );
}
