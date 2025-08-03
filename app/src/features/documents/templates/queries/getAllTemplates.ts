import { HttpError } from 'wasp/server';
import { type GetAllTemplates } from 'wasp/server/operations';
import type { Template } from 'wasp/entities';

export const getAllTemplates: GetAllTemplates<void, Template[]> = async (
  _args,
  context
) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.Template.findMany({
    where: { user: { id: context.user.id } },
    orderBy: { createdAt: "desc" },
  });
};