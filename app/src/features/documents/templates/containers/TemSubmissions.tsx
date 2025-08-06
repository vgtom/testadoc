import { useEffect, useState } from "react";
import { useQuery, getAllTemplateSubmissions } from "wasp/client/operations";
import { cn } from "../../../../lib/utils";
import { Template } from "wasp/entities";
import { SubmissionCard } from "../components/SubmissionCard";
import { CompleteTemplateObject } from "../../types";
import { CustomPagination } from "../../../../components/CustomPagination";

// DnD item type for file
const FILE = "FILE";

export default function TemplateSubmissions() {
  const [submissions, setSubmissions] = useState<CompleteTemplateObject[]>([]);
  const [pageNum, setPageNum] = useState(1)
  const { data, isLoading, error, refetch } = useQuery(
    getAllTemplateSubmissions, {page: pageNum, pageSize: 10}
  );
  const [viewMode, setViewMode] = useState<"list" | "columns">("columns");

  useEffect(() => {
    setSubmissions(data?.items || [])
  }, [data])

  if (error)
    return (
      <div className="text-center text-red-500">Error loading documents.</div>
    );

  // No documents: show upload button and optional uploading state, not centered
  if (!submissions || submissions.length === 0) {
    return (
      <div>
        <p className="text-center">No submissions yet!</p>
      </div>
    );
  }

  // Documents exist: show list, upload button, and only show drop area on drag
  return (
    <div className="p-4 w-full container mx-auto relative">
      <div>
        <CustomPagination total={data?.totalPages} currentPage={pageNum} pageSize={data?.pageSize} onPageChange={setPageNum}  />
      </div>
      <div
        className={cn(
          viewMode === "columns"
            ? " sm:grid-cols-2  gap-4"
            : " gap-4", "mt-5", "flex flex-col gap-2"
        )}
      >
        {submissions
          .filter((i) => i.status !== "Draft")
          .map((template: CompleteTemplateObject) => (
            <SubmissionCard template={template} key={template.id} />
          ))}
      </div>
      
    </div>
  );
}
