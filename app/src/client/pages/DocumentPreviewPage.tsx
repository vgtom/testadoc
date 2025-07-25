import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getDownloadDocumentSignedURL } from "wasp/client/operations";
import { getDocument } from "pdfjs-dist";
import { getDownloadDocumentSignedURLByDocId } from "wasp/client/operations";
import { PDFWorker } from "pdfjs-dist";

const DocumentPreviewPage = () => {
//   pdfjs.GlobalWorkerOptions.workerSrc = useMemo(
//     () =>
//       new URL("pdfjs-dist/build/pdf.worker.min.js", import.meta.url).toString(),
//     []
//   );

  const { documentId } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const renderPdf = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         // Get signed URL for the document
//         // const signedUrl = await getDownloadDocumentSignedURLByDocId({ id: documentId!  });
//         const signedUrl =
//           "http://localhost:9000/testadoc-files/85b9c386-53fe-46ce-a89b-b5a5c5a4d213/2fd9d9e0-e0ee-4561-9e54-eaff68ba9a83.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=minioadmin%2F20250725%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20250725T141727Z&X-Amz-Expires=3600&X-Amz-Signature=53f39dc21c9cbb572e32daf01b6166df71e54907cc1df8d6cb1e7ebabbf4b952&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject";
//         // Load PDF
//         const loadingTask = getDocument(signedUrl);
//         const pdf = await loadingTask.promise;
//         const page = await pdf.getPage(1);
//         const viewport = page.getViewport({ scale: 1.5 });
//         const canvas = canvasRef.current;
//         if (!canvas) throw new Error("Canvas not found");
//         const context = canvas.getContext("2d");
//         canvas.height = viewport.height;
//         canvas.width = viewport.width;
//         await page.render({ canvasContext: context!, viewport }).promise;
//       } catch (err: any) {
//         setError(err.message || "Failed to load PDF");
//       } finally {
//         setLoading(false);
//       }
//     };
//     if (documentId) renderPdf();
//   }, [documentId]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Document Preview</h1>
      {loading && <p>Loading PDF...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid #ccc",
          display: loading ? "none" : "block",
        }}
      />
    </div>
  );
};

export default DocumentPreviewPage;
