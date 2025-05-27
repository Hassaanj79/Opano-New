
import type { User, Channel, Message, Draft, DocumentCategory, Document } from '@/types';
import * as Icons from 'lucide-react';

// No initialMockCurrentUser as current user will come from Firebase Auth.
// initialMockUsers will be populated by AppContext if a Firebase user isn't found here,
// or will use the roles defined here if a match is found by email.

export const initialMockUsers: User[] = [
  {
    id: 'u1-admin', // Changed ID to be distinct if firebase.uid is different
    name: 'Hassaan', // Assuming this is the intended admin
    email: 'hassyku786@gmail.com', // Admin email
    avatarUrl: 'https://placehold.co/40x40.png?text=HA',
    isOnline: true,
    designation: 'Org Admin',
    role: 'admin', // Explicitly admin
    phoneNumber: '123-456-7890',
    linkedinProfileUrl: 'https://linkedin.com/in/hassaan',
    pronouns: 'He/Him',
  },
  {
    id: 'u5', // Areeb
    name: 'Areeb',
    email: 'areeb@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=AR',
    isOnline: true,
    designation: 'UI/UX Designer',
    role: 'member',
    pronouns: 'He/Him',
  },
  {
    id: 'u2', // Hanzlah
    name: 'Hanzlah',
    email: 'hanzlah@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=HZ',
    isOnline: false,
    designation: 'Frontend Developer',
    role: 'member',
    pronouns: 'He/Him',
  },
  {
    id: 'u3', // Huzaifa
    name: 'Huzaifa',
    email: 'huzaifa@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=HU',
    isOnline: true,
    designation: 'Backend Developer',
    role: 'member',
    pronouns: 'He/Him',
  },
  {
    id: 'u4', // Fahad
    name: 'Fahad',
    email: 'fahad@example.com',
    avatarUrl: 'https://placehold.co/40x40.png?text=FA',
    isOnline: false,
    designation: 'QA Engineer',
    role: 'member',
    pronouns: 'He/Him',
  },
];

export let initialMockChannels: Channel[] = [];
export let mockMessages: Record<string, Message[]> = {};
export let initialMockDrafts: Draft[] = []; // Changed from mockDrafts to initialMockDrafts
export let initialDocumentCategories: DocumentCategory[] = [];

export const getMessagesForConversation = (conversationId: string): Message[] => {
  const msgs = mockMessages[conversationId] || [];
  // Ensure reactions is always an object, even if undefined in mock data initially
  return msgs.map(msg => ({ ...msg, reactions: msg.reactions ? { ...msg.reactions } : {} }));
};

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

