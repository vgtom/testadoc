import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { pdfjs } from "react-pdf";
import { getDownloadDocumentSignedURLByDocId } from "wasp/client/operations";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
import withProtectedLayout from "../client/HOC/withProtectedLayout";
import DocumentEditor from "../features/document/containers/Editor";
import { getDocumentById } from "wasp/client/operations";
import { Document, DocumentEdit } from "wasp/entities";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const DocumentPreviewPage = () => {
  const { documentId } = useParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [doc, setDoc] = useState<Document & { edits: DocumentEdit[] } | null>(null)
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
        getDocumentById({id: documentId}).then(res => setDoc(res))
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
    <div >
      <DocumentEditor fileUrl={fileUrl} doc={doc} />
    </div>
  );
};

export default withProtectedLayout(DocumentPreviewPage);
