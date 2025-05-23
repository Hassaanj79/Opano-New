
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserAvatar } from '@/components/UserAvatar';
import { format } from 'date-fns';
import { BellRing, MessageCircle } from 'lucide-react'; // Using MessageCircle for message context

export function ActivityView() {
  const { activities, currentUser } = useAppContext();

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6">
        <BellRing className="h-16 w-16 mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">No Activity Yet</h3>
        <p className="text-sm text-center">No one has reacted to your messages recently.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <header className="p-4 border-b sticky top-0 bg-background z-10">
        <h1 className="text-xl font-semibold text-foreground">Activity</h1>
        <p className="text-sm text-muted-foreground">Reactions to your messages.</p>
      </header>
      <ScrollArea className="flex-grow">
        <div className="p-4 space-y-3">
          {activities.map(activity => {
            const formattedTimestamp = format(new Date(activity.timestamp), 'MMM d, p');
            return (
              <Card key={activity.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-150">
                <CardHeader className="p-3 pb-2 bg-card/50 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserAvatar user={activity.reactor} className="h-7 w-7" />
                            <CardTitle className="text-base font-medium">
                                {activity.reactor.name} reacted <span className="text-xl">{activity.emoji}</span>
                            </CardTitle>
                        </div>
                        <CardDescription className="text-xs">
                            {formattedTimestamp}
                        </CardDescription>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        To your message in {activity.conversationType === 'channel' ? '#' : ''}{activity.conversationName}
                    </p>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md border border-border/50">
                    <MessageCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="italic truncate">{currentUser.name}: "{activity.message.content}"</p>
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
