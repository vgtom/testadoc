import React, { FC, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Label } from "../../../components/ui/label";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRecipient } from "wasp/client/operations";
import { toast } from "sonner";
import clsx from "clsx";

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

type RoleFormProps = {
  setShowSignRoleForm: React.Dispatch<React.SetStateAction<boolean>>;
  showSignRoleForm: boolean;
  templateId: string | undefined;
};

const RoleFormDialog: FC<RoleFormProps> = ({
  setShowSignRoleForm,
  showSignRoleForm,
  templateId,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecipientFormType>({
    resolver: zodResolver(recipientFormSchema),
    defaultValues: { color: suggestedColors[0] },
  });

  const selectedColor = watch("color");
  const [customColorEnabled, setCustomColorEnabled] = useState(false);

  const onSubmit = async (data: RecipientFormType) => {
    if (!templateId) {
      toast.error("Template ID required.");
      return;
    }

    try {
      await createRecipient({
        templateId,
        name: data.name,
        email: data.email,
        color: data.color,
      });
      toast.success("Recipient added!");
      setShowSignRoleForm(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create recipient.");
    }
  };

  return (
    <Dialog open={showSignRoleForm} onOpenChange={setShowSignRoleForm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Recipient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} placeholder="Full name..." />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name.message}</p>
            )}

            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register("email")} placeholder="example@email.com" />
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

              {/* Custom color picker */}
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
                  style={{ backgroundColor: customColorEnabled ? selectedColor : "#fff" }}
                  title="Custom color"
                />
              </label>
            </div>
            {errors.color && (
              <p className="text-sm text-red-600">{errors.color.message}</p>
            )}
          </div>

          <Button type="submit">Add Recipient</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleFormDialog;
