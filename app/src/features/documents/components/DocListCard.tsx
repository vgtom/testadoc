import React from "react";
import { Document } from "wasp/entities";
import PdfThumbnailIcon from "../../../client/static/pdf_thumb.png";
import { Button } from "../../../components/ui/button";
import { cn } from "../../../lib/utils";
import { useNavigate } from "react-router-dom";
import { createTemplate } from "wasp/client/operations";
import { toast } from "sonner";

const statusColors = {
  Draft: "bg-yellow-100 text-yellow-800 border-yellow-300 border",
  Sent: "bg-blue-100 text-blue-800 border-blue-300 border",
  Signed: "bg-green-100 text-green-800 border-green-300 border",
};

export const DocumentCard = ({
  doc,
  uploadProgressPercent,
}: {
  doc: Partial<Document>;
  uploadProgressPercent?: number;
}) => {
  const navigate = useNavigate();

  const handleViewClick = async () => {
    try {
      navigate(`/documents/${doc.id}`);
    } catch (err) {
      toast("Failed to generate secure URL.");
    }
  };

  const handleEditClick = async () => {
    try {
      navigate(`/document_editor/${doc.id}`);
    } catch (err) {
      toast("Failed to generate secure URL.");
    }
  };

  const handleCreateTemplate = async () => {
    if (!doc.id) {
      toast("No doc id");
      return;
    }
    try {
      createTemplate({ documentId: doc.id, name: "no name for now" }).then(
        ({ id }) => {

          toast("Create template successfully!");
          navigate(`/template_editor/${id}`);
        }
      );
    } catch (error) {
      toast("Failed to create template.");
    }
  };

  return (
    <div
      key={doc.id}
      className="flex max-lg:grid flex-nowrap p-4 border rounded-lg shadow-lg bg-white gap-3"
    >
      <div className="w-[100px] h-full max-lg:h-[100px] max-lg:w-full  bg-gray-200 rounded-md flex justify-center items-center p-5">
        <img className="max-h-[85%]" src={PdfThumbnailIcon} alt="" />
      </div>
      <div className="flex flex-col justify-between gap-2 w-full">
        <p className="font-medium text-sm text-gray-900">{doc.name}</p>
        
        <div className="flex gap-2 flex-wrap">
          <Button
            className="w-fit h-fit pl-0"
            variant={"link"}
            onClick={() => handleViewClick()}
          >
            View
          </Button>
          {/* <Button
            className="w-fit h-fit pl-0"
            variant={"link"}
            onClick={() => handleEditClick()}
          >
            Edit
          </Button> */}

          <Button
            className="w-fit h-fit pl-0"
            variant={"link"}
            onClick={() => handleCreateTemplate()}
          >
            Create template
          </Button>
        </div>
        {uploadProgressPercent && (
          <div className="flex flex-col items-end min-w-[120px] w-full">
            <div className="text-xs text-gray-500 mt-1">
              {uploadProgressPercent}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgressPercent}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
