
"use client";

import React, { useState, useEffect } from 'react';
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppContext } from '@/contexts/AppContext';
import type { User, Channel } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface AddMembersToChannelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
}

export function AddMembersToChannelDialog({ isOpen, onOpenChange, channelId }: AddMembersToChannelDialogProps) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const { allUsersWithCurrent, channels, currentUser, addMembersToChannel } = useAppContext();
  const { toast } = useToast();

  const [channel, setChannel] = useState<Channel | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  useEffect(() => {
    if (isOpen && channelId) {
      const currentChannel = channels.find(ch => ch.id === channelId);
      setChannel(currentChannel || null);

      if (currentChannel) {
        const usersToAdd = allUsersWithCurrent.filter(user => 
          !currentChannel.memberIds.includes(user.id) // No need to filter current user here, as they might not be a member
        );
        setAvailableUsers(usersToAdd);
      } else {
        setAvailableUsers([]);
      }
      setSelectedUserIds([]); // Reset selections when dialog opens or channel changes
    }
  }, [isOpen, channelId, channels, allUsersWithCurrent]);

  const handleUserSelect = (userId: string) => {
    setSelectedUserIds(prevSelected =>
      prevSelected.includes(userId)
        ? prevSelected.filter(id => id !== userId)
        : [...prevSelected, userId]
    );
  };

  const resetForm = () => {
    setSelectedUserIds([]);
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (selectedUserIds.length === 0) {
      toast({
        title: "No users selected",
        description: "Please select at least one user to add.",
        variant: "destructive",
      });
      return;
    }
    if (channel) {
      addMembersToChannel(channel.id, selectedUserIds);
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

  if (!channel) {
    return null; 
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Members to #{channel.name}</DialogTitle>
            <DialogDescription>
              Select users from the workspace to add to this channel.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {availableUsers.length > 0 ? (
              <ScrollArea className="h-60 rounded-md border p-2">
                <Label className="text-sm font-medium mb-2 block px-1">Available Users</Label>
                <div className="space-y-2">
                  {availableUsers.map((user: User) => (
                    <div key={user.id} className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-muted/50">
                      <Checkbox
                        id={`add-member-${user.id}`}
                        checked={selectedUserIds.includes(user.id)}
                        onCheckedChange={() => handleUserSelect(user.id)}
                        aria-label={`Select ${user.name}`}
                      />
                      <Label
                        htmlFor={`add-member-${user.id}`}
                        className="text-sm font-normal cursor-pointer flex-grow"
                      >
                        {user.name} <span className="text-xs text-muted-foreground">({user.designation || 'No designation'})</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                All workspace members are already in this channel.
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={selectedUserIds.length === 0}>Add Members</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


    