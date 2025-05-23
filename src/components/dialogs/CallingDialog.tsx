
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserAvatar } from '@/components/UserAvatar';
import { useAppContext } from '@/contexts/AppContext';
import { PhoneOff, Users, Hash } from 'lucide-react'; // Added Users, Hash

export function CallingDialog() {
  const { isCallActive, callingWith, endCall } = useAppContext();

  if (!isCallActive || !callingWith) {
    return null;
  }

  const isChannelCall = callingWith.type === 'channel';
  const avatarUser = isChannelCall ? undefined : callingWith.recipient; // Only show avatar for DM calls
  const name = callingWith.name;

  return (
    <Dialog open={isCallActive} onOpenChange={(open) => { if (!open) endCall(); }}>
      <DialogContent 
        className="sm:max-w-sm" 
        onInteractOutside={(e) => e.preventDefault()} // Prevent closing on overlay click
        onEscapeKeyDown={(e) => e.preventDefault()} // Prevent closing with Escape key
      >
        <DialogHeader className="items-center text-center">
          <div className="my-4">
            {isChannelCall ? (
              <div className="p-3 rounded-full bg-muted inline-flex">
                <Hash className="h-12 w-12 text-primary" />
              </div>
            ) : (
              <UserAvatar user={avatarUser} className="h-24 w-24 text-6xl" />
            )}
          </div>
          <DialogTitle className="text-2xl font-semibold">
            {isCallActive ? `Calling ${name}...` : `Call with ${name}`}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            This is a simulated call. No audio/video is active.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="mt-6">
          <Button 
            type="button" 
            variant="destructive" 
            onClick={endCall}
            className="w-full sm:w-auto"
            size="lg"
          >
            <PhoneOff className="mr-2 h-5 w-5" />
            Hang Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
