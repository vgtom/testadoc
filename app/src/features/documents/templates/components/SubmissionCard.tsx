import { Template } from "wasp/entities";
import PdfThumbnailIcon from "../../../../client/static/pdf_thumb.png";
import { Button } from "../../../../components/ui/button";
import { cn } from "../../../../lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CompleteTemplateObject,
  RecipientStatus,
  TemplateStatus,
} from "../../types";
import { Calendar, Download, View } from "lucide-react";
import { CgProfile } from "react-icons/cg";
import { useAuth } from "wasp/client/auth";
import { downloadPdfWithOverlay } from "../../pdfUtils";
import { getDownloadDocumentSignedURL } from "wasp/client/operations";
// src/types/statusColors.ts (or wherever you store shared constants)

export const recipientStatusColors: Record<RecipientStatus, string> = {
  Draft: "bg-gray-100 text-gray-800 border-gray-300 border",
  Recieved: "bg-purple-100 text-purple-800 border-purple-300 border",
  Viewed: "bg-orange-100 text-orange-800 border-orange-300 border",
  Finished: "bg-green-100 text-green-800 border-green-300 border",
};

const statusColors: Record<TemplateStatus, string> = {
  Draft: "bg-yellow-100 text-yellow-800 border-yellow-300 border",
  Sent: "bg-blue-100 text-blue-800 border-blue-300 border",
  Completed: "bg-green-100 text-green-800 border-green-300 border",
};

export const SubmissionCard = ({
  template,
}: {
  template: Partial<CompleteTemplateObject>;
}) => {
  const navigate = useNavigate();

  const { data: authUser } = useAuth();

  const handleViewClick = async () => {
    try {
      navigate(`/submissions/${template.id}`);
    } catch (err) {
      toast("Failed to generate secure URL.");
    }
  };

  const handleDownloadClick = async () => {
    try {
      // navigate(`/submissions/${template.id}`);
      if (!template.document?.key) {
        toast.error("Document key missing!")
        return
      }
      const pdfUrl = await getDownloadDocumentSignedURL({key: template.document?.key})
      await downloadPdfWithOverlay(pdfUrl, template.placedAssets || [])
    } catch (err) {
      toast("Failed to generate secure URL.");
    }
  };

  return (
    <div
      key={template.id}
      className="flex max-lg:grid flex-nowrap p-4 border hover:border-gray-400 transition-all rounded-lg shadow-sm bg-white gap-3"
    >
      <div className="w-[100px] h-full max-lg:h-[100px] max-lg:w-full  bg-gray-200 rounded-md flex justify-center items-center p-5">
        <img className="max-h-[85%]" src={PdfThumbnailIcon} alt="" />
      </div>
      <div className="flex gap-10">
        <div className="flex flex-col justify-between gap-2 w-full">
          <p className="font-medium text-sm text-gray-900">{template.name}</p>
          {template.status && (
            <span
              className={cn(
                statusColors[template.status],
                "w-fit h-fit text-xs px-1 py-[.5px] rounded-sm"
              )}
            >
              {template.status}
            </span>
          )}
          <div className="flex flex-col gap-2 text-xs font-medium">
            <span className="flex gap-1 items-center">
              <CgProfile size={13} />
              {authUser?.email}
            </span>
            <span className="flex gap-1 items-center">
              <Calendar size={13} />
              {template.createdAt?.toDateString()}
            </span>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          {template.recipients?.map((recipient) => (
            <div className="flex gap-2 items-center">
              <span
                className={cn(
                  recipientStatusColors[recipient.status],
                  "rounded-sm px-1 text-xs font-medium"
                )}
              >
                {recipient.status === "Draft" ? "Pending" : recipient.status}
              </span>
              <span>{recipient.contact.email}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grow"></div>
      <div className="flex items-center gap-3">
        <Button onClick={handleDownloadClick}>
          <Download />
          Download
        </Button>
        <Button onClick={handleViewClick}> 
          <View />
          View
        </Button>
      </div>
    </div>
  );
};
