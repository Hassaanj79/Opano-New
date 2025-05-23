
"use client";
import type { Message } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ImageIcon, Smile, MoreHorizontal, Edit3, Trash2, ThumbsUp, Heart, Brain, PartyPopper, AlertCircle, Users } from 'lucide-react'; 
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { UserProfilePopover } from './UserProfilePopover'; // Import the new component

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const { users, currentUser, toggleReaction, editMessage, deleteMessage } = useAppContext();
  

  if (message.isSystemMessage) {
    return (
      <div className="flex justify-center py-1.5 px-4 my-1">
        <p className="text-xs text-muted-foreground italic bg-muted/40 px-2.5 py-1 rounded-full shadow-sm">
          {message.content}
        </p>
      </div>
    );
  }

  const sender = users.find(u => u.id === message.userId) || (message.userId === currentUser.id ? currentUser : undefined);
  const isCurrentUserSender = sender?.id === currentUser.id;

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const { toast } = useToast();

  const messageTimestamp = format(new Date(message.timestamp), 'p');

  const renderContent = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return <span key={index} className="text-primary font-medium">{part}</span>;
      }
      return part;
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditText(message.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(message.content);
  };

  const handleSaveEdit = () => {
    if (editText.trim() === '') {
      toast({ title: "Cannot save empty message", variant: "destructive" });
      return;
    }
    if (editText.trim() !== message.content) {
      editMessage(message.id, editText.trim());
    }
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    // Confirmation dialog could be added here
    deleteMessage(message.id);
    toast({ title: "Message Deleted" });
  };

  const avatarElement = <UserAvatar user={sender} className="h-8 w-8 flex-shrink-0 mt-0.5" />;

  return (
    <div className={cn(
      "group flex gap-2.5 py-1.5 px-4 hover:bg-muted/20 relative",
      isCurrentUserSender ? "justify-end" : "justify-start"
    )}>
      {!isCurrentUserSender && sender && (
        <UserProfilePopover user={sender} popoverSide="right" popoverAlign="start">
          {avatarElement}
        </UserProfilePopover>
      )}
      {!isCurrentUserSender && !sender && avatarElement} {/* Fallback if sender is somehow undefined */}
      
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isCurrentUserSender ? "items-end" : "items-start"
      )}>
        {!isCurrentUserSender && !isEditing && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm text-foreground/90">{sender?.name || 'Unknown User'}</span>
            <span className="text-xs text-muted-foreground">{messageTimestamp}</span>
          </div>
        )}
        
        <div className={cn(
          "relative rounded-lg px-3 py-2 text-sm shadow-sm w-full",
          isCurrentUserSender 
            ? "bg-user-message-background text-user-message-foreground rounded-br-none" 
            : "bg-other-message-background text-other-message-foreground rounded-bl-none"
        )}>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea 
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[60px] bg-card text-card-foreground border-border focus-visible:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  }
                  if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancelEdit} className="text-xs">Cancel</Button>
                <Button size="sm" onClick={handleSaveEdit} className="text-xs">Save</Button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap">{renderContent(message.content)}</p>
              {message.isEdited && <span className="text-xs text-muted-foreground/70 italic ml-1">(edited)</span>}
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
            </>
          )}

          {/* Hover actions - shown on group hover, not when editing */}
          {!isEditing && (
            <div className={cn(
                "absolute top-[-12px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 p-0.5 rounded-full border bg-background shadow-sm",
                isCurrentUserSender ? "right-2" : "left-2" 
            )}>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent" onClick={() => toggleReaction(message.id, '👍')} aria-label="Thumbs Up">
                    <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground"/>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent" onClick={() => toggleReaction(message.id, '❤️')} aria-label="Heart">
                    <Heart className="h-3.5 w-3.5 text-muted-foreground"/>
                </Button>
                 <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent" onClick={() => toggleReaction(message.id, '🤯')} aria-label="Mind Blown">
                    <Brain className="h-3.5 w-3.5 text-muted-foreground" /> 
                </Button>
                 <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent" onClick={() => toggleReaction(message.id, '😮')} aria-label="Shocked">
                    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" /> 
                </Button>
                 <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent" onClick={() => toggleReaction(message.id, '🎉')} aria-label="Party Popper">
                    <PartyPopper className="h-3.5 w-3.5 text-muted-foreground"/>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent" aria-label="Add reaction with emoji picker">
                    <Smile className="h-3.5 w-3.5 text-muted-foreground"/>
                </Button>
                {isCurrentUserSender && (
                  <>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent" onClick={handleEdit} aria-label="Edit message">
                      <Edit3 className="h-3.5 w-3.5 text-muted-foreground"/>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/20" onClick={handleDelete} aria-label="Delete message">
                      <Trash2 className="h-3.5 w-3.5 text-destructive"/>
                    </Button>
                  </>
                )}
            </div>
          )}
        </div>

        {/* Reactions display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && !isEditing && (
            <div className={cn(
                "flex gap-1 mt-1 flex-wrap", 
                isCurrentUserSender ? "justify-end" : ""
            )}>
                {Object.entries(message.reactions).map(([emoji, userIds]) => (
                    userIds.length > 0 && ( 
                        <button 
                            key={emoji} 
                            onClick={() => toggleReaction(message.id, emoji)}
                            className={cn(
                                "flex items-center gap-1 rounded-full border bg-background hover:bg-muted/50 px-1.5 py-0.5 text-xs",
                                userIds.includes(currentUser.id) ? "border-primary bg-primary/10" : "border-border"
                            )}
                            aria-label={`React with ${emoji}`}
                        >
                            <span>{emoji}</span>
                            <span className="text-muted-foreground font-medium">{userIds.length}</span>
                        </button>
                    )
                ))}
            </div>
        )}

        {isCurrentUserSender && !isEditing && (
          <div className="flex items-center gap-1 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="M20 6 9 17l-5-5"/></svg>
            <span className="text-xs text-muted-foreground">{messageTimestamp}</span>
          </div>
        )}
      </div>
      {isCurrentUserSender && (
         avatarElement // Show current user's avatar without popover
      )}
    </div>
  );
}

