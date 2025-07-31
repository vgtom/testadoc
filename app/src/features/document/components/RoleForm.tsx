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
import { createSignRole } from "wasp/client/operations";
import { toast } from "sonner";
import clsx from "clsx";

export const roleFormSchema = z.object({
  role: z.string().min(1, "Invalid role"),
  color: z.string().min(1, "Invalid color"),
});

export type RoleFormType = z.infer<typeof roleFormSchema>;

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
  } = useForm<RoleFormType>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { color: suggestedColors[0] },
  });

  const selectedColor = watch("color");
  const [customColorEnabled, setCustomColorEnabled] = useState(false);

  const onSubmit = (data: RoleFormType) => {
    if (!templateId) {
      toast.error("Template ID required.");
      return;
    }
    createSignRole({ templateId, name: data.role, color: data.color });
    setShowSignRoleForm(false);
  };

  return (
    <Dialog open={showSignRoleForm} onOpenChange={setShowSignRoleForm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Role</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          <div className="grid gap-3">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              {...register("role")}
              placeholder="Type the role..."
            />
            {errors.role && (
              <p className="text-sm text-red-600">{errors.role.message}</p>
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

              {/* Custom color button */}
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

          <Button type="submit">Add role</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleFormDialog;
