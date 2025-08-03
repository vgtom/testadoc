import { Document as PdfDocument, Page } from "react-pdf";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { Document, PlacedAsset } from "wasp/entities";

type PdfPaginationProps = {
  doc: (Document & { placedAssets?: PlacedAsset[] }) | null;
  fileUrl: string | null;
  handlePageClick: (pagenum: number) => void;
};

const PdfPagination: FC<PdfPaginationProps> = ({
  doc,
  fileUrl,
  handlePageClick,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<number>(1);
  const [width, setWidth] = useState<number>(100);
  const [pageHeight, setPageHeight] = useState<number>(0);

  const handleLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="bg-white rounded-lg shadow-lg p-6 relative overflow-auto"
    >
      {doc && (
        <PdfDocument
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
                className={`relative mb-8 last:mb-0 cursor-pointer rounded-lg border-2 ${
                  activePage === pageNumber
                    ? " border-blue-500 "
                    : ""
                }`}
                onClick={() => { 
                    setActivePage(pageNumber)
                    handlePageClick(pageNumber)}}
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
        </PdfDocument>
      )}
    </div>
  );
};

export default PdfPagination;
