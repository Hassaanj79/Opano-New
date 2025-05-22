
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User, Channel, Message, ActiveConversation } from '@/types';
import { mockUsers, mockChannels, mockCurrentUser, getMessagesForConversation as fetchMockMessages } from '@/lib/mock-data';
import { summarizeChannel as summarizeChannelFlow } from '@/ai/flows/summarize-channel';
import { useToast } from '@/hooks/use-toast';

interface AppContextType {
  currentUser: User;
  users: User[];
  channels: Channel[];
  activeConversation: ActiveConversation;
  setActiveConversation: (type: 'channel' | 'dm', id: string) => void;
  messages: Message[];
  addMessage: (content: string, file?: File) => void; // File object for potential future use
  currentSummary: string | null;
  isLoadingSummary: boolean;
  generateSummary: (channelId: string) => Promise<void>;
  clearSummary: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser] = useState<User>(mockCurrentUser);
  const [users] = useState<User[]>(mockUsers.filter(u => u.id !== currentUser.id)); // Exclude current user from DM list
  const [channels] = useState<Channel[]>(mockChannels);
  const [activeConversation, setActiveConversationState] = useState<ActiveConversation>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const { toast } = useToast();

  const setActiveConversation = useCallback((type: 'channel' | 'dm', id: string) => {
    setCurrentSummary(null); // Clear summary when changing conversation
    if (type === 'channel') {
      const channel = channels.find(c => c.id === id);
      if (channel) {
        setActiveConversationState({ type, id, name: channel.name, channel });
      }
    } else {
      const user = users.find(u => u.id === id);
      if (user) {
        setActiveConversationState({ type, id, name: user.name, recipient: user });
      }
    }
  }, [channels, users]);

  useEffect(() => {
    if (activeConversation) {
      const fetchedMessages = fetchMockMessages(activeConversation.id);
      setMessages(fetchedMessages);
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  const addMessage = useCallback((content: string, file?: File) => {
    if (!activeConversation) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      userId: currentUser.id,
      content,
      timestamp: Date.now(),
      // Basic file handling UI representation
      file: file ? { name: file.name, url: '#', type: file.type.startsWith('image/') ? 'image' : 'document' } : undefined,
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    // In a real app, this would also send to a backend
  }, [activeConversation, currentUser.id]);

  const generateSummary = useCallback(async (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) {
      toast({ title: "Error", description: "Channel not found.", variant: "destructive" });
      return;
    }
    const channelMessages = fetchMockMessages(channelId);
    if (channelMessages.length === 0) {
      toast({ title: "Summary", description: "No messages in this channel to summarize." });
      return;
    }

    setIsLoadingSummary(true);
    setCurrentSummary(null);
    try {
      const result = await summarizeChannelFlow({
        channelName: channel.name,
        messages: channelMessages.map(m => `${users.find(u => u.id === m.userId)?.name || 'User'}: ${m.content}`),
      });
      setCurrentSummary(result.summary);
      toast({ title: "Summary Generated", description: `Summary for #${channel.name} is ready.` });
    } catch (error) {
      console.error("Error generating summary:", error);
      toast({ title: "Summarization Error", description: "Could not generate summary.", variant: "destructive" });
      setCurrentSummary("Failed to generate summary.");
    } finally {
      setIsLoadingSummary(false);
    }
  }, [channels, users, toast]);
  
  const clearSummary = () => {
    setCurrentSummary(null);
  };

  // Set a default active conversation (e.g., first channel)
  useEffect(() => {
    if (channels.length > 0 && !activeConversation) {
      setActiveConversation('channel', channels[0].id);
    }
  }, [channels, activeConversation, setActiveConversation]);


  return (
    <AppContext.Provider value={{
      currentUser,
      users,
      channels,
      activeConversation,
      setActiveConversation,
      messages,
      addMessage,
      currentSummary,
      isLoadingSummary,
      generateSummary,
      clearSummary,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
