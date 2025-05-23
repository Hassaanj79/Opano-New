
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Hash, Sparkles, UserCircle2, Users, UserPlus, Phone } from 'lucide-react';
import { useState } from 'react';
import { SummarizeDialog } from './SummarizeDialog';
import { AddMembersToChannelDialog } from '@/components/dialogs/AddMembersToChannelDialog';
import { ViewChannelMembersDialog } from '@/components/dialogs/ViewChannelMembersDialog'; 

export function ChatHeader() {
  const { 
    activeConversation, 
    generateSummary, 
    currentSummary, 
    isLoadingSummary, 
    clearSummary,
    startCall,
    isCallActive,
    callingWith,
    currentUser // Added currentUser to check if logged in
  } = useAppContext();
  const [isSummarizeDialogOpen, setIsSummarizeDialogOpen] = useState(false);
  const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false);
  const [isViewMembersDialogOpen, setIsViewMembersDialogOpen] = useState(false);

  if (!activeConversation || !currentUser) return null; // Don't render if no active convo or no user

  const handleSummarize = async () => {
    if (activeConversation.type === 'channel') {
      setIsSummarizeDialogOpen(true);
      await generateSummary(activeConversation.id);
    }
  };
  
  const handleSummarizeDialogClose = (open: boolean) => {
    setIsSummarizeDialogOpen(open);
    if(!open) {
      clearSummary();
    }
  }

  const handleCall = () => {
    if (activeConversation && !isCallActive) {
      startCall(activeConversation);
    }
  };

  const name = activeConversation.name;
  const description = activeConversation.type === 'channel' 
    ? `${activeConversation.channel?.memberIds.length || 0} Members` 
    : (activeConversation.recipient?.designation || (activeConversation.recipient?.isOnline ? 'Online' : 'Offline'));

  const isDifferentCallActive = isCallActive && callingWith?.id !== activeConversation.id;

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
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCall}
            disabled={isDifferentCallActive || !currentUser} // Disable if no current user
            className="text-xs"
            aria-label="Start call"
          >
            <Phone className="mr-1.5 h-3.5 w-3.5" />
            Call
          </Button>
          {activeConversation.type === 'channel' && (
            <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isLoadingSummary || !currentUser} className="text-xs">
              <Sparkles className={`mr-1.5 h-3.5 w-3.5 ${isLoadingSummary ? 'animate-spin' : ''}`} />
              {isLoadingSummary ? 'Summarizing...' : 'AI Summary'}
            </Button>
          )}
          {activeConversation.type === 'channel' && activeConversation.channel && (
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsViewMembersDialogOpen(true)} 
                className="text-muted-foreground hover:text-primary"
                aria-label="View members"
                disabled={!currentUser}
              >
                <Users className="h-4 w-4" />
             </Button>
           )}
           {activeConversation.type === 'channel' && activeConversation.id && (
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddMembersDialogOpen(true)} 
                className="text-xs"
                aria-label="Add members to channel"
                disabled={!currentUser}
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Add Members
             </Button>
           )}
        </div>
      </div>
      {currentUser && ( // Only render dialogs if user is logged in
        <>
          <SummarizeDialog
            isOpen={isSummarizeDialogOpen}
            onOpenChange={handleSummarizeDialogClose}
            summary={currentSummary}
            isLoading={isLoadingSummary}
            channelName={activeConversation.type === 'channel' ? activeConversation.name : undefined}
          />
          {activeConversation.type === 'channel' && activeConversation.id && (
            <AddMembersToChannelDialog
              isOpen={isAddMembersDialogOpen}
              onOpenChange={setIsAddMembersDialogOpen}
              channelId={activeConversation.id}
            />
          )}
          {activeConversation.type === 'channel' && activeConversation.channel && (
            <ViewChannelMembersDialog
              isOpen={isViewMembersDialogOpen}
              onOpenChange={setIsViewMembersDialogOpen}
              channel={activeConversation.channel}
            />
          )}
        </>
      )}
    </>
  );
}
