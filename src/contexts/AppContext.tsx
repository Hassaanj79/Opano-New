
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User, Channel, Message, ActiveConversation, PendingInvitation } from '@/types';
import { mockUsers, mockChannels, mockCurrentUser, getMessagesForConversation as fetchMockMessages } from '@/lib/mock-data';
import { summarizeChannel as summarizeChannelFlow } from '@/ai/flows/summarize-channel';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // For redirecting after join

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
  sendInvitation: (email: string) => string | null; // Returns token or null
  verifyInviteToken: (token: string) => PendingInvitation | null;
  acceptInvitation: (token: string, userDetails: { name: string; designation: string }) => boolean;
  pendingInvitations: PendingInvitation[]; // Expose for debugging or advanced scenarios
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User>(mockCurrentUser);
  const [users, setUsers] = useState<User[]>(mockUsers.filter(u => u.id !== currentUser.id));
  const [allUsersWithCurrent, setAllUsersWithCurrent] = useState<User[]>(mockUsers);
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [activeConversation, setActiveConversationState] = useState<ActiveConversation>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const setActiveConversation = useCallback((type: 'channel' | 'dm', id: string) => {
    setCurrentSummary(null);
    if (type === 'channel') {
      const channel = channels.find(c => c.id === id);
      if (channel) {
        setActiveConversationState({ type, id, name: channel.name, channel });
      }
    } else {
      const user = allUsersWithCurrent.find(u => u.id === id);
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
    setMessages(prevMessages => [...prevMessages, newMessage]);
  }, [activeConversation, currentUser.id]);

  const addChannel = useCallback((name: string, description?: string, memberIds: string[] = []) => {
    const newChannel: Channel = {
      id: `c${Date.now()}`,
      name,
      description: description || '',
      memberIds: Array.from(new Set([currentUser.id, ...memberIds])),
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
    const channelMessages = fetchMockMessages(channelId);
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

  const sendInvitation = useCallback((email: string): string | null => {
    if (allUsersWithCurrent.some(user => user.name.toLowerCase().includes(email.split('@')[0].toLowerCase())) || pendingInvitations.some(inv => inv.email === email)) {
        // Simplified check: if email's user part matches any existing user name part, or email already invited
      toast({ title: "Invitation Failed", description: `${email} is already a member or has been invited.`, variant: "destructive" });
      return null;
    }
    const token = btoa(`${email}-${Date.now()}`); // Simple token generation
    const newInvitation: PendingInvitation = { email, token, timestamp: Date.now() };
    setPendingInvitations(prev => [...prev, newInvitation]);
    
    // Construct the base URL
    const joinUrl = `${window.location.origin}/join/${token}`;

    toast({
      title: "Invitation Sent (Simulated)",
      description: `An invitation email would be sent to ${email}. For testing, use this link: ${joinUrl}`,
      duration: 15000, // Keep toast longer to copy link
    });
    console.log(`Simulated invitation sent to ${email}. Token: ${token}. Join URL: ${joinUrl}`);
    return token;
  }, [allUsersWithCurrent, pendingInvitations, toast]);

  const verifyInviteToken = useCallback((token: string): PendingInvitation | null => {
    return pendingInvitations.find(inv => inv.token === token) || null;
  }, [pendingInvitations]);

  const acceptInvitation = useCallback((token: string, userDetails: { name: string; designation: string }): boolean => {
    const invitation = verifyInviteToken(token);
    if (!invitation) {
      toast({ title: "Invalid Invitation", description: "This invitation link is not valid or has expired.", variant: "destructive" });
      return false;
    }

    const newUser: User = {
      id: `u${Date.now()}`, // Simple ID generation
      name: userDetails.name,
      designation: userDetails.designation,
      avatarUrl: `https://placehold.co/40x40.png?text=${userDetails.name.substring(0,2).toUpperCase()}`,
      isOnline: true, // New user is online
    };

    setUsers(prevUsers => [...prevUsers, newUser]);
    setAllUsersWithCurrent(prevAll => [...prevAll, newUser]);
    setPendingInvitations(prevInvites => prevInvites.filter(inv => inv.token !== token));

    toast({ title: "Welcome to Chatterbox!", description: `User ${newUser.name} has joined the workspace.` });
    router.push('/'); // Redirect to main page
    return true;
  }, [verifyInviteToken, toast, router, setUsers, setAllUsersWithCurrent, setPendingInvitations]);

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
      addChannel,
      currentSummary,
      isLoadingSummary,
      generateSummary,
      clearSummary,
      sendInvitation,
      verifyInviteToken,
      acceptInvitation,
      pendingInvitations,
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
