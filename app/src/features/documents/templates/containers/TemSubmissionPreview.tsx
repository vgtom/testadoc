import React, { FC } from "react";
import {
  PdfViewer,
  PlacedAssetWithRecipient,
} from "../../components/PdfViewer";
import SubmissionTracker from "../components/SubmissionTracker";
import { CompleteTemplateObject } from "../../types";

type TemSubmissionPreviewProps = {
  fileUrl: string | null;
  template: CompleteTemplateObject | null;
  placedAssets?: PlacedAssetWithRecipient[];
};

const TemSubmissionPreview: FC<TemSubmissionPreviewProps> = ({
  fileUrl,
  template,
}) => {
  return (
    <div className="grid grid-cols-[1fr_15rem]">
      <div className="overflow-auto">
        <PdfViewer fileUrl={fileUrl} placedAssets={template?.placedAssets} />
      </div>
      <div>
        <SubmissionTracker template={template} />
      </div>
    </div>
  );
};

export default TemSubmissionPreview;
