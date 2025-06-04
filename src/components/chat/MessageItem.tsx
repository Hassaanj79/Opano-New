
"use client";
import type { Message } from '@/types';
import { useAppContext } from '@/contexts/AppContext';
import { UserAvatar } from '@/components/UserAvatar';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, ImageIcon, MessageSquareReply, Edit3, Trash2, ThumbsUp, Heart, Brain, AlertCircle, PartyPopper, MoreHorizontal, Mic } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useRef } from 'react';
import { Textarea } from '../ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const { users, currentUser, toggleReaction, editMessage, deleteMessage, setReplyingToMessage } = useAppContext();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.setSelectionRange(editInputRef.current.value.length, editInputRef.current.value.length);
    }
  }, [isEditing]);

  if (message.isSystemMessage) {
    return (
      <div className="flex justify-center py-1.5 px-4 my-1">
        <p className="text-xs text-muted-foreground italic bg-muted/40 px-2.5 py-1 rounded-full shadow-sm">
          {message.content}
        </p>
      </div>
    );
  }

  const sender = users.find(u => u.id === message.userId) || (message.userId === currentUser?.id ? currentUser : null);
  const isCurrentUserSender = sender?.id === currentUser?.id;

  const messageTimestamp = format(new Date(message.timestamp), 'p');

  const handleReactionClick = (emoji: string) => {
    if (currentUser && !isEditing) { // Disable reactions while editing
      toggleReaction(message.id, emoji);
    }
  };

  const handleEdit = () => {
    if (!isCurrentUserSender) return;
    setEditedContent(message.content);
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!isCurrentUserSender || !editMessage) return;
    if (editedContent.trim() !== message.content.trim()) {
      editMessage(message.id, editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  const confirmDelete = () => {
    if (!isCurrentUserSender || !deleteMessage) return;
    deleteMessage(message.id);
  }

  const renderFileAttachment = () => {
    if (!message.file) return null;
    const isImage = message.file.type === 'image' && message.file.url;
    const isAudio = message.file.type === 'audio' && message.file.url;
    const isOtherFile = !isImage && !isAudio && message.file.url;


    return (
      <Card className="mt-2 max-w-xs bg-card/50 shadow-sm border-border/60">
        <CardContent className="p-2.5">
          {isImage && (
            <a href={message.file.url} target="_blank" rel="noopener noreferrer" className="block">
              <Image
                src={message.file.url!}
                alt={message.file.name}
                width={200} 
                height={150}
                className="rounded-md object-cover hover:opacity-80 transition-opacity"
                data-ai-hint="image attachment"
              />
            </a>
          )}
          {isAudio && (
             <audio controls src={message.file.url} className="w-full h-10 rounded-md bg-card/80 shadow-none border-border/50 my-1">
               Your browser does not support the audio element.
             </audio>
          )}
          {isOtherFile && (
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                 <a href={message.file.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate block" title={message.file.name}>
                    {message.file.name}
                 </a>
                 <p className="text-xs text-muted-foreground">Generic File</p>
              </div>
            </div>
          )}
          {!isImage && !isAudio && ( 
             <p className="text-xs text-muted-foreground mt-1 truncate">{message.file.name}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const getReactionBadgeStyle = (emoji: string) => {
    switch (emoji) {
      case '👍': return 'bg-[hsl(var(--reaction-like-bg))] text-[hsl(var(--reaction-like-fg))] border-[hsl(var(--reaction-like-fg))]';
      case '❤️': return 'bg-[hsl(var(--reaction-love-bg))] text-[hsl(var(--reaction-love-fg))] border-[hsl(var(--reaction-love-fg))]';
      case '🤯': return 'bg-[hsl(var(--reaction-brain-bg))] text-[hsl(var(--reaction-brain-fg))] border-[hsl(var(--reaction-brain-fg))]';
      case '😮': return 'bg-[hsl(var(--reaction-alert-bg))] text-[hsl(var(--reaction-alert-fg))] border-[hsl(var(--reaction-alert-fg))]';
      case '🎉': return 'bg-[hsl(var(--reaction-party-bg))] text-[hsl(var(--reaction-party-fg))] border-[hsl(var(--reaction-party-fg))]';
      default: return 'bg-muted border-border text-muted-foreground';
    }
  };

  return (
    <div className={cn(
      "group flex gap-2.5 py-1.5 px-4 hover:bg-muted/30 relative", // Increased hover opacity for better visibility
      isCurrentUserSender ? "justify-end" : "justify-start"
    )}>
      {!isCurrentUserSender && <UserAvatar user={sender} className="h-8 w-8 flex-shrink-0 mt-0.5" />}

      <div className={cn(
        "flex flex-col max-w-[75%] md:max-w-[70%]", // Slightly increased max-width for wider screens
        isCurrentUserSender ? "items-end" : "items-start"
      )}>
        {!isCurrentUserSender && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-semibold text-sm text-foreground/90">{sender?.name || 'Unknown User'}</span>
            <span className="text-xs text-muted-foreground">{messageTimestamp}</span>
          </div>
        )}

        {message.replyToMessageId && (
          <div className={cn(
            "text-xs text-muted-foreground mb-1 pl-2.5 pr-2 py-1.5 border-l-2 rounded-r-md w-full", // Adjusted padding
             isCurrentUserSender ? "border-primary/40 bg-primary/10" : "border-primary/60 bg-muted/40" // Enhanced visual distinction
            )}>
            Replying to <strong className="text-foreground/80">{message.originalMessageSenderName || 'Unknown User'}</strong>:
            <em className="ml-1 truncate block italic">"{message.originalMessageContent?.substring(0,50)}{message.originalMessageContent && message.originalMessageContent.length > 50 ? '...' : ''}"</em>
          </div>
        )}

        <div className={cn(
          "relative rounded-xl px-3.5 py-2.5 text-sm shadow-md w-fit", // Increased padding and rounding, w-fit for better sizing
          isCurrentUserSender
            ? "bg-user-message-background text-user-message-foreground rounded-br-sm" // Softer round for current user's last bubble corner
            : "bg-other-message-background text-other-message-foreground rounded-bl-sm" // Softer round for other user's last bubble corner
        )}>
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                ref={editInputRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full text-sm bg-card/90 text-card-foreground p-2 min-h-[60px]"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSaveEdit();
                    } else if (e.key === 'Escape') {
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
              {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
              {message.isEdited && <span className="text-xs text-muted-foreground/70 italic ml-1">(edited)</span>}
              {renderFileAttachment()}
            </>
          )}

          {currentUser && !isEditing && ( 
            <div className={cn(
                "absolute top-[-14px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-0.5 p-1 rounded-full border bg-background/80 backdrop-blur-sm shadow-lg", // Enhanced toolbar style
                isCurrentUserSender ? "right-2" : "left-2"
            )}>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent hover:scale-110 transition-transform" onClick={() => handleReactionClick('👍')} aria-label="Thumbs Up">
                    <ThumbsUp className="h-3.5 w-3.5 text-muted-foreground"/>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent hover:scale-110 transition-transform" onClick={() => handleReactionClick('❤️')} aria-label="Heart">
                    <Heart className="h-3.5 w-3.5 text-muted-foreground"/>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent hover:scale-110 transition-transform" onClick={() => handleReactionClick('🤯')} aria-label="Mind Blown">
                    <Brain className="h-3.5 w-3.5 text-muted-foreground"/>
                </Button>
                 <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent hover:scale-110 transition-transform" onClick={() => handleReactionClick('😮')} aria-label="Shocked">
                    <AlertCircle className="h-3.5 w-3.5 text-muted-foreground"/>
                </Button>
                 <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent hover:scale-110 transition-transform" onClick={() => handleReactionClick('🎉')} aria-label="Party Popper">
                    <PartyPopper className="h-3.5 w-3.5 text-muted-foreground"/>
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent hover:scale-110 transition-transform" onClick={() => { setReplyingToMessage?.(message); toast({ title: "Replying", description: "Your next message will be a reply."}); }} aria-label="Reply">
                    <MessageSquareReply className="h-3.5 w-3.5 text-muted-foreground"/>
                </Button>
                {isCurrentUserSender && (
                  <>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent hover:scale-110 transition-transform" onClick={handleEdit} aria-label="Edit message">
                      <Edit3 className="h-3.5 w-3.5 text-muted-foreground"/>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent hover:scale-110 transition-transform" aria-label="Delete message">
                          <Trash2 className="h-3.5 w-3.5 text-destructive"/>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. Are you sure you want to permanently delete this message?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
            </div>
          )}
        </div>

        {message.reactions && Object.keys(message.reactions).length > 0 && currentUser && !isEditing && (
            <div className={cn(
                "flex gap-1 mt-1.5 flex-wrap", // Added mt-1.5
                isCurrentUserSender ? "justify-end" : ""
            )}>
                {Object.entries(message.reactions).map(([emoji, userIds]) => (
                    userIds.length > 0 && (
                        <button
                            key={emoji}
                            onClick={() => handleReactionClick(emoji)}
                            className={cn(
                                "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs shadow-sm transition-all hover:shadow-md hover:brightness-110", // Added hover:brightness-110
                                getReactionBadgeStyle(emoji),
                                userIds.includes(currentUser.id) ? "ring-2 ring-offset-1 ring-offset-background ring-current" : "opacity-80 hover:opacity-100"
                            )}
                            aria-label={`React with ${emoji}`}
                        >
                            <span>{emoji}</span>
                            <span className="font-medium">{userIds.length}</span>
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
      {isCurrentUserSender && <UserAvatar user={sender} className="h-8 w-8 flex-shrink-0 mt-0.5" />}
    </div>
  );
}
