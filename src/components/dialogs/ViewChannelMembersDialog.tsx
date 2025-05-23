
"use client";

import React from 'react';
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from '@/components/UserAvatar';
import { useAppContext } from '@/contexts/AppContext';
import type { User, Channel } from '@/types';

interface ViewChannelMembersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel | null | undefined;
}

export function ViewChannelMembersDialog({ isOpen, onOpenChange, channel }: ViewChannelMembersDialogProps) {
  const { allUsersWithCurrent } = useAppContext();

  if (!channel) {
    return null;
  }

  const members: User[] = channel.memberIds
    .map(memberId => allUsersWithCurrent.find(user => user.id === memberId))
    .filter((user): user is User => !!user); // Filter out undefined if a user ID doesn't match

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Members of #{channel.name}</DialogTitle>
          <DialogDescription>
            {members.length} member(s) in this channel.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          {members.length > 0 ? (
            <ScrollArea className="h-72 max-h-[60vh] rounded-md border">
              <div className="p-2 space-y-1">
                {members.map((user: User) => (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                    <UserAvatar user={user} className="h-9 w-9" />
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      {user.designation && <p className="text-xs text-muted-foreground">{user.designation}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              This channel has no members yet.
            </p>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
