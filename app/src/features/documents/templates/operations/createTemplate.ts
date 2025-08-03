import { HttpError } from 'wasp/server';
import { type CreateTemplate } from 'wasp/server/operations';
import * as z from 'zod';
import type { Template } from 'wasp/entities';

export const createTemplateInputSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  documentId: z.string().uuid(),
});

export const createTemplate: CreateTemplate<
  z.infer<typeof createTemplateInputSchema>,
  Template
> = async (args, context) => {
  if (!context.user) throw new HttpError(401);

  return await context.entities.Template.create({
    data: {
      name: args.name,
      documentId: args.documentId,
      userId: context.user.id,
    },
  });
};