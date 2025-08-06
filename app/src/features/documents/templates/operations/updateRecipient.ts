import { Recipient, Contact, User } from "wasp/entities";
import { HttpError } from "wasp/server";
import { createAuditLog, type UpdateRecipient } from "wasp/server/operations";
import * as z from "zod";
import { sendMail } from "../../../../lib/mailSender";
import { AuditLogActionType, AuditLogTag } from "../../../common/server/audit/auditTypes";

// Optional: define allowed statuses
const RecipientStatusEnum = z.enum(["Draft", "Sent", "Signed"]);

const updateRecipientInputSchema = z.object({
  recipientId: z.string().uuid(),
  color: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  status: RecipientStatusEnum.optional(),
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
      template: { userId: user.id },
    },
    include: { contact: true, template: { include: { document: true, user: true } } },
  });

  if (!recipient) {
    throw new HttpError(404, "Recipient not found");
  }

  // Send email if status is updated to "Sent"
  if (status === "Sent") {
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

  // Create audit log if status is updated to "Signed"
  if (status === "Sent") {
    await createAuditLog(
      {
        actionType: AuditLogActionType.SENT_TO_FIRST_RECIPIENT,
        actionDescription: `Recipient ${recipient.contact.email} marked as Signed for template: ${recipient.template.name}`,
        templateId: recipient.templateId,
        recipientId: recipient.id,
        tag: AuditLogTag.TEMPLATE_FLOW,
      },
      {
        user,
      }
    );
  }

  // Update recipient (color + status)
  const updatedRecipient = await context.entities.Recipient.update({
    where: { id: recipientId },
    data: {
      ...(color ? { color } : {}),
      ...(status ? { status } : {}),
    },
  });

  // Optionally update contact
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