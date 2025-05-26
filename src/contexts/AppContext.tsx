
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User, Channel, Message, ActiveConversation, PendingInvitation, Draft, ActivityItem, CurrentView, DocumentCategory, Document, LeaveRequest, UserRole } from '@/types';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import {
    initialMockUsers,
    initialMockChannels,
    getMessagesForConversation as fetchMockMessages,
    updateMockMessage,
    mockMessages,
    mockDrafts as initialMockDrafts,
    initialDocumentCategories
} from '@/lib/mock-data';
import { summarizeChannel as summarizeChannelFlow } from '@/ai/flows/summarize-channel';
import { sendInvitationEmail } from '@/ai/flows/send-invitation-email-flow';
import { useToast } from '@/hooks/use-toast';
import { useRouter, usePathname } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { ToastAction } from '@/components/ui/toast';


export type UserProfileUpdateData = {
  name: string;
  designation?: string;
  email: string;
  phoneNumber?: string;
  avatarDataUrl?: string;
  linkedinProfileUrl?: string;
  pronouns?: string;
  role?: UserRole;
};

interface AppContextType {
  currentUser: User | null;
  users: User[];
  allUsersWithCurrent: User[];
  channels: Channel[];
  activeConversation: ActiveConversation;
  setActiveConversation: (type: 'channel' | 'dm', id: string) => void;
  addMessage: (content: string, file?: File) => void;
  addChannel: (name: string, description?: string, memberIds?: string[], isPrivate?: boolean) => void;
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
  signOutUser: () => Promise<void>;

  currentView: CurrentView;
  setActiveSpecialView: (view: 'replies' | 'activity' | 'drafts') => void;
  drafts: Draft[];
  deleteDraft: (draftId: string) => void;
  replies: Message[];
  activities: ActivityItem[];
  getConversationName: (conversationId: string, conversationType: 'channel' | 'dm') => string;

  replyingToMessage: Message | null;
  setReplyingToMessage: React.Dispatch<React.SetStateAction<Message | null>>;

  documentCategories: DocumentCategory[];
  addDocumentCategory: (name: string, description: string, iconName?: DocumentCategory['iconName']) => void;
  addFileDocumentToCategory: (categoryId: string, file: File) => void;
  addTextDocumentToCategory: (categoryId: string, docName: string, textContent: string) => void;
  addLinkedDocumentToCategory: (categoryId: string, docName: string, docUrl: string) => void;
  deleteDocumentFromCategory: (categoryId: string, docId: string) => void;
  findDocumentCategoryById: (categoryId: string) => DocumentCategory | undefined;
  searchAllDocuments: (query: string) => Array<{ doc: Document, category: DocumentCategory }>;

  isCallActive: boolean;
  callingWith: ActiveConversation | null;
  startCall: (conversation: ActiveConversation | null) => void;
  endCall: () => void;

  isLoadingAuth: boolean;

  isUserProfilePanelOpen: boolean;
  viewingUserProfile: User | null;
  openUserProfilePanel: (user: User) => void;
  closeUserProfilePanel: () => void;

  leaveRequests: LeaveRequest[];
  handleAddLeaveRequest: (newRequestData: Omit<LeaveRequest, 'id' | 'userId' | 'requestDate' | 'status'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [users, setUsers] = useState<User[]>([]); // Init empty, populated after auth
  const [allUsersWithCurrent, setAllUsersWithCurrent] = useState<User[]>([]); // Init empty
  const [channels, setChannels] = useState<Channel[]>(initialMockChannels);
  const [activeConversation, setActiveConversationState] = useState<ActiveConversation>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSummary, setCurrentSummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  const [currentView, setCurrentViewState] = useState<CurrentView>('chat');
  const [drafts, setDrafts] = useState<Draft[]>(initialMockDrafts);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>(initialDocumentCategories);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callingWith, setCallingWith] = useState<ActiveConversation | null>(null);

  const [isUserProfilePanelOpen, setIsUserProfilePanelOpen] = useState(false);
  const [viewingUserProfile, setViewingUserProfile] = useState<User | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const closeUserProfilePanel = useCallback(() => {
    setIsUserProfilePanelOpen(false);
    setViewingUserProfile(null);
  }, []);
  
  const setActiveConversation = useCallback((type: 'channel' | 'dm', id: string) => {
    setCurrentSummary(null); // Clear any existing summary
    closeUserProfilePanel();
    let foundConversation: ActiveConversation = null;
    if (type === 'channel') {
      const channel = channels.find(c => c.id === id);
      if (channel) {
        if (channel.isPrivate && (!currentUser || !channel.memberIds.includes(currentUser.id))) {
          setTimeout(() => { // Ensure toast is called outside render cycle
            toast({
              title: "Access Denied",
              description: `You are not a member of this private channel.`,
              variant: "destructive",
            });
          },0);
          return;
        }
        foundConversation = { type, id, name: channel.name, channel };
      }
    } else { // type === 'dm'
      const user = allUsersWithCurrent.find(u => u.id === id);
      if (user) {
        foundConversation = { type, id, name: user.name, recipient: user };
      }
    }
    setActiveConversationState(foundConversation);
    setCurrentViewState('chat');
    setReplyingToMessage(null);
  }, [channels, allUsersWithCurrent, currentUser, toast, closeUserProfilePanel]);


  const setActiveSpecialView = useCallback((view: 'replies' | 'activity' | 'drafts') => {
    setCurrentViewState(view);
    setActiveConversationState(null); // Clear active chat conversation
    setReplyingToMessage(null);
    closeUserProfilePanel();
  }, [closeUserProfilePanel]);

  // Firebase Auth Listener
  useEffect(() => {
    console.log("[AppContext] Subscribing to Firebase onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      console.log("[AppContext] onAuthStateChanged triggered. Firebase user:", firebaseUser?.uid || 'null');
      if (firebaseUser) {
        let appUser: User | undefined = initialMockUsers.find(u => u.id === firebaseUser.uid);
        let userRole: UserRole = 'member'; // Default role

        if (!appUser) { // New user to our system
          if (initialMockUsers.length === 0) { // This is the very first user signing up
            userRole = 'admin';
            console.log(`[AppContext] First user detected (${firebaseUser.email}), assigning 'admin' role.`);
          }
          appUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User',
            email: firebaseUser.email || 'no-email@example.com',
            avatarUrl: firebaseUser.photoURL || `https://placehold.co/40x40.png?text=${(firebaseUser.displayName || firebaseUser.email || 'AU').substring(0,2).toUpperCase()}`,
            isOnline: true,
            designation: '', // Can be filled out in profile edit
            phoneNumber: '',
            linkedinProfileUrl: '',
            pronouns: '',
            role: userRole,
          };
          initialMockUsers.push(appUser); // Add to our mock "DB"
          console.log(`[AppContext] New app user created: ${appUser.name}, Role: ${appUser.role}`);
        } else { // Existing user found in our mock DB
           appUser = { ...appUser, isOnline: true, role: appUser.role || 'member' }; // Ensure role is set
           const userIndex = initialMockUsers.findIndex(u => u.id === appUser!.id);
           if (userIndex !== -1) {
               initialMockUsers[userIndex] = appUser;
           }
           console.log(`[AppContext] Existing app user found: ${appUser.name}, Role: ${appUser.role}`);
        }
        setCurrentUser(appUser);
        setUsers(initialMockUsers.filter(u => u.id !== appUser!.id));
        setAllUsersWithCurrent([...initialMockUsers]);

      } else { // User is signed out
        setCurrentUser(null);
        setActiveConversationState(null);
        setCurrentViewState('chat');
        setUsers([]); // Clear users list
        setAllUsersWithCurrent([]); // Clear all users list
        closeUserProfilePanel();
      }
      setIsLoadingAuth(false);
      console.log("[AppContext] isLoadingAuth set to false.");
    });
    return () => {
      console.log("[AppContext] Unsubscribing from Firebase onAuthStateChanged.");
      unsubscribe();
    };
  }, [closeUserProfilePanel]); // Added closeUserProfilePanel to dependencies

  // Redirection Logic
  useEffect(() => {
    if (isLoadingAuth) return;

    console.log("[AppContext] Redirection check. currentUser:", currentUser?.id || 'null', "pathname:", pathname);
    const isAuthPage = pathname.startsWith('/auth/') || pathname.startsWith('/join/');
    const isAdminPage = pathname.startsWith('/admin/');

    if (!currentUser && !isAuthPage) {
      console.log("[AppContext] Not logged in, not on auth page. Redirecting to /auth/join");
      router.replace('/auth/join');
    } else if (currentUser && isAuthPage) {
      console.log("[AppContext] User logged in and on auth page, redirecting to /");
      router.replace('/');
    } else if (currentUser && isAdminPage && currentUser.role !== 'admin') {
      console.log("[AppContext] Non-admin trying to access admin page. Redirecting to /");
      router.replace('/');
    }
  }, [isLoadingAuth, currentUser, pathname, router]);

  // Initial Active Conversation Logic
   useEffect(() => {
    if (isLoadingAuth || !currentUser || pathname !== '/' || activeConversation) return;

    if (channels.length === 0 && users.length === 0 && currentView === 'chat') {
      console.log("[AppContext] Blank slate. Setting initial active conversation to self DM.");
      setActiveConversation('dm', currentUser.id);
    } else if (channels.length > 0 && currentView === 'chat') {
      const generalChannel = channels.find(c => c.name.toLowerCase() === 'general');
      if (generalChannel) {
        console.log("[AppContext] Setting initial active conversation to #general channel.");
        setActiveConversation('channel', generalChannel.id);
      } else {
         console.log("[AppContext] No #general, defaulting to first channel or self DM.");
         setActiveConversation('channel', channels[0].id);
      }
    } else if (currentView === 'chat' && users.length > 0) { // Should be covered by self-DM if no channels
        console.log("[AppContext] No channels, but other users exist. Setting to self DM.");
        setActiveConversation('dm', currentUser.id);
    }
  }, [isLoadingAuth, currentUser, pathname, activeConversation, channels, users, currentView, setActiveConversation]);


  useEffect(() => {
    if (currentView === 'chat' && activeConversation) {
      const fetchedMessages = fetchMockMessages(activeConversation.id);
      setMessages(fetchedMessages);
    } else {
      setMessages([]);
    }
  }, [activeConversation, currentView]);

  const addMessage = useCallback((content: string, file?: File) => {
    if (!activeConversation || !currentUser) {
        setTimeout(() => toast({title: "Cannot send message", description: "You must be logged in and in a conversation.", variant: "destructive"}), 0);
        return;
    }

    let replyData: Partial<Message> = {};
    if (replyingToMessage) {
      const originalSender = allUsersWithCurrent.find(u => u.id === replyingToMessage.userId);
      replyData = {
        replyToMessageId: replyingToMessage.id,
        originalMessageSenderName: originalSender?.name || "Unknown User",
        originalMessageContent: replyingToMessage.content.substring(0, 70) + (replyingToMessage.content.length > 70 ? "..." : ""),
      };
    }

    let messageFile: Message['file'] | undefined = undefined;
    if (file) {
      let fileType: Message['file']['type'] = 'other';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio';
      } else if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
        fileType = 'document';
      }

      // For images and audio, we can create an object URL for local preview
      const fileUrl = (fileType === 'audio' || fileType === 'image') ? URL.createObjectURL(file) : 'https://placehold.co/200x150.png'; // Placeholder for non-previewable

      messageFile = {
        name: file.name,
        url: fileUrl, // This will be the Object URL for local files
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
      ...replyData,
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    // Update mock data store
    if (activeConversation && mockMessages[activeConversation.id]) {
        mockMessages[activeConversation.id] = [...mockMessages[activeConversation.id], newMessage];
    } else if (activeConversation) {
        mockMessages[activeConversation.id] = [newMessage];
    }
    setReplyingToMessage(null); // Clear replying state after sending
  }, [activeConversation, currentUser, replyingToMessage, allUsersWithCurrent, toast]);

  const addChannel = useCallback((name: string, description?: string, memberIds: string[] = [], isPrivate: boolean = false) => {
    if (!currentUser) {
        setTimeout(() => toast({title: "Action failed", description: "You must be logged in to create a channel.", variant: "destructive"}), 0);
        return;
    }
    if (currentUser.role !== 'admin') {
        setTimeout(() => toast({title: "Permission Denied", description: "Only admins can create channels.", variant: "destructive"}), 0);
        return;
    }

    const trimmedName = name.trim();
    if (channels.some(channel => channel.name.toLowerCase() === trimmedName.toLowerCase())) {
      setTimeout(() => {
        toast({
          title: "Channel Name Exists",
          description: `A channel named "${trimmedName}" already exists. Please choose a different name.`,
          variant: "destructive",
        });
      }, 0);
      return;
    }


    const newChannel: Channel = {
      id: `c${Date.now()}`,
      name: trimmedName,
      description: description || '',
      memberIds: Array.from(new Set([currentUser.id, ...memberIds])), // Creator is always a member
      isPrivate,
    };
    setChannels(prevChannels => {
      const updatedChannels = [...prevChannels, newChannel];
      // Update mock data store
      const channelIndex = initialMockChannels.findIndex(ch => ch.id === newChannel.id);
      if (channelIndex === -1) {
        initialMockChannels.push(newChannel); // Add if new
      } else {
        initialMockChannels[channelIndex] = newChannel; // Update if somehow exists (should not happen with unique IDs)
      }
      return updatedChannels;
    });

    const creatorName = currentUser.name;
    const creationSystemMessage: Message = {
        id: `sys-create-${Date.now()}`,
        userId: 'system',
        content: `${creatorName} created the ${isPrivate ? 'private ' : ''}channel #${trimmedName}.`,
        timestamp: Date.now(),
        isSystemMessage: true,
    };
    mockMessages[newChannel.id] = [creationSystemMessage]; // Initialize messages for the new channel

    const addedMembersOtherThanCreator = memberIds.filter(id => id !== currentUser.id);
    if (addedMembersOtherThanCreator.length > 0) {
        const addedUserNames = addedMembersOtherThanCreator
            .map(id => allUsersWithCurrent.find(user => user.id === id)?.name)
            .filter((name): name is string => !!name); // Type guard

        if (addedUserNames.length > 0) {
            const addedMembersMessageContent = `${creatorName} added ${addedUserNames.join(', ')} to the channel.`;
            const addedMembersSystemMessage: Message = {
                id: `sys-add-init-${Date.now()}`,
                userId: 'system',
                content: addedMembersMessageContent,
                timestamp: Date.now() + 1, // Ensure slightly different timestamp
                isSystemMessage: true,
            };
            mockMessages[newChannel.id].push(addedMembersSystemMessage);
        }
    }


    setActiveConversation('channel', newChannel.id);
    setTimeout(() => { // Defer toast to avoid issues during render
      toast({ title: "Channel Created", description: `Channel #${trimmedName} has been created.` });
    }, 0);
  }, [currentUser, toast, setActiveConversation, allUsersWithCurrent, channels]);

  const addMembersToChannel = useCallback((channelId: string, userIdsToAdd: string[]) => {
     if (!currentUser) {
        setTimeout(() => toast({title: "Action failed", description: "You must be logged in.", variant: "destructive"}), 0);
        return;
    }
    if (currentUser.role !== 'admin') {
        setTimeout(() => toast({title: "Permission Denied", description: "Only admins can add members to channels.", variant: "destructive"}), 0);
        return;
    }

    let channelName = '';
    let isPrivateChannel = false;
    setChannels(prevChannels => {
      return prevChannels.map(channel => {
        if (channel.id === channelId) {
          channelName = channel.name;
          isPrivateChannel = channel.isPrivate || false;
          const newMemberIds = Array.from(new Set([...channel.memberIds, ...userIdsToAdd]));
          const updatedChannel = { ...channel, memberIds: newMemberIds };
          
          // Update mock data store
          const mockChannelIndex = initialMockChannels.findIndex(ch => ch.id === channelId);
          if (mockChannelIndex !== -1) {
            initialMockChannels[mockChannelIndex] = updatedChannel;
          }

          // If this is the active conversation, update its channel details
          if (activeConversation?.type === 'channel' && activeConversation.id === channelId) {
            setActiveConversationState(prev => prev ? {...prev, channel: updatedChannel} : null);
          }
          return updatedChannel;
        }
        return channel;
      });
    });

    // Create a system message for the action
    const addedUserNames = userIdsToAdd
        .map(id => allUsersWithCurrent.find(user => user.id === id)?.name)
        .filter((name): name is string => !!name); // Type guard

    if (addedUserNames.length > 0) {
        const systemMessageContent = `${currentUser.name} added ${addedUserNames.join(', ')} to ${isPrivateChannel ? 'the private channel ' : ''}#${channelName}.`;
        const systemMessage: Message = {
            id: `sys-add-${Date.now()}`,
            userId: 'system',
            content: systemMessageContent,
            timestamp: Date.now(),
            isSystemMessage: true,
        };

        if (mockMessages[channelId]) {
            mockMessages[channelId].push(systemMessage);
        } else {
            mockMessages[channelId] = [systemMessage];
        }

        // If the channel is active, update its messages in state
        if (activeConversation?.type === 'channel' && activeConversation.id === channelId) {
            setMessages(prevMessages => [...prevMessages, systemMessage]);
        }
        setTimeout(() => {
          toast({ title: "Members Added", description: `${addedUserNames.length} new member(s) added to #${channelName}.` });
        }, 0);
    }

  }, [toast, activeConversation, currentUser, allUsersWithCurrent]);

  const generateSummary = useCallback(async (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) {
      setTimeout(() => { // Defer toast
        toast({ title: "Error", description: "Channel not found.", variant: "destructive" });
      }, 0);
      return;
    }
    const channelMessages = fetchMockMessages(channelId).filter(msg => !msg.isSystemMessage); // Exclude system messages
    if (channelMessages.length === 0) {
      setTimeout(() => { // Defer toast
        toast({ title: "Summary", description: "No user messages in this channel to summarize." });
      }, 0);
      setCurrentSummary("This channel has no user messages yet.");
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
      setTimeout(() => { // Defer toast
        toast({ title: "Summary Generated", description: `Summary for #${channel.name} is ready.` });
      }, 0);
    } catch (error) {
      console.error("Error generating summary:", error);
      setTimeout(() => { // Defer toast
        toast({ title: "Summarization Error", description: "Could not generate summary.", variant: "destructive" });
      }, 0);
      setCurrentSummary("Failed to generate summary.");
    } finally {
      setIsLoadingSummary(false);
    }
  }, [channels, allUsersWithCurrent, toast]);

  const clearSummary = () => {
    setCurrentSummary(null);
  };

  const sendInvitation = useCallback(async (email: string): Promise<string | null> => {
    if (!currentUser) return null;
    if (currentUser.role !== 'admin') {
        setTimeout(() => toast({title: "Permission Denied", description: "Only admins can send invitations.", variant: "destructive"}), 0);
        return null;
    }
    // Check if user already exists by email in our mock data or pending invitations
    if (allUsersWithCurrent.some(user => user.email === email) || pendingInvitations.some(inv => inv.email === email)) {
      setTimeout(() => {
        toast({ title: "Invitation Failed", description: `${email} is already a member or has a pending invitation.`, variant: "destructive" });
      }, 0);
      return null;
    }
    const token = btoa(`${email}-${Date.now()}`); // Simple mock token
    const newInvitation: PendingInvitation = { email, token, timestamp: Date.now() };
    setPendingInvitations(prev => [...prev, newInvitation]);

    const joinUrl = `${window.location.origin}/join/${token}`;
    const emailSubject = `You're invited to join ${process.env.NEXT_PUBLIC_APP_NAME || "Opano"}!`;
    const emailHtmlBody = `
      <h1>Welcome to ${process.env.NEXT_PUBLIC_APP_NAME || "Opano"}!</h1>
      <p>You've been invited to join the ${process.env.NEXT_PUBLIC_APP_NAME || "Opano"} workspace.</p>
      <p>Please click the link below to complete your registration:</p>
      <p><a href="${joinUrl}" target="_blank">${joinUrl}</a></p>
      <p>If you did not expect this invitation, you can safely ignore this email.</p>
    `;
    setTimeout(() => {
      toast({
        title: "Sending Invitation...",
        description: `Attempting to send an invitation email to ${email}.`,
        duration: 5000, // Give some time for the flow to execute
      });
    },0);

    try {
      const emailResult = await sendInvitationEmail({
        to: email,
        subject: emailSubject,
        htmlBody: emailHtmlBody,
        joinUrl: joinUrl, // Pass joinUrl to the flow
      });

      if (emailResult.success) {
        setTimeout(() => {
          toast({
            title: "Invitation Sent!",
            description: `An invitation email has been sent to ${email}.`,
            duration: 7000,
          });
        },0);
      } else {
        setTimeout(() => {
          toast({
            title: "Email Sending Failed",
            description: `Could not send email to ${email}. ${emailResult.error || ''} For testing, use this link (also in console): ${joinUrl}`,
            variant: "destructive",
            duration: 15000, // Longer duration for error
          });
        }, 0);
        console.error(`[sendInvitation] Failed to send invitation email to ${email}. Error: ${emailResult.error}. Test Link: ${joinUrl}`);
      }
    } catch (flowError) {
      console.error("[sendInvitation] Error calling sendInvitationEmail flow:", flowError);
      setTimeout(() => { // Ensure toast is called outside render cycle
        toast({
            title: "Flow Error",
            description: `An error occurred while trying to send the email. For testing, use this link (also in console): ${joinUrl}`,
            variant: "destructive",
            duration: 15000
          });
      }, 0);
      console.error(`[sendInvitation] Flow error sending invitation email to ${email}. Test Link: ${joinUrl}`);
    }
    return token;
  }, [allUsersWithCurrent, pendingInvitations, toast, currentUser]);

  const verifyInviteToken = useCallback((token: string): PendingInvitation | null => {
    return pendingInvitations.find(inv => inv.token === token) || null;
  }, [pendingInvitations]);

  const acceptInvitation = useCallback((token: string, userDetails: { name: string; designation: string }): boolean => {
    const invitation = verifyInviteToken(token);
    if (!invitation) {
      setTimeout(() => { // Defer toast
        toast({ title: "Invalid Invitation", description: "This invitation link is not valid or has expired.", variant: "destructive" });
      },0);
      return false;
    }
    
    // Simulate user creation or next step. In a real Firebase app, this would typically
    // lead to a sign-up flow for the invitation.email.
    // For now, we'll just show a success message.
    setTimeout(() => { // Defer toast
      toast({ title: "Invitation Accepted", description: `User with email ${invitation.email} can now sign up.` });
    }, 0);
    setPendingInvitations(prevInvites => prevInvites.filter(inv => inv.token !== token)); // Remove used invitation
    return true;
  }, [verifyInviteToken, toast]);

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    if (!currentUser) return; // Ensure currentUser exists
    setMessages(prevMessages => {
      return prevMessages.map(msg => {
        if (msg.id === messageId) {
          const reactions = { ...(msg.reactions || {}) }; // Ensure reactions is an object
          const userList = reactions[emoji] || [];
          const userIndex = userList.indexOf(currentUser.id);

          if (userIndex > -1) { // User has reacted with this emoji, so remove reaction
            userList.splice(userIndex, 1);
            if (userList.length === 0) {
              delete reactions[emoji];
            } else {
              reactions[emoji] = userList;
            }
          } else { // User has not reacted with this emoji, so add reaction
            reactions[emoji] = [...userList, currentUser.id];
          }
          const updatedMsg = { ...msg, reactions };
          // Update mock data store
          if (activeConversation) updateMockMessage(activeConversation.id, messageId, { reactions: updatedMsg.reactions });
          return updatedMsg;
        }
        return msg;
      });
    });
  }, [currentUser, activeConversation]);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (!currentUser) return;
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId && msg.userId === currentUser.id) { // Only allow editing own messages
          const updatedMsg = { ...msg, content: newContent, isEdited: true, timestamp: Date.now() };
          // Update mock data store
          if (activeConversation) updateMockMessage(activeConversation.id, messageId, { content: newContent, isEdited: true, timestamp: updatedMsg.timestamp });
          return updatedMsg;
        }
        return msg;
      })
    );
  }, [currentUser, activeConversation]);

  const deleteMessage = useCallback((messageId: string) => {
    if (!currentUser) return;
    setMessages(prevMessages =>
      prevMessages.filter(msg => {
        if (msg.id === messageId && msg.userId === currentUser.id) { // Only allow deleting own messages
          // Update mock data store by removing the message
          if (activeConversation && mockMessages[activeConversation.id]) {
            mockMessages[activeConversation.id] = mockMessages[activeConversation.id].filter(m => m.id !== messageId);
          }
          return false; // Filter out
        }
        return true;
      })
    );
  }, [currentUser, activeConversation]);

  const toggleCurrentUserStatus = useCallback(() => {
    if (!currentUser) return;
    setCurrentUser(prevUser => {
        if (!prevUser) return null; // Should not happen if currentUser is already set
        const newStatus = !prevUser.isOnline;
        const updatedCurrentUser = { ...prevUser, isOnline: newStatus };

        // Simulate updating the user in the main list as well for consistency
        setAllUsersWithCurrent(prevAllUsers => prevAllUsers.map(u => u.id === updatedCurrentUser.id ? updatedCurrentUser : u));
        setUsers(prevOtherUsers => prevOtherUsers.map(u => u.id === updatedCurrentUser.id ? updatedCurrentUser : u));
        
        // Update mock-data (simulating persistence)
        const userIndex = initialMockUsers.findIndex(u => u.id === updatedCurrentUser.id);
        if (userIndex !== -1) {
            initialMockUsers[userIndex] = updatedCurrentUser;
        }

        setTimeout(() => { // Defer toast
            toast({
              title: "Status Updated",
              description: `You are now ${newStatus ? 'Online' : 'Away'}.`,
            });
        },0);

      return updatedCurrentUser;
    });
  }, [toast, currentUser]);

  const updateUserProfile = useCallback((profileData: UserProfileUpdateData) => {
    if (!currentUser) return;
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser: User = {
            ...prevUser,
            name: profileData.name || prevUser.name,
            designation: profileData.designation === undefined ? prevUser.designation : profileData.designation, // Handle empty string to clear
            email: profileData.email, // Assuming email can be updated (Firebase Auth makes this complex)
            phoneNumber: profileData.phoneNumber === undefined ? prevUser.phoneNumber : profileData.phoneNumber,
            avatarUrl: profileData.avatarDataUrl || prevUser.avatarUrl, // Use new dataUrl if provided
            linkedinProfileUrl: profileData.linkedinProfileUrl === undefined ? prevUser.linkedinProfileUrl : profileData.linkedinProfileUrl,
            pronouns: profileData.pronouns === undefined ? prevUser.pronouns : profileData.pronouns,
            role: profileData.role || prevUser.role,
        };
        
        // Update in our mock persistent store
        const userIndex = initialMockUsers.findIndex(u => u.id === updatedUser.id);
        if (userIndex !== -1) {
            initialMockUsers[userIndex] = updatedUser;
        } else {
            initialMockUsers.push(updatedUser); // Should not happen if currentUser exists
        }
        // Update state for immediate UI reflection
        setAllUsersWithCurrent(initialMockUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
        setUsers(initialMockUsers.filter(u => u.id !== updatedUser.id));


        setTimeout(() => { // Defer toast
            toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        },0);
      return updatedUser;
    });
  }, [toast, currentUser]);

  const signOutUser = useCallback(async () => {
    try {
      console.log("[AppContext] Attempting to sign out user.");
      await signOut(auth);
      // onAuthStateChanged will handle setting currentUser to null and redirection
      setTimeout(() => { // Defer toast
        toast({ title: "Signed Out", description: "You have been successfully signed out." });
      }, 0);
      console.log("[AppContext] User signed out successfully.");
    } catch (error) {
      console.error("[AppContext] Error signing out: ", error);
      setTimeout(() => { // Defer toast
        toast({ title: "Sign Out Error", description: "Could not sign you out. Please try again.", variant: "destructive" });
      }, 0);
    }
  }, [toast]);


  const deleteDraft = useCallback((draftId: string) => {
    setDrafts(prevDrafts => prevDrafts.filter(draft => draft.id !== draftId));
    // Update mock data store
    const draftIndex = initialMockDrafts.findIndex(d => d.id === draftId);
    if (draftIndex > -1) {
      initialMockDrafts.splice(draftIndex, 1);
    }
    setTimeout(() => { // Defer toast
      toast({ title: "Draft Deleted", description: "The draft has been removed." });
    }, 0);
  }, [toast]);


  const getConversationName = useCallback((conversationId: string, conversationType: 'channel' | 'dm'): string => {
    if (conversationType === 'channel') {
      return channels.find(c => c.id === conversationId)?.name || 'Unknown Channel';
    } else { // DM
      return allUsersWithCurrent.find(u => u.id === conversationId)?.name || 'Unknown User';
    }
  }, [channels, allUsersWithCurrent]);

  const replies = useMemo(() => {
    if (!currentUser) return [];
    const allMsgs: Message[] = Object.values(mockMessages).flat();
    return allMsgs.filter(msg =>
      msg.content.toLowerCase().includes(`@${currentUser.name.toLowerCase()}`) &&
      msg.userId !== currentUser.id && // Don't show self-mentions as replies here
      !msg.isSystemMessage
    ).sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }, [currentUser]); // Removed allMockMessages from deps as it's directly imported

  const activities: ActivityItem[] = useMemo(() => {
    if (!currentUser) return [];
    const myMessageIds = new Set<string>();
    // Get all messages from all conversations
    const allMsgs: Message[] = Object.values(mockMessages).flat();

    allMsgs.forEach(msg => {
      if (msg.userId === currentUser.id && !msg.isSystemMessage) {
        myMessageIds.add(msg.id);
      }
    });

    const activityItems: ActivityItem[] = [];
    allMsgs.forEach(msg => {
      if (myMessageIds.has(msg.id) && msg.reactions) { // Message was sent by current user and has reactions
        Object.entries(msg.reactions).forEach(([emoji, reactorIds]) => {
          reactorIds.forEach(reactorId => {
            if (reactorId !== currentUser.id) { // Reaction is from someone else
              const reactor = allUsersWithCurrent.find(u => u.id === reactorId);
              if (reactor) {
                // Find conversation context
                let convId = '';
                let convType: 'channel' | 'dm' = 'channel'; // Default assumption
                let convName = 'Unknown Conversation';

                for (const [key, messagesInConv] of Object.entries(mockMessages)) { // Iterate through allMockMessages
                    if (messagesInConv.some(m => m.id === msg.id)) {
                        convId = key;
                        const channel = channels.find(c => c.id === key);
                        if (channel) {
                            convType = 'channel';
                            convName = channel.name;
                        } else {
                            const user = allUsersWithCurrent.find(u => u.id === key);
                            if (user) {
                                convType = 'dm';
                                convName = user.name;
                            }
                        }
                        break; // Found the conversation
                    }
                }

                activityItems.push({
                  id: `${msg.id}-${reactorId}-${emoji}`, // Unique ID for activity
                  message: msg,
                  reactor,
                  emoji,
                  timestamp: msg.timestamp, // Could be reaction timestamp if available, using message for now
                  conversationId: convId,
                  conversationType: convType,
                  conversationName: convName,
                });
              }
            }
          });
        });
      }
    });
    return activityItems.sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }, [currentUser, allUsersWithCurrent, channels]); // Removed allMockMessages


  const findDocumentCategoryById = useCallback((categoryId: string) => {
    return documentCategories.find(cat => cat.id === categoryId);
  }, [documentCategories]);

  const addDocumentCategory = useCallback((name: string, description: string, iconName: DocumentCategory['iconName'] = 'FolderKanban') => {
    if (!currentUser) {
        setTimeout(() => toast({title: "Action failed", description: "You must be logged in.", variant: "destructive"}), 0);
        return;
    }
    if (currentUser.role !== 'admin') {
        setTimeout(() => toast({title: "Permission Denied", description: "Only admins can create document categories.", variant: "destructive"}), 0);
        return;
    }
    const newCategory: DocumentCategory = {
      id: `cat-${Date.now()}`,
      name,
      description,
      iconName: iconName, // Use provided icon or default
      documents: [],
    };
    setDocumentCategories(prev => {
        const updated = [...prev, newCategory];
        initialDocumentCategories.push(newCategory); // Update mock store
        return updated;
    });
    setTimeout(() => { // Defer toast
      toast({ title: "Category Added", description: `Category "${name}" has been created.` });
    }, 0);
  }, [toast, currentUser]);

  const addFileDocumentToCategory = useCallback((categoryId: string, file: File) => {
    if (!currentUser) {
        setTimeout(() => toast({title: "Action failed", description: "You must be logged in.", variant: "destructive"}), 0);
        return;
    }
    const newDocument: Document = {
      id: `doc-file-${Date.now()}`,
      name: file.name,
      type: file.type || 'unknown',
      docType: 'file',
      lastModified: format(new Date(), "MMM d, yyyy"),
      fileUrl: URL.createObjectURL(file), // Create a temporary URL for local files
      fileObject: file, // Store the actual file object
    };
    setDocumentCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
            const updatedCat = { ...cat, documents: [...cat.documents, newDocument] };
            const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
            if (catIndex > -1) initialDocumentCategories[catIndex] = updatedCat;
            return updatedCat;
        }
        return cat;
    }));
    
    const category = findDocumentCategoryById(categoryId);
    const categoryName = category ? category.name : 'Unknown Category';
    setTimeout(() => { // Defer toast
        toast({
            title: "Document Added",
            description: `${currentUser.name} added "${newDocument.name}" to the "${categoryName}" category.`,
            action: (
                <ToastAction altText="View Category" onClick={() => router.push(`/documents/${categoryId}`)}>
                    View Category
                </ToastAction>
            ),
        });
    }, 0);

    // System message to #general
    const generalChannelId = channels.find(c => c.name.toLowerCase() === 'general')?.id || (channels.length > 0 ? channels[0].id : null); // Fallback to first channel if general not found
    if (generalChannelId) {
        const systemMessageContent = `${currentUser.name} added a new document: "${newDocument.name}" to the "${categoryName}" category.`;
        const systemMessage: Message = {
            id: `sys-doc-add-${Date.now()}`,
            userId: 'system',
            content: systemMessageContent,
            timestamp: Date.now(),
            isSystemMessage: true,
        };
        if (mockMessages[generalChannelId]) { 
            mockMessages[generalChannelId].push(systemMessage);
        } else {
            mockMessages[generalChannelId] = [systemMessage];
        }
        if (activeConversation?.type === 'channel' && activeConversation.id === generalChannelId) {
            setMessages(prevMessages => [...prevMessages, systemMessage]);
        }
    }

  }, [toast, findDocumentCategoryById, currentUser, router, channels, activeConversation]);

  const addTextDocumentToCategory = useCallback((categoryId: string, docName: string, textContent: string) => {
    if (!currentUser) {
        setTimeout(() => toast({title: "Action failed", description: "You must be logged in.", variant: "destructive"}), 0);
        return;
    }
    const newDocument: Document = {
      id: `doc-text-${Date.now()}`,
      name: docName.endsWith('.txt') ? docName : `${docName}.txt`, // Ensure .txt for consistency if not provided
      type: 'text/plain',
      docType: 'text',
      lastModified: format(new Date(), "MMM d, yyyy"),
      textContent: textContent,
    };
    setDocumentCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
            const updatedCat = { ...cat, documents: [...cat.documents, newDocument] };
            const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
            if (catIndex > -1) initialDocumentCategories[catIndex] = updatedCat;
            return updatedCat;
        }
        return cat;
    }));

    const category = findDocumentCategoryById(categoryId);
    const categoryName = category ? category.name : 'Unknown Category';
    setTimeout(() => { // Defer toast
        toast({
            title: "Document Created",
            description: `${currentUser.name} created "${newDocument.name}" in the "${categoryName}" category.`,
            action: (
                <ToastAction altText="View Category" onClick={() => router.push(`/documents/${categoryId}`)}>
                    View Category
                </ToastAction>
            ),
        });
    },0);

    const generalChannelId = channels.find(c => c.name.toLowerCase() === 'general')?.id || (channels.length > 0 ? channels[0].id : null);
    if (generalChannelId) {
        const systemMessageContent = `${currentUser.name} created a new text document: "${newDocument.name}" in the "${categoryName}" category.`;
        const systemMessage: Message = {
            id: `sys-doc-create-${Date.now()}`,
            userId: 'system',
            content: systemMessageContent,
            timestamp: Date.now(),
            isSystemMessage: true,
        };
         if (mockMessages[generalChannelId]) { 
            mockMessages[generalChannelId].push(systemMessage);
        } else {
            mockMessages[generalChannelId] = [systemMessage];
        }
        if (activeConversation?.type === 'channel' && activeConversation.id === generalChannelId) {
            setMessages(prevMessages => [...prevMessages, systemMessage]);
        }
    }

  }, [toast, findDocumentCategoryById, currentUser, router, channels, activeConversation]);

  const addLinkedDocumentToCategory = useCallback((categoryId: string, docName: string, docUrl: string) => {
    if (!currentUser) {
        setTimeout(() => toast({title: "Action failed", description: "You must be logged in.", variant: "destructive"}), 0);
        return;
    }
    const newDocument: Document = {
      id: `doc-url-${Date.now()}`,
      name: docName,
      type: 'external/link',
      docType: 'url',
      lastModified: format(new Date(), "MMM d, yyyy"),
      fileUrl: docUrl,
    };
    setDocumentCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
            const updatedCat = { ...cat, documents: [...cat.documents, newDocument] };
            const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
            if (catIndex > -1) initialDocumentCategories[catIndex] = updatedCat;
            return updatedCat;
        }
        return cat;
    }));

    const category = findDocumentCategoryById(categoryId);
    const categoryName = category ? category.name : 'Unknown Category';
    setTimeout(() => { // Defer toast
        toast({
            title: "External Document Linked",
            description: `${currentUser.name} linked "${newDocument.name}" in the "${categoryName}" category.`,
            action: (
                <ToastAction altText="View Category" onClick={() => router.push(`/documents/${categoryId}`)}>
                    View Category
                </ToastAction>
            ),
        });
    },0);

    const generalChannelId = channels.find(c => c.name.toLowerCase() === 'general')?.id || (channels.length > 0 ? channels[0].id : null);
    if (generalChannelId) {
        const systemMessageContent = `${currentUser.name} linked an external document: "${newDocument.name}" in the "${categoryName}" category.`;
        const systemMessage: Message = {
            id: `sys-doc-link-${Date.now()}`,
            userId: 'system',
            content: systemMessageContent,
            timestamp: Date.now(),
            isSystemMessage: true,
        };
        if (mockMessages[generalChannelId]) { 
            mockMessages[generalChannelId].push(systemMessage);
        } else {
            mockMessages[generalChannelId] = [systemMessage];
        }
        if (activeConversation?.type === 'channel' && activeConversation.id === generalChannelId) {
            setMessages(prevMessages => [...prevMessages, systemMessage]);
        }
    }

  }, [toast, findDocumentCategoryById, currentUser, router, channels, activeConversation]);

  const deleteDocumentFromCategory = useCallback((categoryId: string, docId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
        setTimeout(() => toast({title: "Permission Denied", description: "Only admins can delete documents.", variant: "destructive"}), 0);
        return;
    }
    setDocumentCategories(prev => prev.map(cat => {
        if (cat.id === categoryId) {
            const updatedDocs = cat.documents.filter(doc => doc.id !== docId);
            const updatedCat = { ...cat, documents: updatedDocs };
            // Update mock store
            const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
            if (catIndex > -1) initialDocumentCategories[catIndex] = updatedCat;
            return updatedCat;
        }
        return cat;
    }));
    setTimeout(() => { // Defer toast
        toast({ title: "Document Deleted", description: "The document has been removed."});
    },0);
  }, [toast, currentUser]);

  const searchAllDocuments = useCallback((query: string): Array<{ doc: Document, category: DocumentCategory }> => {
    const trimmedQuery = query.trim().toLowerCase();
    const results: Array<{ doc: Document, category: DocumentCategory }> = [];

    if (trimmedQuery === '') {
        // If query is empty, show first 2 docs from first 5 categories
        documentCategories.slice(0,5).forEach(category => {
            category.documents.slice(0, 2).forEach(doc => {
                results.push({ doc, category });
            });
        });
    } else {
        documentCategories.forEach(category => {
          category.documents.forEach(doc => {
            if (doc.name.toLowerCase().includes(trimmedQuery)) {
              results.push({ doc, category });
            }
          });
        });
    }
    return results.slice(0, 10); // Limit results to 10 for performance
  }, [documentCategories]);

  const startCall = (conversation: ActiveConversation | null) => {
    if (!currentUser || !conversation) return;
    setCallingWith(conversation);
    setIsCallActive(true);
    setTimeout(() => { // Defer toast
      toast({ title: "Starting Call", description: `Calling ${conversation.name}... (Simulated)` });
    }, 0);

    // Add system message for call start
    const callMessageContent = `${currentUser.name} started a call.`;
    const systemMessage: Message = {
      id: `sys-call-start-${Date.now()}`,
      userId: 'system',
      content: callMessageContent,
      timestamp: Date.now(),
      isSystemMessage: true,
    };

    if (mockMessages[conversation.id]) { // Ensure the conversation entry exists
      mockMessages[conversation.id].push(systemMessage);
    } else {
      mockMessages[conversation.id] = [systemMessage];
    }

    if (activeConversation?.id === conversation.id) {
      setMessages(prevMessages => [...prevMessages, systemMessage]);
    }
  };

  const endCall = () => {
    if (callingWith) {
        setTimeout(() => { // Defer toast
            toast({ title: "Call Ended", description: `Call with ${callingWith.name} ended. (Simulated)` });
        }, 0);

      // Add system message for call end
      const callMessageContent = `Call with ${callingWith.name} ended.`;
      const systemMessage: Message = {
        id: `sys-call-end-${Date.now()}`,
        userId: 'system',
        content: callMessageContent,
        timestamp: Date.now(),
        isSystemMessage: true,
      };

      if (mockMessages[callingWith.id]) { // Ensure the conversation entry exists
        mockMessages[callingWith.id].push(systemMessage);
      } else {
        mockMessages[callingWith.id] = [systemMessage];
      }

      if (activeConversation?.id === callingWith.id) {
        setMessages(prevMessages => [...prevMessages, systemMessage]);
      }
    }
    setIsCallActive(false);
    setCallingWith(null);
  };

  const handleAddLeaveRequest = useCallback(async (newRequestData: Omit<LeaveRequest, 'id' | 'userId' | 'requestDate' | 'status'>) => {
    if (!currentUser) {
        setTimeout(() => toast({ title: "Error", description: "You must be logged in to request leave.", variant: "destructive" }), 0);
        return;
    }
    const newLeaveRequest: LeaveRequest = {
      ...newRequestData,
      id: `leave-${Date.now()}`,
      userId: currentUser.id,
      requestDate: new Date(),
      status: 'pending',
    };
    setLeaveRequests(prev => [...prev, newLeaveRequest].sort((a,b) => b.requestDate.getTime() - a.requestDate.getTime()));

    setTimeout(() => { // Defer toast
        toast({
            title: "Leave Request Submitted",
            description: `Your leave request for ${currentUser.name} has been submitted for approval.`,
        });
    }, 0);

    // Send email to admin
    const configuredAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    let adminEmail = configuredAdminEmail || "hassyku786@gmail.com"; // Default admin email

    if (!configuredAdminEmail) {
      console.log("[AppContext] NEXT_PUBLIC_ADMIN_EMAIL not set in .env.local, defaulting admin notifications for leave requests to hassyku786@gmail.com");
    }

    const durationDays = differenceInDays(newLeaveRequest.endDate, newLeaveRequest.startDate) + 1;
    const subject = `New Leave Request from ${currentUser.name}`;
    const htmlBody = `
      <p>Hello Admin,</p>
      <p>A new leave request has been submitted by <strong>${currentUser.name}</strong> (ID: ${currentUser.id}).</p>
      <p><strong>Details:</strong></p>
      <ul>
        <li><strong>Start Date:</strong> ${format(newLeaveRequest.startDate, 'PPP')}</li>
        <li><strong>End Date:</strong> ${format(newLeaveRequest.endDate, 'PPP')}</li>
        <li><strong>Duration:</strong> ${durationDays} day(s)</li>
        <li><strong>Reason:</strong> ${newLeaveRequest.reason}</li>
      </ul>
      <p>Please review this request in the Opano system.</p>
    `;
    try {
      console.log(`[AppContext] Attempting to send leave notification to admin: ${adminEmail}`);
      const emailResult = await sendInvitationEmail({
        to: adminEmail,
        subject: subject,
        htmlBody: htmlBody,
        joinUrl: `${window.location.origin}/attendance` // Link to attendance page for admin review
      });
      if (emailResult.success) {
        console.log(`[AppContext] Leave notification email sent successfully to ${adminEmail}. Message ID: ${emailResult.messageId}`);
      } else {
        console.error(`[AppContext] Failed to send leave notification email to ${adminEmail}. Error: ${emailResult.error}`);
        setTimeout(() => { // Defer toast
          toast({
            title: "Admin Notification Failed",
            description: `Could not notify admin about the leave request. Error: ${emailResult.error}`,
            variant: "destructive",
            duration: 7000
          });
        }, 0);
      }
    } catch (error) {
      console.error("[AppContext] Error calling sendInvitationEmail flow for admin notification:", error);
       setTimeout(() => { // Defer toast
          toast({
            title: "Admin Notification Error",
            description: "An unexpected error occurred while trying to notify the admin.",
            variant: "destructive",
            duration: 7000
          });
        }, 0);
    }

    // Send in-app message to admin
    const adminUser = allUsersWithCurrent.find(u => u.role === 'admin');
    if (adminUser && adminUser.id !== currentUser.id) {
      const adminMessageContent = `${currentUser.name} has submitted a leave request: ${durationDays} day(s) from ${format(newLeaveRequest.startDate, 'MMM d')} to ${format(newLeaveRequest.endDate, 'MMM d')}. Reason: ${newLeaveRequest.reason}`;
      const systemMessageForAdmin: Message = {
        id: `sys-leave-req-${Date.now()}`,
        userId: 'system',
        content: adminMessageContent,
        timestamp: Date.now(),
        isSystemMessage: true,
      };
      if (mockMessages[adminUser.id]) {
        mockMessages[adminUser.id].push(systemMessageForAdmin);
      } else {
        mockMessages[adminUser.id] = [systemMessageForAdmin];
      }
      // If admin's DM is active, update UI (optional, less critical for this notification)
      // if (activeConversation?.id === adminUser.id && activeConversation.type === 'dm') {
      //   setMessages(prev => [...prev, systemMessageForAdmin]);
      // }
      console.log(`[AppContext] In-app leave notification sent to admin DM: ${adminUser.name}`);
    }


  }, [currentUser, toast, allUsersWithCurrent, activeConversation, channels]);

  const openUserProfilePanel = (userToView: User) => {
    setViewingUserProfile(userToView);
    setIsUserProfilePanelOpen(true);
  };


  return (
    <AppContext.Provider value={{
      currentUser,
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
      signOutUser,
      currentView,
      setActiveSpecialView,
      drafts,
      deleteDraft,
      replies,
      activities,
      getConversationName,
      replyingToMessage,
      setReplyingToMessage,
      documentCategories,
      addDocumentCategory,
      addFileDocumentToCategory,
      addTextDocumentToCategory,
      addLinkedDocumentToCategory,
      deleteDocumentFromCategory,
      findDocumentCategoryById,
      searchAllDocuments,
      isCallActive,
      callingWith,
      startCall,
      endCall,
      isLoadingAuth,
      isUserProfilePanelOpen,
      viewingUserProfile,
      openUserProfilePanel,
      closeUserProfilePanel,
      leaveRequests,
      handleAddLeaveRequest,
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

    
