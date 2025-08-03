import React, { FC, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog";
import { Label } from "../../../../components/ui/label";
import { Input } from "../../../../components/ui/input";
import { Button } from "../../../../components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createRecipient,
  updateRecipient,
  getAllContacts,
  useQuery,
} from "wasp/client/operations";
import { toast } from "sonner";
import clsx from "clsx";
import { Recipient } from "wasp/entities";
import { RecipientWithContact } from "../../types";

export const recipientFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  color: z.string().min(1, "Invalid color"),
});

export type RecipientFormType = z.infer<typeof recipientFormSchema>;

const suggestedColors = [
  "#AED581", "#FFCC80", "#81D4FA", "#CE93D8", "#90CAF9", "#A5D6A7",
  "#FFD54F", "#B39DDB", "#FFAB91", "#80CBC4", "#F48FB1", "#FF8A65",
];

type RecipientFormProps = {
  setShowSignRecipientForm: React.Dispatch<React.SetStateAction<boolean>>;
  showSignRecipientForm: boolean;
  templateId: string | undefined;
  recipientToEdit?: RecipientWithContact | null;
};

const RecipientFormDialog: FC<RecipientFormProps> = ({
  setShowSignRecipientForm,
  showSignRecipientForm,
  templateId,
  recipientToEdit,
}) => {
  const { data: contacts } = useQuery(getAllContacts);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecipientFormType>({
    resolver: zodResolver(recipientFormSchema),
    defaultValues: {
      color: suggestedColors[0],
    },
  });

  const selectedColor = watch("color");
  const [customColorEnabled, setCustomColorEnabled] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  useEffect(() => {
    if (recipientToEdit) {
      setValue("name", recipientToEdit.contact.name);
      setValue("email", recipientToEdit.contact.email);
      setValue("color", recipientToEdit.color || '#ffff');
      setSelectedContactId(recipientToEdit.contactId ?? null);
      setCustomColorEnabled(
        !suggestedColors.includes(recipientToEdit.color || '#ffff')
      );
    } else {
      reset({ color: suggestedColors[0] });
      setSelectedContactId(null);
      setCustomColorEnabled(false);
    }
  }, [recipientToEdit, reset, setValue]);

  const handleContactChange = (id: string) => {
    setSelectedContactId(id);
    const contact = contacts?.find((c) => c.id === id);
    if (contact) {
      setValue("name", contact.name);
      setValue("email", contact.email);
    }
  };

  const onSubmit = async (data: RecipientFormType) => {
    if (!templateId) {
      toast.error("Template ID required.");
      return;
    }

    try {
      if (recipientToEdit) {
        await updateRecipient({
          recipientId: recipientToEdit.id,
          ...(selectedContactId
            ? { contactId: selectedContactId }
            : { name: data.name, email: data.email }),
          color: data.color,
        });
        toast.success("Recipient updated!");
      } else {
        await createRecipient({
          templateId,
          ...(selectedContactId
            ? { contactId: selectedContactId }
            : { name: data.name, email: data.email }),
          color: data.color,
        });
        toast.success("Recipient added!");
      }

      setShowSignRecipientForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save recipient.");
    }
  };

  return (
    <Dialog open={showSignRecipientForm} onOpenChange={setShowSignRecipientForm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {recipientToEdit ? "Edit Recipient" : "Add Recipient"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="contact">Choose Existing Contact (optional)</Label>
            <select
              id="contact"
              className="p-2 border rounded"
              value={selectedContactId ?? ""}
              onChange={(e) =>
                e.target.value
                  ? handleContactChange(e.target.value)
                  : setSelectedContactId(null)
              }
            >
              <option value="">-- Select a Contact --</option>
              {contacts?.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} ({contact.email})
                </option>
              ))}
            </select>

            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Full name..."
              disabled={!!selectedContactId}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}

            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              {...register("email")}
              placeholder="example@email.com"
              disabled={!!selectedContactId}
            />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}

            <Label>Choose a Color</Label>
            <div className="flex flex-wrap gap-2">
              {suggestedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => {
                    setValue("color", color);
                    setCustomColorEnabled(false);
                  }}
                  className={clsx(
                    "w-8 h-8 rounded-full border-2 transition",
                    selectedColor === color ? "border-black" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}

              <label className="relative w-8 h-8 rounded-full border-2 cursor-pointer overflow-hidden">
                <input
                  type="color"
                  className="absolute w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    setValue("color", e.target.value);
                    setCustomColorEnabled(true);
                  }}
                />
                <div
                  className={clsx(
                    "w-full h-full rounded-full border-2",
                    customColorEnabled ? "border-black" : "border-gray-300"
                  )}
                  style={{ backgroundColor: selectedColor }}
                  title="Custom color"
                />
              </label>
            </div>
            {errors.color && (
              <p className="text-sm text-red-600">{errors.color.message}</p>
            )}
          </div>

          <Button type="submit">
            {recipientToEdit ? "Update Recipient" : "Add Recipient"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RecipientFormDialog;
