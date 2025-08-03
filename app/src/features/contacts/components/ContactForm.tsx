import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createContact, editContact } from "wasp/client/operations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/ui/form";
import { Input } from "../../../components/ui/input";
import { toast } from "sonner";

// Define the form schema using Zod
const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

type Contact = {
  id: string;
  name: string;
  email: string;
};

type ContactFormProps = {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact | null;
};

export function ContactForm({ isOpen, onClose, contact }: ContactFormProps) {
  const isEditing = !!contact;

  // Initialize react-hook-form with Zod resolver
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: contact?.name || "",
      email: contact?.email || "",
    },
  });

  // Reset form when contact prop changes
  React.useEffect(() => {
    form.reset({
      name: contact?.name || "",
      email: contact?.email || "",
    });
  }, [contact, form]);

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof contactSchema>) => {
    try {
      if (isEditing && contact) {
        const result = await editContact({
          contactId: contact.id,
          name: data.name,
          email: data.email,
        });
        toast.success("Success", {
          description: result.message,
        });
      } else {
        const result = await createContact(data);
        toast.success("Success", {
          description: result.message,
        });
      }
      form.reset();
      onClose();
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "Something went wrong",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Contact" : "Create Contact"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{isEditing ? "Save Changes" : "Create"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}