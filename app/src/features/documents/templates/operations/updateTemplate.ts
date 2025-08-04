import { HttpError } from "wasp/server";
import { type UpdateTemplate } from "wasp/server/operations";
import * as z from "zod";
import type { Template } from "wasp/entities";

const statusEnum = z.enum(["Draft", "Sent", "Signed"]);

export const updateTemplateInputSchema = z.object({
  templateId: z.string().uuid(), // Still required to identify which template
  name: z.string().optional(),
  documentId: z.string().uuid().optional(),
  status: statusEnum.optional(),
});

export const updateTemplate: UpdateTemplate<
  z.infer<typeof updateTemplateInputSchema>,
  Template
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  const { templateId, ...updates } = args;

  return await context.entities.Template.update({
    where: { id: templateId },
    data: {
      ...(updates.name && { name: updates.name }),
      ...(updates.documentId && { documentId: updates.documentId }),
      ...(updates.status && { status: updates.status }),
      userId: context.user.id,
    },
  });
};
