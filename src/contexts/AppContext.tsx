
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, useRef } from 'react';
import type { User, Channel, Message, ActiveConversation, CurrentView, PendingInvitation, UserRole, Draft, ActivityItem, Document, DocumentCategory, UserProfileUpdateData } from '@/types';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

import {
    initialMockUsers,
    initialMockChannels,
    getMessagesForConversation as fetchMockMessages,
    updateMockMessage,
    mockMessages, // Corrected: Import directly as mockMessages
    // initialMockCurrentUser removed
    initialMockDrafts, // Renamed from mockDrafts for clarity
    initialDocumentCategories
} from '@/lib/mock-data';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Assuming firebase.ts is set up

// AI Flow imports - these will remain but might be conditionally used if currentUser is null
import { summarizeChannel as summarizeChannelFlow } from '@/ai/flows/summarize-channel';
import { sendInvitationEmail as sendInvitationEmailFlow } from '@/ai/flows/send-invitation-email-flow';
import { format, formatDistanceToNowStrict } from 'date-fns';


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
  openEditProfileDialog?: () => void; // Made optional for UserProfilePanel case
  updateUserProfile: (profileData: UserProfileUpdateData) => void;
  toggleCurrentUserStatus: () => void;
  signOutUser: () => Promise<void>;
  getConversationName: (conversationId: string, conversationType: 'channel' | 'dm') => string;
  sendInvitation: (email: string) => void;
  pendingInvitations: PendingInvitation[];
  verifyInviteToken: (token: string) => PendingInvitation | null;
  acceptInvitation: (token: string, newUserDetails: { name: string; designation?: string }) => boolean;
  addMembersToChannel: (channelId: string, userIdsToAdd: string[]) => void;
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
  updateUserRole: (targetUserId: string, newRole: UserRole) => void;
  handleAddLeaveRequest: (newRequestData: Omit<import('@/types').LeaveRequest, 'id' | 'userId' | 'requestDate' | 'status'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [users, setUsers] = useState<User[]>([]); // Initialized empty, to be filled from initialMockUsers if needed
  const [allUsersWithCurrent, setAllUsersWithCurrent] = useState<User[]>([]);
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

  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  // Ref pattern for setActiveConversation
  const setActiveConversationRef = useRef<((type: 'channel' | 'dm', id: string) => void) | null>(null);


  // Firebase Auth Listener
  useEffect(() => {
    console.log('[AppContext] Setting up Firebase auth listener...');
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      console.log('[AppContext] Auth state changed. Firebase user:', firebaseUser?.email);
      if (firebaseUser) {
        const existingUser = initialMockUsers.find(u => u.email === firebaseUser.email);
        let appUser: User;

        if (existingUser) {
          appUser = {
            ...existingUser,
            id: firebaseUser.uid, // Ensure Firebase UID is used
            name: firebaseUser.displayName || existingUser.name,
            email: firebaseUser.email || existingUser.email, // Should always be there
            avatarUrl: firebaseUser.photoURL || existingUser.avatarUrl,
            // designation, role, etc., are kept from mock if user exists
          };
          // Update the user in initialMockUsers if UID was different or name/avatar updated
          const userIndex = initialMockUsers.findIndex(u => u.email === firebaseUser.email);
          initialMockUsers[userIndex] = appUser;

        } else {
          // New user via Firebase (e.g., Google Sign-In, or first time Email/Pass)
          // Assign role: first user is admin, others are members
          const isFirstUser = initialMockUsers.length === 0;
          appUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'New User',
            email: firebaseUser.email!, // Email should exist for authenticated user
            avatarUrl: firebaseUser.photoURL || `https://placehold.co/40x40.png?text=${(firebaseUser.displayName || 'N')?.[0]?.toUpperCase()}`,
            isOnline: true,
            designation: 'New Member',
            role: isFirstUser ? 'admin' : 'member',
          };
          initialMockUsers.push(appUser); // Add to our mock persistent store
        }

        console.log('[AppContext] Current user set:', appUser.email, 'Role:', appUser.role);
        setCurrentUser(appUser);

        const otherUsers = initialMockUsers.filter(u => u.id !== appUser.id);
        setUsers(otherUsers);
        setAllUsersWithCurrent([...otherUsers, appUser]);

      } else {
        console.log('[AppContext] No Firebase user. Setting currentUser to null.');
        setCurrentUser(null);
        setUsers([]);
        setAllUsersWithCurrent([]);
        setActiveConversationState(null);
      }
      setIsLoadingAuth(false);
      console.log('[AppContext] isLoadingAuth set to false.');
    });
    return () => {
      console.log('[AppContext] Cleaning up Firebase auth listener.');
      unsubscribe();
    }
  }, []);


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
      const user = allUsersWithCurrent.find(u => u.id === id); // Use allUsersWithCurrent
      if (user) {
        foundConversation = { type, id, name: user.name, recipient: user };
      }
    }
    setActiveConversationState(foundConversation);
    setCurrentViewState('chat');
  }, [channels, allUsersWithCurrent, currentUser, toast]); // Dependencies for setActiveConversation

  useEffect(() => {
    setActiveConversationRef.current = setActiveConversation;
  }, [setActiveConversation]);

  const setActiveSpecialView = useCallback((view: 'chat' | 'replies' | 'activity' | 'drafts') => {
    setCurrentViewState(view);
    setActiveConversationState(null);
    setReplyingToMessage(null);
  }, []);


  // Redirection Logic
 useEffect(() => {
    console.log('[AppContext] Redirection check. isLoadingAuth:', isLoadingAuth, 'currentUser:', !!currentUser, 'pathname:', pathname);
    if (!isLoadingAuth) {
      const isAuthPage = pathname.startsWith('/auth/') || pathname.startsWith('/join/');
      if (!currentUser && !isAuthPage) {
        console.log('[AppContext] No user & not on auth page, redirecting to /auth/join');
        router.push('/auth/join');
      } else if (currentUser && isAuthPage) {
        console.log('[AppContext] User logged in & on auth page, redirecting to /');
        router.push('/');
      } else if (currentUser && !activeConversation && pathname === '/' && channels.length > 0 && currentView === 'chat') {
        // Automatically select the first channel if user is logged in, on main page, no active convo, and channels exist
        // Check if setActiveConversationRef.current is available before calling
        if (setActiveConversationRef.current) {
          console.log('[AppContext] Auto-selecting first channel:', channels[0].name);
          setActiveConversationRef.current('channel', channels[0].id);
        }
      }
    }
  }, [isLoadingAuth, currentUser, router, pathname, activeConversation, channels, currentView]);


  // Load messages when activeConversation changes
  useEffect(() => {
    if (currentView === 'chat' && activeConversation) {
      const fetchedMessages = fetchMockMessages(activeConversation.id);
      setMessages(fetchedMessages);
    } else {
      setMessages([]); // Clear messages if no active conversation or not in chat view
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
    setReplyingToMessage(null); // Clear reply context after sending
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
      id: `sys-${Date.now()}`,
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

    setActiveConversation('channel', newChannel.id);
    setTimeout(() => toast({ title: "Channel Created", description: `Channel #${name} created.` }), 0);
  }, [currentUser, channels, allUsersWithCurrent, toast, setActiveConversation]);

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

          // Update mock data
          const mockChannelIndex = initialMockChannels.findIndex(mc => mc.id === channelId);
          if (mockChannelIndex !== -1) {
            initialMockChannels[mockChannelIndex] = updatedChannel;
          }
          
          // Post system message
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
            // If this is the active channel, update messages state
            if (activeConversation?.id === channelId) {
              setMessages(prevMsgs => [...prevMsgs, systemMessage]);
            }
          }
           setTimeout(() => toast({ title: "Members Added", description: `${addedUsersNames.join(', ')} added to #${channel.name}.` }), 0);
          return updatedChannel;
        }
        return channel;
      })
    );
  }, [currentUser, allUsersWithCurrent, toast, activeConversation]);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    if (!currentUser || !activeConversation) return;
    setMessages(prevMessages => {
      return prevMessages.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...(msg.reactions || {}) };
          const userList = reactions[emoji] || [];
          const userIndex = userList.indexOf(currentUser.id);

          if (userIndex > -1) { // User already reacted with this emoji, remove reaction
            userList.splice(userIndex, 1);
            if (userList.length === 0) delete reactions[emoji];
            else reactions[emoji] = userList;
          } else { // Add reaction
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
    // No need to setViewingUserProfile(null) here, panel will just not render
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
        email: profileData.email || prevUser.email, // Email is critical
        avatarUrl: profileData.avatarDataUrl || prevUser.avatarUrl,
        phoneNumber: profileData.phoneNumber === undefined ? prevUser.phoneNumber : profileData.phoneNumber,
        linkedinProfileUrl: profileData.linkedinProfileUrl === undefined ? prevUser.linkedinProfileUrl : profileData.linkedinProfileUrl,
        pronouns: profileData.pronouns === undefined ? prevUser.pronouns : profileData.pronouns,
      };
      // Update the master list of users
      const userIndex = initialMockUsers.findIndex(u => u.id === updatedUser.id);
      if (userIndex !== -1) {
        initialMockUsers[userIndex] = { ...initialMockUsers[userIndex], ...updatedUser };
      } else {
        initialMockUsers.push(updatedUser); // Should not happen if currentUser logic is correct
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
      return { ...prevUser, isOnline: newStatus };
    });
    // Update this user in all relevant lists
    initialMockUsers.forEach((user, index) => {
      if (user.id === currentUser.id) initialMockUsers[index].isOnline = newStatus;
    });
    setAllUsersWithCurrent(prev => prev.map(u => u.id === currentUser.id ? { ...u, isOnline: newStatus } : u));
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isOnline: newStatus } : u));

    setTimeout(() => toast({ title: "Status Updated", description: `You are now ${newStatus ? 'Online' : 'Away'}.` }), 0);
  }, [currentUser, toast]);

  const signOutUser = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle setting currentUser to null and redirection
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
      // Use allUsersWithCurrent which includes the current user.
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
      // Optionally, resend the email here or provide a way to resend
      // For now, just inform the admin.
      // For testing, here is the join URL again:
      const joinUrl = `${window.location.origin}/join/${existingInvitation.token}`;
      console.log(`[sendInvitation] Test link for already invited user ${email}: ${joinUrl}`);
      return;
    }

    const token = btoa(`${email}-${Date.now()}`); // Simple mock token
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
        joinUrl: joinUrl, // Pass joinUrl for logging inside the flow
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
    // Optionally, add expiry check here if needed
    return invitation || null;
  }, [pendingInvitations]);

  const acceptInvitation = useCallback((token: string, newUserDetails: { name: string; designation?: string }): boolean => {
    const invitationIndex = pendingInvitations.findIndex(inv => inv.token === token);
    if (invitationIndex === -1) {
      setTimeout(() => toast({ title: "Invalid Token", description: "This invitation is no longer valid.", variant: "destructive" }),0);
      return false;
    }
    const invitation = pendingInvitations[invitationIndex];

    // In a real Firebase app, this is where you'd guide the user to the Firebase sign-up/sign-in flow
    // for the invitation.email. After successful Firebase auth, you'd create their profile in Firestore.
    // For mock, we create the user directly.
    const newUser: User = {
      id: `u${Date.now()}`,
      name: newUserDetails.name,
      email: invitation.email,
      avatarUrl: `https://placehold.co/40x40.png?text=${newUserDetails.name[0]?.toUpperCase() || 'U'}`,
      isOnline: true,
      designation: newUserDetails.designation || 'New Member',
      role: 'member', // New users from invites are members
    };

    setUsers(prev => [...prev, newUser]);
    setAllUsersWithCurrent(prev => [...prev, newUser]);
    initialMockUsers.push(newUser); // Update mock store
    
    setPendingInvitations(prev => prev.filter(inv => inv.token !== token));
    
    // "Log in" the new user for the mock setup & redirect
    setCurrentUser(newUser); // This will trigger redirection via the auth useEffect
    setTimeout(() => toast({ title: "Welcome!", description: `Account for ${newUser.name} created.` }),0);
    return true;
  }, [pendingInvitations, toast]);

  const fetchAndSetSummary = useCallback(async (channelId: string, channelName: string) => {
    const channelMessages = mockMessages[channelId] || [];
    if (channelMessages.length < 5) { // Don't summarize very short conversations
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
  }, [currentUser, mockMessages]); // Re-evaluate if mockMessages changes identity

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
                    timestamp: Date.now(), // Mock: reaction timestamp would ideally be stored
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
    return userActivities.sort((a, b) => b.timestamp - a.timestamp); // Sort by mock timestamp
  }, [currentUser, mockMessages, allUsersWithCurrent, getConversationName, channels]);

  // Document Management Functions
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
    initialDocumentCategories.push(newCategory); // Update mock store
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
    if (catIndex > -1) initialDocumentCategories[catIndex].documents.push(newDocument);
    initialDocumentCategories[catIndex].documents.sort((a,b) => a.name.localeCompare(b.name));

    const categoryName = category.name;
    const successMsg = `"${currentUser.name} added "${newDocument.name}" to the "${categoryName}" category."`;
    setTimeout(() => toast({ 
        title: "Document Added", 
        description: successMsg,
        action: <ToastAction altText="View Category" onClick={() => router.push(`/documents/${categoryId}`)}>View Category</ToastAction>
    }), 0);

    // Post to general channel
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
            setMessages(prev => [...prev, systemMessage]);
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
    if (catIndex > -1) initialDocumentCategories[catIndex].documents.push(newDocument);
    initialDocumentCategories[catIndex].documents.sort((a,b) => a.name.localeCompare(b.name));

    const categoryName = category.name;
    const successMsg = `"${currentUser.name} created text document "${newDocument.name}" in the "${categoryName}" category."`;
     setTimeout(() => toast({ 
        title: "Document Created", 
        description: successMsg,
        action: <ToastAction altText="View Category" onClick={() => router.push(`/documents/${categoryId}`)}>View Category</ToastAction>
    }), 0);

    // Post to general channel
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
            setMessages(prev => [...prev, systemMessage]);
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
    if (catIndex > -1) initialDocumentCategories[catIndex].documents.push(newDocument);
    initialDocumentCategories[catIndex].documents.sort((a,b) => a.name.localeCompare(b.name));

    const categoryName = category.name;
    const successMsg = `"${currentUser.name} linked external document "${newDocument.name}" in the "${categoryName}" category."`;
    setTimeout(() => toast({ 
        title: "External Document Linked", 
        description: successMsg,
        action: <ToastAction altText="View Category" onClick={() => router.push(`/documents/${categoryId}`)}>View Category</ToastAction>
    }), 0);

    // Post to general channel
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
            setMessages(prev => [...prev, systemMessage]);
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
    if (!query.trim()) { // Return all documents if query is empty
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
      // Update state
      setAllUsersWithCurrent(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, role: newRole } : u));
      setTimeout(() => toast({ title: "User Role Updated", description: `${initialMockUsers[userIndex].name}'s role changed to ${newRole}.` }), 0);
    } else {
       setTimeout(() => toast({ title: "Error", description: "User not found.", variant: "destructive" }), 0);
    }
  }, [currentUser, toast]);

  const handleAddLeaveRequest = useCallback(async (newRequestData: Omit<import('@/types').LeaveRequest, 'id' | 'userId' | 'requestDate' | 'status'>) => {
    if (!currentUser) return;
     // Existing AppContext logic for adding to local state
    console.log("[AppContext] handleAddLeaveRequest called with data:", newRequestData, "by user:", currentUser.name);

    // Admin email logic
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "hassyku786@gmail.com";
    if (process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      console.log(`[AppContext] Using admin email from .env.local: ${adminEmail}`);
    } else {
      console.log(`[AppContext] NEXT_PUBLIC_ADMIN_EMAIL not set, defaulting to: ${adminEmail}`);
    }

    const durationDays = formatDistanceToNowStrict(newRequestData.endDate, { unit: 'day', roundingMethod: 'ceil', addSuffix: false }).replace(' days', ' day(s)');

    const emailSubject = `New Leave Request from ${currentUser.name}`;
    const emailHtmlBody = `
      <p>Hello Admin,</p>
      <p><strong>${currentUser.name}</strong> has submitted a new leave request:</p>
      <ul>
        <li><strong>Start Date:</strong> ${format(newRequestData.startDate, 'PPP')}</li>
        <li><strong>End Date:</strong> ${format(newRequestData.endDate, 'PPP')}</li>
        <li><strong>Duration:</strong> ${durationDays}</li>
        <li><strong>Reason:</strong> ${newRequestData.reason}</li>
      </ul>
      <p>Please review this request in the Opano system.</p>
    `;

    try {
      console.log(`[AppContext] Attempting to send leave request email to: ${adminEmail}`);
      const emailResult = await sendInvitationEmailFlow({ // Reusing the existing email flow
        to: adminEmail,
        subject: emailSubject,
        htmlBody: emailHtmlBody,
        joinUrl: `${window.location.origin}/attendance`, // Link to attendance page for admin
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

    // Add system message to Admin's DM
    const adminUser = allUsersWithCurrent.find(u => u.role === 'admin');
    if (adminUser && adminUser.id !== currentUser.id) {
        const systemMessageContent = `${currentUser.name} has submitted a leave request:
Start: ${format(newRequestData.startDate, 'MMM d, yyyy')}
End: ${format(newRequestData.endDate, 'MMM d, yyyy')}
Duration: ${durationDays}
Reason: ${newRequestData.reason}`;

        const systemMessage: Message = {
            id: `sys-leave-${Date.now()}`,
            userId: 'system',
            content: systemMessageContent,
            timestamp: Date.now(),
            isSystemMessage: true,
        };
        if (mockMessages[adminUser.id]) { // Admin's ID is used as conversation ID for their DM
            mockMessages[adminUser.id].push(systemMessage);
        } else {
            mockMessages[adminUser.id] = [systemMessage];
        }
        // If the current user is the admin and viewing their own DM, refresh messages
        if (activeConversation?.type === 'dm' && activeConversation.id === adminUser.id) {
            setMessages(prev => [...prev, systemMessage]);
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
    handleAddLeaveRequest,
  }), [
    currentUser, isLoadingAuth, users, allUsersWithCurrent, channels, activeConversation, setActiveConversation,
    messages, addMessage, addChannel, toggleReaction, currentView, setActiveSpecialView,
    isUserProfilePanelOpen, viewingUserProfile, openUserProfilePanel, closeUserProfilePanel, isEditProfileDialogOpen, setIsEditProfileDialogOpen, openEditProfileDialog,
    updateUserProfile, toggleCurrentUserStatus, signOutUser, getConversationName,
    sendInvitation, pendingInvitations, verifyInviteToken, acceptInvitation, addMembersToChannel,
    currentSummary, isLoadingSummary, fetchAndSetSummary,
    replyingToMessage, setReplyingToMessage, drafts, saveDraft, deleteDraft, activities, replies,
    documentCategories, addDocumentCategory, findDocumentCategoryById, addFileDocumentToCategory,
    addTextDocumentToCategory, addLinkedDocumentToCategory, deleteDocumentFromCategory, searchAllDocuments,
    updateUserRole, handleAddLeaveRequest
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

    