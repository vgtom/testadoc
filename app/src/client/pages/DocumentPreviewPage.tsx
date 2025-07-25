import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import { getDownloadDocumentSignedURLByDocId } from "wasp/client/operations";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
import withProtectedLayout from "../../client/HOC/withProtectedLayout";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const DocumentPreviewPage = () => {
  const { documentId } = useParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800); // Default width
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch PDF URL
  useEffect(() => {
    const fetchPdfUrl = async () => {
      setLoading(true);
      setError(null);
      try {
        if (!documentId) throw new Error("Document ID is missing");
        const url = await getDownloadDocumentSignedURLByDocId({ id: documentId });
        setFileUrl(url);
      } catch (err: any) {
        setError(err.message || "Failed to load PDF URL");
      } finally {
        setLoading(false);
      }
    };
    fetchPdfUrl();
  }, [documentId]);

  // Observe container width
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      const containerWidth = containerRef.current?.offsetWidth;
      if (containerWidth) setWidth(containerWidth - 100);
    };

    updateWidth(); // Initial
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Document Preview</h1>
      {loading && <p>Loading PDF...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div ref={containerRef} className="border p-4 bg-white w-full">
        {fileUrl && (
          <Document file={fileUrl} onLoadSuccess={handleLoadSuccess} onLoadError={(e) => setError(e.message)}>
            {Array.from(new Array(numPages), (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={width}
                renderTextLayer={false}
                
              />
            ))}
          </Document>
        )}
      </div>
    </div>
  );
};

export default withProtectedLayout(DocumentPreviewPage, "Edit");
