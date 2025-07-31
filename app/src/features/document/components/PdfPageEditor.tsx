import { useEffect, useState } from "react";
import { Document } from "wasp/entities";

interface PdfPageEditorProps {
  document: Document;
  pages: Array<{
    id: string;
    pageNumber: number;
    originalPageNumber: number;
    pdfDoc: any;
    sourceDocId?: string;
  }>;
  availableDocuments: Document[];
  hasChanges: boolean;
  isLoading: boolean;
  error: string | null;
  onReorderPages: (sourceIndex: number, destinationIndex: number) => void;
  onAddPage: (doc: Document, pageNum: number, insertAt: number) => void;
  onRemovePage: (pageIndex: number) => void;
  onDuplicatePage: (pageIndex: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onSetError: (error: string | null) => void;
}

const PdfPageEditor: React.FC<PdfPageEditorProps> = ({
  document,
  pages,
  availableDocuments,
  hasChanges,
  isLoading,
  error,
  onReorderPages,
  onAddPage,
  onRemovePage,
  onDuplicatePage,
  onSave,
  onCancel,
  onSetError,
}) => {
  const [draggedItem, setDraggedItem] = useState<number | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [selectedPageNum, setSelectedPageNum] = useState<number>(1);
  const [insertPosition, setInsertPosition] = useState<number>(pages.length + 1);

  // Update insert position when pages change
  useEffect(() => {
    setInsertPosition(pages.length + 1);
  }, [pages.length]);

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedItem !== null && draggedItem !== dropIndex) {
      onReorderPages(draggedItem, dropIndex);
    }
    
    setDraggedItem(null);
  };

  const handleAddSelectedPage = () => {
    if (selectedDoc) {
      onAddPage(selectedDoc, selectedPageNum, insertPosition);
      
      // Reset form
      setSelectedDoc(null);
      setSelectedPageNum(1);
      setInsertPosition(pages.length + 2); // Will be updated by useEffect
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold">Edit: {document.name}</h3>
          {hasChanges && (
            <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
              Unsaved changes
            </span>
          )}
          {error && (
            <span className="text-sm text-red-600 bg-red-100 px-2 py-1 rounded">
              {error}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!hasChanges || isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              hasChanges && !isLoading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex">
        {/* Main editing area */}
        <div className="flex-1 p-6 overflow-auto max-h-[600px]">
          <div className="space-y-4">
            {pages.map((page, index) => (
              <div
                key={page.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className={`relative border-2 rounded-lg p-4 cursor-move transition-all ${
                  draggedItem === index
                    ? 'border-blue-500 shadow-lg bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Page header */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">
                      ⋮⋮ Page {page.pageNumber}
                    </span>
                    {page.sourceDocId && page.sourceDocId !== document.id && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        From other document
                      </span>
                    )}
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => onDuplicatePage(index)}
                      className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      title="Duplicate page"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => onRemovePage(index)}
                      className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                      title="Remove page"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Page preview placeholder */}
                <div className="w-full h-32 bg-gray-100 rounded flex items-center justify-center">
                  <span className="text-gray-500">Page {page.originalPageNumber} Preview</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar for adding pages */}
        <div className="w-80 bg-gray-50 p-4 border-l border-gray-200">
          <h4 className="text-lg font-semibold mb-4">Add Pages</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Document
              </label>
              <select
                value={selectedDoc?.id || ''}
                onChange={(e) => {
                  const doc = availableDocuments.find(d => d.id === e.target.value);
                  setSelectedDoc(doc || null);
                  setSelectedPageNum(1);
                }}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a document...</option>
                {availableDocuments.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedDoc && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedPageNum}
                    onChange={(e) => setSelectedPageNum(parseInt(e.target.value) || 1)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insert at Position
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={pages.length + 1}
                    value={insertPosition}
                    onChange={(e) => setInsertPosition(parseInt(e.target.value) || 1)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleAddSelectedPage}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Page
                </button>
              </>
            )}

            {availableDocuments.length === 0 && (
              <div className="text-gray-500 text-sm">
                No other documents available to add pages from.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfPageEditor;