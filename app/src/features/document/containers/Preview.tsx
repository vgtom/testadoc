import { FC, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min?url";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

type DocumentPreviewProps = {
  fileUrl: string | null;
};

export const DocumentPreview: FC<DocumentPreviewProps> = ({fileUrl}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [width, setWidth] = useState<number>(800); // Default width
  const [error, setError] = useState<string | null>(null);


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
    <div
      ref={containerRef}
      className="bg-white rounded-lg shadow-lg p-6 relative"
    >
      {error && <p>{error}</p>}
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
                className={`relative mb-8 last:mb-0 `}
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
                </div>
              </div>
            );
          })}
        </Document>
      )}
    </div>
  );
};
