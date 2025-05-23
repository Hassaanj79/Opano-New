
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserAvatar } from '@/components/UserAvatar';
import { format } from 'date-fns';
import { MessageSquareReply } from 'lucide-react';

export function RepliesView() {
  const { replies, allUsersWithCurrent, getConversationName, currentUser } = useAppContext();

  if (replies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <MessageSquareReply className="h-16 w-16 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">No Replies Yet</h3>
        <p className="text-sm text-center">You haven't been mentioned in any messages recently.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b sticky top-0 bg-background z-10">
        <h1 className="text-xl font-semibold text-foreground">Replies & Mentions</h1>
        <p className="text-sm text-muted-foreground">Messages where you were mentioned.</p>
      </header>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-3">
          {replies.map(message => {
            const sender = allUsersWithCurrent.find(u => u.id === message.userId);
            // Determine conversation context
            let conversationContext = "Unknown Conversation";
            let conversationType: 'channel' | 'dm' = 'channel'; // Default
            
            // This logic needs to iterate through mockMessages to find where this message.id exists
            // This is inefficient for a real app but okay for mock data
            for (const [convId, messagesInConv] of Object.entries(mockMessages)) {
              if (messagesInConv.some(m => m.id === message.id)) {
                conversationContext = getConversationName(convId, mockChannels.some(c => c.id === convId) ? 'channel' : 'dm');
                conversationType = mockChannels.some(c => c.id === convId) ? 'channel' : 'dm';
                break;
              }
            }
            
            const formattedTimestamp = format(new Date(message.timestamp), 'MMM d, p');

            return (
              <Card key={message.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-150">
                <CardHeader className="p-3 pb-2 bg-card/50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       {sender && <UserAvatar user={sender} className="h-7 w-7" />}
                       <CardTitle className="text-base font-medium">{sender?.name || 'Unknown User'}</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      {formattedTimestamp}
                    </CardDescription>
                  </div>
                   <p className="text-xs text-muted-foreground mt-1">
                      In {conversationType === 'channel' ? '#' : ''}{conversationContext}
                    </p>
                </CardHeader>
                <CardContent className="p-3">
                  <p className="text-sm whitespace-pre-wrap text-foreground/90">{message.content}</p>
                  {message.file && (
                    <div className="mt-2 text-xs text-blue-500">
                      📎 Attachment: {message.file.name}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

// Helper data from mock, should ideally not be imported directly if context provides enough, but needed for finding conv type.
import { mockMessages, mockChannels } from '@/lib/mock-data'; // Changed 'channels' to 'mockChannels'

