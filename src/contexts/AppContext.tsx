
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { User, Channel, Message, ActiveConversation, PendingInvitation, Draft, ActivityItem, CurrentView } from '@/types';
import { mockUsers, mockChannels, mockCurrentUser, getMessagesForConversation as fetchMockMessages, updateMockMessage, mockMessages as allMockMessages, mockDrafts as initialMockDrafts } from '@/lib/mock-data';
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

  currentView: CurrentView;
  setActiveSpecialView: (view: 'replies' | 'activity' | 'drafts') => void;
  drafts: Draft[];
  deleteDraft: (draftId: string) => void;
  replies: Message[];
  activities: ActivityItem[];
  getConversationName: (conversationId: string, conversationType: 'channel' | 'dm') => string;

  replyingToMessage: Message | null;
  setReplyingToMessage: React.Dispatch<React.SetStateAction<Message | null>>;
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

  const [currentView, setCurrentViewState] = useState<CurrentView>('chat');
  const [drafts, setDrafts] = useState<Draft[]>(initialMockDrafts);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);


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
        if (channel.isPrivate && !channel.memberIds.includes(currentUser.id)) {
          setTimeout(() => {
            toast({
              title: "Access Denied",
              description: `You are not a member of the private channel #${channel.name}.`,
              variant: "destructive",
            });
          }, 0);
          return; // Do not set active conversation
        }
        setActiveConversationState({ type, id, name: channel.name, channel });
      }
    } else {
      const user = allUsersWithCurrent.find(u => u.id === id);
      if (user) {
        setActiveConversationState({ type, id, name: user.name, recipient: user });
      }
    }
    setCurrentViewState('chat'); // Ensure view is 'chat' when a conversation is selected
    setReplyingToMessage(null); // Clear reply context when changing conversation
  }, [channels, allUsersWithCurrent, currentUser.id, toast]);

  const setActiveSpecialView = useCallback((view: 'replies' | 'activity' | 'drafts') => {
    setCurrentViewState(view);
    setActiveConversationState(null); // Clear active chat when switching to a special view
    setReplyingToMessage(null); // Clear reply context
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
    if (!activeConversation) return;

    let replyData: Partial<Message> = {};
    if (replyingToMessage) {
      const originalSender = allUsersWithCurrent.find(u => u.id === replyingToMessage.userId);
      replyData = {
        replyToMessageId: replyingToMessage.id,
        originalMessageSenderName: originalSender?.name || "Unknown User",
        originalMessageContent: replyingToMessage.content.substring(0, 70) + (replyingToMessage.content.length > 70 ? "..." : ""),
      };
    }

    const newMessage: Message = {
      id: `m${Date.now()}`,
      userId: currentUser.id,
      content,
      timestamp: Date.now(),
      file: file ? { name: file.name, url: 'https://placehold.co/200x150.png', type: file.type.startsWith('image/') ? 'image' : 'document' } : undefined,
      reactions: {},
      ...replyData,
    };
    setMessages(prevMessages => [...prevMessages, newMessage]);
    if (activeConversation && allMockMessages[activeConversation.id]) {
        allMockMessages[activeConversation.id] = [...allMockMessages[activeConversation.id], newMessage];
    } else if (activeConversation) {
        allMockMessages[activeConversation.id] = [newMessage];
    }
    setReplyingToMessage(null); // Clear reply context after sending
  }, [activeConversation, currentUser.id, replyingToMessage, allUsersWithCurrent]);

  const addChannel = useCallback((name: string, description?: string, memberIds: string[] = [], isPrivate: boolean = false) => {
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
      const channelIndex = mockChannels.findIndex(ch => ch.id === newChannel.id);
      if (channelIndex === -1) {
        mockChannels.push(newChannel);
      } else {
        mockChannels[channelIndex] = newChannel;
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
                timestamp: Date.now() + 1, // Ensure slightly different timestamp
                isSystemMessage: true,
            };
            allMockMessages[newChannel.id].push(addedMembersSystemMessage);
        }
    }

    setActiveConversation('channel', newChannel.id);
    setTimeout(() => {
      toast({ title: "Channel Created", description: `Channel #${trimmedName} has been created.` });
    }, 0);
  }, [currentUser.id, currentUser.name, toast, setActiveConversation, allUsersWithCurrent, channels]);

  const addMembersToChannel = useCallback((channelId: string, userIdsToAdd: string[]) => {
    let channelName = '';
    let isPrivateChannel = false;
    setChannels(prevChannels => {
      return prevChannels.map(channel => {
        if (channel.id === channelId) {
          channelName = channel.name;
          isPrivateChannel = channel.isPrivate || false;
          const newMemberIds = Array.from(new Set([...channel.memberIds, ...userIdsToAdd]));
          const updatedChannel = { ...channel, memberIds: newMemberIds };

          const mockChannelIndex = mockChannels.findIndex(ch => ch.id === channelId);
          if (mockChannelIndex !== -1) {
            mockChannels[mockChannelIndex] = updatedChannel;
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

  }, [toast, activeConversation, currentUser.name, allUsersWithCurrent]);

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
    const emailSubject = "You're invited to join Opano!";
    const emailHtmlBody = `
      <h1>Welcome to Opano!</h1>
      <p>You've been invited to join the Opano workspace.</p>
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
  }, [allUsersWithCurrent, pendingInvitations, toast]);

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

    const newUser: User = {
      id: `u${Date.now()}`,
      name: userDetails.name,
      designation: userDetails.designation,
      avatarUrl: `https://placehold.co/40x40.png?text=${userDetails.name.substring(0,2).toUpperCase()}`,
      isOnline: true,
      email: invitation.email,
    };

    mockUsers.push(newUser);
    setUsers(prevUsers => [...prevUsers.filter(u => u.id !== newUser.id), newUser]);
    setAllUsersWithCurrent(prevAll => [...prevAll.filter(u => u.id !== newUser.id), newUser]);


    setPendingInvitations(prevInvites => prevInvites.filter(inv => inv.token !== token));
    setTimeout(() => {
      toast({ title: "Welcome to Opano!", description: `User ${newUser.name} has joined the workspace.` });
    }, 0);
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
          if (activeConversation && allMockMessages[activeConversation.id]) {
            allMockMessages[activeConversation.id] = allMockMessages[activeConversation.id].filter(m => m.id !== messageId);
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
      setTimeout(() => {
        toast({
          title: "Status Updated",
          description: `You are now ${newStatus ? 'Online' : 'Away'}.`,
        });
      }, 0);
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
        avatarUrl: profileData.avatarDataUrl || prevUser.avatarUrl,
      };
      setTimeout(() => {
        toast({ title: "Profile Updated", description: "Your profile has been successfully updated." });
      }, 0);
      return updatedUser;
    });
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
    if (channels.length > 0 && !activeConversation && currentView === 'chat') {
       const selfDmUser = allUsersWithCurrent.find(u => u.id === currentUser.id);
       if (selfDmUser) {
         setActiveConversation('dm', currentUser.id);
       } else if (channels[0]) {
         setActiveConversation('channel', channels[0].id);
       }
    }
  }, [channels, currentUser.id, allUsersWithCurrent, activeConversation, setActiveConversation, currentView]);

  const getConversationName = useCallback((conversationId: string, conversationType: 'channel' | 'dm'): string => {
    if (conversationType === 'channel') {
      return channels.find(c => c.id === conversationId)?.name || 'Unknown Channel';
    } else {
      return allUsersWithCurrent.find(u => u.id === conversationId)?.name || 'Unknown User';
    }
  }, [channels, allUsersWithCurrent]);

  const replies = useMemo(() => {
    const allMsgs: Message[] = Object.values(allMockMessages).flat();
    return allMsgs.filter(msg =>
      msg.content.toLowerCase().includes(`@${currentUser.name.toLowerCase()}`) &&
      msg.userId !== currentUser.id && 
      !msg.isSystemMessage
    ).sort((a, b) => b.timestamp - a.timestamp);
  }, [currentUser.name, currentUser.id]);

  const activities: ActivityItem[] = useMemo(() => {
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
  }, [currentUser.id, allUsersWithCurrent, channels]);


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
      currentView,
      setActiveSpecialView,
      drafts,
      deleteDraft,
      replies,
      activities,
      getConversationName,
      replyingToMessage,
      setReplyingToMessage,
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
