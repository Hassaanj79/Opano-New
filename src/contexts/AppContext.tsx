
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { User, Channel, Message, ActiveConversation, PendingInvitation } from '@/types';
import { mockUsers, mockChannels, mockCurrentUser, getMessagesForConversation as fetchMockMessages, updateMockMessage, mockMessages } from '@/lib/mock-data';
import { summarizeChannel as summarizeChannelFlow } from '@/ai/flows/summarize-channel';
import { sendInvitationEmail } from '@/ai/flows/send-invitation-email-flow';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// Define the shape of the data for updating a user profile
export type UserProfileUpdateData = {
  name: string;
  designation?: string;
  email: string;
  phoneNumber?: string;
  avatarDataUrl?: string; // Added for new avatar data
};

interface AppContextType {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  users: User[]; 
  allUsersWithCurrent: User[]; 
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
  sendInvitation: (email: string) => Promise<string | null>;
  verifyInviteToken: (token: string) => PendingInvitation | null;
  acceptInvitation: (token: string, userDetails: { name: string; designation: string }) => boolean;
  pendingInvitations: PendingInvitation[];
  toggleReaction: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, newContent: string) => void;
  deleteMessage: (messageId: string) => void;
  addMembersToChannel: (channelId: string, userIdsToAdd: string[]) => void;
  toggleCurrentUserStatus: () => void;
  updateUserProfile: (profileData: UserProfileUpdateData) => void;
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

  useEffect(() => {
    const updatedOtherUsers = mockUsers.filter(u => u.id !== currentUser.id);
    const updatedAllUsers = mockUsers.map(u => u.id === currentUser.id ? currentUser : u);
    
    setUsers(updatedOtherUsers);
    setAllUsersWithCurrent(updatedAllUsers);
  
    const mockUserIndex = mockUsers.findIndex(u => u.id === currentUser.id);
    if (mockUserIndex !== -1) {
      mockUsers[mockUserIndex] = currentUser;
    }
  
  }, [currentUser]);


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
      reactions: {},
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    if (activeConversation) {
        const currentMockMessages = mockMessages[activeConversation.id] || [];
        mockMessages[activeConversation.id] = [...currentMockMessages, newMessage];
    }
  }, [activeConversation, currentUser.id]);

  const addChannel = useCallback((name: string, description?: string, memberIds: string[] = []) => {
    const newChannel: Channel = {
      id: `c${Date.now()}`,
      name,
      description: description || '',
      memberIds: Array.from(new Set([currentUser.id, ...memberIds])), 
    };
    setChannels(prevChannels => {
      const updatedChannels = [...prevChannels, newChannel];
      const channelIndex = mockChannels.findIndex(ch => ch.id === newChannel.id);
      if (channelIndex === -1) { 
        mockChannels.push(newChannel);
      } else { 
        mockChannels[channelIndex] = newChannel;
      }
      return updatedChannels;
    });
    setActiveConversation('channel', newChannel.id);
    toast({ title: "Channel Created", description: `Channel #${name} has been created.` });
  }, [currentUser.id, toast, setActiveConversation]);

  const addMembersToChannel = useCallback((channelId: string, userIdsToAdd: string[]) => {
    setChannels(prevChannels => {
      return prevChannels.map(channel => {
        if (channel.id === channelId) {
          const newMemberIds = Array.from(new Set([...channel.memberIds, ...userIdsToAdd]));
          const updatedChannel = { ...channel, memberIds: newMemberIds };

          const mockChannelIndex = mockChannels.findIndex(ch => ch.id === channelId);
          if (mockChannelIndex !== -1) {
            mockChannels[mockChannelIndex] = updatedChannel;
          }
          
          if (activeConversation?.type === 'channel' && activeConversation.id === channelId) {
            setActiveConversationState(prev => prev ? {...prev, channel: updatedChannel} : null);
          }

          toast({ title: "Members Added", description: `${userIdsToAdd.length} new member(s) added to #${channel.name}.` });
          return updatedChannel;
        }
        return channel;
      });
    });
  }, [toast, activeConversation]);

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

  const sendInvitation = useCallback(async (email: string): Promise<string | null> => {
    if (allUsersWithCurrent.some(user => user.email === email) || pendingInvitations.some(inv => inv.email === email)) {
      toast({ title: "Invitation Failed", description: `${email} is already a member or has a pending invitation.`, variant: "destructive" });
      return null;
    }
    const token = btoa(`${email}-${Date.now()}`);
    const newInvitation: PendingInvitation = { email, token, timestamp: Date.now() };
    setPendingInvitations(prev => [...prev, newInvitation]);
    
    const joinUrl = `${window.location.origin}/join/${token}`;
    const emailSubject = "You're invited to join Opano!";
    const emailHtmlBody = `
      <h1>Welcome to Opano!</h1>
      <p>You've been invited to join the Opano workspace.</p>
      <p>Please click the link below to complete your registration:</p>
      <p><a href="${joinUrl}" target="_blank">${joinUrl}</a></p>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
    `;

    toast({
      title: "Sending Invitation...",
      description: `Attempting to send an invitation email to ${email}.`,
      duration: 5000,
    });

    try {
      const emailResult = await sendInvitationEmail({
        to: email,
        subject: emailSubject,
        htmlBody: emailHtmlBody,
        joinUrl: joinUrl, 
      });

      if (emailResult.success) {
        toast({
          title: "Invitation Sent!",
          description: `An invitation email has been sent to ${email}.`,
          duration: 7000,
        });
      } else {
        toast({
          title: "Email Sending Failed",
          description: `Could not send email to ${email}. ${emailResult.error || ''} For testing, use this link (also in console): ${joinUrl}`,
          variant: "destructive",
          duration: 15000,
        });
        console.error(`[sendInvitation] Failed to send invitation email to ${email}. Error: ${emailResult.error}. Test Link: ${joinUrl}`);
      }
    } catch (flowError) {
      console.error("[sendInvitation] Error calling sendInvitationEmail flow:", flowError);
      toast({
          title: "Flow Error",
          description: `An error occurred while trying to send the email. For testing, use this link (also in console): ${joinUrl}`,
          variant: "destructive",
          duration: 15000,
        });
      console.error(`[sendInvitation] Flow error sending invitation email to ${email}. Test Link: ${joinUrl}`);
    }
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
      id: `u${Date.now()}`,
      name: userDetails.name,
      designation: userDetails.designation,
      avatarUrl: `https://placehold.co/40x40.png?text=${userDetails.name.substring(0,2).toUpperCase()}`,
      isOnline: true,
      email: invitation.email, 
    };

    mockUsers.push(newUser);
    setUsers(prevUsers => [...prevUsers, newUser]);
    setAllUsersWithCurrent(prevAll => [...prevAll, newUser]);

    setPendingInvitations(prevInvites => prevInvites.filter(inv => inv.token !== token));

    toast({ title: "Welcome to Opano!", description: `User ${newUser.name} has joined the workspace.` });
    router.push('/');
    return true;
  }, [verifyInviteToken, toast, router]);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prevMessages => {
      return prevMessages.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...(msg.reactions || {}) };
          const userList = reactions[emoji] || [];
          const userIndex = userList.indexOf(currentUser.id);

          if (userIndex > -1) {
            userList.splice(userIndex, 1);
            if (userList.length === 0) {
              delete reactions[emoji];
            } else {
              reactions[emoji] = userList;
            }
          } else {
            reactions[emoji] = [...userList, currentUser.id];
          }
          const updatedMsg = { ...msg, reactions };
          if (activeConversation) updateMockMessage(activeConversation.id, messageId, { reactions: updatedMsg.reactions });
          return updatedMsg;
        }
        return msg;
      });
    });
  }, [currentUser.id, activeConversation]);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.id === messageId && msg.userId === currentUser.id) {
          const updatedMsg = { ...msg, content: newContent, isEdited: true, timestamp: Date.now() };
          if (activeConversation) updateMockMessage(activeConversation.id, messageId, { content: newContent, isEdited: true, timestamp: updatedMsg.timestamp });
          return updatedMsg;
        }
        return msg;
      })
    );
  }, [currentUser.id, activeConversation]);

  const deleteMessage = useCallback((messageId: string) => {
    setMessages(prevMessages =>
      prevMessages.filter(msg => {
        if (msg.id === messageId && msg.userId === currentUser.id) {
          if (activeConversation && mockMessages[activeConversation.id]) {
            mockMessages[activeConversation.id] = mockMessages[activeConversation.id].filter(m => m.id !== messageId);
          }
          return false;
        }
        return true;
      })
    );
  }, [currentUser.id, activeConversation]);

  const toggleCurrentUserStatus = useCallback(() => {
    setCurrentUser(prevUser => {
      const newStatus = !prevUser.isOnline;
      const updatedCurrentUser = { ...prevUser, isOnline: newStatus };
      toast({
        title: "Status Updated",
        description: `You are now ${newStatus ? 'Online' : 'Away'}.`,
      });
      return updatedCurrentUser;
    });
  }, [toast]);

  const updateUserProfile = useCallback((profileData: UserProfileUpdateData) => {
    setCurrentUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        name: profileData.name,
        designation: profileData.designation || prevUser.designation,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber || prevUser.phoneNumber,
        avatarUrl: profileData.avatarDataUrl || prevUser.avatarUrl, // Use new dataUrl if provided
      };
      toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      return updatedUser;
    });
  }, [toast]);


  useEffect(() => {
    if (channels.length > 0 && !activeConversation) {
       const selfDmUser = allUsersWithCurrent.find(u => u.id === currentUser.id);
       if (selfDmUser) {
         setActiveConversation('dm', currentUser.id);
       } else if (channels[0]) { 
         setActiveConversation('channel', channels[0].id);
       }
    }
  }, [channels, currentUser.id, allUsersWithCurrent, activeConversation, setActiveConversation]);

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      users,
      allUsersWithCurrent,
      channels,
      activeConversation,
      setActiveConversation,
      messages,
      addMessage,
      addChannel,
      addMembersToChannel,
      currentSummary,
      isLoadingSummary,
      generateSummary,
      clearSummary,
      sendInvitation,
      verifyInviteToken,
      acceptInvitation,
      pendingInvitations,
      toggleReaction,
      editMessage,
      deleteMessage,
      toggleCurrentUserStatus,
      updateUserProfile,
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
