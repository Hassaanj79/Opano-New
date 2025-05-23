
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Edit3, Trash2, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export function DraftsView() {
  const { drafts, setActiveConversation, deleteDraft } = useAppContext();
  const { toast } = useToast();

  const handleEditOrSendDraft = (draftId: string, targetConversationId: string, targetConversationType: 'channel' | 'dm') => {
    setActiveConversation(targetConversationType, targetConversationId);
    // For now, we just switch to the conversation. Populating input is a TODO for a later step.
    // User will need to copy/paste or retype.
    toast({
      title: "Switched to Conversation",
      description: "Your draft content can be manually copied to the message input.",
    });
    // The draft is not automatically deleted here. User can send and then delete if desired.
  };

  const handleDeleteDraft = (draftId: string) => {
    deleteDraft(draftId);
    // Toast for deletion is handled within useAppContext's deleteDraft
  };


  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <FileText className="h-16 w-16 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">No Drafts Yet</h3>
        <p className="text-sm text-center">You haven't saved any drafts.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b sticky top-0 bg-background z-10">
        <h1 className="text-xl font-semibold text-foreground">Drafts</h1>
        <p className="text-sm text-muted-foreground">Your saved, unsent messages.</p>
      </header>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-3">
          {drafts.map(draft => {
            const formattedTimestamp = format(new Date(draft.timestamp), 'MMM d, p');
            return (
              <Card key={draft.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-150">
                <CardHeader className="p-3 pb-2 bg-card/50 border-b">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-medium">
                            Draft for: {draft.targetConversationType === 'channel' ? '#' : ''}{draft.targetConversationName}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Last saved: {formattedTimestamp}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-wrap text-foreground/90 mb-3">{draft.content}</p>
                  <div className="flex justify-end gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handleEditOrSendDraft(draft.id, draft.targetConversationId, draft.targetConversationType)}
                    >
                        <Send className="h-3.5 w-3.5 mr-1" /> {/* Changed icon to Send */}
                        Go to Chat
                    </Button>
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => handleDeleteDraft(draft.id)}
                    >
                         <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

