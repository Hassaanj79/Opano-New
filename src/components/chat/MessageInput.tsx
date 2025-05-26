
"use client";
import React, { useState, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, SendHorizonal, SmilePlus } from 'lucide-react'; // Removed Mic, StopCircle etc.
import { useAppContext } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
// Removed Popover related imports
// Removed UserAvatar, ScrollArea, cn as @mention and /share are removed

export function MessageInput() {
  const [messageContent, setMessageContent] = useState('');
  const { addMessage, activeConversation } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSendMessage = () => {
    if (messageContent.trim() === '' || !activeConversation) return;
    addMessage(messageContent.trim());
    setMessageContent('');
  };

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setMessageContent(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0] && activeConversation) {
      const file = event.target.files[0];
      addMessage(`Shared file: ${file.name}`, file); // Simple message for file
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  if (!activeConversation) {
    return null;
  }
  
  return (
      <div className="p-3 border-t border-border bg-background relative">
        {/* ReplyToMessage UI removed */}
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
            placeholder="Type a message..."
            className="flex-grow resize-none border-0 shadow-none focus-visible:ring-0 p-1.5 min-h-[2.25rem] max-h-32 bg-transparent"
            rows={1}
          />
          {/* Voice message button removed */}
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
        {/* Popovers for @mention and /share removed */}
      </div>
  );
}
