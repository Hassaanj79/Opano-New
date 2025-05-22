
"use client";
import { useAppContext } from '@/contexts/AppContext';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { MessageSquareDashed } from 'lucide-react';

export function ChatView() {
  const { activeConversation, messages } = useAppContext();

  if (!activeConversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <MessageSquareDashed className="h-16 w-16 mb-4" />
        <p className="text-lg font-medium">Select a conversation to start chatting</p>
        <p className="text-sm">Choose a channel or a direct message from the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <ChatHeader />
      <MessageList messages={messages} />
      <MessageInput />
    </div>
  );
}
