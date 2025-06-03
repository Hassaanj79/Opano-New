
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from '@/components/UserAvatar';
import { useAppContext } from '@/contexts/AppContext';
import type { User, Channel } from '@/types';
import { Trash2, ShieldAlert } from 'lucide-react';

interface ViewChannelMembersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Channel | null | undefined;
}

export function ViewChannelMembersDialog({ isOpen, onOpenChange, channel }: ViewChannelMembersDialogProps) {
  const { allUsersWithCurrent, currentUser, removeUserFromChannel } = useAppContext();
  const [userToRemove, setUserToRemove] = useState<User | null>(null);

  if (!channel) {
    return null;
  }

  const members: User[] = channel.memberIds
    .map(memberId => allUsersWithCurrent.find(user => user.id === memberId))
    .filter((user): user is User => !!user); // Filter out undefined if a user ID doesn't match

  const handleConfirmRemoveUser = () => {
    if (userToRemove && channel) {
      removeUserFromChannel(channel.id, userToRemove.id);
      setUserToRemove(null); // Close the alert dialog by resetting the user to remove
    }
  };

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
                  <div key={user.id} className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} className="h-9 w-9" />
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-foreground">{user.name} {user.id === currentUser?.id && "(You)"}</p>
                        {user.designation && <p className="text-xs text-muted-foreground">{user.designation}</p>}
                      </div>
                    </div>
                    {currentUser?.role === 'admin' && user.id !== currentUser?.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setUserToRemove(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        {userToRemove && userToRemove.id === user.id && (
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {userToRemove.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {userToRemove.name} from #{channel.name}? They will lose access to this channel.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setUserToRemove(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleConfirmRemoveUser} className="bg-destructive hover:bg-destructive/90">
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        )}
                      </AlertDialog>
                    )}
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
