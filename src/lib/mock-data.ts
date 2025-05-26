
import type { User, Channel, Message, Draft, DocumentCategory, UserRole } from '@/types';

// No initial users; users will come from Firebase Auth or invitations.
export const initialMockUsers: User[] = [];

// No initial channels; channels will be created by admins.
export const initialMockChannels: Channel[] = [];

// No current user defined here; will be set by Firebase Auth.
// export const mockCurrentUser: User = { ... }; // Removed

// Messages will be added dynamically.
export const mockMessages: Record<string, Message[]> = {};

// Drafts will be added by user interaction.
export const mockDrafts: Draft[] = [];

// Document categories will be created by admins.
export let initialDocumentCategories: DocumentCategory[] = [];

// Helper function to get messages; will return empty if no messages for the ID.
export const getMessagesForConversation = (conversationId: string): Message[] => {
  const msgs = mockMessages[conversationId] || [];
  // Ensure reactions is always an object, even if undefined in mock data
  return msgs.map(msg => ({ ...msg, reactions: msg.reactions ? { ...msg.reactions } : {} }));
};

// Helper function to update messages (e.g., for reactions, edits).
export const updateMockMessage = (conversationId: string, messageId: string, updatedMessageData: Partial<Message>) => {
  if (mockMessages[conversationId]) {
    const messageIndex = mockMessages[conversationId].findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      mockMessages[conversationId][messageIndex] = {
        ...mockMessages[conversationId][messageIndex],
        ...updatedMessageData,
      };
    }
  }
};
