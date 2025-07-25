import React from "react";
import { Document } from "wasp/entities";
import PdfThumbnailIcon from "../client/static/pdf_thumb.png";
import { getDownloadDocumentSignedURL } from "wasp/client/operations";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";

const statusColors = {
  Draft: "bg-yellow-100 text-yellow-800 border-yellow-300 border",
  Sent: "bg-blue-100 text-blue-800 border-blue-300 border",
  Signed: "bg-green-100 text-green-800 border-green-300 border",
};

export const DocumentCard = ({ doc }: { doc: Document }) => {
  const handleViewClick = async (key: string) => {
    try {
      const signedUrl = await getDownloadDocumentSignedURL({ key });
      window.open(signedUrl, "_blank");
    } catch (err) {
      alert("Failed to generate secure URL.");
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
      <div className="flex flex-col justify-between gap-2">
        <p className="font-medium text-sm text-gray-900">{doc.name}</p>
        <span
          className={cn(
            statusColors[doc.status],
            "w-fit h-fit text-xs px-1 py-[.5px] rounded-sm"
          )}
        >
          {doc.status}
        </span>
        <div className="flex gap-2">
          <Button
            className="w-fit h-fit pl-0"
            variant={"link"}
            onClick={() => handleViewClick(doc.key)}
          >
            View
          </Button>
          <Button
            className="w-fit h-fit pl-0"
            variant={"link"}
            onClick={() => handleViewClick(doc.key)}
          >
            Edit
          </Button>
        </div>
      </div>
    </div>
  );
};
