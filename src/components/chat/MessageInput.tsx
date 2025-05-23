
"use client";
import React, { useState, useRef, type ChangeEvent, type KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, SendHorizonal, SmilePlus, X, Mic, StopCircle, FileText, Link as LinkIcon } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import type { User, Document, DocumentCategory } from '@/types';
import { UserAvatar } from '@/components/UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function MessageInput() {
  const [messageContent, setMessageContent] = useState('');
  const {
    users,
    currentUser,
    addMessage,
    activeConversation,
    replyingToMessage,
    setReplyingToMessage,
    allUsersWithCurrent,
    searchAllDocuments,
  } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // @mention state
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [filteredMentionUsers, setFilteredMentionUsers] = useState<User[]>([]);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [mentionStartPosition, setMentionStartPosition] = useState<number | null>(null);

  // /share document state
  const [showDocSearchPopover, setShowDocSearchPopover] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [filteredDocsForSharing, setFilteredDocsForSharing] = useState<Array<{ doc: Document, category: DocumentCategory }>>([]);
  const [activeDocSearchIndex, setActiveDocSearchIndex] = useState(0);
  const [slashCommandStartPosition, setSlashCommandStartPosition] = useState<number | null>(null);
  const SLASH_COMMAND = "/share ";


  // Voice message state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);


  useEffect(() => {
    if (replyingToMessage && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingToMessage]);


  const handleSendMessage = () => {
    if (messageContent.trim() === '' || !activeConversation) return;
    addMessage(messageContent.trim());
    setMessageContent('');
    setShowMentionPopover(false);
    setShowDocSearchPopover(false); 
    setDocSearchQuery('');
    setMentionQuery('');
  };

  const handleCancelReply = () => {
    setReplyingToMessage(null);
  };

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setMessageContent(text);

    const cursorPosition = event.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    
    // @mention logic
    const atMatch = textBeforeCursor.match(/@(\w*)$/);
    if (atMatch) {
      setShowDocSearchPopover(false); 
      setDocSearchQuery('');
      setSlashCommandStartPosition(null); // Ensure slash command popover is hidden
      const query = atMatch[1];
      const startPos = atMatch.index;

      if (startPos !== undefined) {
        setMentionStartPosition(startPos);
        setMentionQuery(query);
        const mentionableUsers = users.filter(u => u.id !== currentUser.id); 
        const filtered = mentionableUsers.filter(user =>
          user.name.toLowerCase().includes(query.toLowerCase()) && query.length > 0
        );
        setFilteredMentionUsers(filtered.length > 0 ? filtered : []);
        setShowMentionPopover(filtered.length > 0);
        setActiveMentionIndex(0);
      } else {
        setShowMentionPopover(false);
        setMentionQuery('');
      }
    } else if (slashCommandStartPosition === null) { // Only hide mention if not in slash command
      setShowMentionPopover(false);
      setMentionQuery('');
      setMentionStartPosition(null);
    }

    // /share document logic
    const slashCommandIndex = textBeforeCursor.lastIndexOf(SLASH_COMMAND);
    if (slashCommandIndex !== -1 && cursorPosition >= slashCommandIndex + SLASH_COMMAND.length) {
        setShowMentionPopover(false); 
        setMentionQuery('');
        setMentionStartPosition(null); // Ensure mention popover is hidden
        
        const query = textBeforeCursor.substring(slashCommandIndex + SLASH_COMMAND.length);
        setDocSearchQuery(query); 
        setSlashCommandStartPosition(slashCommandIndex); 
        
        const results = searchAllDocuments(query.trim());
        setFilteredDocsForSharing(query.trim() === '' ? results.slice(0, 5) : results);
        setShowDocSearchPopover(results.length > 0 || query.trim() === ''); // Show even if query is empty after /share
        setActiveDocSearchIndex(0);
    } else if (mentionStartPosition === null) { // Only hide slash if not in mention
        setSlashCommandStartPosition(null);
        setShowDocSearchPopover(false);
        setDocSearchQuery('');
    }
  };

  const handleMentionSelect = (user: User) => {
    if (mentionStartPosition === null || textareaRef.current === null) return;

    const currentText = messageContent;
    const textBeforeMention = currentText.substring(0, mentionStartPosition);
    const endOfMentionQuery = mentionStartPosition + 1 + mentionQuery.length; // +1 for @
    const textAfterMentionQuery = currentText.substring(endOfMentionQuery);
    
    const newText = `${textBeforeMention}@${user.name} ${textAfterMentionQuery}`;
    setMessageContent(newText);
    
    setShowMentionPopover(false);
    setMentionQuery('');
    setMentionStartPosition(null);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = mentionStartPosition + 1 + user.name.length + 1; 
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleDocShareSelect = (docData: { doc: Document, category: DocumentCategory }) => {
    const { doc } = docData; // Category might not be needed for the message content itself now
    
    if (doc.docType === 'file' && doc.fileObject) {
      addMessage(`Sharing: ${doc.name}`, doc.fileObject);
    } else if (doc.docType === 'text' && doc.textContent) {
      const shareMessage = `Shared document: "${doc.name}"\n\n${doc.textContent}`;
      addMessage(shareMessage);
    } else if (doc.docType === 'url' && doc.fileUrl) {
      const shareMessage = `Shared link: "${doc.name}"\n${doc.fileUrl}`;
      addMessage(shareMessage);
    } else {
      addMessage(`Attempted to share document: "${doc.name}".`);
    }
    
    setMessageContent(''); 
    
    setShowDocSearchPopover(false);
    setDocSearchQuery('');
    setSlashCommandStartPosition(null);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };


  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPopover && filteredMentionUsers.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveMentionIndex(prev => (prev + 1) % filteredMentionUsers.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveMentionIndex(prev => (prev - 1 + filteredMentionUsers.length) % filteredMentionUsers.length);
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        if (filteredMentionUsers[activeMentionIndex]) {
          handleMentionSelect(filteredMentionUsers[activeMentionIndex]);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setShowMentionPopover(false);
      }
    } else if (showDocSearchPopover && filteredDocsForSharing.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveDocSearchIndex(prev => (prev + 1) % filteredDocsForSharing.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveDocSearchIndex(prev => (prev - 1 + filteredDocsForSharing.length) % filteredDocsForSharing.length);
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        if (filteredDocsForSharing[activeDocSearchIndex]) {
          handleDocShareSelect(filteredDocsForSharing[activeDocSearchIndex]);
        }
      } else if (event.key === 'Escape') {
        event.preventDefault();
        setShowDocSearchPopover(false);
      }
    } else {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      } else if (event.key === 'Escape' && replyingToMessage) {
        event.preventDefault();
        handleCancelReply();
      }
    }
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      addMessage(`Shared file: ${file.name}`, file);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleToggleRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({ title: "Audio Recording Not Supported", description: "Your browser does not support audio recording.", variant: "destructive" });
      return;
    }

    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: audioBlob.type });
          addMessage("[Voice Message]", audioFile);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
        toast({ title: "Recording started", description: "Click the stop icon to finish." });
      } catch (err) {
        console.error("Error accessing microphone:", err);
        toast({ title: "Microphone Access Denied", description: "Please allow microphone access to record voice messages.", variant: "destructive" });
        setIsRecording(false);
      }
    }
  };


  if (!activeConversation) {
    return null;
  }

  const originalReplySenderName = replyingToMessage ? allUsersWithCurrent.find(u => u.id === replyingToMessage.userId)?.name : '';
  
  const popoverSideOffset = replyingToMessage ? 60 : 5; 

  return (
    <Popover open={showMentionPopover || showDocSearchPopover} onOpenChange={(open) => {
        if (!open) {
            setShowMentionPopover(false);
            setShowDocSearchPopover(false);
        }
    }}>
      <div className="p-3 border-t border-border bg-background relative">
        {replyingToMessage && (
          <div className="flex items-center justify-between p-1.5 mb-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md border border-input">
            <div className="truncate">
              Replying to <span className="font-medium text-foreground/80">{originalReplySenderName || 'Unknown User'}</span>: 
              <em className="ml-1 opacity-80">"{replyingToMessage.content.substring(0,50) + (replyingToMessage.content.length > 50 ? '...' : '')}"</em>
            </div>
            <Button variant="ghost" size="icon" onClick={handleCancelReply} className="h-6 w-6 text-muted-foreground hover:text-destructive">
              <X className="h-3.5 w-3.5" />
              <span className="sr-only">Cancel reply</span>
            </Button>
          </div>
        )}
        <PopoverAnchor asChild>
          <div className="flex items-center gap-2 rounded-lg border border-input p-1.5 focus-within:ring-1 focus-within:ring-ring bg-card">
            <Button type="button" variant="ghost" size="icon" onClick={handleAttachClick} className="text-muted-foreground hover:text-primary h-8 w-8">
              <Paperclip className="h-4.5 w-4.5" />
              <span className="sr-only">Attach file</span>
            </Button>
            <Input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              aria-label="Attach file"
            />
            <Textarea
              ref={textareaRef}
              value={messageContent}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isRecording ? "Recording voice message..." : "Type /share or @mention..."}
              className="flex-grow resize-none border-0 shadow-none focus-visible:ring-0 p-1.5 min-h-[2.25rem] max-h-32 bg-transparent"
              rows={1}
              disabled={isRecording}
            />
            <Button type="button" variant="ghost" size="icon" onClick={handleToggleRecording} className={cn("text-muted-foreground hover:text-primary h-8 w-8", isRecording && "text-destructive hover:text-destructive/80")}>
              {isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              <span className="sr-only">{isRecording ? "Stop recording" : "Record voice message"}</span>
            </Button>
            <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8">
              <SmilePlus className="h-5 w-5" />
              <span className="sr-only">Add emoji</span>
            </Button>
            <Button 
                type="button" 
                size="icon" 
                onClick={handleSendMessage} 
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 rounded-md"
                disabled={messageContent.trim() === '' || isRecording}
            >
              <SendHorizonal className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </div>
        </PopoverAnchor>
        
        {(showMentionPopover && filteredMentionUsers.length > 0) || (showDocSearchPopover && filteredDocsForSharing.length > 0) ? (
          <PopoverContent
            className="p-1 w-[300px] max-h-60 overflow-y-auto" 
            side="top"
            align="start"
            sideOffset={popoverSideOffset} 
            onOpenAutoFocus={(e) => e.preventDefault()} 
            onCloseAutoFocus={(e) => e.preventDefault()} 
          >
            <ScrollArea className="h-auto max-h-56"> 
              <div className="space-y-0.5">
                {showMentionPopover && filteredMentionUsers.map((user, index) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-auto p-1.5 text-left",
                      index === activeMentionIndex ? "bg-accent text-accent-foreground" : ""
                    )}
                    onClick={() => handleMentionSelect(user)}
                    onMouseMove={() => setActiveMentionIndex(index)} 
                  >
                    <UserAvatar user={user} className="h-6 w-6 mr-2" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      {user.designation && <span className="text-xs text-muted-foreground">{user.designation}</span>}
                    </div>
                  </Button>
                ))}
                {showDocSearchPopover && filteredDocsForSharing.map((item, index) => (
                  <Button
                    key={item.doc.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-auto p-1.5 text-left",
                      index === activeDocSearchIndex ? "bg-accent text-accent-foreground" : ""
                    )}
                    onClick={() => handleDocShareSelect(item)}
                    onMouseMove={() => setActiveDocSearchIndex(index)}
                  >
                    {item.doc.docType === 'file' && <FileText className="h-5 w-5 mr-2 text-muted-foreground" />}
                    {item.doc.docType === 'text' && <FileText className="h-5 w-5 mr-2 text-muted-foreground" />}
                    {item.doc.docType === 'url' && <LinkIcon className="h-5 w-5 mr-2 text-muted-foreground" />}
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-medium truncate" title={item.doc.name}>{item.doc.name}</span>
                      <span className="text-xs text-muted-foreground">In: {item.category.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
             {showDocSearchPopover && filteredDocsForSharing.length === 0 && docSearchQuery.trim().length > 0 && (
                <div className="p-2 text-center text-sm text-muted-foreground">No documents found matching "{docSearchQuery}".</div>
            )}
          </PopoverContent>
        ) : null}
      </div>
    </Popover>
  );
}
