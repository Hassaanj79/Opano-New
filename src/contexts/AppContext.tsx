
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User, Channel, Message, ActiveConversation, CurrentView } from '@/types';
import {
    initialMockUsers,
    initialMockChannels,
    getMessagesForConversation as fetchMockMessages,
    updateMockMessage,
    mockMessages as allMockMessages, // Keep alias for consistency if used below
    initialMockCurrentUser
} from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // Keep for basic nav if needed

export type UserProfileUpdateData = {
  name: string;
  designation?: string;
  email?: string; // Keep for basic profile editing
  avatarDataUrl?: string;
};

interface AppContextType {
  currentUser: User | null;
  users: User[]; // Users excluding current user
  allUsersWithCurrent: User[]; // All users including current
  channels: Channel[];
  activeConversation: ActiveConversation;
  setActiveConversation: (type: 'channel' | 'dm', id: string) => void;
  addMessage: (content: string, file?: File) => void;
  addChannel: (name: string, description?: string, memberIds?: string[], isPrivate?: boolean) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  // Simplified: remove summary, invitation, role management, document, leave, advanced profile panel features
  // Keep basic user status and profile update
  toggleCurrentUserStatus: () => void;
  updateUserProfile: (profileData: UserProfileUpdateData) => void;
  signOutUser: () => Promise<void>; // Simplified sign out
  currentView: CurrentView; // Kept simple
  setActiveSpecialView: (view: 'chat') => void; // Simplified for now
  getConversationName: (conversationId: string, conversationType: 'channel' | 'dm') => string;
  isLoadingAuth: boolean; // Simplified to just a flag
  // Removed: isUserProfilePanelOpen, viewingUserProfile, openUserProfilePanel, closeUserProfilePanel, openEditProfileDialog
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(initialMockCurrentUser); // Start with mock current user
  const [isLoadingAuth, setIsLoadingAuth] = useState(false); // Simplified, assume loaded
  const [users, setUsers] = useState<User[]>(initialMockUsers.filter(u => u.id !== initialMockCurrentUser.id));
  const [allUsersWithCurrent, setAllUsersWithCurrent] = useState<User[]>(initialMockUsers);
  const [channels, setChannels] = useState<Channel[]>(initialMockChannels);
  const [activeConversation, setActiveConversationState] = useState<ActiveConversation>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const [currentView, setCurrentViewState] = useState<CurrentView>('chat');

  // Simplified setActiveConversation, remove complex checks for now
  const setActiveConversation = useCallback((type: 'channel' | 'dm', id: string) => {
    let foundConversation: ActiveConversation = null;
    if (type === 'channel') {
      const channel = channels.find(c => c.id === id);
      if (channel) {
        foundConversation = { type, id, name: channel.name, channel };
      }
    } else {
      const user = allUsersWithCurrent.find(u => u.id === id);
      if (user) {
        foundConversation = { type, id, name: user.name, recipient: user };
      }
    }
    setActiveConversationState(foundConversation);
    setCurrentViewState('chat');
  }, [channels, allUsersWithCurrent]);

  const setActiveSpecialView = useCallback((view: 'chat') => { // Only chat for now
    setCurrentViewState(view);
    setActiveConversationState(null);
  }, []);

  useEffect(() => {
    if (currentView === 'chat' && activeConversation) {
      const fetchedMessages = fetchMockMessages(activeConversation.id);
      setMessages(fetchedMessages);
    } else {
      setMessages([]);
    }
  }, [activeConversation, currentView]);

  const addMessage = useCallback((content: string, file?: File) => {
    if (!activeConversation || !currentUser) return;

    let messageFile: Message['file'] | undefined = undefined;
    if (file) {
      let fileType: Message['file']['type'] = 'other';
      if (file.type.startsWith('image/')) fileType = 'image';
      else if (file.type.startsWith('audio/')) fileType = 'audio';
      else if (file.type === 'application/pdf' || file.type.startsWith('text/')) fileType = 'document';
      
      messageFile = {
        name: file.name,
        url: URL.createObjectURL(file), // Temporary URL for local files
        type: fileType,
      };
    }

    const newMessage: Message = {
      id: `m${Date.now()}`,
      userId: currentUser.id,
      content,
      timestamp: Date.now(),
      file: messageFile,
      reactions: {},
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    if (allMockMessages[activeConversation.id]) {
        allMockMessages[activeConversation.id].push(newMessage);
    } else {
        allMockMessages[activeConversation.id] = [newMessage];
    }
  }, [activeConversation, currentUser]);

  const addChannel = useCallback((name: string, description: string = '', memberIds: string[] = [], isPrivate: boolean = false) => {
    if (!currentUser) return;
    const newChannel: Channel = {
      id: `c${Date.now()}`,
      name,
      description,
      memberIds: Array.from(new Set([currentUser.id, ...memberIds])),
      isPrivate,
    };
    setChannels(prevChannels => [...prevChannels, newChannel]);
    initialMockChannels.push(newChannel); // Update mock store
    setActiveConversation('channel', newChannel.id);
    setTimeout(() => toast({ title: "Channel Created", description: `Channel #${name} created.` }),0);
  }, [currentUser, setActiveConversation, toast]);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    if (!currentUser) return;
    setMessages(prevMessages => {
      return prevMessages.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...(msg.reactions || {}) };
          const userList = reactions[emoji] || [];
          const userIndex = userList.indexOf(currentUser.id);
          if (userIndex > -1) {
            userList.splice(userIndex, 1);
            if (userList.length === 0) delete reactions[emoji];
            else reactions[emoji] = userList;
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
  }, [currentUser, activeConversation]);

  const toggleCurrentUserStatus = useCallback(() => {
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        const newStatus = !prevUser.isOnline;
        const updatedUser = { ...prevUser, isOnline: newStatus };
        
        setAllUsersWithCurrent(prevAll => prevAll.map(u => u.id === updatedUser.id ? updatedUser : u));
        setUsers(prevU => prevU.map(u => u.id === updatedUser.id ? updatedUser : u));

        const userIndex = initialMockUsers.findIndex(u => u.id === updatedUser.id);
        if (userIndex !== -1) initialMockUsers[userIndex] = updatedUser;

        setTimeout(() => toast({ title: "Status Updated", description: `You are now ${newStatus ? 'Online' : 'Away'}.`}),0);
        return updatedUser;
    });
  }, [toast]);

  const updateUserProfile = useCallback((profileData: UserProfileUpdateData) => {
    setCurrentUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = {
        ...prevUser,
        name: profileData.name || prevUser.name,
        designation: profileData.designation === undefined ? prevUser.designation : profileData.designation,
        email: profileData.email || prevUser.email, // Assuming email is part of basic profile
        avatarUrl: profileData.avatarDataUrl || prevUser.avatarUrl,
      };
      setAllUsersWithCurrent(prevAll => prevAll.map(u => u.id === updatedUser.id ? updatedUser : u));
      setUsers(prevU => prevU.map(u => u.id === updatedUser.id ? updatedUser : u));
      
      const userIndex = initialMockUsers.findIndex(u => u.id === updatedUser.id);
      if (userIndex !== -1) initialMockUsers[userIndex] = updatedUser;
      
      setTimeout(() => toast({ title: "Profile Updated", description: "Your profile has been updated."}),0);
      return updatedUser;
    });
  }, [toast]);

  const signOutUser = useCallback(async () => {
    // This is now a mock sign out, as Firebase is removed
    setCurrentUser(null);
    setUsers([]);
    setAllUsersWithCurrent([]);
    setActiveConversationState(null);
    setTimeout(() => toast({ title: "Signed Out" }),0);
    // No actual router push here unless specifically needed for a non-Firebase auth page
  }, [toast]);

  const getConversationName = useCallback((conversationId: string, conversationType: 'channel' | 'dm'): string => {
    if (conversationType === 'channel') {
      return channels.find(c => c.id === conversationId)?.name || 'Unknown Channel';
    } else {
      return allUsersWithCurrent.find(u => u.id === conversationId)?.name || 'Unknown User';
    }
  }, [channels, allUsersWithCurrent]);


  const contextValue = useMemo(() => ({
    currentUser,
    users,
    allUsersWithCurrent,
    channels,
    activeConversation,
    setActiveConversation,
    messages,
    addMessage,
    addChannel,
    toggleReaction,
    toggleCurrentUserStatus,
    updateUserProfile,
    signOutUser,
    currentView,
    setActiveSpecialView,
    getConversationName,
    isLoadingAuth,
  }), [
    currentUser, users, allUsersWithCurrent, channels, activeConversation, setActiveConversation,
    messages, addMessage, addChannel, toggleReaction, toggleCurrentUserStatus, updateUserProfile,
    signOutUser, currentView, setActiveSpecialView, getConversationName, isLoadingAuth
  ]);

  return (
    <AppContext.Provider value={contextValue}>
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
