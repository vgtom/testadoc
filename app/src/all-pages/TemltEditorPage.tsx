import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { pdfjs } from "react-pdf";
import {
  getDownloadDocumentSignedURLByDocId,
  getTemplateById,
} from "wasp/client/operations";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";
import withProtectedLayout from "../client/HOC/withProtectedLayout";
import { Template } from "wasp/entities";
import { TemplateEditor } from "../features/document/containers/TemltEditor";
import { CompleteTemplateObject } from "../features/document/types";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

const TemplateEditorPage = () => {
  const { templateId } = useParams();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [template, setTemplate] = useState<CompleteTemplateObject | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800); // Default width
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  

  // Fetch PDF URL
  useEffect(() => {
    const fetchPdfUrl = async () => {
      setLoading(true);
      setError(null);
      console.log(templateId);
      try {
        if (!templateId) throw new Error("Template ID is missing");
        const template: Template | null = await getTemplateById({
          id: templateId,
        });
        if (!template || !template?.documentId) throw new Error("Template is missing");
        const url = await getDownloadDocumentSignedURLByDocId({
          id: template?.documentId,
        });
        setFileUrl(url);
        getTemplateById({ id: templateId }).then((res) => setTemplate(res));
      } catch (err: any) {
        setError(err.message || "Failed to load PDF URL");
      } finally {
        setLoading(false);
      }
    };
    fetchPdfUrl();
  }, [templateId]);

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
    <div>
      <TemplateEditor fileUrl={fileUrl} template={template} />
    </div>
  );
};

export default withProtectedLayout(TemplateEditorPage);
