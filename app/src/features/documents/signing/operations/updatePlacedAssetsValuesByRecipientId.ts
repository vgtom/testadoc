import { HttpError } from "wasp/server";
import {
  createAuditLog,
  type UpdatePlacedAssetsValuesByRecipientId,
} from "wasp/server/operations";
import * as z from "zod";
import { PlacedAsset, Recipient, Template, Contact } from "wasp/entities";
import { sendMail } from "../../../../lib/mailSender";
import { AuditLogActionType } from "wasp/src/features/common/server/audit/auditTypes";
import { AuditLogTag } from "../../../common/server/audit/auditTypes";

const inputSchema = z.object({
  shouldSendToNextRecipient: z.boolean().optional(),
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      recipientId: z.string().uuid(),
      value: z.string(),
    })
  ),
});

type UpdatePayload = z.infer<typeof inputSchema>;

export const updatePlacedAssetsValuesByRecipientId: UpdatePlacedAssetsValuesByRecipientId<
  UpdatePayload,
  PlacedAsset[]
> = async ({ updates, shouldSendToNextRecipient }, context) => {

  inputSchema.parse({ updates, shouldSendToNextRecipient });

  const recipientIds = [...new Set(updates.map((u) => u.recipientId))];
  if (recipientIds.length !== 1) {
    throw new HttpError(400, "All updates must belong to the same recipient");
  }

  const recipientId = recipientIds[0];

  const recipient = await context.entities.Recipient.findUnique({
    where: { id: recipientId },
    include: { contact: true, template: { include: { user: true } } },
  });

  if (!recipient) {
    throw new HttpError(404, "Recipient not found!")
  }

  const validAssets = await context.entities.PlacedAsset.findMany({
    where: {
      recipientId,
      id: { in: updates.map((u) => u.id) },
    },
  });

  const updatedAssets: PlacedAsset[] = [];
  for (const { id, value } of updates) {
    const matching = validAssets.find((pa) => pa.id === id);
    if (!matching) continue;

    const updated = await context.entities.PlacedAsset.update({
      where: { id },
      data: { value },
    });

    updatedAssets.push(updated);
  }

  if (shouldSendToNextRecipient) {
    // Check if all placed assets for the recipient have a value
    const allRecipientAssets = await context.entities.PlacedAsset.findMany({
      where: { recipientId },
    }); 

    const assetsWithoutValue = allRecipientAssets.filter(
      (asset) => !asset.value || asset.value.trim() === ""
    );

    if (assetsWithoutValue.length > 0) {
      throw new HttpError(
        400,
        "Updated signatures, but you must fill all fields to send to the next recipient."
      );
    }

    // Set the current recipient's status to 'Signed'
    await context.entities.Recipient.update({
      where: { id: recipientId },
      data: { status: "Finished" },
    });

    // Find and notify the next recipient
    const template = await context.entities.Template.findUnique({
      where: { id: recipient.templateId },
      include: { recipients: { include: { contact: true } }, user: true },
    });

    if (template) {
      // Sort recipients by creation date to determine order
      const recipients = template.recipients.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      // Find the index of the current recipient
      const currentRecipientIndex = recipients.findIndex(
        (r) => r.id === recipientId
      );

      // Check if the current recipient is the last one
      const isLastRecipient = currentRecipientIndex === recipients.length - 1;
      console.log(recipients)
      console.log("----length-----")
      console.log(recipients.length)
      console.log({isLastRecipient})
      if (isLastRecipient) {
        // If last recipient, set template status to 'Signed' and log audit
        await context.entities.Template.update({
          where: { id: template.id },
          data: { status: "Completed" },
        });

        await createAuditLog(
          {
            actionType: AuditLogActionType.ALL_RECIPIENTS_COMPLETED,
            actionDescription: `All recipients have completed signing template: ${template.name}`,
            templateId: template.id,
            recipientId,
            tag: AuditLogTag.TEMPLATE_FLOW,
          }
        );
      } else {
        // Get the next recipient
        const nextRecipient = recipients[currentRecipientIndex + 1];

        if (nextRecipient) {
          // Update the next recipient's status to 'Sent'
          await context.entities.Recipient.update({
            where: { id: nextRecipient.id },
            data: { status: "Recieved" },
          });

          // Create an audit log entry for sending to the next recipient
          await createAuditLog(
            {
              actionType: AuditLogActionType.SENT_TO_NEXT_RECIPIENT,
              actionDescription: `Document sent to next recipient: ${nextRecipient.contact.email}`,
              templateId: template.id,
              recipientId: nextRecipient.id,
              tag: AuditLogTag.TEMPLATE_FLOW,
            }
          );

          // Send email to the next recipient
         sendMail({
            from: "signadoc@example.com",
            to: nextRecipient.contact.email,
            subject: "You are invited to sign a document",
            text: `Hi there,
You have been invited to sign the "${template.name}".
Review and Sign
Login to SignAdoc as ${nextRecipient.contact.email}
and sign
http://localhost:3000/template_signer/${nextRecipient.id}
Please contact us by replying to this email if you have any questions.
Thanks,
${template.user.username}
Sent using SignAdoc free document signing.`,
          });
        }
      }
    }
  }

  return updatedAssets;
};