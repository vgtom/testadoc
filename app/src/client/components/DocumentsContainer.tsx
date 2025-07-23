import React, { useRef } from 'react';
import { useQuery, getAllDocuments, createDocument } from 'wasp/client/operations';

const statusColors = {
  Draft: 'bg-yellow-100 text-yellow-800',
  Sent: 'bg-blue-100 text-blue-800',
  Signed: 'bg-green-100 text-green-800',
};

export default function DocumentsContainer() {
  const { data: documents, isLoading, error, refetch } = useQuery(getAllDocuments);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await createDocument({ fileName: file.name, fileType: file.type });
      refetch();
      alert('Document upload initiated. Please refresh to see status.');
    } catch (err) {
      alert('Failed to upload document.');
    }
    e.target.value = '';
  };

  if (isLoading) return <div>Loading documents...</div>;
  if (error) return <div>Error loading documents.</div>;

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Uploaded Documents</h2>
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={handleUploadClick}
      >
        Upload PDF
      </button>
      <input
        ref={inputRef}
        id="document-upload-input"
        type="file"
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div className="space-y-2">
        {!documents || documents.length === 0 ? (
          <div>No documents found.</div>
        ) : (
          documents.map((doc: any) => (
            <div key={doc.id} className="flex items-center justify-between p-3 border rounded shadow-sm">
              <div>
                <span className="font-medium">{doc.name}</span>
                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline">View</a>
              </div>
              <span className={`px-2 py-1 rounded text-xs font-semibold || 'bg-gray-100 text-gray-800'}`}>{doc.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
