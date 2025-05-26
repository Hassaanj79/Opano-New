
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User, Channel, Message, ActiveConversation, PendingInvitation, Draft, ActivityItem, CurrentView, DocumentCategory, Document, LeaveRequest, UserRole } from '@/types';
import { auth } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import {
    mockUsers as initialMockUsers,
    mockChannels as initialMockChannels,
    getMessagesForConversation as fetchMockMessages,
    updateMockMessage,
    mockMessages as allMockMessages,
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
  role?: UserRole; // Role might not be editable by user directly
};

interface AppContextType {
  currentUser: User | null;
  users: User[];
  allUsersWithCurrent: User[];
  channels: Channel[];
  activeConversation: ActiveConversation;
  setActiveConversation: (type: 'channel' | 'dm', id: string) => void;
  messages: Message[];
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
  const [users, setUsers] = useState<User[]>(initialMockUsers.filter(u => u.id !== currentUser?.id));
  const [allUsersWithCurrent, setAllUsersWithCurrent] = useState<User[]>(initialMockUsers);
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
    
    setTimeout(() => {
        toast({
            title: "Leave Request Submitted",
            description: `Your leave request for ${currentUser.name} has been submitted for approval.`,
        });
    }, 0);

    const configuredAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    const adminEmail = configuredAdminEmail || "hassyku786@gmail.com";
    
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
        joinUrl: `${window.location.origin}/attendance` 
      });
      if (emailResult.success) {
        console.log(`[AppContext] Leave notification email sent successfully to ${adminEmail}. Message ID: ${emailResult.messageId}`);
      } else {
        console.error(`[AppContext] Failed to send leave notification email to ${adminEmail}. Error: ${emailResult.error}`);
        setTimeout(() => {
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
       setTimeout(() => {
          toast({
            title: "Admin Notification Error",
            description: "An unexpected error occurred while trying to notify the admin.",
            variant: "destructive",
            duration: 7000
          });
        }, 0);
    }

  }, [currentUser, toast]);

  const openUserProfilePanel = (userToView: User) => {
    setViewingUserProfile(userToView);
    setIsUserProfilePanelOpen(true);
    if (currentView !== 'chat') {
      // setCurrentViewState('chat'); 
    }
  };

  const closeUserProfilePanel = () => {
    setIsUserProfilePanelOpen(false);
    setViewingUserProfile(null);
  };

  useEffect(() => {
    console.log("[AppContext] Subscribing to Firebase onAuthStateChanged.");
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      console.log("[AppContext] onAuthStateChanged triggered. Firebase user:", firebaseUser?.uid || 'null');
      if (firebaseUser) {
        const existingMockUser = initialMockUsers.find(u => u.email === firebaseUser.email);
        const appUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Anonymous User',
          email: firebaseUser.email || 'no-email@example.com',
          avatarUrl: firebaseUser.photoURL || `https://placehold.co/40x40.png?text=${(firebaseUser.displayName || firebaseUser.email || 'AU').substring(0,2).toUpperCase()}`,
          isOnline: true,
          designation: existingMockUser?.designation || '',
          phoneNumber: existingMockUser?.phoneNumber || '',
          linkedinProfileUrl: existingMockUser?.linkedinProfileUrl || '',
          pronouns: existingMockUser?.pronouns || '',
          role: existingMockUser?.role || 'member', // Assign role from mock or default to member
        };
        setCurrentUser(appUser);
        setAllUsersWithCurrent(prevAllUsers => {
            const otherMockUsers = initialMockUsers.filter(u => u.email !== appUser.email); 
            return [appUser, ...otherMockUsers];
        });
        setUsers(initialMockUsers.filter(u => u.email !== appUser.email));
      } else {
        setCurrentUser(null);
        setActiveConversationState(null);
        setCurrentViewState('chat');
        setAllUsersWithCurrent(initialMockUsers); 
        setUsers(initialMockUsers);
        closeUserProfilePanel();
      }
      setIsLoadingAuth(false);
      console.log("[AppContext] isLoadingAuth set to false.");
    });
    return () => {
      console.log("[AppContext] Unsubscribing from Firebase onAuthStateChanged.");
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isLoadingAuth) {
      console.log("[AppContext] Redirection check. isLoadingAuth: false, currentUser:", currentUser?.id || 'null', "pathname:", pathname);
      const isAuthPage = pathname.startsWith('/auth/') || pathname.startsWith('/join/');
      if (!currentUser && !isAuthPage) {
        console.log("[AppContext] Redirecting to /auth/join");
        router.replace('/auth/join');
      } else if (currentUser && isAuthPage) {
        console.log("[AppContext] Redirecting to /");
        router.replace('/');
      }
    }
  }, [isLoadingAuth, currentUser, pathname, router]);


  useEffect(() => {
    if (currentUser) {
      // setUsers(initialMockUsers.filter(u => u.id !== currentUser.id && u.email !== currentUser.email));
      const otherMockUsers = initialMockUsers.filter(u => u.id !== currentUser.id && u.email !== currentUser.email);
      setAllUsersWithCurrent([currentUser, ...otherMockUsers]);
       setUsers(otherMockUsers); // Users should not include current user
    } else {
      setUsers(initialMockUsers);
      setAllUsersWithCurrent(initialMockUsers);
    }
  }, [currentUser]);


  const setActiveConversation = useCallback((type: 'channel' | 'dm', id: string) => {
    setCurrentSummary(null);
    closeUserProfilePanel();
    if (type === 'channel') {
      const channel = channels.find(c => c.id === id);
      if (channel) {
        if (channel.isPrivate && (!currentUser || !channel.memberIds.includes(currentUser.id))) {
          setTimeout(() => {
            toast({
              title: "Access Denied",
              description: `You are not a member of this private channel.`,
              variant: "destructive",
            });
          }, 0);
          return;
        }
        setActiveConversationState({ type, id, name: channel.name, channel });
      }
    } else {
      const user = allUsersWithCurrent.find(u => u.id === id);
      if (user) {
        setActiveConversationState({ type, id, name: user.name, recipient: user });
      }
    }
    setCurrentViewState('chat');
    setReplyingToMessage(null);
  }, [channels, allUsersWithCurrent, currentUser, toast]);

  const setActiveSpecialView = useCallback((view: 'replies' | 'activity' | 'drafts') => {
    setCurrentViewState(view);
    setActiveConversationState(null);
    setReplyingToMessage(null);
    closeUserProfilePanel();
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

      const fileUrl = (fileType === 'audio' || fileType === 'image') ? URL.createObjectURL(file) : 'https://placehold.co/200x150.png';

      messageFile = {
        name: file.name,
        url: fileUrl,
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
    if (activeConversation && allMockMessages[activeConversation.id]) {
        allMockMessages[activeConversation.id] = [...allMockMessages[activeConversation.id], newMessage];
    } else if (activeConversation) {
        allMockMessages[activeConversation.id] = [newMessage];
    }
    setReplyingToMessage(null);
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
      memberIds: Array.from(new Set([currentUser.id, ...memberIds])),
      isPrivate,
    };
    setChannels(prevChannels => {
      const updatedChannels = [...prevChannels, newChannel];
      const channelIndex = initialMockChannels.findIndex(ch => ch.id === newChannel.id);
      if (channelIndex === -1) {
        initialMockChannels.push(newChannel);
      } else {
        initialMockChannels[channelIndex] = newChannel;
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
    allMockMessages[newChannel.id] = [creationSystemMessage];

    const addedMembersOtherThanCreator = memberIds.filter(id => id !== currentUser.id);
    if (addedMembersOtherThanCreator.length > 0) {
        const addedUserNames = addedMembersOtherThanCreator
            .map(id => allUsersWithCurrent.find(user => user.id === id)?.name)
            .filter((name): name is string => !!name);

        if (addedUserNames.length > 0) {
            const addedMembersMessageContent = `${creatorName} added ${addedUserNames.join(', ')} to the channel.`;
            const addedMembersSystemMessage: Message = {
                id: `sys-add-init-${Date.now()}`,
                userId: 'system',
                content: addedMembersMessageContent,
                timestamp: Date.now() + 1,
                isSystemMessage: true,
            };
            allMockMessages[newChannel.id].push(addedMembersSystemMessage);
        }
    }

    setActiveConversation('channel', newChannel.id);
    setTimeout(() => {
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

          const mockChannelIndex = initialMockChannels.findIndex(ch => ch.id === channelId);
          if (mockChannelIndex !== -1) {
            initialMockChannels[mockChannelIndex] = updatedChannel;
          }

          if (activeConversation?.type === 'channel' && activeConversation.id === channelId) {
            setActiveConversationState(prev => prev ? {...prev, channel: updatedChannel} : null);
          }
          return updatedChannel;
        }
        return channel;
      });
    });

    const addedUserNames = userIdsToAdd
        .map(id => allUsersWithCurrent.find(user => user.id === id)?.name)
        .filter((name): name is string => !!name);

    if (addedUserNames.length > 0) {
        const systemMessageContent = `${currentUser.name} added ${addedUserNames.join(', ')} to ${isPrivateChannel ? 'the private channel ' : ''}#${channelName}.`;
        const systemMessage: Message = {
            id: `sys-add-${Date.now()}`,
            userId: 'system',
            content: systemMessageContent,
            timestamp: Date.now(),
            isSystemMessage: true,
        };

        if (allMockMessages[channelId]) {
            allMockMessages[channelId].push(systemMessage);
        } else {
            allMockMessages[channelId] = [systemMessage];
        }

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
      setTimeout(() => {
        toast({ title: "Error", description: "Channel not found.", variant: "destructive" });
      }, 0);
      return;
    }
    const channelMessages = fetchMockMessages(channelId).filter(msg => !msg.isSystemMessage);
    if (channelMessages.length === 0) {
      setTimeout(() => {
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
      setTimeout(() => {
        toast({ title: "Summary Generated", description: `Summary for #${channel.name} is ready.` });
      }, 0);
    } catch (error) {
      console.error("Error generating summary:", error);
      setTimeout(() => {
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
    if (allUsersWithCurrent.some(user => user.email === email) || pendingInvitations.some(inv => inv.email === email)) {
      setTimeout(() => {
        toast({ title: "Invitation Failed", description: `${email} is already a member or has a pending invitation.`, variant: "destructive" });
      }, 0);
      return null;
    }
    const token = btoa(`${email}-${Date.now()}`);
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
        duration: 5000,
      });
    },0);

    try {
      const emailResult = await sendInvitationEmail({
        to: email,
        subject: emailSubject,
        htmlBody: emailHtmlBody,
        joinUrl: joinUrl,
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
            duration: 15000,
          });
        }, 0);
        console.error(`[sendInvitation] Failed to send invitation email to ${email}. Error: ${emailResult.error}. Test Link: ${joinUrl}`);
      }
    } catch (flowError) {
      console.error("[sendInvitation] Error calling sendInvitationEmail flow:", flowError);
      setTimeout(() => {
        toast({
            title: "Flow Error",
            description: `An error occurred while trying to send the email. For testing, use this link (also in console): ${joinUrl}`,
            variant: "destructive",
            duration: 15000,
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
      setTimeout(() => {
        toast({ title: "Invalid Invitation", description: "This invitation link is not valid or has expired.", variant: "destructive" });
      },0);
      return false;
    }
    // This part would ideally trigger Firebase user creation.
    // For mock:
    const newUser: User = {
      id: `u${Date.now()}`,
      name: userDetails.name,
      email: invitation.email,
      designation: userDetails.designation,
      isOnline: true,
      avatarUrl: `https://placehold.co/40x40.png?text=${userDetails.name.substring(0,2).toUpperCase()}`,
      role: 'member' // New users default to 'member'
    };
    setUsers(prev => [...prev, newUser]);
    setAllUsersWithCurrent(prev => [...prev, newUser]);
    initialMockUsers.push(newUser); 
    setCurrentUser(newUser); // Automatically log in the new user (simulation)

    setTimeout(() => {
      toast({ title: "Welcome to Opano!", description: `Account for ${invitation.email} created.` });
    }, 0);
    setPendingInvitations(prevInvites => prevInvites.filter(inv => inv.token !== token));
    return true;
  }, [verifyInviteToken, toast]);

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
  }, [currentUser, activeConversation]);

  const editMessage = useCallback((messageId: string, newContent: string) => {
    if (!currentUser) return;
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
  }, [currentUser, activeConversation]);

  const deleteMessage = useCallback((messageId: string) => {
    if (!currentUser) return;
    setMessages(prevMessages =>
      prevMessages.filter(msg => {
        if (msg.id === messageId && msg.userId === currentUser.id) {
          if (activeConversation && allMockMessages[activeConversation.id]) {
            allMockMessages[activeConversation.id] = allMockMessages[activeConversation.id].filter(m => m.id !== messageId);
          }
          return false;
        }
        return true;
      })
    );
  }, [currentUser, activeConversation]);

  const toggleCurrentUserStatus = useCallback(() => {
    if (!currentUser) return;
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        const newStatus = !prevUser.isOnline;
        const updatedCurrentUser = { ...prevUser, isOnline: newStatus };
        
        setTimeout(() => {
            toast({
              title: "Status Updated",
              description: `You are now ${newStatus ? 'Online' : 'Away'}. (Local simulation)`,
            });
        },0);

      return updatedCurrentUser;
    });
  }, [toast, currentUser]);

  const updateUserProfile = useCallback((profileData: UserProfileUpdateData) => {
    if (!currentUser) return;
    setCurrentUser(prevUser => {
        if (!prevUser) return null;
        const updatedUser: User = { // Ensure type User is used
            ...prevUser,
            name: profileData.name || prevUser.name,
            designation: profileData.designation || prevUser.designation,
            email: profileData.email, 
            phoneNumber: profileData.phoneNumber || prevUser.phoneNumber,
            avatarUrl: profileData.avatarDataUrl || prevUser.avatarUrl,
            linkedinProfileUrl: profileData.linkedinProfileUrl || prevUser.linkedinProfileUrl,
            pronouns: profileData.pronouns || prevUser.pronouns,
            role: profileData.role || prevUser.role, // Persist role, typically not user-editable
        };
        
        setAllUsersWithCurrent(prevAll => prevAll.map(u => u.id === updatedUser.id ? updatedUser : u));
        setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));

        const mockUserIndex = initialMockUsers.findIndex(u => u.id === updatedUser.id || u.email === updatedUser.email);
        if (mockUserIndex !== -1) {
            initialMockUsers[mockUserIndex] = {
                ...initialMockUsers[mockUserIndex],
                ...updatedUser
            };
        }
        
        setTimeout(() => {
            toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
        },0);
      return updatedUser;
    });
  }, [toast, currentUser]);

  const signOutUser = useCallback(async () => {
    try {
      console.log("[AppContext] Attempting to sign out user.");
      await signOut(auth);
      setTimeout(() => {
        toast({ title: "Signed Out", description: "You have been successfully signed out." });
      }, 0);
      console.log("[AppContext] User signed out successfully.");
    } catch (error) {
      console.error("[AppContext] Error signing out: ", error);
      setTimeout(() => {
        toast({ title: "Sign Out Error", description: "Could not sign you out. Please try again.", variant: "destructive" });
      }, 0);
    }
  }, [toast]);


  const deleteDraft = useCallback((draftId: string) => {
    setDrafts(prevDrafts => prevDrafts.filter(draft => draft.id !== draftId));
    const draftIndex = initialMockDrafts.findIndex(d => d.id === draftId);
    if (draftIndex > -1) {
      initialMockDrafts.splice(draftIndex, 1);
    }
    setTimeout(() => {
      toast({ title: "Draft Deleted", description: "The draft has been removed." });
    }, 0);
  }, [toast]);

  useEffect(() => {
    if (!isLoadingAuth && currentUser && !pathname.startsWith('/auth/') && !pathname.startsWith('/join/')) {
      if (channels.length > 0 && !activeConversation && currentView === 'chat') {
        const selfDmUser = allUsersWithCurrent.find(u => u.id === currentUser.id);
        if (selfDmUser) {
          console.log("[AppContext] Setting initial active conversation to self DM.");
          setActiveConversation('dm', currentUser.id);
        } else if (channels[0]) {
          console.log("[AppContext] Setting initial active conversation to first channel:", channels[0].name);
          setActiveConversation('channel', channels[0].id);
        }
      }
    }
  }, [isLoadingAuth, currentUser, channels, activeConversation, setActiveConversation, currentView, allUsersWithCurrent, pathname]);


  const getConversationName = useCallback((conversationId: string, conversationType: 'channel' | 'dm'): string => {
    if (conversationType === 'channel') {
      return channels.find(c => c.id === conversationId)?.name || 'Unknown Channel';
    } else {
      return allUsersWithCurrent.find(u => u.id === conversationId)?.name || 'Unknown User';
    }
  }, [channels, allUsersWithCurrent]);

  const replies = useMemo(() => {
    if (!currentUser) return [];
    const allMsgs: Message[] = Object.values(allMockMessages).flat();
    return allMsgs.filter(msg =>
      msg.content.toLowerCase().includes(`@${currentUser.name.toLowerCase()}`) &&
      msg.userId !== currentUser.id &&
      !msg.isSystemMessage
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [currentUser]);

  const activities: ActivityItem[] = useMemo(() => {
    if (!currentUser) return [];
    const myMessageIds = new Set<string>();
    const allMsgs: Message[] = Object.values(allMockMessages).flat();
    allMsgs.forEach(msg => {
      if (msg.userId === currentUser.id) {
        myMessageIds.add(msg.id);
      }
    });

    const activityItems: ActivityItem[] = [];
    allMsgs.forEach(msg => {
      if (myMessageIds.has(msg.id) && msg.reactions) {
        Object.entries(msg.reactions).forEach(([emoji, reactorIds]) => {
          reactorIds.forEach(reactorId => {
            if (reactorId !== currentUser.id) {
              const reactor = allUsersWithCurrent.find(u => u.id === reactorId);
              if (reactor) {
                let convId = '';
                let convType: 'channel' | 'dm' = 'channel';
                let convName = 'Unknown Conversation';

                for (const [key, messagesInConv] of Object.entries(allMockMessages)) {
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
                        break;
                    }
                }

                activityItems.push({
                  id: `${msg.id}-${reactorId}-${emoji}`,
                  message: msg,
                  reactor,
                  emoji,
                  timestamp: msg.timestamp,
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
    return activityItems.sort((a, b) => b.timestamp - a.timestamp);
  }, [currentUser, allUsersWithCurrent, channels]);


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
      iconName: iconName,
      documents: [],
    };
    setDocumentCategories(prev => [...prev, newCategory]);
    initialDocumentCategories.push(newCategory);
    setTimeout(() => {
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
      fileUrl: URL.createObjectURL(file),
      fileObject: file,
    };
    setDocumentCategories(prev => prev.map(cat =>
        cat.id === categoryId ? { ...cat, documents: [...cat.documents, newDocument] } : cat
    ));
    const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
    if (catIndex > -1) initialDocumentCategories[catIndex].documents.push(newDocument);

    const category = findDocumentCategoryById(categoryId);
    const categoryName = category ? category.name : 'Unknown Category';
    setTimeout(() => {
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

    const generalChannelId = 'c1';
    const systemMessageContent = `${currentUser.name} added a new document: "${newDocument.name}" to the "${categoryName}" category.`;
    const systemMessage: Message = {
        id: `sys-doc-add-${Date.now()}`,
        userId: 'system',
        content: systemMessageContent,
        timestamp: Date.now(),
        isSystemMessage: true,
    };
    if (allMockMessages[generalChannelId]) {
        allMockMessages[generalChannelId].push(systemMessage);
    } else {
        allMockMessages[generalChannelId] = [systemMessage];
    }
    if (activeConversation?.type === 'channel' && activeConversation.id === generalChannelId) {
        setMessages(prevMessages => [...prevMessages, systemMessage]);
    }

  }, [toast, findDocumentCategoryById, currentUser, router, activeConversation]);

  const addTextDocumentToCategory = useCallback((categoryId: string, docName: string, textContent: string) => {
    if (!currentUser) {
        setTimeout(() => toast({title: "Action failed", description: "You must be logged in.", variant: "destructive"}), 0);
        return;
    }
    const newDocument: Document = {
      id: `doc-text-${Date.now()}`,
      name: docName.endsWith('.txt') ? docName : `${docName}.txt`,
      type: 'text/plain',
      docType: 'text',
      lastModified: format(new Date(), "MMM d, yyyy"),
      textContent: textContent,
    };
    setDocumentCategories(prev => prev.map(cat =>
        cat.id === categoryId ? { ...cat, documents: [...cat.documents, newDocument] } : cat
    ));
    const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
    if (catIndex > -1) initialDocumentCategories[catIndex].documents.push(newDocument);

    const category = findDocumentCategoryById(categoryId);
    const categoryName = category ? category.name : 'Unknown Category';
    setTimeout(() => {
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

    const generalChannelId = 'c1';
    const systemMessageContent = `${currentUser.name} created a new text document: "${newDocument.name}" in the "${categoryName}" category.`;
    const systemMessage: Message = {
        id: `sys-doc-create-${Date.now()}`,
        userId: 'system',
        content: systemMessageContent,
        timestamp: Date.now(),
        isSystemMessage: true,
    };
     if (allMockMessages[generalChannelId]) {
        allMockMessages[generalChannelId].push(systemMessage);
    } else {
        allMockMessages[generalChannelId] = [systemMessage];
    }
    if (activeConversation?.type === 'channel' && activeConversation.id === generalChannelId) {
        setMessages(prevMessages => [...prevMessages, systemMessage]);
    }

  }, [toast, findDocumentCategoryById, currentUser, router, activeConversation]);

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
    setDocumentCategories(prev => prev.map(cat =>
        cat.id === categoryId ? { ...cat, documents: [...cat.documents, newDocument] } : cat
    ));
    const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
    if (catIndex > -1) initialDocumentCategories[catIndex].documents.push(newDocument);

    const category = findDocumentCategoryById(categoryId);
    const categoryName = category ? category.name : 'Unknown Category';
    setTimeout(() => {
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

    const generalChannelId = 'c1';
    const systemMessageContent = `${currentUser.name} linked an external document: "${newDocument.name}" in the "${categoryName}" category.`;
    const systemMessage: Message = {
        id: `sys-doc-link-${Date.now()}`,
        userId: 'system',
        content: systemMessageContent,
        timestamp: Date.now(),
        isSystemMessage: true,
    };
    if (allMockMessages[generalChannelId]) {
        allMockMessages[generalChannelId].push(systemMessage);
    } else {
        allMockMessages[generalChannelId] = [systemMessage];
    }
    if (activeConversation?.type === 'channel' && activeConversation.id === generalChannelId) {
        setMessages(prevMessages => [...prevMessages, systemMessage]);
    }

  }, [toast, findDocumentCategoryById, currentUser, router, activeConversation]);

  const deleteDocumentFromCategory = useCallback((categoryId: string, docId: string) => {
    if (!currentUser || currentUser.role !== 'admin') {
        setTimeout(() => toast({title: "Permission Denied", description: "Only admins can delete documents.", variant: "destructive"}), 0);
        return;
    }
    setDocumentCategories(prev => prev.map(cat =>
        cat.id === categoryId
            ? { ...cat, documents: cat.documents.filter(doc => doc.id !== docId) }
            : cat
    ));
    const catIndex = initialDocumentCategories.findIndex(c => c.id === categoryId);
    if (catIndex > -1) {
        initialDocumentCategories[catIndex].documents = initialDocumentCategories[catIndex].documents.filter(doc => doc.id !== docId);
    }
    setTimeout(() => {
        toast({ title: "Document Deleted", description: "The document has been removed."});
    },0);
  }, [toast, currentUser]);

  const searchAllDocuments = useCallback((query: string): Array<{ doc: Document, category: DocumentCategory }> => {
    const trimmedQuery = query.trim().toLowerCase();
    const results: Array<{ doc: Document, category: DocumentCategory }> = [];

    if (trimmedQuery === '') {
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
    return results.slice(0, 10); 
  }, [documentCategories]);

  const startCall = (conversation: ActiveConversation | null) => {
    if (!currentUser || !conversation) return;
    setCallingWith(conversation);
    setIsCallActive(true);
    setTimeout(() => {
      toast({ title: "Starting Call", description: `Calling ${conversation.name}... (Simulated)` });
    }, 0);

    const callMessageContent = `${currentUser.name} started a call.`;
    const systemMessage: Message = {
      id: `sys-call-start-${Date.now()}`,
      userId: 'system',
      content: callMessageContent,
      timestamp: Date.now(),
      isSystemMessage: true,
    };

    if (allMockMessages[conversation.id]) {
      allMockMessages[conversation.id].push(systemMessage);
    } else {
      allMockMessages[conversation.id] = [systemMessage];
    }

    if (activeConversation?.id === conversation.id) {
      setMessages(prevMessages => [...prevMessages, systemMessage]);
    }
  };

  const endCall = () => {
    if (callingWith) {
        setTimeout(() => {
            toast({ title: "Call Ended", description: `Call with ${callingWith.name} ended. (Simulated)` });
        }, 0);

      const callMessageContent = `Call with ${callingWith.name} ended.`;
      const systemMessage: Message = {
        id: `sys-call-end-${Date.now()}`,
        userId: 'system',
        content: callMessageContent,
        timestamp: Date.now(),
        isSystemMessage: true,
      };

      if (allMockMessages[callingWith.id]) {
        allMockMessages[callingWith.id].push(systemMessage);
      } else {
        allMockMessages[callingWith.id] = [systemMessage];
      }

      if (activeConversation?.id === callingWith.id) {
        setMessages(prevMessages => [...prevMessages, systemMessage]);
      }
    }
    setIsCallActive(false);
    setCallingWith(null);
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
