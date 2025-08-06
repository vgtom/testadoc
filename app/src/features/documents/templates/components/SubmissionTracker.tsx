import React, { FC } from "react";
import { CompleteTemplateObject } from "../../types";
import { cn } from "../../../../lib/utils";
import { recipientStatusColors } from "./SubmissionCard";
import { getAuditLogByTemplateId, useQuery } from "wasp/client/operations";

type SubmissionTrackerProps = {
  template: CompleteTemplateObject | null;
};

const SubmissionTracker: FC<SubmissionTrackerProps> = ({ template }) => {
  const { data: auditLogs } = useQuery(getAuditLogByTemplateId, {
    templateId: template?.id,
  });
  return (
    <div className="p-5 mt-6 bg-white border h-full rounded-lg flex flex-col gap-2">
      <div>
        <span className="font-medium text-sm">Template name:</span>
        <p className=" text-sm">{template?.name}</p>
      </div>
      <div>
        <span className="font-medium text-sm">Created At:</span>
        <p className=" text-sm">{template?.createdAt.toDateString()}</p>
      </div>
      <div>
        <span className="font-medium text-sm">Status:</span>
        <p className=" text-sm">{template?.status}</p>
      </div>
      <div>
        <span className="font-medium text-sm">Recipients:</span>
        <p className=" text-sm">
          {template?.recipients?.flatMap((i) => i.contact.email).join(", ")}
        </p>
      </div>
      <div>
        <span className="font-medium text-sm">Track:</span>
        <div className="flex flex-col justify-center gap-2 mt-3">
          {template?.recipients?.map((recipient) => (
            <div className="flex items-center flex-nowrap ">
              <span
                className={cn(
                  recipientStatusColors[recipient.status],
                  "rounded-sm px-1 text-xs font-medium mr-1"
                )}
              >
                {recipient.status === "Draft" ? "Pending" : recipient.status}
              </span>
              <span className="text-xs">{recipient.contact.email}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <span className="font-medium text-sm">Logs:</span>
        <div className="flex flex-col justify-center gap-2 mt-3">
          {auditLogs?.map((auditLog) => (
            <div className="flex  flex-col ">
              <span
                className="text-xs"
                // className={cn(
                //   recipientStatusColors[auditLog.status],
                //   "rounded-sm px-1 text-xs font-medium mr-1"
                // )}
              >
                {auditLog.actionType}
              </span>
              <span className="text-xs">{auditLog.recipient?.contact?.email}</span>
              <span className="text-xs">{auditLog.createdAt.toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SubmissionTracker;
