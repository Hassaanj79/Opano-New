
"use client";
import type { Message } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ImageIcon, Smile,ThumbsUp, Heart, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const { users, currentUser } = useAppContext();
  const sender = users.find(u => u.id === message.userId) || (message.userId === currentUser.id ? currentUser : undefined);
  const isCurrentUserSender = sender?.id === currentUser.id;

  const messageTimestamp = format(new Date(message.timestamp), 'p'); // e.g., 9:01 PM

  // Helper to render @mentions with styling
  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return <span key={index} className="text-primary font-medium">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className={cn(
      "group flex gap-2.5 py-1.5 px-4 hover:bg-muted/20", // Reduced padding
      isCurrentUserSender ? "justify-end" : "justify-start"
    )}>
      {!isCurrentUserSender && (
        <UserAvatar user={sender} className="h-8 w-8 flex-shrink-0 mt-0.5" />
      )}
      
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isCurrentUserSender ? "items-end" : "items-start"
      )}>
        {!isCurrentUserSender && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm text-foreground/90">{sender?.name || 'Unknown User'}</span>
            <span className="text-xs text-muted-foreground">{messageTimestamp}</span>
          </div>
        )}
        
        <div className={cn(
          "relative rounded-lg px-3 py-2 text-sm shadow-sm",
          isCurrentUserSender 
            ? "bg-user-message-background text-user-message-foreground rounded-br-none" 
            : "bg-other-message-background text-other-message-foreground rounded-bl-none"
        )}>
          <p className="whitespace-pre-wrap">{renderContent(message.content)}</p>
          {message.file && (
            <Card className="mt-2 max-w-xs bg-card/80 shadow-none border-border/50">
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  {message.file.type === 'image' ? (
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  )}
                  <a href={message.file.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate">
                    {message.file.name}
                  </a>
                </div>
                {message.file.type === 'image' && message.file.url.startsWith('https://placehold.co') && (
                   <Image 
                      src={message.file.url} 
                      alt={message.file.name} 
                      width={150} 
                      height={100} 
                      className="mt-1.5 rounded-md object-cover"
                      data-ai-hint="placeholder image"
                   />
                )}
              </CardContent>
            </Card>
          )}
            {/* Hover actions - shown on group hover */}
            <div className={cn(
                "absolute top-[-10px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 p-0.5 rounded-full border bg-background shadow-sm",
                isCurrentUserSender ? "right-2" : "left-2" 
            )}>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent"><Smile className="h-3.5 w-3.5 text-muted-foreground"/></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent"><MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground"/></Button>
            </div>
        </div>

        {message.reactions && Object.keys(message.reactions).length > 0 && (
            <div className={cn(
                "flex gap-1 mt-1",
                isCurrentUserSender ? "justify-end" : ""
            )}>
                {Object.entries(message.reactions).map(([emoji, userIds]) => (
                    <button 
                        key={emoji} 
                        className="flex items-center gap-1 rounded-full border bg-background hover:bg-muted/50 px-1.5 py-0.5 text-xs"
                        aria-label={`React with ${emoji}`}
                    >
                        <span>{emoji}</span>
                        <span className="text-muted-foreground">{userIds.length}</span>
                    </button>
                ))}
            </div>
        )}
        {isCurrentUserSender && (
          <div className="flex items-center gap-1 mt-0.5">
             {/* Placeholder for sent/read status, checkmark from image */}
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M20 6 9 17l-5-5"/></svg>
            <span className="text-xs text-muted-foreground">{messageTimestamp}</span>
          </div>
        )}
      </div>
      {isCurrentUserSender && (
        <UserAvatar user={sender} className="h-8 w-8 flex-shrink-0 mt-0.5" />
      )}
    </div>
  );
}
