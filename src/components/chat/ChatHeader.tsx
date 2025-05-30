
"use client";
import React, { useState } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import { Hash, UserCircle2, Users, UserPlus } from 'lucide-react'; // Added UserPlus
import { ViewChannelMembersDialog } from '@/components/dialogs/ViewChannelMembersDialog';
import { AddMembersToChannelDialog } from '@/components/dialogs/AddMembersToChannelDialog'; // Import AddMembers dialog
import { Button } from '@/components/ui/button';

export function ChatHeader() {
  const { activeConversation, currentUser } = useAppContext();
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false); // State for AddMembersDialog

  if (!activeConversation || !currentUser) return null;

  const name = activeConversation.name;
  let descriptionElement: React.ReactNode;

  if (activeConversation.type === 'channel' && activeConversation.channel) {
    const memberCount = activeConversation.channel.memberIds.length || 0;
    descriptionElement = (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground p-0 h-auto hover:bg-transparent hover:underline flex items-center gap-1"
        onClick={() => setIsMembersDialogOpen(true)}
        aria-label={`View ${memberCount} members`}
      >
        <Users className="h-3 w-3" /> 
        {`${memberCount} Member${memberCount !== 1 ? 's' : ''}`}
      </Button>
    );
  } else if (activeConversation.type === 'dm' && activeConversation.recipient) {
    descriptionElement = (
      <p className="text-xs text-muted-foreground">
        {activeConversation.recipient.designation || (activeConversation.recipient.isOnline ? 'Online' : 'Offline')}
      </p>
    );
  }


  return (
    <>
      <div className="flex items-center justify-between p-3 border-b border-border h-[60px] bg-background">
        <div className="flex items-center gap-2">
          {activeConversation.type === 'channel' ? (
            <Hash className="h-5 w-5 text-muted-foreground" />
          ) : (
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <h2 className="text-base font-semibold text-foreground">{name}</h2>
            {descriptionElement}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {activeConversation.type === 'channel' && currentUser?.role === 'admin' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddMembersDialogOpen(true)}
              className="group-data-[collapsible=icon]:hidden"
            >
              <UserPlus className="h-4 w-4 mr-1.5" />
              Add Members
            </Button>
          )}
        </div>
      </div>
      
      {activeConversation.type === 'channel' && activeConversation.channel && (
        <>
          <ViewChannelMembersDialog
            isOpen={isMembersDialogOpen}
            onOpenChange={setIsMembersDialogOpen}
            channel={activeConversation.channel}
          />
          <AddMembersToChannelDialog
            isOpen={isAddMembersDialogOpen}
            onOpenChange={setIsAddMembersDialogOpen}
            channelId={activeConversation.id}
          />
        </>
      )}
    </>
  );
}
