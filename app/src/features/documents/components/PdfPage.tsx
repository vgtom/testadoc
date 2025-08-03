import React from 'react'
import { Document, Page, pdfjs } from 'react-pdf'

// Load worker from CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`

interface PdfPageProps {
  fileUrl: string
  pageNumber: number
  width: number
}

const PdfPage: React.FC<PdfPageProps> = ({ fileUrl, pageNumber, width }) => {
  return (
    <div className="pdf-page-container relative">
      <Document
        file={fileUrl}
        onLoadError={(error) => console.error('PDF load error:', error)}
        loading={<div>Loading PDF...</div>}
      >
        <div className="relative">

        <Page
          pageNumber={pageNumber}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          width={width} // adjust width as needed
          className={"border border-red-700"}
          />
          </div>
      </Document>
    </div>
  )
}

export default PdfPage
