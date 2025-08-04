import { useState } from "react";
import { useQuery, getAllSignRequestedTemplates } from "wasp/client/operations";
import { cn } from "../../../../lib/utils";
import { Template } from "wasp/entities";
import { SignListCard } from "../components/SignListCard";
import { TemplateWithRecipientId } from "../../templates/queries/getAllSignRequestedTemplates";

export default function TemplateSignRequests() {
  const { data: templates } = useQuery(getAllSignRequestedTemplates);

  const [viewMode, setViewMode] = useState<"list" | "columns">("columns");
  return (
    <div
      className="p-4 w-full container mx-auto relative"
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Sign requestes</h2>
      </div>

      <div
        className={cn(
          viewMode === "columns"
            ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
            : "grid gap-4"
        )}
      >
        {templates?.map((template: TemplateWithRecipientId) => (
          <SignListCard template={template} key={template.id} />
        ))}
      </div>
    </div>
  );
}
