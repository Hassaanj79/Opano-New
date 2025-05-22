
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Hash, Sparkles, Users, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import { SummarizeDialog } from './SummarizeDialog';

export function ChatHeader() {
  const { activeConversation, generateSummary, currentSummary, isLoadingSummary, clearSummary } = useAppContext();
  const [isSummarizeDialogOpen, setIsSummarizeDialogOpen] = useState(false);

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
      clearSummary(); // Clear summary when dialog closes
    }
  }

  const name = activeConversation.name;
  const description = activeConversation.type === 'channel' 
    ? `${activeConversation.channel?.memberCount || 0} members` 
    : (activeConversation.recipient?.isOnline ? 'Online' : 'Offline');

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-border h-[61px]">
        <div className="flex items-center gap-2">
          {activeConversation.type === 'channel' ? (
            <Hash className="h-5 w-5 text-muted-foreground" />
          ) : (
            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <h2 className="text-lg font-semibold">{name}</h2>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
        </div>
        {activeConversation.type === 'channel' && (
          <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isLoadingSummary}>
            <Sparkles className={`mr-2 h-4 w-4 ${isLoadingSummary ? 'animate-spin' : ''}`} />
            {isLoadingSummary ? 'Summarizing...' : 'Summarize'}
          </Button>
        )}
      </div>
      <SummarizeDialog
        isOpen={isSummarizeDialogOpen}
        onOpenChange={handleDialogClose}
        summary={currentSummary}
        isLoading={isLoadingSummary}
        channelName={activeConversation.type === 'channel' ? activeConversation.name : undefined}
      />
    </>
  );
}
