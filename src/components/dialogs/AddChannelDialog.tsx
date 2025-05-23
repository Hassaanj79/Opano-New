
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
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { User } from '@/types';

interface AddChannelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddChannelDialog({ isOpen, onOpenChange }: AddChannelDialogProps) {
  const [channelName, setChannelName] = useState('');
  const [channelDescription, setChannelDescription] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isPrivateChannel, setIsPrivateChannel] = useState(false); // New state for privacy
  const { addChannel, users: allUsers, currentUser } = useAppContext();

  const availableUsers = allUsers.filter(user => user.id !== currentUser.id);

  const handleUserSelect = (userId: string) => {
    setSelectedUserIds(prevSelected =>
      prevSelected.includes(userId)
        ? prevSelected.filter(id => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const resetForm = () => {
    setChannelName('');
    setChannelDescription('');
    setSelectedUserIds([]);
    setIsPrivateChannel(false); // Reset privacy state
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (channelName.trim()) {
      addChannel(channelName.trim(), channelDescription.trim(), selectedUserIds, isPrivateChannel); // Pass isPrivateChannel
      resetForm();
      onOpenChange(false);
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
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Channel</DialogTitle>
            <DialogDescription>
              Enter the name, description, select members, and set privacy for your new channel.
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

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="channel-private" className="text-right">
                Privacy
              </Label>
              <div className="col-span-3 flex items-center space-x-2">
                <Checkbox
                    id="channel-private"
                    checked={isPrivateChannel}
                    onCheckedChange={(checked) => setIsPrivateChannel(Boolean(checked))}
                />
                <Label htmlFor="channel-private" className="text-sm font-normal cursor-pointer">
                    Make this channel private
                </Label>
              </div>
            </div>

            {availableUsers.length > 0 && (
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Members
              </Label>
              <ScrollArea className="col-span-3 h-40 rounded-md border p-2">
                <div className="space-y-2">
                  {availableUsers.map((user: User) => (
                    <div key={user.id} className="flex items-center space-x-2 p-1 rounded-md hover:bg-muted/50">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => handleUserSelect(user.id)}
                        aria-label={`Select ${user.name}`}
                      />
                      <Label
                        htmlFor={`user-${user.id}`}
                        className="text-sm font-normal cursor-pointer flex-grow"
                      >
                        {user.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            )}
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
