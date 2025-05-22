
"use client";
import { useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, SendHorizonal } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input'; // For file input

export function MessageInput() {
  const [messageContent, setMessageContent] = useState('');
  const { addMessage, activeConversation } = useAppContext();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (messageContent.trim() === '' || !activeConversation) return;
    addMessage(messageContent.trim());
    setMessageContent('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // For simplicity, we'll just add a message indicating a file was "sent".
      // In a real app, you'd upload the file then send a message with file info.
      addMessage(`Shared file: ${file.name}`, file);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
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
    <div className="p-4 border-t border-border bg-background">
      <div className="flex items-end gap-2 rounded-lg border border-input p-2 focus-within:ring-2 focus-within:ring-ring">
        <Textarea
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${activeConversation.name}`}
          className="flex-grow resize-none border-0 shadow-none focus-visible:ring-0 p-0 min-h-[2.5rem] max-h-32"
          rows={1}
        />
        <Input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          aria-label="Attach file"
        />
        <Button type="button" variant="ghost" size="icon" onClick={handleAttachClick} className="text-muted-foreground hover:text-primary">
          <Paperclip className="h-5 w-5" />
          <span className="sr-only">Attach file</span>
        </Button>
        <Button type="button" size="icon" onClick={handleSendMessage} className="bg-primary hover:bg-primary/90">
          <SendHorizonal className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}
