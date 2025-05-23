
"use client";

import React, { useState } from 'react';
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
import { Label } from "@/components/ui/label";
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

interface InviteUserDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteUserDialog({ isOpen, onOpenChange }: InviteUserDialogProps) {
  const [email, setEmail] = useState('');
  const { sendInvitation } = useAppContext();
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (email.trim()) {
      // Basic email validation
      if (!/\S+@\S+\.\S+/.test(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        return;
      }
      
      sendInvitation(email.trim());
      // We don't close the dialog immediately to allow the user to see the toast message
      // which might contain the test link. User can close manually.
      // resetForm(); 
      // onOpenChange(false); 
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite User to Workspace</DialogTitle>
            <DialogDescription>
              Enter the email address of the person you want to invite. They will receive a (simulated) email with a link to join.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="invite-email" className="text-right">
                Email
              </Label>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
                required
                placeholder="e.g. newteammate@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!email.trim()}>Send Invitation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
