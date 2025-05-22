
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
  addMessage: (content: string, file?: File) => void;
  addChannel: (name: string, description?: string, memberIds?: string[]) => void;
  currentSummary: string | null;
  isLoadingSummary: boolean;
  generateSummary: (channelId: string) => Promise<void>;
  clearSummary: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser] = useState<User>(mockCurrentUser);
  const [users] = useState<User[]>(mockUsers.filter(u => u.id !== currentUser.id)); // Other users
  const [allUsersWithCurrent] = useState<User[]>(mockUsers); // All users including current
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [activeConversation, setActiveConversationState] = useState<ActiveConversation>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const { toast } = useToast();

  const setActiveConversation = useCallback((type: 'channel' | 'dm', id: string) => {
    setCurrentSummary(null);
    if (type === 'channel') {
      const channel = channels.find(c => c.id === id);
      if (channel) {
        setActiveConversationState({ type, id, name: channel.name, channel });
      }
    } else {
      const user = allUsersWithCurrent.find(u => u.id === id); // Search in all users for DM recipient
      if (user) {
        setActiveConversationState({ type, id, name: user.name, recipient: user });
      }
    }
  }, [channels, allUsersWithCurrent]);

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
      file: file ? { name: file.name, url: 'https://placehold.co/200x150.png', type: file.type.startsWith('image/') ? 'image' : 'document' } : undefined,
    };
    
    // In a real app, you would persist this message to your backend
    // For mock data, we can add it to a global or context-managed store if needed,
    // but for this example, we'll just update the local state.
    // If mockMessages was designed to be mutable and shared, you'd update it here.
    // For now, this only updates the `messages` state for the current view.

    setMessages(prevMessages => [...prevMessages, newMessage]);
  }, [activeConversation, currentUser.id]);

  const addChannel = useCallback((name: string, description?: string, memberIds: string[] = []) => {
    const newChannel: Channel = {
      id: `c${Date.now()}`,
      name,
      description: description || '',
      memberIds: Array.from(new Set([currentUser.id, ...memberIds])), // Creator + selected, unique IDs
    };
    setChannels(prevChannels => [...prevChannels, newChannel]);
    setActiveConversation('channel', newChannel.id); 
    toast({ title: "Channel Created", description: `Channel #${name} has been created.` });
  }, [currentUser.id, toast, setActiveConversation]);

  const generateSummary = useCallback(async (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) {
      toast({ title: "Error", description: "Channel not found.", variant: "destructive" });
      return;
    }
    const channelMessages = fetchMockMessages(channelId); // These are specific to this channel
    if (channelMessages.length === 0) {
      toast({ title: "Summary", description: "No messages in this channel to summarize." });
      setCurrentSummary("This channel has no messages yet.");
      return;
    }

    setIsLoadingSummary(true);
    setCurrentSummary(null);
    try {
      const result = await summarizeChannelFlow({
        channelName: channel.name,
        // Make sure to use allUsersWithCurrent to find sender names correctly
        messages: channelMessages.map(m => `${allUsersWithCurrent.find(u => u.id === m.userId)?.name || 'Unknown User'}: ${m.content}`),
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
  }, [channels, allUsersWithCurrent, toast]);
  
  const clearSummary = () => {
    setCurrentSummary(null);
  };

  // Set initial active conversation to the first channel if none is active
  useEffect(() => {
    if (channels.length > 0 && !activeConversation) {
      setActiveConversation('channel', channels[0].id);
    }
  }, [channels, activeConversation, setActiveConversation]);


  return (
    <AppContext.Provider value={{
      currentUser,
      users, // This remains other users for lists like DMs
      channels,
      activeConversation,
      setActiveConversation,
      messages,
      addMessage,
      addChannel,
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
