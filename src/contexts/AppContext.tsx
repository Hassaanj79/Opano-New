
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import type { User, Channel, Message, ActiveConversation, CurrentView, PendingInvitation, UserRole, Draft, ActivityItem, Document, DocumentCategory, UserProfileUpdateData, LeaveRequest } from '@/types';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

import {
    initialMockUsers,
    initialMockChannels,
    getMessagesForConversation as fetchMockMessages,
    updateMockMessage,
    mockMessages,
    initialMockDrafts,
    initialDocumentCategories
} from '@/lib/mock-data';
import { summarizeChannel as summarizeChannelFlow } from '@/ai/flows/summarize-channel';
import { sendInvitationEmail as sendInvitationEmailFlow } from '@/ai/flows/send-invitation-email-flow';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { format, formatDistanceToNowStrict, differenceInSeconds, startOfDay, endOfDay, isWithinInterval, isSameDay } from 'date-fns';


interface AppContextType {
  currentUser: User | null;
  isLoadingAuth: boolean;
  users: User[];
  allUsersWithCurrent: User[];
  channels: Channel[];
  activeConversation: ActiveConversation;
  setActiveConversation: (type: 'channel' | 'dm', id: string) => void;
  messages: Message[];
  addMessage: (content: string, file?: File) => void;
  addChannel: (name: string, description?: string, memberIds?: string[], isPrivate?: boolean) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  currentView: CurrentView;
  setActiveSpecialView: (view: 'chat' | 'replies' | 'activity' | 'drafts') => void;
  isUserProfilePanelOpen: boolean;
  viewingUserProfile: User | null;
  openUserProfilePanel: (user: User) => void;
  closeUserProfilePanel: () => void;
  isEditProfileDialogOpen: boolean;
  setIsEditProfileDialogOpen: (isOpen: boolean) => void;
  openEditProfileDialog?: () => void;
  updateUserProfile: (profileData: UserProfileUpdateData) => void;
  toggleCurrentUserStatus: () => void;
  signOutUser: () => Promise<void>;
  getConversationName: (conversationId: string, conversationType: 'channel' | 'dm') => string;
  sendInvitation: (email: string) => void;
  pendingInvitations: PendingInvitation[];
  verifyInviteToken: (token: string) => PendingInvitation | null;
  acceptInvitation: (token: string, newUserDetails: { name: string; designation?: string }) => boolean;
  addMembersToChannel: (channelId: string, userIdsToAdd: string[]) => void;
  removeUserFromChannel: (channelId: string, userIdToRemove: string) => void;
  currentSummary: string | null;
  isLoadingSummary: boolean;
  fetchAndSetSummary: (channelId: string, channelName: string) => void;
  replyingToMessage: Message | null;
  setReplyingToMessage: (message: Message | null) => void;
  drafts: Draft[];
  saveDraft: (content: string) => void;
  deleteDraft: (draftId: string) => void;
  activities: ActivityItem[];
  replies: Message[];
  documentCategories: DocumentCategory[];
  addDocumentCategory: (name: string, description: string, iconName?: keyof typeof import("lucide-react")) => void;
  findDocumentCategoryById: (categoryId: string) => DocumentCategory | null | undefined;
  addFileDocumentToCategory: (categoryId: string, file: File) => void;
  addTextDocumentToCategory: (categoryId: string, docName: string, textContent: string) => void;
  addLinkedDocumentToCategory: (categoryId: string, docName: string, docUrl: string) => void;
  deleteDocumentFromCategory: (categoryId: string, docId: string) => void;
  searchAllDocuments: (query: string) => Array<{ doc: Document, category: DocumentCategory }>;
  updateUserRole: (targetUserId: string, newRole: UserRole) => void;
  leaveRequests: LeaveRequest[];
  handleAddLeaveRequest: (newRequestData: Omit<LeaveRequest, 'id' | 'userId' | 'requestDate' | 'status'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [users, setUsers] = useState<User[]>(initialMockUsers);
  const [allUsersWithCurrent, setAllUsersWithCurrent] = useState<User[]>(initialMockUsers);
  const [channels, setChannels] = useState<Channel[]>(initialMockChannels);
  const [activeConversation, setActiveConversationState] = useState<ActiveConversation>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentView, setCurrentViewState] = useState<CurrentView>('chat');
  const [isUserProfilePanelOpen, setIsUserProfilePanelOpen] = useState(false);
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);
  const [isEditProfileDialogOpen, setIsEditProfileDialogOpen] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>(initialMockDrafts);
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>(initialDocumentCategories);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);


  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const setActiveConversation = useCallback((type: 'channel' | 'dm', id: string) => {
    setCurrentSummary(null);
    setReplyingToMessage(null);
    let foundConversation: ActiveConversation = null;
    if (type === 'channel') {
      const channel = channels.find(c => c.id === id);
      if (channel) {
        if (channel.isPrivate && currentUser && !channel.memberIds.includes(currentUser.id)) {
            setTimeout(() => toast({ title: "Access Denied", description: "You are not a member of this private channel.", variant: "destructive" }), 0);
            return;
        }
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
  }, [channels, allUsersWithCurrent, currentUser, toast]);

  const setActiveConversationRef = useRef(setActiveConversation);
  useEffect(() => {
    setActiveConversationRef.current = setActiveConversation;
  }, [setActiveConversation]);


  const setActiveSpecialView = useCallback((view: 'chat' | 'replies' | 'activity' | 'drafts') => {
    setCurrentViewState(view);
    setActiveConversationState(null);
    setReplyingToMessage(null);
    closeUserProfilePanel();
  }, []); 

  const setActiveSpecialViewRef = useRef(setActiveSpecialView);
  useEffect(() => {
    setActiveSpecialViewRef.current = setActiveSpecialView;
  }, [setActiveSpecialView]);


  useEffect(() => {
    console.log('[AppContext] Auth listener setup.');
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[AppContext] Auth state changed. Firebase user:', firebaseUser?.email);
      if (firebaseUser) {
        let appUser: User | undefined = initialMockUsers.find(u => u.email === firebaseUser.email);
        let isFirstUserEver = initialMockUsers.length === 0;

        if (appUser) {
          appUser = {
            ...appUser,
            id: firebaseUser.uid, 
            name: firebaseUser.displayName || appUser.name,
            email: firebaseUser.email!,
            avatarUrl: firebaseUser.photoURL || appUser.avatarUrl,
          };
          const userIndex = initialMockUsers.findIndex(u => u.email === firebaseUser.email);
          initialMockUsers[userIndex] = appUser;
        } else {
          appUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            email: firebaseUser.email!,
            avatarUrl: firebaseUser.photoURL || `https://placehold.co/40x40.png?text=${(firebaseUser.displayName || 'N')?.[0]?.toUpperCase()}`,
            isOnline: true,
            designation: 'Member',
            role: isFirstUserEver ? 'admin' : 'member',
          };
          initialMockUsers.push(appUser);
        }

        setCurrentUser(appUser);
        const otherUsers = initialMockUsers.filter(u => u.id !== appUser!.id);
        setUsers(otherUsers);
        setAllUsersWithCurrent([...otherUsers, appUser]);

        if (isFirstUserEver && appUser.role === 'admin') {
          
          const generalChannelName = "general";
          const generalChannelId = `c${Date.now()}-general`;
          const newGeneralChannel: Channel = {
            id: generalChannelId,
            name: generalChannelName,
            description: "Default channel for general announcements and discussions.",
            memberIds: [appUser.id],
            isPrivate: false,
          };
          setChannels(prev => [...prev, newGeneralChannel].sort((a, b) => a.name.localeCompare(b.name)));
          initialMockChannels.push(newGeneralChannel);
          initialMockChannels.sort((a, b) => a.name.localeCompare(b.name));
          
          const systemMessage: Message = {
            id: `sys-create-${Date.now()}`,
            userId: 'system',
            content: `${appUser.name} created the channel #${generalChannelName}.`,
            timestamp: Date.now(),
            isSystemMessage: true,
          };
          if (mockMessages[generalChannelId]) {
            mockMessages[generalChannelId].push(systemMessage);
          } else {
            mockMessages[generalChannelId] = [systemMessage];
          }
          
          setActiveConversation('channel', newGeneralChannel.id);
        }

      } else {
        setCurrentUser(null);
        setUsers([]);
        setAllUsersWithCurrent([]);
        setActiveConversationState(null);
      }
      setIsLoadingAuth(false);
    });
    return () => {
      console.log('[AppContext] Auth listener cleanup.');
      unsubscribe();
    }
  }, []); 

  useEffect(() => {
    console.log('[AppContext] Redirection check. isLoadingAuth:', isLoadingAuth, 'currentUser:', !!currentUser, 'pathname:', pathname);
    if (!isLoadingAuth && currentUser === undefined) {
      console.warn("[AppContext] currentUser is undefined post-auth loading. This shouldn't happen.");
      return;
    }

    if (!isLoadingAuth) {
      const isAuthPage = pathname.startsWith('/auth/') || pathname.startsWith('/join/');
      if (currentUser === null && !isAuthPage) {
        console.log('[AppContext] No user & not on auth page, redirecting to /auth/join');
        router.push('/auth/join');
      } else if (currentUser !== null && isAuthPage) {
        console.log('[AppContext] User logged in & on auth page, redirecting to /');
        router.push('/');
      }
    }
  }, [isLoadingAuth, currentUser, router, pathname]);


  useEffect(() => {
    if (!isLoadingAuth && currentUser && !activeConversation && channels.length > 0 && currentView === 'chat' && pathname === '/') {
        const generalChannel = channels.find(c => c.name === "general");
        if (generalChannel && setActiveConversationRef.current) {
            console.log('[AppContext] Auto-selecting #general channel for existing user.');
            setActiveConversationRef.current('channel', generalChannel.id);
        } else if (setActiveConversationRef.current && channels.length > 0) {
            console.log('[AppContext] Auto-selecting first available channel.');
             setActiveConversationRef.current('channel', channels[0].id);
        }
    }
  }, [isLoadingAuth, currentUser, activeConversation, channels, currentView, pathname]);


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
        url: URL.createObjectURL(file),
        type: fileType,
        fileObject: file,
      };
    }

    const newMessage: Message = {
      id: `m${Date.now()}`,
      userId: currentUser.id,
      content,
      timestamp: Date.now(),
      file: messageFile,
      reactions: {},
      isEdited: false,
      replyToMessageId: replyingToMessage?.id,
      originalMessageSenderName: replyingToMessage?.userId ? allUsersWithCurrent.find(u => u.id === replyingToMessage.userId)?.name : undefined,
      originalMessageContent: replyingToMessage?.content,
    };

    setMessages(prevMessages => [...prevMessages, newMessage]);
    if (mockMessages[activeConversation.id]) {
      mockMessages[activeConversation.id].push(newMessage);
    } else {
      mockMessages[activeConversation.id] = [newMessage];
    }
    setReplyingToMessage(null);
  }, [activeConversation, currentUser, replyingToMessage, allUsersWithCurrent]);

  const addChannel = useCallback((name: string, description: string = '', memberIds: string[] = [], isPrivate: boolean = false) => {
    if (!currentUser) {
      setTimeout(() => toast({ title: "Not Logged In", description: "You must be logged in to create a channel.", variant: "destructive" }),0);
      return;
    }
    if (currentUser.role !== 'admin') {
      setTimeout(() => toast({ title: "Permission Denied", description: "Only admins can create channels.", variant: "destructive" }), 0);
      return;
    }
    if (channels.some(ch => ch.name.toLowerCase() === name.toLowerCase())) {
        setTimeout(() => toast({ title: "Channel Exists", description: "A channel with this name already exists. Please choose a different name.", variant: "destructive" }), 0);
        return;
    }

    const actualMemberIds = Array.from(new Set([currentUser.id, ...memberIds]));
    const newChannel: Channel = {
      id: `c${Date.now()}`,
      name,
      description,
      memberIds: actualMemberIds,
      isPrivate,
    };
    setChannels(prevChannels => [...prevChannels, newChannel].sort((a, b) => a.name.localeCompare(b.name)));
    initialMockChannels.push(newChannel);
    initialMockChannels.sort((a, b) => a.name.localeCompare(b.name));

    const creatorName = currentUser.name;
    let systemMessageContent = `${creatorName} created the ${isPrivate ? 'private ' : ''}channel #${name}.`;

    const addedMembers = actualMemberIds.filter(id => id !== currentUser.id).map(id => allUsersWithCurrent.find(u => u.id === id)?.name).filter(Boolean);
    if (addedMembers.length > 0) {
      systemMessageContent += ` ${creatorName} added ${addedMembers.join(', ')} to the channel.`;
    }
    
    const systemMessage: Message = {
      id: `sys-create-${Date.now()}`,
      userId: 'system',
      content: systemMessageContent,
      timestamp: Date.now(),
      isSystemMessage: true,
    };
    if (mockMessages[newChannel.id]) {
      mockMessages[newChannel.id].push(systemMessage);
    } else {
      mockMessages[newChannel.id] = [systemMessage];
    }
    if(setActiveConversationRef.current) {
      setActiveConversationRef.current('channel', newChannel.id);
    }
    setTimeout(() => toast({ title: "Channel Created", description: `Channel #${name} created.` }), 0);
  }, [currentUser, channels, allUsersWithCurrent, toast]);

  const addMembersToChannel = useCallback((channelId: string, userIdsToAdd: string[]) => {
    if (!currentUser || currentUser.role !== 'admin') {
      setTimeout(() => toast({ title: "Permission Denied", description: "Only admins can add members.", variant: "destructive" }), 0);
      return;
    }

    setChannels(prevChannels =>
      prevChannels.map(channel => {
        if (channel.id === channelId) {
          const newMemberIds = Array.from(new Set([...channel.memberIds, ...userIdsToAdd]));
          const updatedChannel = { ...channel, memberIds: newMemberIds };

          const mockChannelIndex = initialMockChannels.findIndex(mc => mc.id === channelId);
          if (mockChannelIndex !== -1) {
            initialMockChannels[mockChannelIndex] = updatedChannel;
          }
          
          const addedUsersNames = userIdsToAdd.map(id => allUsersWithCurrent.find(u => u.id === id)?.name).filter(Boolean);
          if (addedUsersNames.length > 0) {
            const systemMessage: Message = {
              id: `sys-add-${Date.now()}`,
              userId: 'system',
              content: `${currentUser.name} added ${addedUsersNames.join(', ')} to the channel.`,
              timestamp: Date.now(),
              isSystemMessage: true,
            };
            if (mockMessages[channelId]) {
              mockMessages[channelId].push(systemMessage);
            } else {
              mockMessages[channelId] = [systemMessage];
            }
            if (activeConversation?.id === channelId) {
              setMessages(fetchMockMessages(channelId)); 
            }
          }
           setTimeout(() => toast({ title: "Members Added", description: `${addedUsersNames.join(', ')} added to #${channel.name}.` }), 0);
          return updatedChannel;
        }
        return channel;
      })
    );
  }, [currentUser, allUsersWithCurrent, toast, activeConversation]);

  const removeUserFromChannel = useCallback((channelId: string, userIdToRemove: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      setTimeout(() => toast({ title: "Permission Denied", description: "Only admins can remove users.", variant: "destructive" }), 0);
      return;
    }
    if (currentUser.id === userIdToRemove) {
      setTimeout(() => toast({ title: "Action Denied", description: "You cannot remove yourself from a channel this way.", variant: "destructive" }), 0);
      return;
    }

    let userWasRemoved = false;
    let removedUserName = "A user";
    let targetChannelName = "the channel";

    setChannels(prevChannels =>
      prevChannels.map(channel => {
        if (channel.id === channelId) {
          targetChannelName = channel.name;
          const userToRemoveDetails = allUsersWithCurrent.find(u => u.id === userIdToRemove);
          if (userToRemoveDetails) {
            removedUserName = userToRemoveDetails.name;
          }
          const newMemberIds = channel.memberIds.filter(id => id !== userIdToRemove);
          if (newMemberIds.length < channel.memberIds.length) {
            userWasRemoved = true;
          }
          const updatedChannel = { ...channel, memberIds: newMemberIds };
          
          const mockChannelIndex = initialMockChannels.findIndex(mc => mc.id === channelId);
          if (mockChannelIndex !== -1) {
            initialMockChannels[mockChannelIndex] = updatedChannel;
          }
          return updatedChannel;
        }
        return channel;
      })
    );

    if (userWasRemoved) {
      const systemMessage: Message = {
        id: `sys-remove-${Date.now()}`,
        userId: 'system',
        content: `${currentUser.name} removed ${removedUserName} from the channel.`,
        timestamp: Date.now(),
        isSystemMessage: true,
      };
      if (mockMessages[channelId]) {
        mockMessages[channelId].push(systemMessage);
      } else {
        mockMessages[channelId] = [systemMessage];
      }
      if (activeConversation?.id === channelId) {
        setMessages(fetchMockMessages(channelId));
      }
      setTimeout(() => toast({ title: "User Removed", description: `${removedUserName} has been removed from #${targetChannelName}.` }), 0);
    } else {
      setTimeout(() => toast({ title: "User Not Found", description: `Could not find user in #${targetChannelName}.`, variant: "default" }), 0);
    }
  }, [currentUser, allUsersWithCurrent, toast, activeConversation]);


  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    if (!currentUser || !activeConversation) return;
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
          updateMockMessage(activeConversation.id, messageId, { reactions: updatedMsg.reactions });
          return updatedMsg;
        }
        return msg;
      });
    });
  }, [currentUser, activeConversation]);

  const openUserProfilePanel = useCallback((user: User) => {
    setViewingUserProfile(user);
    setIsUserProfilePanelOpen(true);
  }, []);

  const closeUserProfilePanel = useCallback(() => {
    setIsUserProfilePanelOpen(false);
  }, []);

  const openEditProfileDialog = useCallback(() => {
      setIsEditProfileDialogOpen(true);
  }, []);

  const updateUserProfile = useCallback((profileData: UserProfileUpdateData) => {
    if (!currentUser) return;
    setCurrentUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = {
        ...prevUser,
        name: profileData.name || prevUser.name,
        designation: profileData.designation === undefined ? prevUser.designation : profileData.designation,
        email: profileData.email || prevUser.email,
        avatarUrl: profileData.avatarDataUrl || prevUser.avatarUrl,
        phoneNumber: profileData.phoneNumber === undefined ? prevUser.phoneNumber : profileData.phoneNumber,
        linkedinProfileUrl: profileData.linkedinProfileUrl === undefined ? prevUser.linkedinProfileUrl : profileData.linkedinProfileUrl,
        pronouns: profileData.pronouns === undefined ? prevUser.pronouns : profileData.pronouns,
      };
      const userIndex = initialMockUsers.findIndex(u => u.id === updatedUser.id);
      if (userIndex !== -1) {
        initialMockUsers[userIndex] = { ...initialMockUsers[userIndex], ...updatedUser };
      }
      setAllUsersWithCurrent(prevAll => prevAll.map(u => u.id === updatedUser.id ? updatedUser : u));
      setUsers(prevU => prevU.map(u => u.id === updatedUser.id ? updatedUser : u));

      setTimeout(() => toast({ title: "Profile Updated", description: "Your profile has been updated." }), 0);
      return updatedUser;
    });
  }, [currentUser, toast]);

  const toggleCurrentUserStatus = useCallback(() => {
    if (!currentUser) return;
    const newStatus = !currentUser.isOnline;
    setCurrentUser(prevUser => {
      if (!prevUser) return null;
      const updatedUser = { ...prevUser, isOnline: newStatus };
      const userIndex = initialMockUsers.findIndex(u => u.id === updatedUser.id);
      if (userIndex !== -1) initialMockUsers[userIndex].isOnline = newStatus;
      setAllUsersWithCurrent(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      return updatedUser;
    });
    setTimeout(() => toast({ title: "Status Updated", description: `You are now ${newStatus ? 'Online' : 'Away'}.` }), 0);
  }, [currentUser, toast]);

  const signOutUser = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      setTimeout(() => toast({ title: "Signed Out" }), 0);
    } catch (error) {
      console.error("Error signing out:", error);
      setTimeout(() => toast({ title: "Sign Out Failed", description: "Could not sign out. Please try again.", variant: "destructive" }), 0);
    }
  }, [toast]);

  const getConversationName = useCallback((conversationId: string, conversationType: 'channel' | 'dm'): string => {
    if (conversationType === 'channel') {
      return channels.find(c => c.id === conversationId)?.name || 'Unknown Channel';
    } else {
      return allUsersWithCurrent.find(u => u.id === conversationId)?.name || 'Unknown User';
    }
  }, [channels, allUsersWithCurrent]);

 const sendInvitation = useCallback(async (email: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
      setTimeout(() => toast({ title: "Permission Denied", description: "Only admins can send invitations.", variant: "destructive" }), 0);
      return;
    }

    const existingUser = initialMockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      setTimeout(() => toast({ title: "User Exists", description: `${email} is already a member of this workspace.`, variant: "default" }), 0);
      return;
    }

    const existingInvitation = pendingInvitations.find(inv => inv.email.toLowerCase() === email.toLowerCase());
    if (existingInvitation) {
      const timeSinceInvite = formatDistanceToNowStrict(new Date(existingInvitation.timestamp), { addSuffix: true });
      setTimeout(() => toast({ title: "Already Invited", description: `${email} was already invited ${timeSinceInvite}. A new email will not be sent.`, variant: "default" }), 0);
      const joinUrl = `${window.location.origin}/join/${existingInvitation.token}`;
      console.log(`[sendInvitation] Test link for already invited user ${email}: ${joinUrl}`);
      return;
    }

    const token = btoa(`${email}-${Date.now()}`);
    const newInvitation: PendingInvitation = { email, token, timestamp: Date.now() };
    setPendingInvitations(prev => [...prev, newInvitation]);
    
    const joinUrl = `${window.location.origin}/join/${token}`;

    try {
      const emailBody = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #FF7F50; font-size: 24px;">You're Invited to Opano!</h1>
            </div>
            <p>Hello,</p>
            <p>You've been invited by <strong>${currentUser.name}</strong> to join the Opano workspace.</p>
            <p>Opano is a collaborative platform for seamless communication and productivity.</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${joinUrl}" style="background-color: #FF7F50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Join Opano Workspace</a>
            </p>
            <p>If the button above doesn't work, copy and paste the following link into your web browser:</p>
            <p style="word-break: break-all;"><a href="${joinUrl}" style="color: #FF7F50;">${joinUrl}</a></p>
            <p>We're excited to have you on board!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 0.9em; color: #777; text-align: center;">This is an automated message from Opano.</p>
          </div>
        </div>
      `;

      const emailResult = await sendInvitationEmailFlow({
        to: email,
        subject: `Invitation to join Opano from ${currentUser.name}`,
        htmlBody: emailBody,
        joinUrl: joinUrl,
      });

      if (emailResult.success) {
        setTimeout(() => {
          toast({
            title: "Invitation Sent",
            description: `An invitation email has been sent to ${email}.`,
          });
        }, 0);
      } else {
         setTimeout(() => {
          toast({
            title: "Email Failed",
            description: `Could not send invitation email to ${email}. ${emailResult.error || 'Unknown error.'}. Test Link: ${joinUrl}`,
            variant: "destructive",
            duration: 15000
          });
        }, 0);
        console.error(`[sendInvitation] Failed to send invitation email to ${email}. Error: ${emailResult.error}. Test Link: ${joinUrl}`);
      }
    } catch (flowError) {
      console.error("[sendInvitation] Error calling sendInvitationEmail flow:", flowError);
       setTimeout(() => {
        toast({
          title: "Flow Error",
          description: `An error occurred while trying to send the invitation to ${email}. Check console for details. Test Link: ${joinUrl}`,
          variant: "destructive",
          duration: 15000
        });
      }, 0);
    }
  }, [currentUser, pendingInvitations, toast]);

  const verifyInviteToken = useCallback((token: string): PendingInvitation | null => {
    const invitation = pendingInvitations.find(inv => inv.token === token);
    return invitation || null;
  }, [pendingInvitations]);

  const acceptInvitation = useCallback((token: string, newUserDetails: { name: string; designation?: string }): boolean => {
    const invitationIndex = pendingInvitations.findIndex(inv => inv.token === token);
    if (invitationIndex === -1) {
      setTimeout(() => toast({ title: "Invalid Token", description: "This invitation is no longer valid.", variant: "destructive" }),0);
      return false;
    }
    const invitation = pendingInvitations[invitationIndex];
    const newUser: User = {
      id: `u${Date.now()}`,
      name: newUserDetails.name,
      email: invitation.email,
      avatarUrl: `https://placehold.co/40x40.png?text=${newUserDetails.name[0]?.toUpperCase() || 'U'}`,
      isOnline: true,
      designation: newUserDetails.designation || 'New Member',
      role: 'member',
    };
    setUsers(prev => [...prev, newUser]);
    setAllUsersWithCurrent(prev => [...prev, newUser]);
    initialMockUsers.push(newUser);
    setPendingInvitations(prev => prev.filter(inv => inv.token !== token));
    setCurrentUser(newUser);
    setTimeout(() => toast({ title: "Welcome!", description: `Account for ${newUser.name} created.` }),0);
    return true;
  }, [pendingInvitations, toast]);

  const fetchAndSetSummary = useCallback(async (channelId: string, channelName: string) => {
    const channelMessages = mockMessages[channelId] || [];
    if (channelMessages.length < 5) {
      setTimeout(() => toast({ title: "Not Enough Messages", description: "This channel doesn't have enough messages to summarize yet.", variant: "default" }), 0);
      return;
    }
    setIsLoadingSummary(true);
    setCurrentSummary(null);
    try {
      const { summary } = await summarizeChannelFlow({
        channelName,
        messages: channelMessages.filter(m => !m.isSystemMessage).map(m => `${allUsersWithCurrent.find(u => u.id === m.userId)?.name || 'Unknown'}: ${m.content}`),
      });
      setCurrentSummary(summary);
    } catch (error) {
      console.error("Error fetching summary:", error);
      setCurrentSummary("Could not generate summary at this time.");
       setTimeout(() => toast({ title: "Summary Error", description: "Failed to generate conversation summary.", variant: "destructive" }), 0);
    } finally {
      setIsLoadingSummary(false);
    }
  }, [allUsersWithCurrent, toast]);

  const saveDraft = useCallback((content: string) => {
    if (!activeConversation || !currentUser || !content.trim()) return;
    const newDraft: Draft = {
      id: `d${Date.now()}`,
      content: content.trim(),
      targetConversationId: activeConversation.id,
      targetConversationName: activeConversation.name,
      targetConversationType: activeConversation.type,
      timestamp: Date.now(),
    };
    setDrafts(prev => [newDraft, ...prev.sort((a,b) => b.timestamp - a.timestamp)]);
    initialMockDrafts.unshift(newDraft);
    initialMockDrafts.sort((a,b) => b.timestamp - a.timestamp);
    setTimeout(() => toast({ title: "Draft Saved", description: `Your message draft for ${activeConversation.name} has been saved.` }), 0);
  }, [activeConversation, currentUser, toast]);

  const deleteDraft = useCallback((draftId: string) => {
    setDrafts(prev => prev.filter(d => d.id !== draftId));
    const draftIndex = initialMockDrafts.findIndex(d => d.id === draftId);
    if (draftIndex > -1) initialMockDrafts.splice(draftIndex, 1);
    setTimeout(() => toast({ title: "Draft Deleted" }), 0);
  }, [toast]);

  const replies = useMemo(() => {
    if (!currentUser) return [];
    const allMsgs: Message[] = Object.values(mockMessages).flat();
    return allMsgs.filter(msg => msg.content.toLowerCase().includes(`@${currentUser.name.toLowerCase()}`) && msg.userId !== currentUser.id && !msg.isSystemMessage)
                  .sort((a, b) => b.timestamp - a.timestamp);
  }, [currentUser]); 

  const activities = useMemo(() => {
    if (!currentUser) return [];
    const userActivities: ActivityItem[] = [];
    Object.entries(mockMessages).forEach(([conversationId, msgs]) => {
      msgs.forEach(msg => {
        if (msg.userId === currentUser.id && msg.reactions) {
          Object.entries(msg.reactions).forEach(([emoji, userIds]) => {
            userIds.forEach(reactorId => {
              if (reactorId !== currentUser.id) {
                const reactor = allUsersWithCurrent.find(u => u.id === reactorId);
                if (reactor) {
                  userActivities.push({
                    id: `act-${msg.id}-${reactorId}-${emoji}`,
                    reactor,
                    message: msg,
                    emoji,
                    timestamp: Date.now(), 
                    conversationId,
                    conversationName: getConversationName(conversationId, channels.some(c => c.id === conversationId) ? 'channel' : 'dm'),
                    conversationType: channels.some(c => c.id === conversationId) ? 'channel' : 'dm',
                  });
                }
              }
            });
          });
        }
      });
    });
    return userActivities.sort((a, b) => b.timestamp - a.timestamp);
  }, [currentUser, mockMessages, allUsersWithCurrent, getConversationName, channels]);

  const addDocumentCategory = useCallback((name: string, description: string, iconName: keyof typeof import("lucide-react") = 'Folder') => {
    if (!currentUser || currentUser.role !== 'admin') {
      setTimeout(() => toast({ title: "Permission Denied", description: "Only admins can create document categories.", variant: "destructive" }), 0);
      return;
    }
     if (documentCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
      setTimeout(() => toast({ title: "Category Exists", description: "A category with this name already exists.", variant: "destructive" }), 0);
      return;
    }
    const newCategory: DocumentCategory = {
      id: `cat-${Date.now()}`,
      name,
      description,
      iconName,
      documents: [],
    };
    setDocumentCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
    initialDocumentCategories.push(newCategory);
    initialDocumentCategories.sort((a, b) => a.name.localeCompare(b.name));
    setTimeout(() => toast({ title: "Category Added", description: `Category "${name}" created.` }), 0);
  }, [currentUser, documentCategories, toast]);

  const findDocumentCategoryById = useCallback((categoryId: string) => {
    return documentCategories.find(cat => cat.id === categoryId);
  }, [documentCategories]);

  const addFileDocumentToCategory = useCallback((categoryId: string, file: File) => {
    if (!currentUser) return;
    const category = findDocumentCategoryById(categoryId);
    if (!category) return;

    const newDocument: Document = {
      id: `doc-file-${Date.now()}`,
      name: file.name,
      type: file.type,
      docType: 'file',
      lastModified: new Date().toLocaleDateString(),
      fileUrl: URL.createObjectURL(file),
      fileObject: file,
    };
    
    setDocumentCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, documents: [...cat.documents, newDocument].sort((a,b) => a.name.localeCompare(b.name)) } : cat
    ));
    const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
    if (catIndex > -1) {
        initialDocumentCategories[catIndex].documents.push(newDocument);
        initialDocumentCategories[catIndex].documents.sort((a,b) => a.name.localeCompare(b.name));
    }

    const categoryName = category.name;
    const successMsg = `"${currentUser.name} added "${newDocument.name}" to the "${categoryName}" category."`;
    setTimeout(() => toast({ 
        title: "Document Added", 
        description: successMsg,
        action: React.createElement("button", {
            onClick: () => router.push(`/documents/${categoryId}`),
            className: "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        }, "View Category")
    }), 0);

    const generalChannelId = 'c1'; 
    const generalChannel = channels.find(c => c.id === generalChannelId);
    if (generalChannel) {
        const systemMessage: Message = {
            id: `sys-doc-${Date.now()}`,
            userId: 'system',
            content: `[System] ${currentUser.name} added a new document: "${newDocument.name}" to the "${categoryName}" category.`,
            timestamp: Date.now(),
            isSystemMessage: true,
        };
        if (mockMessages[generalChannelId]) {
            mockMessages[generalChannelId].push(systemMessage);
        } else {
            mockMessages[generalChannelId] = [systemMessage];
        }
        if (activeConversation?.id === generalChannelId) {
            setMessages(fetchMockMessages(generalChannelId));
        }
    }

  }, [currentUser, documentCategories, findDocumentCategoryById, toast, router, channels, activeConversation]);

  const addTextDocumentToCategory = useCallback((categoryId: string, docName: string, textContent: string) => {
    if (!currentUser) return;
    const category = findDocumentCategoryById(categoryId);
    if (!category) return;

    const newDocument: Document = {
      id: `doc-text-${Date.now()}`,
      name: docName,
      type: 'text/plain',
      docType: 'text',
      lastModified: new Date().toLocaleDateString(),
      textContent: textContent,
    };
    setDocumentCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, documents: [...cat.documents, newDocument].sort((a,b) => a.name.localeCompare(b.name)) } : cat
    ));
     const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
    if (catIndex > -1) {
        initialDocumentCategories[catIndex].documents.push(newDocument);
        initialDocumentCategories[catIndex].documents.sort((a,b) => a.name.localeCompare(b.name));
    }

    const categoryName = category.name;
    const successMsg = `"${currentUser.name} created text document "${newDocument.name}" in the "${categoryName}" category."`;
     setTimeout(() => toast({ 
        title: "Document Created", 
        description: successMsg,
        action: React.createElement("button", {
            onClick: () => router.push(`/documents/${categoryId}`),
            className: "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        }, "View Category")
    }), 0);

    const generalChannelId = 'c1'; 
    const generalChannel = channels.find(c => c.id === generalChannelId);
    if (generalChannel) {
        const systemMessage: Message = {
            id: `sys-doc-${Date.now()}`,
            userId: 'system',
            content: `[System] ${currentUser.name} created a new text document: "${newDocument.name}" in the "${categoryName}" category.`,
            timestamp: Date.now(),
            isSystemMessage: true,
        };
        if (mockMessages[generalChannelId]) {
            mockMessages[generalChannelId].push(systemMessage);
        } else {
            mockMessages[generalChannelId] = [systemMessage];
        }
         if (activeConversation?.id === generalChannelId) {
            setMessages(fetchMockMessages(generalChannelId));
        }
    }

  }, [currentUser, documentCategories, findDocumentCategoryById, toast, router, channels, activeConversation]);

  const addLinkedDocumentToCategory = useCallback((categoryId: string, docName: string, docUrl: string) => {
    if (!currentUser) return;
    const category = findDocumentCategoryById(categoryId);
    if (!category) return;

    const newDocument: Document = {
      id: `doc-url-${Date.now()}`,
      name: docName,
      type: 'url',
      docType: 'url',
      lastModified: new Date().toLocaleDateString(),
      fileUrl: docUrl,
    };
     setDocumentCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, documents: [...cat.documents, newDocument].sort((a,b) => a.name.localeCompare(b.name)) } : cat
    ));
    const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
    if (catIndex > -1) {
        initialDocumentCategories[catIndex].documents.push(newDocument);
        initialDocumentCategories[catIndex].documents.sort((a,b) => a.name.localeCompare(b.name));
    }

    const categoryName = category.name;
    const successMsg = `"${currentUser.name} linked external document "${newDocument.name}" in the "${categoryName}" category."`;
    setTimeout(() => toast({ 
        title: "External Document Linked", 
        description: successMsg,
        action: React.createElement("button", {
            onClick: () => router.push(`/documents/${categoryId}`),
            className: "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        }, "View Category")
    }), 0);

    const generalChannelId = 'c1'; 
    const generalChannel = channels.find(c => c.id === generalChannelId);
    if (generalChannel) {
        const systemMessage: Message = {
            id: `sys-doc-${Date.now()}`,
            userId: 'system',
            content: `[System] ${currentUser.name} linked an external document: "${newDocument.name}" in the "${categoryName}" category.`,
            timestamp: Date.now(),
            isSystemMessage: true,
        };
        if (mockMessages[generalChannelId]) {
            mockMessages[generalChannelId].push(systemMessage);
        } else {
            mockMessages[generalChannelId] = [systemMessage];
        }
        if (activeConversation?.id === generalChannelId) {
            setMessages(fetchMockMessages(generalChannelId));
        }
    }
  }, [currentUser, documentCategories, findDocumentCategoryById, toast, router, channels, activeConversation]);
  
  const deleteDocumentFromCategory = useCallback((categoryId: string, docId: string) => {
     if (!currentUser || currentUser.role !== 'admin') {
      setTimeout(() => toast({ title: "Permission Denied", description: "Only admins can delete documents.", variant: "destructive" }), 0);
      return;
    }
    setDocumentCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, documents: cat.documents.filter(d => d.id !== docId) } : cat
    ));
    const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
    if (catIndex > -1) {
        initialDocumentCategories[catIndex].documents = initialDocumentCategories[catIndex].documents.filter(d => d.id !== docId);
    }
    setTimeout(() => toast({ title: "Document Deleted", description: "The document has been removed." }), 0);
  }, [currentUser, toast]);

  const searchAllDocuments = useCallback((query: string): Array<{ doc: Document, category: DocumentCategory }> => {
    const lowerQuery = query.toLowerCase();
    const results: Array<{ doc: Document, category: DocumentCategory }> = [];
    if (!query.trim()) {
        documentCategories.forEach(category => {
            category.documents.forEach(doc => {
                results.push({ doc, category });
            });
        });
    } else {
        documentCategories.forEach(category => {
            category.documents.forEach(doc => {
                if (doc.name.toLowerCase().includes(lowerQuery)) {
                    results.push({ doc, category });
                }
            });
        });
    }
    return results.sort((a,b) => a.doc.name.localeCompare(b.doc.name));
  }, [documentCategories]);

  const updateUserRole = useCallback((targetUserId: string, newRole: UserRole) => {
    if (!currentUser || currentUser.role !== 'admin') {
      setTimeout(() => toast({ title: "Permission Denied", description: "Only admins can change user roles.", variant: "destructive" }), 0);
      return;
    }
    if (currentUser.id === targetUserId) {
        setTimeout(() => toast({ title: "Action Denied", description: "Admins cannot change their own role through this interface.", variant: "destructive" }), 0);
        return;
    }

    const userIndex = initialMockUsers.findIndex(u => u.id === targetUserId);
    if (userIndex !== -1) {
      initialMockUsers[userIndex].role = newRole;
      setAllUsersWithCurrent(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
      setTimeout(() => toast({ title: "User Role Updated", description: `${initialMockUsers[userIndex].name}'s role changed to ${newRole}.` }), 0);
    } else {
       setTimeout(() => toast({ title: "Error", description: "User not found.", variant: "destructive" }), 0);
    }
  }, [currentUser, toast]);

  const handleAddLeaveRequest = useCallback(async (newRequestData: Omit<LeaveRequest, 'id' | 'userId' | 'requestDate' | 'status'>) => {
    if (!currentUser) return;

    const newLeaveRequest: LeaveRequest = {
      id: `lr-${Date.now()}`,
      userId: currentUser.id,
      requestDate: new Date(),
      startDate: startOfDay(newRequestData.startDate),
      endDate: endOfDay(newRequestData.endDate),
      reason: newRequestData.reason,
      status: 'pending',
    };

    setLeaveRequests(prevRequests => 
      [...prevRequests, newLeaveRequest].sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime())
    );

    console.log("[AppContext] handleAddLeaveRequest called with data:", newRequestData, "by user:", currentUser.name);
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "hassyku786@gmail.com";
    if (process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      console.log(`[AppContext] Using admin email from .env.local: ${adminEmail}`);
    } else {
      console.log(`[AppContext] NEXT_PUBLIC_ADMIN_EMAIL not set, defaulting to: ${adminEmail}`);
    }

    const durationMs = endOfDay(newRequestData.endDate).getTime() - startOfDay(newRequestData.startDate).getTime();
    const durationDays = Math.max(1, Math.floor(durationMs / (1000 * 60 * 60 * 24)) + 1);
    const durationString = `${durationDays} day${durationDays !== 1 ? 's' : ''}`;

    const emailSubject = `New Leave Request from ${currentUser.name}`;
    const emailHtmlBody = `
      <p>Hello Admin,</p>
      <p><strong>${currentUser.name}</strong> has submitted a new leave request:</p>
      <ul>
        <li><strong>Start Date:</strong> ${format(newRequestData.startDate, 'PPP')}</li>
        <li><strong>End Date:</strong> ${format(newRequestData.endDate, 'PPP')}</li>
        <li><strong>Duration:</strong> ${durationString}</li>
        <li><strong>Reason:</strong> ${newRequestData.reason}</li>
      </ul>
      <p>Please review this request in the Opano system.</p>
    `;

    try {
      console.log(`[AppContext] Attempting to send leave request email to: ${adminEmail}`);
      const emailResult = await sendInvitationEmailFlow({
        to: adminEmail,
        subject: emailSubject,
        htmlBody: emailHtmlBody,
        joinUrl: `${window.location.origin}/attendance`, // Changed to /attendance as leave is part of it
      });

      if (emailResult.success) {
        console.log("[AppContext] Admin notification email sent successfully for leave request.");
      } else {
        console.error(`[AppContext] Failed to send admin notification email for leave request. Error: ${emailResult.error}`);
        setTimeout(() => toast({
            title: "Admin Email Failed",
            description: `Could not send leave notification to admin. ${emailResult.error || 'Unknown error.'}.`,
            variant: "destructive",
            duration: 8000
        }), 0);
      }
    } catch (flowError) {
      console.error("[AppContext] Error calling email flow for leave request:", flowError);
      setTimeout(() => toast({
          title: "Admin Email Flow Error",
          description: "An error occurred while trying to notify the admin. Check console for details.",
          variant: "destructive",
          duration: 8000
      }), 0);
    }

    const adminUser = allUsersWithCurrent.find(u => u.role === 'admin');
    if (adminUser && adminUser.id !== currentUser.id) {
        const systemMessageContent = `${currentUser.name} has submitted a leave request:
Start: ${format(newRequestData.startDate, 'MMM d, yyyy')}
End: ${format(newRequestData.endDate, 'MMM d, yyyy')}
Duration: ${durationString}
Reason: ${newRequestData.reason}`;

        const systemMessage: Message = {
            id: `sys-leave-${Date.now()}`,
            userId: 'system',
            content: systemMessageContent,
            timestamp: Date.now(),
            isSystemMessage: true,
        };
        if (mockMessages[adminUser.id]) { 
            mockMessages[adminUser.id].push(systemMessage);
        } else {
            mockMessages[adminUser.id] = [systemMessage];
        }
        if (activeConversation?.type === 'dm' && activeConversation.id === adminUser.id) {
            setMessages(fetchMockMessages(adminUser.id));
        }
         console.log(`[AppContext] System message about leave request added to admin (${adminUser.name}) DM.`);
    } else if (adminUser && adminUser.id === currentUser.id) {
        console.log("[AppContext] Admin requested leave, no in-app system message to self needed (email sent).");
    } else {
        console.log("[AppContext] No admin found to send in-app system message for leave request.");
    }
  }, [currentUser, toast, allUsersWithCurrent, activeConversation]);


  const contextValue = useMemo(() => ({
    currentUser,
    isLoadingAuth,
    users,
    allUsersWithCurrent,
    channels,
    activeConversation,
    setActiveConversation,
    messages,
    addMessage,
    addChannel,
    toggleReaction,
    currentView,
    setActiveSpecialView,
    isUserProfilePanelOpen,
    viewingUserProfile,
    openUserProfilePanel,
    closeUserProfilePanel,
    isEditProfileDialogOpen,
    setIsEditProfileDialogOpen,
    openEditProfileDialog,
    updateUserProfile,
    toggleCurrentUserStatus,
    signOutUser,
    getConversationName,
    sendInvitation,
    pendingInvitations,
    verifyInviteToken,
    acceptInvitation,
    addMembersToChannel,
    removeUserFromChannel,
    currentSummary,
    isLoadingSummary,
    fetchAndSetSummary,
    replyingToMessage,
    setReplyingToMessage,
    drafts,
    saveDraft,
    deleteDraft,
    activities,
    replies,
    documentCategories,
    addDocumentCategory,
    findDocumentCategoryById,
    addFileDocumentToCategory,
    addTextDocumentToCategory,
    addLinkedDocumentToCategory,
    deleteDocumentFromCategory,
    searchAllDocuments,
    updateUserRole,
    leaveRequests,
    handleAddLeaveRequest,
  }), [
    currentUser, isLoadingAuth, users, allUsersWithCurrent, channels, activeConversation, setActiveConversation,
    messages, addMessage, addChannel, toggleReaction, currentView, setActiveSpecialView,
    isUserProfilePanelOpen, viewingUserProfile, openUserProfilePanel, closeUserProfilePanel, isEditProfileDialogOpen, setIsEditProfileDialogOpen, openEditProfileDialog,
    updateUserProfile, toggleCurrentUserStatus, signOutUser, getConversationName,
    sendInvitation, pendingInvitations, verifyInviteToken, acceptInvitation, addMembersToChannel, removeUserFromChannel,
    currentSummary, isLoadingSummary, fetchAndSetSummary,
    replyingToMessage, setReplyingToMessage, drafts, saveDraft, deleteDraft, activities, replies,
    documentCategories, addDocumentCategory, findDocumentCategoryById, addFileDocumentToCategory,
    addTextDocumentToCategory, addLinkedDocumentToCategory, deleteDocumentFromCategory, searchAllDocuments,
    updateUserRole, leaveRequests, handleAddLeaveRequest
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

