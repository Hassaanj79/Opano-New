
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Hash, Sparkles, UserCircle2, Users, UserPlus } from 'lucide-react'; // Added UserPlus
import { useState } from 'react';
import { SummarizeDialog } from './SummarizeDialog';
import { AddMembersToChannelDialog } from '@/components/dialogs/AddMembersToChannelDialog'; // New Dialog

export function ChatHeader() {
  const { activeConversation, generateSummary, currentSummary, isLoadingSummary, clearSummary } = useAppContext();
  const [isSummarizeDialogOpen, setIsSummarizeDialogOpen] = useState(false);
  const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false); // State for new dialog

  if (!activeConversation) return null;

  const handleSummarize = async () => {
    if (activeConversation.type === 'channel') {
      setIsSummarizeDialogOpen(true);
      await generateSummary(activeConversation.id);
    }
  };
  
  const handleDialogClose = (open: boolean) => {
    setIsSummarizeDialogOpen(open);
    if(!open) {
      clearSummary();
    }
  }

  const name = activeConversation.name;
  const description = activeConversation.type === 'channel' 
    ? `${activeConversation.channel?.memberIds.length || 0} Members` 
    : (activeConversation.recipient?.designation || (activeConversation.recipient?.isOnline ? 'Online' : 'Offline'));

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
          {activeConversation.type === 'channel' && (
            <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isLoadingSummary} className="text-xs">
              <Sparkles className={`mr-1.5 h-3.5 w-3.5 ${isLoadingSummary ? 'animate-spin' : ''}`} />
              {isLoadingSummary ? 'Summarizing...' : 'AI Summary'}
            </Button>
          )}
          {activeConversation.type === 'channel' && (
             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Users className="h-4 w-4" />
                <span className="sr-only">View members</span>
             </Button>
           )}
           {activeConversation.type === 'channel' && activeConversation.id && (
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddMembersDialogOpen(true)} 
                className="text-xs"
                aria-label="Add members to channel"
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Add Members
             </Button>
           )}
        </div>
      </div>
      <SummarizeDialog
        isOpen={isSummarizeDialogOpen}
        onOpenChange={handleDialogClose}
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
    </>
  );
}

    