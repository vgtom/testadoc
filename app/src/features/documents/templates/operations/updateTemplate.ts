import { HttpError } from "wasp/server";
import { type UpdateTemplate } from "wasp/server/operations";
import * as z from "zod";
import type { Template } from "wasp/entities";


export const updateTemplateInputSchema = z.object({
  name: z.string().optional(),
  documentId: z.string().uuid(),
  templateId: z.string().uuid(),
});

export const updateTemplate: UpdateTemplate<
  z.infer<typeof updateTemplateInputSchema>,
  Template
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  return await context.entities.Template.update({
    where: { id: args.templateId },
    data: {
      name: args.name,
      documentId: args.documentId,
      userId: context.user.id,
    },
  });
};
