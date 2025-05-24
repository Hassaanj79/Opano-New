
"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAppContext, type UserProfileUpdateData } from '@/contexts/AppContext';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { UserAvatar } from '@/components/UserAvatar';
import { useToast } from '@/hooks/use-toast';

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const profileFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }).max(50, { message: "Name must be 50 characters or less."}),
  designation: z.string().max(50, { message: "Designation must be 50 characters or less."}).optional().or(z.literal('')),
  email: z.string().email({ message: "Invalid email address." }),
  phoneNumber: z.string().max(20, { message: "Phone number must be 20 characters or less."}).optional().or(z.literal('')),
  avatarDataUrl: z.string().optional(),
  linkedinProfileUrl: z.string().url({ message: "Invalid LinkedIn URL (must include http:// or https://)" }).max(200, {message: "URL too long"}).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfileDialog({ isOpen, onOpenChange }: EditProfileDialogProps) {
  const { currentUser, updateUserProfile } = useAppContext();
  const { toast } = useToast();
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(currentUser?.avatarUrl);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      designation: '',
      email: '',
      phoneNumber: '',
      avatarDataUrl: '',
      linkedinProfileUrl: '',
    },
  });

  useEffect(() => {
    if (currentUser && isOpen) {
      form.reset({
        name: currentUser.name,
        designation: currentUser.designation || '',
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber || '',
        avatarDataUrl: currentUser.avatarUrl || '',
        linkedinProfileUrl: currentUser.linkedinProfileUrl || '',
      });
      setAvatarPreview(currentUser.avatarUrl);
    }
  }, [currentUser, isOpen, form]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setAvatarPreview(dataUrl);
        form.setValue('avatarDataUrl', dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: ProfileFormValues) => {
    const updateData: UserProfileUpdateData = {
      name: data.name,
      designation: data.designation,
      email: data.email,
      phoneNumber: data.phoneNumber,
      avatarDataUrl: data.avatarDataUrl !== currentUser?.avatarUrl ? data.avatarDataUrl : undefined,
      linkedinProfileUrl: data.linkedinProfileUrl,
    };
    updateUserProfile(updateData);
    onOpenChange(false);
  };

  const handleDialogClose = () => {
    if (currentUser) {
        setAvatarPreview(currentUser.avatarUrl);
        form.reset({
            name: currentUser.name,
            designation: currentUser.designation || '',
            email: currentUser.email,
            phoneNumber: currentUser.phoneNumber || '',
            avatarDataUrl: currentUser.avatarUrl || '',
            linkedinProfileUrl: currentUser.linkedinProfileUrl || '',
        });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
              <DialogDescription>
                Update your personal information and profile picture.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <FormItem>
                <FormLabel>Profile Picture</FormLabel>
                <div className="flex items-center gap-4">
                  <UserAvatar user={{...currentUser, avatarUrl: avatarPreview}} className="h-16 w-16" />
                  <Input
                    id="avatarUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="text-sm file:mr-2 file:py-1.5 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                </div>
                <FormMessage>{/* For potential avatar-related errors */}</FormMessage>
              </FormItem>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Alex Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="designation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Designation / Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Software Engineer" {...field} />
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="e.g. alex.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. +1 123-456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="linkedinProfileUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn Profile URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. https://linkedin.com/in/yourprofile" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
