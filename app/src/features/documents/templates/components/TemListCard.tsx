import { Template } from "wasp/entities";
import PdfThumbnailIcon from "../../../../client/static/pdf_thumb.png";
import { Button } from "../../../../components/ui/button";
import { cn } from "../../../../lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const statusColors = {
  Draft: "bg-yellow-100 text-yellow-800 border-yellow-300 border",
  Sent: "bg-blue-100 text-blue-800 border-blue-300 border",
  Signed: "bg-green-100 text-green-800 border-green-300 border",
};

export const TemplateListCard = ({
  template,
  uploadProgressPercent,
}: {
  template: Partial<Template>;
  uploadProgressPercent?: number;
}) => {
  const navigate = useNavigate();


  const handleEditClick = async () => {
    try {
      navigate(`/template_editor/${template.id}`);
    } catch (err) {
      toast("Failed to generate secure URL.");
    }
  };

  return (
    <div
      key={template.id}
      className="flex max-lg:grid flex-nowrap p-4 border rounded-lg shadow-lg bg-white gap-3"
    >
      <div className="w-[100px] h-full max-lg:h-[100px] max-lg:w-full  bg-gray-200 rounded-md flex justify-center items-center p-5">
        <img className="max-h-[85%]" src={PdfThumbnailIcon} alt="" />
      </div>
      <div className="flex flex-col justify-between gap-2 w-full">
        <p className="font-medium text-sm text-gray-900">{template.name}</p>
        {template.status && <span
          className={cn(
            statusColors[template.status],
            "w-fit h-fit text-xs px-1 py-[.5px] rounded-sm"
          )}
        >
          {template.status}
        </span>}
        <div className="flex gap-2">

          <Button
            className="w-fit h-fit pl-0"
            variant={"link"}
            onClick={() => handleEditClick()}
          >
            Edit
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
