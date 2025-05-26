
import type { User, Channel, Message, Draft, DocumentCategory, UserRole } from '@/types';

// Add back some initial users
export const initialMockUsers: User[] = [
  {
    id: 'u2', // Keep existing ID structure if it was there
    name: 'Hanzlah',
    email: 'hanzlah@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=HA',
    isOnline: false,
    designation: 'Frontend Developer',
    role: 'member',
    phoneNumber: '123-456-7891',
    linkedinProfileUrl: 'https://linkedin.com/in/hanzlah',
    pronouns: 'He/Him',
  },
  {
    id: 'u3',
    name: 'Huzaifa',
    email: 'huzaifa@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=HU',
    isOnline: true,
    designation: 'Backend Developer',
    role: 'member',
    phoneNumber: '123-456-7892',
    linkedinProfileUrl: 'https://linkedin.com/in/huzaifa',
    pronouns: 'He/Him',
  },
  {
    id: 'u4',
    name: 'Fahad',
    email: 'fahad@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=FA',
    isOnline: false,
    designation: 'QA Engineer',
    role: 'member',
    phoneNumber: '123-456-7893',
    linkedinProfileUrl: 'https://linkedin.com/in/fahad',
    pronouns: 'He/Him',
  },
  {
    id: 'u5',
    name: 'Areeb',
    email: 'areeb@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=AR',
    isOnline: true,
    designation: 'UI/UX Designer',
    role: 'member',
    phoneNumber: '123-456-7894',
    linkedinProfileUrl: 'https://linkedin.com/in/areeb',
    pronouns: 'He/Him',
  },
  // Note: The actual currentUser will be determined by Firebase Auth.
  // If an admin is needed and no Firebase user has become admin yet,
  // you might need to adjust the first user's role to 'admin' here
  // OR ensure the Firebase auth flow correctly assigns admin to the first signed-up user.
];


export let initialMockChannels: Channel[] = [];

// Messages will be added dynamically.
export let mockMessages: Record<string, Message[]> = {};

// Drafts will be added by user interaction.
export let mockDrafts: Draft[] = [];

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
