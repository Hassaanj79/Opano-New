
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
import { Textarea } from '@/components/ui/textarea';

interface AddChannelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddChannelDialog({ isOpen, onOpenChange }: AddChannelDialogProps) {
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const { addChannel } = useAppContext();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (channelName.trim()) {
      addChannel(channelName.trim(), channelDescription.trim());
      setChannelName('');
      setChannelDescription('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
            <DialogDescription>
              Enter the name and an optional description for your new channel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="channel-name" className="text-right">
                Name
              </Label>
              <Input
                id="channel-name"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                className="col-span-3"
                required
                placeholder="e.g. project-alpha"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="channel-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="channel-description"
                value={channelDescription}
                onChange={(e) => setChannelDescription(e.target.value)}
                className="col-span-3 min-h-[60px]"
                placeholder="e.g. Discussions about the new Project Alpha initiative."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!channelName.trim()}>Create Channel</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
