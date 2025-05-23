
"use client";
import React, { useState, useRef, type ChangeEvent, type KeyboardEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, SendHorizonal, SmilePlus } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from '@/components/ui/popover';
import type { User } from '@/types';
import { UserAvatar } from '@/components/UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export function MessageInput() {
  const [messageContent, setMessageContent] = useState('');
  const { users, currentUser, addMessage, activeConversation } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentionPopover, setShowMentionPopover] = useState(false);
  const [filteredMentionUsers, setFilteredMentionUsers] = useState<User[]>([]);
  const [activeMentionIndex, setActiveMentionIndex] = useState(0);
  const [mentionStartPosition, setMentionStartPosition] = useState<number | null>(null);

  const handleSendMessage = () => {
    if (messageContent.trim() === '' || !activeConversation) return;
    addMessage(messageContent.trim());
    setMessageContent('');
    setShowMentionPopover(false); // Close popover on send
  };

  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const text = event.target.value;
    setMessageContent(text);

    const cursorPosition = event.target.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition);
    
    // Regex to find @mention at the current cursor position or word boundary
    // Matches "@" followed by word characters, potentially at the end of the string or followed by non-word char
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      const query = atMatch[1];
      const startPos = atMatch.index;

      if (startPos !== undefined) {
        setMentionStartPosition(startPos);
        setMentionQuery(query);

        const mentionableUsers = users.filter(u => u.id !== currentUser.id); // users from context already excludes current user
        const filtered = mentionableUsers.filter(user =>
          user.name.toLowerCase().includes(query.toLowerCase()) && query.length > 0 // Only show if query has text
        );

        if (filtered.length > 0) {
          setFilteredMentionUsers(filtered);
          setShowMentionPopover(true);
          setActiveMentionIndex(0);
        } else {
          setShowMentionPopover(false);
        }
      } else {
        setShowMentionPopover(false);
      }
    } else {
      setShowMentionPopover(false);
      setMentionStartPosition(null);
    }
  };

  const handleMentionSelect = (user: User) => {
    if (mentionStartPosition === null || textareaRef.current === null) return;

    const currentText = messageContent;
    const textBeforeMention = currentText.substring(0, mentionStartPosition);
    // Calculate the end of the @query part accurately
    const endOfMentionQuery = mentionStartPosition + 1 + mentionQuery.length;
    const textAfterMentionQuery = currentText.substring(endOfMentionQuery);
    
    const newText = `${textBeforeMention}@${user.name} ${textAfterMentionQuery}`;
    setMessageContent(newText);
    
    setShowMentionPopover(false);
    setMentionQuery('');
    setMentionStartPosition(null);
    
    // Set focus and cursor position after the inserted mention
    // Needs to be deferred to allow React to update the textarea value
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = mentionStartPosition + 1 + user.name.length + 1; // after @, name, and the trailing space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
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
    } else {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
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

  if (!activeConversation) {
    return null;
  }

  return (
    <Popover open={showMentionPopover} onOpenChange={setShowMentionPopover}>
      <div className="p-3 border-t border-border bg-background relative">
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
              placeholder={`Type your message...`}
              className="flex-grow resize-none border-0 shadow-none focus-visible:ring-0 p-1.5 min-h-[2.25rem] max-h-32 bg-transparent"
              rows={1}
            />
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
        </PopoverAnchor>
        {showMentionPopover && filteredMentionUsers.length > 0 && (
          <PopoverContent
            className="p-1 w-[250px] max-h-60 overflow-y-auto" // Adjust width as needed
            side="top"
            align="start"
            sideOffset={5}
            onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
            onCloseAutoFocus={(e) => e.preventDefault()} // Prevent refocusing textarea immediately if not desired
          >
            <ScrollArea className="h-auto max-h-56"> {/* Max height for scroll */}
              <div className="space-y-0.5">
                {filteredMentionUsers.map((user, index) => (
                  <Button
                    key={user.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-auto p-1.5 text-left",
                      index === activeMentionIndex ? "bg-accent text-accent-foreground" : ""
                    )}
                    onClick={() => handleMentionSelect(user)}
                    onMouseMove={() => setActiveMentionIndex(index)} // Highlight on mouse hover
                  >
                    <UserAvatar user={user} className="h-6 w-6 mr-2" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.name}</span>
                      {user.designation && <span className="text-xs text-muted-foreground">{user.designation}</span>}
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        )}
      </div>
    </Popover>
  );
}
