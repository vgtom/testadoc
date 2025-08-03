import { HttpError } from 'wasp/server';
import { type GetRecipientsByTemplateId } from 'wasp/server/operations';
import type { RecipientWithContact } from '../../types';

export const getRecipientsByTemplateId: GetRecipientsByTemplateId<
  { templateId: string | undefined },
  RecipientWithContact[] | null
> = async ({ templateId }, context) => {
  if (!context.user) throw new HttpError(401, "Unauthorized");
  if (!templateId) throw new HttpError(400, "Template ID is required");

  const template = await context.entities.Template.findFirst({
    where: {
      id: templateId,
      userId: context.user.id,
    },
    include: {
      recipients: {
        include: {
          contact: true,
        },
      },
    },
  });

  if (!template) throw new HttpError(404, "Template not found");

  return template.recipients;
};