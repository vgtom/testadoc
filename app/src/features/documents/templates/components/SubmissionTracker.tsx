import React, { FC } from "react";
import { CompleteTemplateObject } from "../../types";
import { cn } from "../../../../lib/utils";
import { recipientStatusColors } from "./SubmissionCard";
import { getAuditLogByTemplateId, useQuery } from "wasp/client/operations";
import { jsPDF } from "jspdf";

type SubmissionTrackerProps = {
  template: CompleteTemplateObject | null;
};

const SubmissionTracker: FC<SubmissionTrackerProps> = ({ template }) => {
  const { data: auditLogs } = useQuery(getAuditLogByTemplateId, {
    templateId: template?.id,
  });

  const downloadAuditLogsPDF = () => {
    if (!template || !auditLogs) return;

    const pdf = new jsPDF();
    let yPosition = 20;
    const lineHeight = 7;
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Add title
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Audit Log Report", margin, yPosition);
    yPosition += lineHeight * 2;

    // Add template information
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Template Information:", margin, yPosition);
    yPosition += lineHeight;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Template Name: ${template.name}`, margin, yPosition);
    yPosition += lineHeight;
    pdf.text(`Created At: ${template.createdAt.toDateString()}`, margin, yPosition);
    yPosition += lineHeight;
    pdf.text(`Status: ${template.status}`, margin, yPosition);
    yPosition += lineHeight * 2;

    // Add recipients
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Recipients:", margin, yPosition);
    yPosition += lineHeight;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    template.recipients?.forEach((recipient) => {
      pdf.text(`${recipient.contact.email} - ${recipient.status}`, margin, yPosition);
      yPosition += lineHeight;
    });
    yPosition += lineHeight;

    // Add audit logs
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text("Audit Logs:", margin, yPosition);
    yPosition += lineHeight;

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");

    auditLogs.forEach((auditLog) => {
      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }

      const actionType = auditLog.actionType;
      const recipientEmail = auditLog.recipient?.contact?.email || "N/A";
      const timestamp = auditLog.createdAt.toLocaleString();

      // Add audit log entry
      pdf.text(`Action: ${actionType}`, margin, yPosition);
      yPosition += lineHeight;
      pdf.text(`Recipient: ${recipientEmail}`, margin, yPosition);
      yPosition += lineHeight;
      pdf.text(`Time: ${timestamp}`, margin, yPosition);
      yPosition += lineHeight * 1.5;
    });

    // Download the PDF
    const fileName = `audit-log-${template.name}-${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  return (
    <div className="p-5 mt-6 bg-white border h-full rounded-lg flex flex-col gap-2">
      {/* Download Button */}
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <span className="font-medium text-sm">Submission Tracker</span>
        <button
          onClick={downloadAuditLogsPDF}
          disabled={!template || !auditLogs || auditLogs.length === 0}
          className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Download PDF
        </button>
      </div>

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
