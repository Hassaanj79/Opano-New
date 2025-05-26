
      
"use client";
import React, { useState, useRef, type ChangeEvent, type KeyboardEvent, type DragEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, SendHorizonal, SmilePlus, UploadCloud, Mic, StopCircle } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import type { User, Document, DocumentCategory } from '@/types';
import { UserAvatar } from '@/components/UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const SLASH_COMMAND = "/share ";

export function MessageInput() {
  const [messageContent, setMessageContent] = useState('');
  const {
    addMessage,
    activeConversation,
    replyingToMessage,
    setReplyingToMessage,
    users: allUsers, // For @mentions, excluding current user
    currentUser,
    searchAllDocuments,
  } = useAppContext();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // State for @mentions
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [mentionStartPosition, setMentionStartPosition] = useState<number | null>(null);

  // State for /share documents
  const [showDocSearchPopover, setShowDocSearchPopover] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [filteredDocsForSharing, setFilteredDocsForSharing] = useState<Array<{ doc: Document, category: DocumentCategory }>>([]);
  const [activeDocSearchIndex, setActiveDocSearchIndex] = useState(0);
  const [slashCommandStartPosition, setSlashCommandStartPosition] = useState<number | null>(null);

  // State for voice recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // State for drag and drop
  const [isDraggingOver, setIsDraggingOver] = useState(false);


  const availableUsersForMention = allUsers.filter(u => u.id !== currentUser?.id);

  const handleSendMessage = () => {
    if (messageContent.trim() === '' || !activeConversation || !currentUser) return;

    let messageType = 'standard';
    let fileToSend: File | undefined = undefined;

    addMessage(messageContent.trim(), fileToSend, messageType);
    setMessageContent('');
    setReplyingToMessage(null); // Clear reply context after sending
    setShowMentionPopover(false);
    setShowDocSearchPopover(false);
    setMentionStartPosition(null);
    setSlashCommandStartPosition(null);
    textareaRef.current?.focus();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && activeConversation && currentUser) {
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

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setMessageContent(text);
    const cursorPosition = event.target.selectionStart;

    // @mention logic
    const atMentionMatch = /@(\w*)$/.exec(text.substring(0, cursorPosition));
    if (atMentionMatch) {
      const query = atMentionMatch[1].toLowerCase();
      setMentionQuery(query);
      const matches = availableUsersForMention.filter(user =>
        user.name.toLowerCase().includes(query)
      ).slice(0, 5);
      setFilteredUsers(matches);
      setActiveMentionIndex(0);
      setShowMentionPopover(matches.length > 0);
      if (mentionStartPosition === null) {
        setMentionStartPosition(cursorPosition - query.length - 1);
      }
    } else {
      setShowMentionPopover(false);
      setMentionStartPosition(null);
    }

    // /share document logic
    const slashCommandIndex = text.lastIndexOf(SLASH_COMMAND);
    if (slashCommandIndex !== -1 && cursorPosition >= slashCommandIndex + SLASH_COMMAND.length) {
        const query = text.substring(slashCommandIndex + SLASH_COMMAND.length, cursorPosition).toLowerCase();
        setDocSearchQuery(query);
        const results = searchAllDocuments(query).slice(0, 5);
        setFilteredDocsForSharing(results);
        setActiveDocSearchIndex(0);
        setShowDocSearchPopover(results.length > 0);
        if (slashCommandStartPosition === null) {
          setSlashCommandStartPosition(slashCommandIndex);
        }
    } else if (slashCommandStartPosition !== null) { // User has backspaced or moved out of share mode
        setShowDocSearchPopover(false);
        setSlashCommandStartPosition(null);
        setDocSearchQuery('');
    } else {
        // Ensure popover is hidden if neither @mention nor /share is active
        if (!atMentionMatch) {
          setShowDocSearchPopover(false);
          setSlashCommandStartPosition(null);
        }
    }
  };

  const handleMentionSelect = (user: User) => {
    if (mentionStartPosition !== null) {
      const newText =
        messageContent.substring(0, mentionStartPosition) +
        `@${user.name} ` +
        messageContent.substring(textareaRef.current?.selectionStart || 0);
      setMessageContent(newText);
      setShowMentionPopover(false);
      setMentionStartPosition(null);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  const handleDocShareSelect = (doc: Document, category: DocumentCategory) => {
    if (!activeConversation || !currentUser || slashCommandStartPosition === null) return;

    let sharedContent = `Shared: ${doc.name} (from ${category.name})`;
    let fileToShare: File | undefined = undefined;

    if (doc.docType === 'file' && doc.fileObject) {
      sharedContent = `Sharing file: ${doc.name}`;
      fileToShare = doc.fileObject;
    } else if (doc.docType === 'text' && doc.textContent) {
      sharedContent = `Shared document: "${doc.name}"\n\n${doc.textContent}`;
    } else if (doc.docType === 'url' && doc.fileUrl) {
      sharedContent = `Shared link: "${doc.name}"\n${doc.fileUrl}`;
    }
    
    addMessage(sharedContent, fileToShare);

    setMessageContent(messageContent.substring(0, slashCommandStartPosition)); // Remove the /share command part
    setShowDocSearchPopover(false);
    setSlashCommandStartPosition(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };


  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionPopover && filteredUsers.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveMentionIndex(prev => (prev + 1) % filteredUsers.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveMentionIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      } else if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        handleMentionSelect(filteredUsers[activeMentionIndex]);
      } else if (event.key === 'Escape') {
        setShowMentionPopover(false);
        setMentionStartPosition(null);
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
        const selection = filteredDocsForSharing[activeDocSearchIndex];
        handleDocShareSelect(selection.doc, selection.category);
      } else if (event.key === 'Escape') {
        setShowDocSearchPopover(false);
        setSlashCommandStartPosition(null);
      }
    } else if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: audioBlob.type });
        if (activeConversation && currentUser) {
          addMessage(`[Voice Message]`, audioFile);
        }
        stream.getTracks().forEach(track => track.stop()); // Stop microphone access
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    // Check if the leave target is outside the drop zone
    if (event.currentTarget.contains(event.relatedTarget as Node)) {
        return;
    }
    setIsDraggingOver(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDraggingOver(false);

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0 && activeConversation && currentUser) {
      Array.from(event.dataTransfer.files).forEach(file => {
        addMessage(`Shared file: ${file.name}`, file);
      });
      event.dataTransfer.clearData();
    }
  };

  if (!activeConversation) {
    return null;
  }

  const originalSenderName = replyingToMessage?.userId === currentUser?.id
    ? "yourself"
    : allUsers.find(u => u.id === replyingToMessage?.userId)?.name || "Unknown User";

  return (
    <div 
      className={cn(
        "p-3 border-t border-border bg-background relative transition-all duration-150 ease-in-out",
        isDraggingOver && "outline-dashed outline-2 outline-offset-[-4px] outline-primary bg-primary/10"
      )}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDraggingOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/10 pointer-events-none rounded-lg">
          <UploadCloud className="h-12 w-12 text-primary mb-2" />
          <p className="text-sm font-medium text-primary">Drop files to upload</p>
        </div>
      )}
      {replyingToMessage && (
        <div className="mb-2 p-2 text-xs bg-muted rounded-md border border-border/50 text-muted-foreground">
          Replying to <strong className="text-foreground/90">{originalSenderName}</strong>:
          <em className="ml-1 truncate block">"{replyingToMessage.content.substring(0, 50)}{replyingToMessage.content.length > 50 ? '...' : ''}"</em>
          <Button variant="ghost" size="icon" onClick={() => setReplyingToMessage(null)} className="h-5 w-5 float-right -mt-1 -mr-1">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
       <div className={cn(
        "flex items-center gap-2 rounded-lg border border-input p-1.5 focus-within:ring-1 focus-within:ring-ring bg-card",
        isDraggingOver && "opacity-50" // Dim input area when dragging over
      )}>
        <Popover open={showMentionPopover} onOpenChange={setShowMentionPopover}>
          <PopoverAnchor asChild>
            <div className="flex-grow relative">
              <Textarea
                ref={textareaRef}
                value={messageContent}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or /share for documents..."
                className="flex-grow resize-none border-0 shadow-none focus-visible:ring-0 p-1.5 min-h-[2.25rem] max-h-32 bg-transparent"
                rows={1}
              />
            </div>
          </PopoverAnchor>
          {filteredUsers.length > 0 && (
            <PopoverContent
                className="w-[250px] p-1 max-h-60 overflow-y-auto"
                side="top"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()} // Prevent stealing focus
            >
              <ScrollArea className="max-h-56">
                {filteredUsers.map((user, index) => (
                  <div
                    key={user.id}
                    onClick={() => handleMentionSelect(user)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent",
                      index === activeMentionIndex && "bg-accent"
                    )}
                  >
                    <UserAvatar user={user} className="h-6 w-6" />
                    <span className="text-sm">{user.name}</span>
                  </div>
                ))}
              </ScrollArea>
            </PopoverContent>
          )}
        </Popover>

         <Popover open={showDocSearchPopover} onOpenChange={setShowDocSearchPopover}>
          <PopoverAnchor asChild>
            <div className="absolute" /> {/* Dummy anchor, actual anchor is textarea */}
          </PopoverAnchor>
          {filteredDocsForSharing.length > 0 && (
            <PopoverContent
                className="w-[300px] p-1 max-h-60 overflow-y-auto"
                side="top"
                align="start"
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <ScrollArea className="max-h-56">
                  <p className="text-xs text-muted-foreground px-2 py-1">Share a document:</p>
                  {filteredDocsForSharing.map(({ doc, category }, index) => (
                    <div
                      key={doc.id}
                      onClick={() => handleDocShareSelect(doc, category)}
                      className={cn(
                        "p-2 rounded-md cursor-pointer hover:bg-accent",
                        index === activeDocSearchIndex && "bg-accent"
                      )}
                    >
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground truncate">In: {category.name}</p>
                    </div>
                  ))}
                </ScrollArea>
            </PopoverContent>
          )}
        </Popover>

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
        {!isRecording ? (
          <Button type="button" variant="ghost" size="icon" onClick={startRecording} className="text-muted-foreground hover:text-primary h-8 w-8">
            <Mic className="h-5 w-5" />
            <span className="sr-only">Record voice message</span>
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="icon" onClick={stopRecording} className="text-red-500 hover:text-red-600 h-8 w-8">
            <StopCircle className="h-5 w-5" />
            <span className="sr-only">Stop recording</span>
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8">
          <SmilePlus className="h-5 w-5" />
          <span className="sr-only">Add emoji</span>
        </Button>
        <Button
            type="button"
            size="icon"
            onClick={handleSendMessage}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 rounded-md"
            disabled={messageContent.trim() === ''}
        >
          <SendHorizonal className="h-4 w-4" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}

// Helper: A small X icon component if not already available or to avoid lucide import in simple cases
const X = ({ className } : { className?: string}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("h-4 w-4", className)}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);

    