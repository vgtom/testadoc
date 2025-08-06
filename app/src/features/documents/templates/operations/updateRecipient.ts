import { Recipient, Contact, User } from "wasp/entities";
import { HttpError } from "wasp/server";
import { createAuditLog, type UpdateRecipient } from "wasp/server/operations";
import * as z from "zod";
import { sendMail } from "../../../../lib/mailSender";
import {
  AuditLogActionType,
  AuditLogTag,
} from "../../../common/server/audit/auditTypes";
import { ZRecipientStatusEnum } from "../../types";

const updateRecipientInputSchema = z.object({
  recipientId: z.string().uuid(),
  color: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  status: ZRecipientStatusEnum.optional(),
});

type UpdateRecipientPayload = z.infer<typeof updateRecipientInputSchema>;

export const updateRecipient: UpdateRecipient<
  UpdateRecipientPayload,
  Recipient
> = async (args, context) => {
  const { user } = context;
  if (!user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { recipientId, color, contactName, contactEmail, status } =
    updateRecipientInputSchema.parse(args);

  const recipient = await context.entities.Recipient.findFirst({
    where: {
      id: recipientId,
    },
    include: {
      contact: true,
      template: { include: { document: true, user: true, recipients: true } },
    },
  });

  if (!recipient) {
    throw new HttpError(404, "Recipient not found");
  }

  if (recipient.status === "Finished") {
    throw new HttpError(400, "This recipient already finished.");
  }

  if (status === "Recieved") {
    const otherRecipients = recipient.template.recipients.filter(
      (r) => r.id !== recipientId
    );
    const allOthersDraft = otherRecipients.every((r) => r.status === "Draft");
    if (allOthersDraft && otherRecipients.length >= 0) {
      await createAuditLog(
        {
          actionType: AuditLogActionType.SENT_TO_FIRST_RECIPIENT,
          actionDescription: `Template ${recipient.template.name} sent to first recipient: ${recipient.contact.email}`,
          templateId: recipient.templateId,
          recipientId: recipient.id,
          tag: AuditLogTag.TEMPLATE_FLOW,
        },
        { user }
      );
    }

    await sendMail({
      from: "signadoc@example.com",
      to: recipient.contact.email,
      subject: "You are invited to sign a document",
      text: `Hi there,
            You have been invited to sign the "${recipient.template.name}".
            Review and Sign
            Login to SignAdoc as ${recipient.contact.email}
            and sign
            http://localhost:3000/template_signer/${recipient.id}
            Please contact us by replying to this email if you have any questions.
            Thanks,
            ${recipient.template.user.username}
            Sent using SignAdoc free document signing.`,
    });
  }

  if (status === "Viewed" && recipient.status !== "Viewed") {
    await createAuditLog(
      {
        actionType: AuditLogActionType.RECIPIENT_OPENED,
        actionDescription: `Recipient ${recipient.contact.email} marked as Viewed for template: ${recipient.template.name}`,
        templateId: recipient.templateId,
        recipientId: recipient.id,
        tag: AuditLogTag.TEMPLATE_FLOW,
      },
      { user }
    );
  }

  if (status === "Finished") {
    await createAuditLog(
      {
        actionType: AuditLogActionType.ALL_RECIPIENTS_COMPLETED,
        actionDescription: `Recipient ${recipient.contact.email} marked as Signed for template: ${recipient.template.name}`,
        templateId: recipient.templateId,
        recipientId: recipient.id,
        tag: AuditLogTag.TEMPLATE_FLOW,
      },
      { user }
    );
  }

  const updatedRecipient = await context.entities.Recipient.update({
    where: { id: recipientId },
    data: {
      ...(color ? { color } : {}),
      ...(status ? { status } : {}),
    },
  });

  if (contactName || contactEmail) {
    await context.entities.Contact.update({
      where: { id: recipient.contactId },
      data: {
        name: contactName || recipient.contact.name,
        email: contactEmail || recipient.contact.email,
      },
    });
  }

  return updatedRecipient;
};